import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bath,
  Calendar,
  ChevronLeft,
  Clock,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { formatBRL, usePetHub } from '../context/PetHubContext';

export const StorePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const {
    stores,
    products,
    services,
    selectedPet,
    addProductToCart,
    openBookingModal,
  } = usePetHub();

  const [tab, setTab] = useState<'unificada' | 'servicos' | 'produtos'>(
    'unificada'
  );

  const store = useMemo(
    () => stores.find((s) => s.id === storeId) ?? stores[0],
    [stores, storeId]
  );

  const storeProducts = useMemo(
    () => products.filter((p) => p.storeId === store.id),
    [products, store.id]
  );

  const storeServices = useMemo(
    () => services.filter((s) => s.storeId === store.id),
    [services, store.id]
  );

  return (
    <MobileShell>
      {/* Hero Banner */}
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={store.bannerUrl}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#302B29]/85 via-[#302B29]/25 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#FFF6EB]/90 text-[#302B29] flex items-center justify-center shadow-md cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-[#FFF6EB]">
          <div className="flex items-center gap-3">
            <img
              src={store.logoUrl}
              alt={store.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FFF6EB] shadow-md"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-extrabold leading-tight">
                  {store.name}
                </h1>
                {store.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-[#F3B63F]" />
                )}
              </div>
              <p className="text-xs text-[#FFF6EB]/85">{store.subtitle}</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-[#FFF6EB] text-[#302B29] text-xs font-extrabold flex items-center gap-1 shadow-xs">
            <Star className="w-3.5 h-3.5 fill-[#F3B63F] text-[#F3B63F]" />
            {store.rating}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4">
        {/* Store Operational Strip */}
        <div className="rounded-2xl bg-white p-3 border border-[#C57969]/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#302B29]/80 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#A9503B]" />
            {store.distanceKm} km ({store.neighborhood})
          </div>
          <div className="h-3 w-px bg-[#302B29]/15" />
          <div className="flex items-center gap-1.5 text-[#302B29]/80 font-semibold">
            <Clock className="w-3.5 h-3.5 text-[#A9503B]" />
            {store.deliveryTimeLabel}
          </div>
          <div className="h-3 w-px bg-[#302B29]/15" />
          <div className="font-extrabold text-emerald-700">
            {store.deliveryFee === 0
              ? 'Frete Grátis'
              : formatBRL(store.deliveryFee)}
          </div>
        </div>

        {/* Highlight Unified Value Prop (PRC-01 / RN-03) */}
        <div className="rounded-2xl bg-[#F3B63F]/18 border border-[#F3B63F]/50 px-3.5 py-2.5 flex items-center gap-2.5 text-xs">
          <Sparkles className="w-4 h-4 text-[#A9503B] shrink-0" />
          <span>
            <strong>Comanda Híbrida PetHub:</strong> Combine ração/farmácia +
            banho &amp; tosa para <strong>{selectedPet.name}</strong> no mesmo
            checkout!
          </span>
        </div>

        {/* Unified Section Switcher */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#EFE6DD] p-1 rounded-2xl">
          {(
            [
              { id: 'unificada', label: 'Tudo Unificado' },
              { id: 'servicos', label: 'Estética 🛁' },
              { id: 'produtos', label: 'Produtos 🛍️' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                tab === t.id
                  ? 'bg-[#A9503B] text-[#FFF6EB] shadow-xs'
                  : 'text-[#302B29]/70 hover:text-[#302B29]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grade de Serviços de Estética */}
        {(tab === 'unificada' || tab === 'servicos') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-[#A9503B]" />
                <h2 className="text-sm font-extrabold">
                  Grade de Estética &amp; Baias Hoje
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#A9503B]">
                Porte {selectedPet.size} ({selectedPet.name})
              </span>
            </div>

            {storeServices.map((srv) => {
              const priceForSelectedPet = srv.priceBySize[selectedPet.size];
              return (
                <div
                  key={srv.id}
                  className="rounded-3xl bg-white p-3.5 border border-[#C57969]/20 shadow-2xs flex gap-3.5 items-center"
                >
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {srv.discountBadge && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#B65744]/15 text-[#A9503B] text-[10px] font-extrabold mb-1">
                        {srv.discountBadge}
                      </span>
                    )}
                    <h3 className="text-xs font-extrabold leading-snug">
                      {srv.name}
                    </h3>
                    <p className="text-[11px] text-[#302B29]/60 line-clamp-2 mt-0.5">
                      {srv.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-[#A9503B]">
                          {formatBRL(priceForSelectedPet)}
                        </span>
                        <span className="text-[10px] text-[#302B29]/50 ml-1">
                          • {srv.durationMinutes} min
                        </span>
                      </div>
                      <button
                        onClick={() => openBookingModal(srv)}
                        className="px-3 py-1.5 rounded-xl bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Vitrine de Produtos Físicos */}
        {(tab === 'unificada' || tab === 'produtos') && (
          <section className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#A9503B]" />
                <h2 className="text-sm font-extrabold">
                  Vitrine de Produtos Físicos
                </h2>
              </div>
              <span className="text-[11px] text-[#302B29]/60">
                Estoque em tempo real
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {storeProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-3xl bg-white p-3 border border-[#C57969]/18 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-28 rounded-2xl overflow-hidden bg-[#FFF6EB] mb-2">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      {prod.discountBadge && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#A9503B] text-[#FFF6EB] text-[10px] font-extrabold">
                          {prod.discountBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[#302B29]/50">
                      {prod.category} • {prod.stock} em estoque
                    </span>
                    <h3 className="text-xs font-extrabold leading-snug line-clamp-2 mt-0.5">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 flex items-end justify-between">
                    <div>
                      {prod.originalPrice && (
                        <div className="text-[10px] text-[#302B29]/45 line-through">
                          {formatBRL(prod.originalPrice)}
                        </div>
                      )}
                      <div className="text-sm font-extrabold text-[#A9503B]">
                        {formatBRL(prod.price)}
                      </div>
                    </div>
                    <button
                      disabled={prod.stock <= 0}
                      onClick={() => addProductToCart(prod, 1)}
                      className="w-8 h-8 rounded-full bg-[#A9503B] hover:bg-[#B65744] disabled:bg-[#302B29]/20 text-[#FFF6EB] flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileShell>
  );
};
