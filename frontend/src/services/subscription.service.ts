import { api } from './api';
import { ApiResponse, Subscription, SubscriptionPlan } from '../types/api';

export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans');
    return response.data.data || [];
  },

  async getPlanBySlug(slug: string): Promise<SubscriptionPlan> {
    const response = await api.get<ApiResponse<SubscriptionPlan>>(`/subscriptions/plans/${slug}`);
    return response.data.data!;
  },

  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get<ApiResponse<Subscription>>('/subscriptions/current');
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  async getHistory(): Promise<Subscription[]> {
    const response = await api.get<ApiResponse<Subscription[]>>('/subscriptions/history');
    return response.data.data || [];
  },

  async createSubscription(planId: string, autoRenew = false): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>('/subscriptions', { planId, autoRenew });
    return response.data.data!;
  },

  async cancelSubscription(id: string): Promise<void> {
    await api.post(`/subscriptions/${id}/cancel`);
  },
};
