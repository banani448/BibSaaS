import { api } from './api';
import { ApiResponse, User, Salon, Barber } from '../types/api';

export const adminService = {
  async getOverview(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/admin/overview');
    return response.data.data || {};
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/admin/users');
    return response.data.data || [];
  },

  async updateUserStatus(id: string, status: string): Promise<void> {
    await api.patch(`/admin/users/${id}/status`, { status });
  },

  async getSalons(): Promise<Salon[]> {
    const response = await api.get<ApiResponse<Salon[]>>('/admin/salons');
    return response.data.data || [];
  },

  async toggleSalonActive(id: string, isActive: boolean): Promise<void> {
    await api.patch(`/admin/salons/${id}/active`, { isActive });
  },

  async getBarbers(): Promise<Barber[]> {
    const response = await api.get<ApiResponse<Barber[]>>('/admin/barbers');
    return response.data.data || [];
  },

  async getStatistics(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/admin/statistics');
    return response.data.data || {};
  },
};
