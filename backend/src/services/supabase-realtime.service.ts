// src/services/supabase-realtime.service.ts

import {
  createClient,
  SupabaseClient,
  RealtimeChannel,
} from "@supabase/supabase-js";

export interface RealtimeEvent {
  event: string;
  payload: any;
  timestamp: string;
}

export interface BroadcastOptions {
  channel: string;
  event: string;
  payload: any;
}

export interface PresenceUser {
  userId: string;
  role?: string;
  fullName?: string;
  connectedAt: string;
}

class SupabaseRealtimeService {
  private readonly supabase: SupabaseClient;
  private readonly channels: Map<string, RealtimeChannel>;

  constructor() {
    this.channels = new Map();

    const url =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "";

    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "";

    this.supabase = createClient(
      url,
      key,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  /**
   * Récupère ou crée un channel.
   */
  private getChannel(
    channelName: string,
  ): RealtimeChannel {
    const existing =
      this.channels.get(channelName);

    if (existing) {
      return existing;
    }

    const channel =
      this.supabase.channel(
        channelName,
      );

    channel.subscribe();

    this.channels.set(
      channelName,
      channel,
    );

    return channel;
  }

  /**
   * Broadcast générique.
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: any,
  ): Promise<void> {
    const channel =
      this.getChannel(channelName);

    await channel.send({
      type: "broadcast",
      event,
      payload: {
        ...payload,
        timestamp:
          new Date().toISOString(),
      },
    });
  }

  /**
   * Notification utilisateur.
   */
  async notifyUser(
    userId: string,
    title: string,
    message: string,
  ) {
    return this.broadcast(
      `user:${userId}`,
      "notification",
      {
        title,
        message,
      },
    );
  }

  /**
   * Notification barbier.
   */
  async notifyBarber(
    barberId: string,
    payload: any,
  ) {
    return this.broadcast(
      `barber:${barberId}`,
      "notification",
      payload,
    );
  }

  /**
   * Notification salon.
   */
  async notifySalon(
    salonId: string,
    payload: any,
  ) {
    return this.broadcast(
      `salon:${salonId}`,
      "notification",
      payload,
    );
  }

  /**
   * Dashboard Admin.
   */
  async notifyAdmin(
    payload: any,
  ) {
    return this.broadcast(
      "admin-dashboard",
      "dashboard.update",
      payload,
    );
  }

  /**
   * Nouvelle réservation.
   */
  async bookingCreated(
    booking: any,
  ) {
    await this.broadcast(
      "bookings",
      "booking.created",
      booking,
    );

    await this.notifyAdmin({
      type: "BOOKING_CREATED",
      bookingId:
        booking.id,
    });
  }

  /**
   * Réservation confirmée.
   */
  async bookingConfirmed(
    booking: any,
  ) {
    return this.broadcast(
      "bookings",
      "booking.confirmed",
      booking,
    );
  }

  /**
   * Réservation annulée.
   */
  async bookingCancelled(
    booking: any,
  ) {
    return this.broadcast(
      "bookings",
      "booking.cancelled",
      booking,
    );
  }

  /**
   * Paiement reçu.
   */
  async paymentReceived(
    payment: any,
  ) {
    await this.broadcast(
      "payments",
      "payment.received",
      payment,
    );

    await this.notifyAdmin({
      type: "PAYMENT_RECEIVED",
      amount:
        payment.amount,
    });
  }

  /**
   * Paiement échoué.
   */
  async paymentFailed(
    payment: any,
  ) {
    return this.broadcast(
      "payments",
      "payment.failed",
      payment,
    );
  }

  /**
   * Abonnement activé.
   */
  async subscriptionActivated(
    subscription: any,
  ) {
    return this.broadcast(
      "subscriptions",
      "subscription.activated",
      subscription,
    );
  }

  /**
   * Abonnement expiré.
   */
  async subscriptionExpired(
    subscription: any,
  ) {
    return this.broadcast(
      "subscriptions",
      "subscription.expired",
      subscription,
    );
  }

  /**
   * Analyse visage terminée.
   */
  async faceAnalysisCompleted(
    analysis: any,
  ) {
    return this.broadcast(
      "face-analysis",
      "analysis.completed",
      analysis,
    );
  }

  /**
   * Nouvelle coiffure ajoutée.
   */
  async hairstyleCreated(
    hairstyle: any,
  ) {
    return this.broadcast(
      "hairstyles",
      "hairstyle.created",
      hairstyle,
    );
  }

  /**
   * Gestion présence.
   */
  async trackPresence(
    channelName: string,
    user: PresenceUser,
  ) {
    const channel =
      this.getChannel(
        channelName,
      );

    await channel.track({
      ...user,
      connectedAt:
        new Date().toISOString(),
    });
  }

  /**
   * Nombre de connexions.
   */
  async getPresence(
    channelName: string,
  ) {
    const channel =
      this.getChannel(
        channelName,
      );

    return channel.presenceState();
  }

  /**
   * Supprimer un channel.
   */
  async removeChannel(
    channelName: string,
  ) {
    const channel =
      this.channels.get(
        channelName,
      );

    if (!channel) {
      return;
    }

    await this.supabase.removeChannel(
      channel,
    );

    this.channels.delete(
      channelName,
    );
  }

  /**
   * Nettoyer tous les channels.
   */
  async disconnectAll() {
    for (const channel of this.channels.values()) {
      await this.supabase.removeChannel(
        channel,
      );
    }

    this.channels.clear();
  }

  /**
   * Health Check.
   */
  async healthCheck() {
    return {
      status: "healthy",
      channels:
        this.channels.size,
      timestamp:
        new Date().toISOString(),
    };
  }
}

const supabaseRealtimeService =
  new SupabaseRealtimeService();

export default supabaseRealtimeService;
export { SupabaseRealtimeService };