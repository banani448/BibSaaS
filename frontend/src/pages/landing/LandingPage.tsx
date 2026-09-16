import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Scissors, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Propulsé par l'Intelligence Artificielle</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            L'intelligence qui<br />
            <span className="gold-gradient-text">transforme votre salon</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Plateforme SaaS tout-en-un pour salons de coiffure et barbiers. 
            Recommandations IA personnalisées, réservations en ligne, gestion de salon et paiements Mobile Money.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg border border-white/10 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Une solution complète pour moderniser votre salon et offrir une expérience exceptionnelle à vos clients.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Recommandations IA',
                description: 'Analyse faciale intelligente pour suggérer les coiffures parfaites selon la morphologie de chaque client.',
                color: 'violet'
              },
              {
                icon: Scissors,
                title: 'Catalogue de Coiffures',
                description: 'Base de données complète de styles avec filtrage par genre, difficulté et popularité.',
                color: 'amber'
              },
              {
                icon: Zap,
                title: 'Réservations en Ligne',
                description: 'Système de prise de rendez-vous 24/7 avec gestion automatique des créneaux disponibles.',
                color: 'blue'
              },
              {
                icon: Users,
                title: 'Gestion de Salon',
                description: 'Tableau de bord complet pour gérer vos barbiers, salons et statistiques de performance.',
                color: 'green'
              },
              {
                icon: Shield,
                title: 'Paiements Sécurisés',
                description: 'Integration Stripe et CinetPay pour accepter les paiements cartes et Mobile Money.',
                color: 'rose'
              },
              {
                icon: ArrowRight,
                title: 'Facturation Automatique',
                description: 'Génération automatique des factures et suivi des paiements en temps réel.',
                color: 'cyan'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-2xl"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prêt à transformer votre salon ?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Rejoignez des centaines de salons qui utilisent déjà BibSaaS pour moderniser leur activité.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Démarrer maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2024 BibSaaS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
