import api from '@/lib/api';
import {
  clearUtmParamsAfterRegistration,
  getAttributionBodyForApi,
} from '@/lib/utm';
import { AuthResponse, User } from '@/types';

function mergeAttribution(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (typeof window === 'undefined') {
    return body;
  }
  return { ...getAttributionBodyForApi(), ...body };
}

interface LoginApiResponse {
  message: string;
  access_token: string;
  expires_at: string;
  role: string;
  type: string | null;
}

interface RegisterApiResponse {
  message: string;
  user: User;
  access_token: string;
  email_verification_required: boolean;
}

interface OAuthRedirectResponse {
  redirect_url: string;
}

export type OAuthProvider = 'google' | 'facebook' | 'apple';

export const authService = {
  async login(
    email: string,
    password: string,
    loginContext: 'owner' | 'client' = 'client'
  ): Promise<AuthResponse> {
    const { data } = await api.post<LoginApiResponse>('/auth/login', {
      email,
      password,
      login_context: loginContext,
    });

    const token = data.access_token;

    // Pass the token explicitly to bypass the Axios interceptor's Clerk token getter
    // which would return null for email/password users who have no Clerk session.
    const userResponse = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = userResponse.data.data ?? userResponse.data;

    return { token, user, expires_at: data.expires_at };
  },

  async registerCustomer(payload: {
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    password: string;
    confirm_password: string;
    city_id?: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post<RegisterApiResponse>(
      '/auth/registerCustomer',
      mergeAttribution({ ...payload })
    );
    clearUtmParamsAfterRegistration();
    return { token: data.access_token, user: data.user, expires_at: '' };
  },

  async registerAgent(payload: {
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    password: string;
    confirm_password: string;
    type: 'individual' | 'agency';
    city_id?: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post<RegisterApiResponse>(
      '/auth/registerAgent',
      mergeAttribution({ ...payload })
    );
    clearUtmParamsAfterRegistration();
    return { token: data.access_token, user: data.user, expires_at: '' };
  },

  async me(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return data.data ?? data;
  },

  /**
   * Backend returns `otp_required` for new Clerk identities only. If a Laravel user
   * already exists for the same email (or clerk_id), the API returns `access_token`
   * immediately with no OTP (see ClerkAuthController::clerkExchange).
   */
  async clerkExchange(
    bearerToken?: string | null,
    options?: { registration_intent?: 'customer' | 'agent' }
  ): Promise<
    | { state: 'otp_required'; email_hint: string | null }
    | { token: string; user: User; panel_sso_url: string | null }
  > {
    const config = bearerToken
      ? { headers: { Authorization: `Bearer ${bearerToken}` } }
      : undefined;
    const body = mergeAttribution(
      options?.registration_intent != null
        ? { registration_intent: options.registration_intent }
        : {}
    );
    const { data } = await api.post<
      | { state: 'otp_required'; email_hint: string | null }
      | { access_token: string; user: User; panel_sso_url: string | null }
    >('/auth/clerk/exchange', body, config);

    if ('state' in data && data.state === 'otp_required') {
      return data;
    }

    const d = data as {
      access_token: string;
      user: User;
      panel_sso_url: string | null;
    };
    return {
      token: d.access_token,
      user: d.user,
      panel_sso_url: d.panel_sso_url,
    };
  },
  async verifyClerkOtp(otp: string): Promise<
    | {
        state: 'profile_required';
        prefill: {
          firstname: string;
          lastname: string;
          email: string | null;
          avatar: string | null;
          registration_intent?: string;
        };
      }
    | {
        state: 'authenticated';
        token: string;
        user: User;
        panel_sso_url: string | null;
      }
  > {
    const { data } = await api.post<
      | {
          state: 'profile_required';
          prefill: {
            firstname: string;
            lastname: string;
            email: string | null;
            avatar: string | null;
            registration_intent?: string;
          };
        }
      | {
          state: 'authenticated';
          access_token: string;
          user: User;
          panel_sso_url: string | null;
        }
    >('/auth/clerk/verify-otp', { otp });

    if (data.state === 'profile_required') {
      return data;
    }

    const d = data as {
      state: 'authenticated';
      access_token: string;
      user: User;
      panel_sso_url: string | null;
    };
    return {
      state: 'authenticated',
      token: d.access_token,
      user: d.user,
      panel_sso_url: d.panel_sso_url,
    };
  },

  async completeClerkProfile(profile: {
    phone_number?: string;
    city_id?: string | null;
  }): Promise<{ token: string; user: User; panel_sso_url: string | null }> {
    const { data } = await api.post<{
      access_token: string;
      user: User;
      panel_sso_url: string | null;
    }>('/auth/clerk/complete-profile', mergeAttribution({ ...profile }));
    clearUtmParamsAfterRegistration();
    return {
      token: data.access_token,
      user: data.user,
      panel_sso_url: data.panel_sso_url,
    };
  },

  async refreshToken(): Promise<{
    access_token: string;
    expires_at: string;
  }> {
    const { data } = await api.post<{
      access_token: string;
      token_type: string;
      expires_at: string;
    }>('/auth/refresh');
    return { access_token: data.access_token, expires_at: data.expires_at };
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },

  async updatePassword(payload: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<{ message: string }> {
    const { data } = await api.post('/auth/update-password', payload);
    return data;
  },

  async resendVerification(email?: string): Promise<{ message: string }> {
    if (email) {
      const { data } = await api.post('/auth/resend-verification', { email });
      return data;
    }
    const { data } = await api.post('/auth/email/resend');
    return data;
  },

  async verifyEmailOtp(
    email: string,
    otp: string
  ): Promise<{
    message: string;
    verified: boolean;
    access_token: string;
    user: User;
    /** Top-level role/type — always present even if UserResource omits them */
    role?: string;
    type?: string | null;
  }> {
    const { data } = await api.post('/auth/verify-email-otp', { email, otp });
    return data;
  },

  async completeOnboarding(): Promise<void> {
    await api.post('/auth/onboarding-complete');
  },

  async trackHomeVisit(): Promise<{ last_home_visit_at: string }> {
    const { data } = await api.post<{ last_home_visit_at: string }>(
      '/auth/track-home-visit'
    );
    return data;
  },

  async updatePreferences(prefs: {
    survey_postponed_ids?: string[];
  }): Promise<{ preferences: { survey_postponed_ids?: string[] } }> {
    const { data } = await api.patch<{
      preferences: { survey_postponed_ids?: string[] };
    }>('/auth/preferences', prefs);
    return data;
  },

  /**
   * Get OAuth redirect URL for a provider.
   * The backend will handle the callback and redirect back to /auth/callback with the token.
   */
  async getOAuthRedirectUrl(provider: OAuthProvider): Promise<string> {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const { data } = await api.get<OAuthRedirectResponse>(
      `/auth/oauth/${provider}/redirect`,
      { params: { redirect_uri: redirectUri } }
    );
    return data.redirect_url;
  },

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const { data } = await api.post<{ available: boolean }>(
      '/auth/check-email',
      { email }
    );
    return data;
  },
};
