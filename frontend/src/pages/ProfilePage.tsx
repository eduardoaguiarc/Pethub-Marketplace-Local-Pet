import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  Gift,
  HeartHandshake,
  IdCard,
  Laptop,
  LogOut,
  MapPin,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { formatBRL, usePetHub } from '../context/PetHubContext';

export const ProfilePage: React.FC = () => {
  const { tutorName, pets, address, pushToast, logout } = usePetHub();
  const navigate = useNavigate();
  const [showHealthCardModal, setShowHealthCardModal] = useState(false);

  const menuRows = [
    {
      icon: MessageSquare,
      label: 'Conversas & Petshops',
      badge: '2',
      onClick: () =>
        pushToast(
          'Chat com Spa Vila Pet',
          '"O Thor está super comportado no banho morno! 🐾"',
          'default'
        ),
    },
    {
      icon: Bell,
      label: 'Notificações e Avisos',
      badge: '5',
      onClick: () =>
        pushToast(
          '5 avisos recentes',
          'Vacinas, ofertas relâmpago e atualizações de pedidos.',
          'default'
        ),
    },
    {
      icon: Calendar,
      label: 'Agendamentos (Spa & Banho)',
      sublabel: 'Sexta-feira às 14:00 • Thor',
      pill: 'Confirmado',
      onClick: () => navigate('/pedidos'),
    },
    {
      icon: MapPin,
      label: 'Endereços de Entrega',
      sublabel: `${address} (Principal)`,
      onClick: () =>
        pushToast('Endereço Principal', `${address} • Raio local 3 km`),
    },
  ];

  return (
    <MobileShell>
      <div className="px-4 pt-5 pb-6 space-y-5">
        {/* Top Profile Header (tela_perfil.jpg) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                alt={tutorName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#B65744]"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#E07A5F] text-white flex items-center justify-center shadow-xs">
                <Award className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold text-[#302B29]">
                  {tutorName}
                </h1>
                <BadgeCheck className="w-4.5 h-4.5 fill-[#A9503B] text-[#FFF6EB]" />
              </div>
              <button
                onClick={() => navigate('/ofertas')}
                className="text-xs font-bold text-[#A9503B] flex items-center gap-0.5 cursor-pointer"
              >
                Clube PetHub Ouro
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-[#FADCD2] text-[#9D4430] text-[10px] font-extrabold">
                  💎 2.450 pts
                </span>
                <span className="text-[11px] text-[#302B29]/60 font-medium">
                  Nível VIP
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/boas-vindas')}
            className="w-10 h-10 rounded-full bg-white shadow-2xs border border-[#C57969]/20 flex items-center justify-center text-[#302B29] cursor-pointer"
            title="Tela de Abertura"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Meus Pets */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <PawPrint className="w-4 h-4 text-[#A9503B]" />
              <h2 className="text-base font-extrabold">Meus Pets</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#EFE6DD] text-[10px] font-bold text-[#302B29]/75">
                {pets.length} ativos
              </span>
            </div>
            <button
              onClick={() => setShowHealthCardModal(true)}
              className="text-xs font-bold text-[#A9503B] flex items-center gap-1 cursor-pointer"
            >
              Carteirinhas
              <IdCard className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="w-60 shrink-0 rounded-3xl bg-white p-3.5 border border-[#C57969]/18 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={pet.avatarUrl}
                      alt={pet.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-extrabold">{pet.name}</h3>
                      <p className="text-[11px] text-[#302B29]/60">
                        {pet.breed} • {pet.weightKg}kg
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FADCD2]/70 text-[#9D4430] text-[10px] font-extrabold shrink-0">
                    {pet.ageLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#302B29]/6">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A9503B]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {pet.vaccineStatus}
                  </span>
                  <button
                    onClick={() => setShowHealthCardModal(true)}
                    className="px-2.5 py-1 rounded-full bg-[#F3EAE0] text-[10px] font-extrabold text-[#302B29] cursor-pointer"
                  >
                    Histórico
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PETHUB PAY: Carteira & Saldo */}
        <section className="rounded-3xl bg-white p-4 border border-[#C57969]/18 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#FADCD2]/70 text-[#A9503B] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#A9503B]">
                  PETHUB PAY
                </div>
                <div className="text-sm font-extrabold">
                  Carteira &amp; Saldo
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-[#302B29]/60">Cashback</div>
              <div className="text-lg font-extrabold text-[#A9503B]">
                {formatBRL(42.8)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAF3EE] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4.5 h-4.5 text-[#302B29]" />
              <div>
                <div className="text-xs font-extrabold">
                  Mastercard •••• 8492
                </div>
                <div className="text-[11px] text-[#302B29]/60">
                  Padrão • Pix cadastrado
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                pushToast(
                  'Métodos de Pagamento (REQ-05)',
                  'Cartão Mastercard •••• 8492 e PIX ativos com split automático.',
                  'default'
                )
              }
              className="text-xs font-extrabold text-[#A9503B] cursor-pointer"
            >
              Trocar
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
              <strong>PetHub Prime Ativo:</strong> 15% OFF + Frete Grátis
            </span>
            <span className="font-bold text-[#A9503B]">Gerenciar</span>
          </div>
        </section>

        {/* Abrir Recompensas */}
        <button
          onClick={() => navigate('/ofertas')}
          className="w-full text-left rounded-3xl bg-gradient-to-r from-[#FADCD2]/65 to-white p-4 border border-[#C57969]/20 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#A9503B] flex items-center justify-center shadow-2xs">
              <Gift className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-sm font-extrabold">
                Abrir Recompensas 🎁
              </div>
              <div className="text-[11px] text-[#302B29]/65">
                4 cupons disponíveis para ativar hoje
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#A9503B]">
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Indique outro tutor */}
        <div className="rounded-3xl bg-white p-3.5 border border-[#C57969]/18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E07A5F] text-white flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold">Indique outro tutor</div>
              <div className="text-[11px] text-[#302B29]/60">
                Ganhe R$ 20 em ração ou banho
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              pushToast(
                'Link de convite copiado!',
                'pethub.app/convite/eduardo-ouro',
                'success'
              )
            }
            className="px-4 py-2 rounded-full bg-[#9D4430] text-[#FFF6EB] text-xs font-extrabold cursor-pointer"
          >
            Indicar
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="rounded-3xl bg-white border border-[#C57969]/18 divide-y divide-[#302B29]/8 overflow-hidden">
          {menuRows.map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.label}
                onClick={row.onClick}
                className="w-full p-4 flex items-center justify-between hover:bg-[#FFF6EB]/50 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F3EAE0] text-[#302B29] flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[#302B29]">
                      {row.label}
                    </div>
                    {row.sublabel && (
                      <div className="text-xs text-[#A9503B] font-medium mt-0.5">
                        {row.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {row.badge && (
                    <span className="w-6 h-6 rounded-full bg-[#9D4430] text-[#FFF6EB] text-xs font-extrabold flex items-center justify-center">
                      {row.badge}
                    </span>
                  )}
                  {row.pill && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FADCD2] text-[#9D4430] text-[10px] font-extrabold">
                      {row.pill}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#302B29]/45" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Switch to B2B Merchant Panel + Logout */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => navigate('/lojista')}
            className="py-3 px-3 rounded-2xl bg-[#302B29] text-[#FFF6EB] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Laptop className="w-4 h-4 text-[#F3B63F]" />
            Painel Lojista
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="py-3 px-3 rounded-2xl bg-white border border-[#C57969]/30 text-[#A9503B] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>

      {/* Carteirinhas Pet Modal */}
      {showHealthCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302B29]/60 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#FFF6EB] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                Carteirinha Sanitária &amp; Comportamental
              </h3>
              <button
                onClick={() => setShowHealthCardModal(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {pets.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white p-3.5 border border-[#C57969]/25 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">
                    {p.name} ({p.breed})
                  </span>
                  <span className="text-[11px] font-bold text-[#A9503B]">
                    Porte {p.size}
                  </span>
                </div>
                <p className="text-xs text-[#302B29]/75">
                  Status sanitário: <strong>{p.vaccineStatus}</strong>
                </p>
                {p.behavioralNotes && p.behavioralNotes.length > 0 && (
                  <p className="text-[11px] text-[#302B29]/65 bg-[#FFF6EB] rounded-xl p-2">
                    Nota estética (REQ-06): {p.behavioralNotes[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </MobileShell>
  );
};
