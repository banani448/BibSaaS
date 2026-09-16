import { api } from './api';
import { ApiResponse, Invoice } from '../types/api';

export const invoiceService = {
  async getMyInvoices(): Promise<Invoice[]> {
    const response = await api.get<ApiResponse<Invoice[]>>('/invoices/me');
    return response.data.data || [];
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data.data!;
  },
};
