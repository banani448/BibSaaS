import { supabase } from './database';

export class RealtimeService {
  static subscribeToNotifications(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }

  static unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
}