import React, { useEffect, useState } from 'react';
import { subscriptionService } from '../../services/subscription.service';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { CreditCard, Check, AlertCircle, Loader2, Sparkles, Crown, Building2 } from 'lucide-react';

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [currentSub, plansData, historyData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getPlans(),
        subscriptionService.getHistory()
      ]);
      setSubscriptions(currentSub ? [currentSub, ...historyData] : historyData);
      setPlans(plansData);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les abonnements'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const subscription = await subscriptionService.createSubscription(planId, true);
      if (subscription) {
        await loadData();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de créer l\'abonnement'));
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/10';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
      case 'EXPIRED': return 'text-slate-400 bg-slate-400/10';
      case 'CANCELLED': return 'text-rose-400 bg-rose-400/10';
      case 'SUSPENDED': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusLabel = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'PENDING': return 'En attente';
      case 'EXPIRED': return 'Expiré';
      case 'CANCELLED': return 'Annulé';
      case 'SUSPENDED': return 'Suspendu';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Abonnements</h1>
          <p className="text-slate-400">Choisissez le plan qui correspond à vos besoins</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Current Subscription */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Votre abonnement actuel</h2>
            <div className="glass-panel rounded-2xl p-6">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{sub.plan?.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Du {new Date(sub.startDate).toLocaleDateString('fr-FR')} au {new Date(sub.endDate).toLocaleDateString('fr-FR')}
                    </p>
                    {sub.autoRenew && (
                      <p className="text-green-400 text-xs mt-1">Renouvellement automatique activé</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {sub.plan?.price} {sub.plan?.currency}
                    </p>
                    <p className="text-slate-500 text-sm">/{sub.plan?.durationDays} jours</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Plans disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSubscribe={handleSubscribe}
                currentSubscription={subscriptions[0]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSubscribe: (planId: string) => void;
  currentSubscription?: Subscription;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSubscribe, currentSubscription }) => {
  const getIcon = () => {
    switch (plan.type) {
      case 'CLIENT_BASIC':
      case 'CLIENT_PREMIUM':
        return <Crown className="h-6 w-6" />;
      case 'BARBER':
        return <Sparkles className="h-6 w-6" />;
      case 'SALON':
      case 'SALON_CHAIN':
        return <Building2 className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = currentSubscription?.planId === plan.id;
  const isSubscribed = currentSubscription?.status === 'ACTIVE';

  return (
    <div className={`glass-panel rounded-2xl p-6 relative ${plan.isPopular ? 'border-amber-500/50' : ''}`}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold">
          Populaire
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${plan.isPopular ? 'bg-amber-500/10' : 'bg-white/5'} flex items-center justify-center ${plan.isPopular ? 'text-amber-400' : 'text-slate-400'}`}>
          {getIcon()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
          <p className="text-slate-500 text-sm">{plan.type.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold text-white">{plan.price}</span>
        <span className="text-slate-400"> {plan.currency}</span>
        <p className="text-slate-500 text-sm">/{plan.durationDays} jours</p>
      </div>

      {plan.description && (
        <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
      )}

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li key={feature.id} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>{feature.key}: {feature.value || 'Inclus'}</span>
          </li>
        ))}
        {plan.aiRecommendations && (
          <li className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Recommandations IA</span>
          </li>
        )}
      </ul>

      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={isCurrentPlan}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          isCurrentPlan
            ? 'bg-white/5 text-slate-500 cursor-not-allowed'
            : plan.isPopular
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black'
            : 'bg-white/5 hover:bg-white/10 text-white'
        }`}
      >
        {isCurrentPlan ? 'Plan actuel' : 'S\'abonner'}
      </button>
    </div>
  );
};

export default SubscriptionsPage;
