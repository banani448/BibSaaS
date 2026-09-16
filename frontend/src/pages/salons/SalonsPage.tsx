import React, { useEffect, useState } from 'react';
import { salonService } from '../../services/salon.service';
import { Salon } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { Search, MapPin, Star, Phone, AlertCircle, Loader2 } from 'lucide-react';

const SalonsPage: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSalons();
  }, []);

  useEffect(() => {
    filterSalons();
  }, [salons, searchTerm]);

  const loadSalons = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await salonService.getSalons();
      setSalons(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les salons'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterSalons = () => {
    let filtered = [...salons];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredSalons(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des salons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Salons Partenaires</h1>
          <p className="text-slate-400">Trouvez le salon parfait près de chez vous</p>
        </div>

        {/* Search */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un salon par nom, ville ou adresse..."
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

        {/* Salons Grid */}
        {filteredSalons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucun salon trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SalonCardProps {
  salon: Salon;
}

const SalonCard: React.FC<SalonCardProps> = ({ salon }) => (
  <div className="glass-card rounded-2xl overflow-hidden">
    {salon.coverUrl ? (
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        <img
          src={salon.coverUrl}
          alt={salon.name}
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <span className="text-4xl">🏪</span>
      </div>
    )}
    
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white text-lg">{salon.name}</h3>
        {salon.rating && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm">
            <Star className="h-3 w-3 fill-current" />
            {typeof salon.rating === 'number' ? salon.rating.toFixed(1) : salon.rating}
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {salon.city && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{salon.city}{salon.country ? `, ${salon.country}` : ''}</span>
          </div>
        )}
        {salon.address && (
          <p className="text-slate-500 text-sm">{salon.address}</p>
        )}
        {salon.phone && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Phone className="h-4 w-4" />
            <span>{salon.phone}</span>
          </div>
        )}
      </div>
      
      <button className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors">
        Voir les détails
      </button>
    </div>
  </div>
);

export default SalonsPage;
