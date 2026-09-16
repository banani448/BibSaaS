import React, { useEffect, useState } from 'react';
import { bookingService } from '../../services/booking.service';
import { Booking, BookingStatus } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { Calendar, Clock, AlertCircle, Loader2, Plus, X } from 'lucide-react';

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les réservations'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    
    try {
      await bookingService.cancelBooking(id);
      loadBookings();
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible d\'annuler la réservation'));
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
      case 'CONFIRMED': return 'text-green-400 bg-green-400/10';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-400/10';
      case 'COMPLETED': return 'text-slate-400 bg-slate-400/10';
      case 'CANCELLED': return 'text-rose-400 bg-rose-400/10';
      case 'NO_SHOW': return 'text-rose-400 bg-rose-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmé';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      case 'NO_SHOW': return 'Absent';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mes Réservations</h1>
            <p className="text-slate-400">Gérez vos rendez-vous</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold transition-all"
          >
            <Plus className="h-5 w-5" />
            Nouvelle réservation
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancelBooking}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Calendar className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune réservation</h3>
            <p className="text-slate-400 mb-6">Vous n'avez pas encore de rendez-vous programmés</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold transition-all"
            >
              Créer une réservation
            </button>
          </div>
        )}

        {/* Create Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Nouvelle réservation</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-slate-400 mb-4">
                Le formulaire de création de réservation sera connecté à l'API backend.
              </p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface BookingCardProps {
  booking: Booking;
  onCancel: (id: string) => void;
  getStatusColor: (status: BookingStatus) => string;
  getStatusLabel: (status: BookingStatus) => string;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, getStatusColor, getStatusLabel }) => (
  <div className="glass-card rounded-2xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-white">
            {booking.salon?.name || booking.barber?.user?.profile?.firstName ? 
              `Rendez-vous chez ${booking.salon?.name || booking.barber?.user?.profile?.firstName}` : 
              'Rendez-vous'
            }
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(booking.scheduledAt).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>
      </div>
      {booking.price && (
        <div className="text-right">
          <p className="text-white font-semibold">{booking.price} {booking.currency}</p>
          <p className="text-slate-500 text-xs">{booking.duration} min</p>
        </div>
      )}
    </div>
    
    {booking.notes && (
      <p className="text-slate-400 text-sm mb-4">{booking.notes}</p>
    )}
    
    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
      <button
        onClick={() => onCancel(booking.id)}
        className="text-sm text-rose-400 hover:text-rose-300 font-medium"
      >
        Annuler la réservation
      </button>
    )}
  </div>
);

export default BookingsPage;
