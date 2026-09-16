import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      let data;
      switch (user?.role) {
        case 'CLIENT':
          data = await dashboardService.getClientDashboard();
          break;
        case 'BARBER':
          data = await dashboardService.getBarberDashboard();
          break;
        case 'SALON':
        case 'SALON_CHAIN':
          data = await dashboardService.getSalonDashboard();
          break;
        case 'ADMIN':
        case 'SUPER_ADMIN':
          data = await dashboardService.getAdminDashboard();
          break;
        default:
          data = await dashboardService.getClientDashboard();
      }
      setDashboardData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger le dashboard'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Erreur</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-6 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData.stats || {};

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bienvenue, {user?.profile?.firstName || user?.email?.split('@')[0]} 👋
          </h1>
          <p className="text-slate-400">
            Voici un aperçu de votre activité {user?.role === 'CLIENT' ? 'client' : user?.role === 'BARBER' ? 'barbier' : 'salon'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Réservations"
            value={stats.bookings || 0}
            color="amber"
          />
          <StatCard
            icon={Users}
            label={user?.role === 'CLIENT' ? 'Salons visités' : 'Clients'}
            value={stats.clients || stats.salons || 0}
            color="violet"
          />
          <StatCard
            icon={CreditCard}
            label="Abonnement"
            value={stats.subscription || 'Gratuit'}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Tendance"
            value={stats.trend || '+0%'}
            color="blue"
          />
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Activité récente</h2>
            <div className="space-y-4">
              {dashboardData.recentActivity?.length > 0 ? (
                dashboardData.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <p className="text-slate-300 text-sm">{activity.description || 'Activité récente'}</p>
                    <span className="text-slate-500 text-xs ml-auto">
                      {new Date(activity.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Aucune activité récente</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickAction
                label="Nouvelle réservation"
                href="/bookings"
                color="amber"
              />
              <QuickAction
                label="Voir le profil"
                href="/profile"
                color="violet"
              />
              <QuickAction
                label="Catalogue coiffures"
                href="/hairstyles"
                color="blue"
              />
              <QuickAction
                label="Analyse IA"
                href="/analyse-visage"
                color="green"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card rounded-2xl p-6">
    <div className={`flex items-center justify-between mb-4`}>
      <Icon className={`h-6 w-6 text-${color}-400`} />
      <span className={`text-2xl font-bold text-${color}-400`}>{value}</span>
    </div>
    <p className="text-slate-400 text-sm">{label}</p>
  </div>
);

interface QuickActionProps {
  label: string;
  href: string;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, href, color }) => (
  <a
    href={href}
    className={`flex items-center justify-center p-4 rounded-xl bg-${color}-500/10 hover:bg-${color}-500/20 border border-${color}-500/20 text-${color}-400 font-medium transition-all hover:scale-[1.02]`}
  >
    {label}
  </a>
);

export default DashboardPage;
