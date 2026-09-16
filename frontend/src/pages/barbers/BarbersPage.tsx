import React, { useEffect, useState } from 'react';
import { barberService } from '../../services/barber.service';
import { Barber } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { Search, Star, MapPin, Scissors, AlertCircle, Loader2 } from 'lucide-react';

const BarbersPage: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBarbers();
  }, []);

  useEffect(() => {
    filterBarbers();
  }, [barbers, searchTerm]);

  const loadBarbers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await barberService.getBarbers();
      setBarbers(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les barbiers'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterBarbers = () => {
    let filtered = [...barbers];
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.user?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.salon?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBarbers(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des barbiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Barbiers Recommandés</h1>
          <p className="text-slate-400">Découvrez les meilleurs talents de la coiffure</p>
        </div>

        {/* Search */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un barbier par nom ou salon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Barbers Grid */}
        {filteredBarbers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBarbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucun barbier trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface BarberCardProps {
  barber: Barber;
}

const BarberCard: React.FC<BarberCardProps> = ({ barber }) => (
  <div className="glass-card rounded-2xl overflow-hidden">
    <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
      {barber.user?.profile?.avatarUrl ? (
        <img
          src={barber.user.profile.avatarUrl}
          alt={`${barber.user.profile.firstName} ${barber.user.profile.lastName}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-6xl">
          {barber.user?.profile?.firstName?.[0] || barber.user?.email?.[0] || '?'}
        </div>
      )}
      {barber.isAvailable && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#07090E]"></div>
      )}
    </div>
    
    <div className="p-4">
      <h3 className="font-semibold text-white mb-1">
        {barber.user?.profile?.firstName} {barber.user?.profile?.lastName}
      </h3>
      
      {barber.salon && (
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
          <Scissors className="h-3 w-3" />
          <span>{barber.salon.name}</span>
        </div>
      )}
      
      {barber.rating && (
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-4 w-4 text-amber-400 fill-current" />
          <span className="text-white font-medium">
            {typeof barber.rating === 'number' ? barber.rating.toFixed(1) : barber.rating}
          </span>
          {barber.totalReviews && (
            <span className="text-slate-500 text-sm">({barber.totalReviews} avis)</span>
          )}
        </div>
      )}
      
      {barber.experienceYears && (
        <p className="text-slate-400 text-sm mb-3">
          {barber.experienceYears} an{barber.experienceYears > 1 ? 's' : ''} d'expérience
        </p>
      )}
      
      {barber.specialties && barber.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {barber.specialties.slice(0, 3).map((specialty, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full bg-white/5 text-slate-400 text-xs"
            >
              {specialty}
            </span>
          ))}
          {barber.specialties.length > 3 && (
            <span className="px-2 py-1 rounded-full bg-white/5 text-slate-400 text-xs">
              +{barber.specialties.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);

export default BarbersPage;
