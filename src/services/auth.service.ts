import api from '@/lib/api';
import { AuthResponse, User } from '@/types';

interface LoginApiResponse {
  message: string;
  access_token: string;
  expires_at: string;
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
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<LoginApiResponse>('/auth/login', { email, password });

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
    const { data } = await api.post<RegisterApiResponse>('/auth/registerCustomer', payload);
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
    const { data } = await api.post<RegisterApiResponse>('/auth/registerAgent', payload);
    return { token: data.access_token, user: data.user, expires_at: '' };
  },

  async me(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return data.data ?? data;
  },

  async clerkExchange(
    bearerToken?: string | null,
  ): Promise<
    | { state: 'otp_required'; email_hint: string | null }
    | { token: string; user: User; panel_sso_url: string | null }
  > {
    const config = bearerToken
      ? { headers: { Authorization: `Bearer ${bearerToken}` } }
      : undefined;
    const { data } = await api.post<
      | { state: 'otp_required'; email_hint: string | null }
      | { access_token: string; user: User; panel_sso_url: string | null }
    >('/auth/clerk/exchange', {}, config);

    if ('state' in data && data.state === 'otp_required') {
      return data;
    }

    const d = data as { access_token: string; user: User; panel_sso_url: string | null };
    return { token: d.access_token, user: d.user, panel_sso_url: d.panel_sso_url };
  },

  async verifyClerkOtp(otp: string): Promise<
    | { state: 'profile_required'; prefill: { firstname: string; lastname: string; email: string | null; avatar: string | null } }
    | { state: 'authenticated'; token: string; user: User; panel_sso_url: string | null }
  > {
    const { data } = await api.post<
      | { state: 'profile_required'; prefill: { firstname: string; lastname: string; email: string | null; avatar: string | null } }
      | { state: 'authenticated'; access_token: string; user: User; panel_sso_url: string | null }
    >('/auth/clerk/verify-otp', { otp });

    if (data.state === 'profile_required') {
      return data;
    }

    const d = data as { state: 'authenticated'; access_token: string; user: User; panel_sso_url: string | null };
    return { state: 'authenticated', token: d.access_token, user: d.user, panel_sso_url: d.panel_sso_url };
  },

  async completeClerkProfile(profile: {
    phone_number: string;
    city_id?: string | null;
  }): Promise<{ token: string; user: User; panel_sso_url: string | null }> {
    const { data } = await api.post<{ access_token: string; user: User; panel_sso_url: string | null }>(
      '/auth/clerk/complete-profile',
      profile,
    );
    return { token: data.access_token, user: data.user, panel_sso_url: data.panel_sso_url };
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

  async verifyEmailOtp(email: string, otp: string): Promise<{
    message: string;
    verified: boolean;
    access_token: string;
    user: User;
  }> {
    const { data } = await api.post('/auth/verify-email-otp', { email, otp });
    return data;
  },

  async completeOnboarding(): Promise<void> {
    await api.post('/auth/onboarding-complete');
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
};
