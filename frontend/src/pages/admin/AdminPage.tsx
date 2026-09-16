import React from 'react';
import { Users, Scissors, Building2, Calendar, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

const AdminPage: React.FC = () => {
  const stats = [
    { label: 'Utilisateurs', value: '0', icon: Users, color: 'amber' },
    { label: 'Barbiers', value: '0', icon: Scissors, color: 'violet' },
    { label: 'Salons', value: '0', icon: Building2, color: 'blue' },
    { label: 'Réservations', value: '0', icon: Calendar, color: 'green' },
    { label: 'Revenus', value: '0 XAF', icon: CreditCard, color: 'rose' },
    { label: 'Croissance', value: '+0%', icon: TrendingUp, color: 'cyan' },
  ];

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
              ADMIN
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord Admin</h1>
          <p className="text-slate-400">Vue d'ensemble de la plateforme</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card rounded-xl p-4">
              <stat.icon className={`h-5 w-5 text-${stat.color}-400 mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Interface Admin</h3>
              <p className="text-slate-400 mb-4">
                L'interface d'administration complète sera connectée aux API backend existantes. 
                Cette page servira de hub pour gérer les utilisateurs, les salons, les réservations, 
                les paiements et les statistiques de la plateforme.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="h-4 w-4 text-amber-400" />
                  Gestion des utilisateurs
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 className="h-4 w-4 text-violet-400" />
                  Gestion des salons
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Scissors className="h-4 w-4 text-blue-400" />
                  Gestion des barbiers
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="h-4 w-4 text-green-400" />
                  Gestion des réservations
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CreditCard className="h-4 w-4 text-rose-400" />
                  Gestion des paiements
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  Statistiques et rapports
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Utilisateurs</h3>
            <p className="text-slate-400 text-sm mb-4">Gérer les comptes utilisateurs et leurs permissions</p>
            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
              Voir les utilisateurs
            </button>
          </div>
          
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Salons</h3>
            <p className="text-slate-400 text-sm mb-4">Approuver et gérer les salons inscrits</p>
            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
              Voir les salons
            </button>
          </div>
          
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Rapports</h3>
            <p className="text-slate-400 text-sm mb-4">Consulter les statistiques et les rapports financiers</p>
            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
              Voir les rapports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
