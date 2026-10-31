import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronDown, MapPin, Navigation, X } from 'lucide-react';
import { usePetHub } from '../context/PetHubContext';

const SAVED_ADDRESSES = [
  { label: 'Rua das Palmeiras, 14', detail: 'Casa • Jardins (Raio 3 km)' },
  { label: 'Av. Ibirapuera, 2120', detail: 'Trabalho • Moema (Raio 3 km)' },
  { label: 'Alameda Lorena, 880', detail: 'Casa dos Pais • Jardins' },
];

export const TopLocationHeader: React.FC = () => {
  const { address, setAddress, pushToast } = usePetHub();
  const navigate = useNavigate();
  const [openAddrModal, setOpenAddrModal] = useState(false);

  return (
    <>
      <header className="px-4 pt-4 pb-2.5 flex items-center justify-between bg-[#FFF6EB] sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          {/* Mini Brand Square */}
          <button
            onClick={() => navigate('/inicio')}
            className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-[#C57969]/20 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <span className="text-[10px] font-black tracking-tighter text-[#A9503B]">
              PetHub
            </span>
          </button>

          {/* Address Selector (REQ-01) */}
          <button
            onClick={() => setOpenAddrModal(true)}
            className="text-left group cursor-pointer"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#A9503B]">
              PETHUB
            </div>
            <div className="flex items-center gap-1 text-sm font-extrabold text-[#302B29] group-hover:text-[#A9503B] transition">
              <span className="truncate max-w-[205px]">{address}</span>
              <ChevronDown className="w-4 h-4 text-[#A9503B] shrink-0" />
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              pushToast(
                'Central de Alertas PetHub',
                'Spa Vila Pet enviou atualização sobre o banho do Thor!',
                'default'
              )
            }
            className="relative w-9 h-9 rounded-full bg-white/80 border border-[#C57969]/20 flex items-center justify-center text-[#302B29] hover:bg-white cursor-pointer"
            aria-label="Notificações"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#A9503B]" />
          </button>

          <button
            onClick={() => navigate('/perfil')}
            className="relative w-10 h-10 rounded-full p-0.5 border-2 border-[#B65744] cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
              alt="Perfil"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C57969] border-2 border-[#FFF6EB]" />
          </button>
        </div>
      </header>

      {/* Geolocation Modal (REQ-01) */}
      {openAddrModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#302B29]/55 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-[#FFF6EB] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  Onde seu pet está hoje?
                </h3>
                <p className="text-xs text-[#302B29]/65">
                  Ordenamos petshops por distância e deslocamento (REQ-01)
                </p>
              </div>
              <button
                onClick={() => setOpenAddrModal(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#302B29]/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setAddress('Rua das Palmeiras, 14');
                setOpenAddrModal(false);
                pushToast(
                  'GPS atualizado com sucesso!',
                  '3 petshops parceiros ativos num raio de 2 km.',
                  'success'
                );
              }}
              className="w-full p-3 rounded-2xl bg-[#B65744]/12 border border-[#B65744]/35 text-[#A9503B] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Usar minha localização GPS atual
            </button>

            <div className="space-y-2">
              {SAVED_ADDRESSES.map((item) => {
                const active = address === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setAddress(item.label);
                      setOpenAddrModal(false);
                      pushToast('Endereço alterado', item.label, 'success');
                    }}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition cursor-pointer ${
                      active
                        ? 'bg-white border-[#A9503B] shadow-xs'
                        : 'bg-white/70 border-[#302B29]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-[#A9503B]" />
                      <div>
                        <div className="text-xs font-extrabold">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#302B29]/60">
                          {item.detail}
                        </div>
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#A9503B]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
