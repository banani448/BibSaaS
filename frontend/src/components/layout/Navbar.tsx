import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notification.service';
import { 
  Sparkles, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Bell, 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  Shield, 
  Scissors
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getUnreadCount()
        .then(setUnreadCount)
        .catch(() => setUnreadCount(0));
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#07090E]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Scissors className="h-5 w-5 text-black transform -rotate-45" />
            <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 ring-2 ring-[#07090E]">
              <Sparkles className="h-2 w-2 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Bib<span className="text-amber-400">SaaS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-700/50">
                IA
              </span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:block">L'intelligence pour votre salon</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
          <Link 
            to="/hairstyles" 
            className={`px-3.5 py-2 rounded-lg transition-colors ${isCurrent('/hairstyles') ? 'text-amber-400 bg-white/5' : 'hover:text-white hover:bg-white/5'}`}
          >
            Coiffures
          </Link>
          <Link 
            to="/analyse-visage" 
            className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${isCurrent('/analyse-visage') ? 'text-violet-400 bg-violet-500/10' : 'hover:text-violet-300 hover:bg-white/5'}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Analyse IA
          </Link>
          <Link 
            to="/salons" 
            className={`px-3.5 py-2 rounded-lg transition-colors ${isCurrent('/salons') ? 'text-amber-400 bg-white/5' : 'hover:text-white hover:bg-white/5'}`}
          >
            Salons
          </Link>
          <Link 
            to="/barbers" 
            className={`px-3.5 py-2 rounded-lg transition-colors ${isCurrent('/barbers') ? 'text-amber-400 bg-white/5' : 'hover:text-white hover:bg-white/5'}`}
          >
            Barbiers
          </Link>
          <Link 
            to="/subscriptions" 
            className={`px-3.5 py-2 rounded-lg transition-colors ${isCurrent('/subscriptions') ? 'text-amber-400 bg-white/5' : 'hover:text-white hover:bg-white/5'}`}
          >
            Tarifs
          </Link>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Link 
                to="/notifications" 
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black ring-2 ring-[#07090E]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Dashboard quick button */}
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <LayoutDashboard className="h-4 w-4 text-amber-400" />
                Dashboard
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {user.profile?.firstName || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold text-xs">
                    {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs text-slate-400">Connecté en tant que</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Mon Profil
                    </Link>

                    <Link
                      to="/bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Mes Réservations
                    </Link>

                    <Link
                      to="/subscriptions"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      Abonnement & Factures
                    </Link>

                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                      >
                        <Shield className="h-4 w-4 text-amber-400" />
                        Administration
                      </Link>
                    )}

                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                Commencer gratuitement
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && (
            <Link to="/notifications" className="relative p-2 text-slate-300">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#07090E]/95 px-4 pt-2 pb-6 space-y-2 backdrop-blur-2xl">
          <Link
            to="/hairstyles"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Catalogue Coiffures
          </Link>
          <Link
            to="/analyse-visage"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-violet-400 bg-violet-500/10"
          >
            <Sparkles className="h-4 w-4" />
            Analyse Visage IA
          </Link>
          <Link
            to="/salons"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Salons Partenaires
          </Link>
          <Link
            to="/barbers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Barbiers Recommandés
          </Link>
          <Link
            to="/subscriptions"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Offres & Tarifs
          </Link>

          {isAuthenticated ? (
            <div className="border-t border-white/10 pt-4 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-amber-400 bg-white/5"
              >
                <LayoutDashboard className="h-5 w-5" />
                Tableau de bord
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
              >
                <User className="h-5 w-5" />
                Mon Profil
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
              >
                <Calendar className="h-5 w-5" />
                Mes Réservations
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-amber-300 bg-amber-500/10"
                >
                  <Shield className="h-5 w-5" />
                  Administration
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="border-t border-white/10 pt-4 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-xl text-slate-200 bg-white/5 font-medium"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold shadow-lg"
              >
                Commencer gratuitement
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
