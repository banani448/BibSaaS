import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notification.service';
import { NotificationItem } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { Bell, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les notifications'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de marquer comme lu'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: new Date().toISOString() 
      })));
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de tout marquer comme lu'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-slate-400">
              {notifications.filter(n => !n.isRead).length} non lue{notifications.filter(n => !n.isRead).length > 1 ? 's' : ''}
            </p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
            >
              <Check className="h-4 w-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Bell className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune notification</h3>
            <p className="text-slate-400">Vous n'avez pas de notifications pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkAsRead }) => (
  <div className={`glass-panel rounded-xl p-4 transition-all ${!notification.isRead ? 'border-l-4 border-l-amber-500' : ''}`}>
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-amber-500/10' : 'bg-white/5'}`}>
        <Bell className={`h-5 w-5 ${!notification.isRead ? 'text-amber-400' : 'text-slate-400'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h3 className={`font-medium ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
            {notification.title}
          </h3>
          <span className="text-slate-500 text-xs whitespace-nowrap ml-2">
            {new Date(notification.createdAt).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-2">{notification.message}</p>
        
        {!notification.isRead && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            Marquer comme lu
          </button>
        )}
      </div>
    </div>
  </div>
);

export default NotificationsPage;
