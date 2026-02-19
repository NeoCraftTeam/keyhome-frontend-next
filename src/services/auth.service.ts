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

    // Store token temporarily to fetch user
    const token = data.access_token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const userResponse = await api.get('/auth/me');
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

  async resendVerification(): Promise<{ message: string }> {
    const { data } = await api.post('/auth/email/resend');
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
};
