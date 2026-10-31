import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Laptop,
  PawPrint,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react';
import { formatBRL, usePetHub } from '../context/PetHubContext';
import { CartDrawer } from './CartDrawer';
import { ServiceBookingModal } from './ServiceBookingModal';

export const MobileShell: React.FC<{
  children: React.ReactNode;
  hideBottomNav?: boolean;
}> = ({ children, hideBottomNav = false }) => {
  const {
    cartItemsCount,
    cartSubtotal,
    setIsCartOpen,
    activeOrdersCount,
    toasts,
  } = usePetHub();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/inicio', label: 'Início', icon: Home },
    { to: '/busca', label: 'Busca', icon: Search },
    { to: '/ofertas', label: 'Ofertas', icon: Tag, dot: true },
    {
      to: '/pedidos',
      label: 'Pedidos',
      icon: ShoppingBag,
      badge: activeOrdersCount,
    },
    { to: '/perfil', label: 'Perfil', icon: PawPrint },
  ];

  return (
    <div className="min-h-dvh w-full bg-[#F5E9DA] flex justify-center relative">
      {/* Desktop Mode Quick Switcher (B2C Tutor <-> B2B Lojista) */}
      <div className="hidden lg:flex fixed top-4 right-5 z-40 items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-[#C57969]/25">
        <button
          onClick={() => navigate('/boas-vindas')}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#302B29]/75 hover:bg-[#FFF6EB] flex items-center gap-1.5 cursor-pointer"
          title="Ver animação de abertura"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F3B63F]" />
          Splash & Login
        </button>
        <button
          onClick={() => navigate('/lojista')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#302B29] text-[#FFF6EB] hover:bg-[#A9503B] transition flex items-center gap-1.5 cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5 text-[#F3B63F]" />
          Painel do Lojista (B2B)
        </button>
      </div>

      {/* Mobile App Container */}
      <div className="w-full max-w-[430px] min-h-dvh bg-[#FFF6EB] text-[#302B29] shadow-xl relative flex flex-col">
        {/* Toast Stack */}
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px] space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl px-4 py-3 shadow-lg border text-xs animate-fade-in ${
                t.tone === 'warning'
                  ? 'bg-[#302B29] text-[#FFF6EB] border-[#F3B63F]'
                  : 'bg-[#302B29] text-[#FFF6EB] border-[#B65744]'
              }`}
            >
              <div className="font-extrabold">{t.title}</div>
              {t.subtitle && (
                <div className="text-[11px] text-[#FFF6EB]/80 mt-0.5">
                  {t.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <main
          className={`flex-1 ${
            hideBottomNav
              ? ''
              : cartItemsCount > 0
                ? 'pb-36'
                : 'pb-22'
          }`}
        >
          {children}
        </main>

        {/* Floating Unified Comanda Bar (iFood-style) */}
        {!hideBottomNav && cartItemsCount > 0 && (
          <div className="fixed bottom-18 left-1/2 -translate-x-1/2 w-[92%] max-w-[398px] z-30">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] shadow-lg flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#FFF6EB]/20 text-xs font-extrabold flex items-center justify-center">
                  {cartItemsCount}
                </span>
                <span className="text-xs font-extrabold">
                  Ver comanda unificada
                </span>
              </div>
              <span className="text-sm font-extrabold">
                {formatBRL(cartSubtotal)}
              </span>
            </button>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        {!hideBottomNav && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#C57969]/20 px-3 py-2 z-30">
            <div className="grid grid-cols-5 items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.to ||
                  (item.to === '/inicio' && location.pathname === '/');
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex flex-col items-center justify-center py-1 gap-0.5 transition relative ${
                      isActive
                        ? 'text-[#A9503B] font-extrabold'
                        : 'text-[#302B29]/60 font-semibold hover:text-[#B65744]'
                    }`}
                  >
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? 'stroke-[2.5]' : 'stroke-[1.9]'
                        }`}
                      />
                      {item.dot && (
                        <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#B65744]" />
                      )}
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#A9503B] text-[#FFF6EB] text-[10px] font-extrabold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px]">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        )}

        {/* Global Modals */}
        <ServiceBookingModal />
        <CartDrawer />
      </div>
    </div>
  );
};
