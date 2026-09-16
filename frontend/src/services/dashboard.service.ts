import { api } from './api';
import { ApiResponse } from '../types/api';

export const dashboardService = {
  async getClientDashboard(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/client');
    return response.data.data || {};
  },

  async getBarberDashboard(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/barber');
    return response.data.data || {};
  },

  async getSalonDashboard(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/salon');
    return response.data.data || {};
  },

  async getAdminDashboard(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/admin');
    return response.data.data || {};
  },

  async getRevenueStats(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/revenue');
    return response.data.data || {};
  },

  async getBookingStats(): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/dashboard/bookings');
    return response.data.data || {};
  },
};
