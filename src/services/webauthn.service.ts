import api from '@/lib/api';
import { User } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PasskeyCredential {
  id: string;
  alias: string | null;
  origin: string | null;
  created_at: string;
  last_used: string | null;
  disabled: boolean;
}

interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: User;
}

// ── Base64url helpers ────────────────────────────────────────────────────────

function b64uToBuffer(b64u: string): ArrayBuffer {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

function bufferToB64u(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── WebAuthn browser feature detection ───────────────────────────────────────

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

/**
 * Check if the browser supports conditional mediation (autofill passkeys).
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return (
      (await PublicKeyCredential.isConditionalMediationAvailable?.()) ?? false
    );
  } catch {
    return false;
  }
}

// ── API service ──────────────────────────────────────────────────────────────

export const webAuthnService = {
  // ── Registration (authenticated user) ──────────────────────────────────

  /**
   * Register a new passkey for the current user.
   * 1. Fetch creation options from backend
   * 2. Call navigator.credentials.create()
   * 3. Send attestation result + alias to backend
   */
  async register(alias?: string): Promise<void> {
    // Step 1: Get creation options
    const { data: options } = await api.post('/auth/webauthn/register/options');

    // Step 2: Build publicKey options
    const publicKey: PublicKeyCredentialCreationOptions = {
      ...options,
      challenge: b64uToBuffer(options.challenge),
      user: {
        ...options.user,
        id: b64uToBuffer(options.user.id),
      },
    };
    if (options.excludeCredentials) {
      publicKey.excludeCredentials = options.excludeCredentials.map(
        (c: { id: string; type: string; transports?: string[] }) => ({
          ...c,
          id: b64uToBuffer(c.id),
        })
      );
    }

    // Step 3: Create credential via browser API
    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('La création de la passkey a été annulée.');
    }

    const attestationResponse =
      credential.response as AuthenticatorAttestationResponse;

    // Step 4: Send to backend
    await api.post('/auth/webauthn/register', {
      id: credential.id,
      rawId: bufferToB64u(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToB64u(attestationResponse.clientDataJSON),
        attestationObject: bufferToB64u(attestationResponse.attestationObject),
      },
      alias: alias || undefined,
    });
  },

  // ── Login (unauthenticated) ────────────────────────────────────────────

  /**
   * Login with a passkey.
   * 1. Fetch assertion options + challenge token from backend
   * 2. Call navigator.credentials.get()
   * 3. Send assertion result + challenge token to backend
   * 4. Receive Sanctum token
   */
  async login(
    loginContext: 'owner' | 'client' = 'client'
  ): Promise<{ token: string; user: User }> {
    // Step 1: Get assertion options
    const optResponse = await api.post('/auth/webauthn/login/options');
    const rawOptions = optResponse.data as Record<string, unknown>;

    // Read token from header first, fall back to body `_wt` field.
    // Some CDN/proxy edges (Cloudflare Workers, Vercel) strip custom response
    // headers, so the backend also embeds the token in the body as a failsafe.
    const challengeToken =
      (optResponse.headers['x-webauthn-token'] as string | undefined) ||
      (rawOptions._wt as string | undefined) ||
      '';

    // Strip private `_wt` field before passing to the browser WebAuthn API.
    const { _wt: _ignored, ...options } = rawOptions;

    // Step 2: Build publicKey options
    const publicKey: PublicKeyCredentialRequestOptions = {
      ...(options as Omit<PublicKeyCredentialRequestOptions, 'challenge'>),
      challenge: b64uToBuffer(options.challenge as string),
    };
    if (options.allowCredentials) {
      publicKey.allowCredentials = (
        options.allowCredentials as {
          id: string;
          type: 'public-key';
          transports?: AuthenticatorTransport[];
        }[]
      ).map((c) => ({
        ...c,
        id: b64uToBuffer(c.id),
      }));
    }

    // Step 3: Get credential via browser API
    const credential = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error("L'authentification par passkey a été annulée.");
    }

    const assertionResponse =
      credential.response as AuthenticatorAssertionResponse;

    // Step 4: Send to backend with challenge token
    let data: LoginResponse;
    try {
      const resp = await api.post<LoginResponse>(
        '/auth/webauthn/login',
        {
          id: credential.id,
          rawId: bufferToB64u(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: bufferToB64u(assertionResponse.clientDataJSON),
            authenticatorData: bufferToB64u(
              assertionResponse.authenticatorData
            ),
            signature: bufferToB64u(assertionResponse.signature),
            userHandle: assertionResponse.userHandle
              ? bufferToB64u(assertionResponse.userHandle)
              : null,
          },
          login_context: loginContext,
        },
        {
          headers: { 'X-WebAuthn-Token': challengeToken },
        }
      );
      data = resp.data;
    } catch (err: unknown) {
      const axErr = err as {
        response?: { status?: number; data?: { code?: string } };
      };
      if (
        axErr.response?.status === 403 &&
        axErr.response?.data?.code === 'ROLE_CONTEXT_MISMATCH'
      ) {
        throw new Error(
          'Ce passkey est associé à un type de compte différent. Veuillez utiliser le bon portail de connexion.'
        );
      }
      throw err;
    }

    // UserResource may wrap in a `data` key
    const rawUser = data.user as User & { data?: User };
    const user = rawUser.data ?? rawUser;

    return { token: data.access_token, user };
  },

  // ── Credential management (authenticated) ──────────────────────────────

  async list(): Promise<PasskeyCredential[]> {
    const { data } = await api.get<{ data: PasskeyCredential[] }>(
      '/auth/webauthn/credentials'
    );
    return data.data;
  },

  async rename(credentialId: string, alias: string): Promise<void> {
    await api.patch(`/auth/webauthn/credentials/${credentialId}`, { alias });
  },

  async remove(credentialId: string): Promise<void> {
    await api.delete(`/auth/webauthn/credentials/${credentialId}`);
  },
};
