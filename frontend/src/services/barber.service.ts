import { api } from './api';
import { ApiResponse, Barber } from '../types/api';

export const barberService = {
  async getBarbers(): Promise<Barber[]> {
    const response = await api.get<ApiResponse<Barber[]>>('/barbers');
    return response.data.data || [];
  },

  async getBarber(id: string): Promise<Barber> {
    const response = await api.get<ApiResponse<Barber>>(`/barbers/${id}`);
    return response.data.data!;
  },

  async getMyBarberProfile(): Promise<Barber> {
    const response = await api.get<ApiResponse<Barber>>('/barbers/me');
    return response.data.data!;
  },
};
