/**
 * Owner active sessions service — list & revoke Sanctum token sessions.
 */
import api from '@/lib/api';

export interface ActiveSession {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string | null;
  expires_at: string | null;
  is_current: boolean;
}

export const ownerSessionsService = {
  async getActiveSessions(): Promise<ActiveSession[]> {
    const res = await api.get('/my/sessions');
    return res.data.data;
  },

  async revokeSession(id: string): Promise<void> {
    await api.delete('/my/sessions/' + encodeURIComponent(id));
  },

  async revokeOtherSessions(): Promise<{ count: number }> {
    const res = await api.delete('/my/sessions');
    return res.data;
  },
};
