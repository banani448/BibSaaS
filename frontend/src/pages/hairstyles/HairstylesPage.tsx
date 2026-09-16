import React, { useEffect, useState } from 'react';
import { hairstyleService } from '../../services/hairstyle.service';
import { Hairstyle } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { Search, Filter, Sparkles, Clock, DollarSign, AlertCircle, Loader2 } from 'lucide-react';

const HairstylesPage: React.FC = () => {
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [filteredHairstyles, setFilteredHairstyles] = useState<Hairstyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    loadHairstyles();
  }, []);

  useEffect(() => {
    filterHairstyles();
  }, [hairstyles, searchTerm, selectedGender, selectedCategory]);

  const loadHairstyles = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await hairstyleService.getHairstyles();
      setHairstyles(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les coiffures'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterHairstyles = () => {
    let filtered = [...hairstyles];
    
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGender !== 'ALL') {
      filtered = filtered.filter(h => h.gender === selectedGender);
    }
    
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(h => h.category === selectedCategory);
    }
    
    setFilteredHairstyles(filtered);
  };

  const categories = [...new Set(hairstyles.map(h => h.category))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des coiffures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Catalogue de Coiffures</h1>
          <p className="text-slate-400">Découvrez les tendances et trouvez votre style parfait</p>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher une coiffure..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            >
              <option value="ALL">Tous les genres</option>
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="UNISEX">Unisexe</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            >
              <option value="ALL">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Hairstyles Grid */}
        {filteredHairstyles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHairstyles.map((hairstyle) => (
              <HairstyleCard key={hairstyle.id} hairstyle={hairstyle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucune coiffure trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface HairstyleCardProps {
  hairstyle: Hairstyle;
}

const HairstyleCard: React.FC<HairstyleCardProps> = ({ hairstyle }) => (
  <div className="glass-card rounded-2xl overflow-hidden group">
    {hairstyle.imageUrl ? (
      <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        <img
          src={hairstyle.imageUrl}
          alt={hairstyle.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {hairstyle.isPremium && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-black text-xs font-bold">
            <Sparkles className="h-3 w-3" />
            Premium
          </div>
        )}
      </div>
    ) : (
      <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <span className="text-4xl">💇</span>
      </div>
    )}
    
    <div className="p-4">
      <h3 className="font-semibold text-white mb-1">{hairstyle.name}</h3>
      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{hairstyle.description}</p>
      
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {hairstyle.estimatedDuration ? `${hairstyle.estimatedDuration} min` : '-'}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {hairstyle.minPrice && hairstyle.maxPrice 
            ? `${hairstyle.minPrice} - ${hairstyle.maxPrice} XAF`
            : 'Prix sur demande'
          }
        </span>
      </div>
      
      <div className="mt-3 flex items-center gap-2">
        <span className="px-2 py-1 rounded-full bg-white/5 text-slate-400 text-xs">
          {hairstyle.category}
        </span>
        <span className="px-2 py-1 rounded-full bg-white/5 text-slate-400 text-xs">
          {hairstyle.gender}
        </span>
      </div>
    </div>
  </div>
);

export default HairstylesPage;
