import api from '@/lib/api';

export interface LaravelNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsIndexMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  unread_count: number;
}

export async function fetchNotifications(params?: {
  per_page?: number;
  unread_only?: boolean;
}): Promise<{ data: LaravelNotification[]; meta: NotificationsIndexMeta }> {
  const res = await api.get<{
    success: boolean;
    data: LaravelNotification[];
    meta: NotificationsIndexMeta;
  }>('/notifications', { params });

  return { data: res.data.data, meta: res.data.meta };
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count');
  return res.data.data.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
