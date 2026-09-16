import { api } from './api';
import { ApiResponse, Booking } from '../types/api';

export interface CreateBookingPayload {
  barberId?: string;
  salonId?: string;
  scheduledAt: string;
  duration?: number;
  notes?: string;
  serviceType?: string;
}

export const bookingService = {
  async getMyBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/me');
    return response.data.data || [];
  },

  async getBooking(id: string): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data.data!;
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>('/bookings', payload);
    return response.data.data!;
  },

  async cancelBooking(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },
};
