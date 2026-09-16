import { api } from './api';
import { ApiResponse, NotificationItem } from '../types/api';

export const notificationService = {
  async getMyNotifications(): Promise<NotificationItem[]> {
    const response = await api.get<ApiResponse<NotificationItem[]>>('/notifications/me');
    return response.data.data || [];
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return response.data.data?.count || 0;
    } catch {
      return 0;
    }
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
