import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Cookie,
  Layers,
  PawPrint,
  PiggyBank,
  Pill,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { formatBRL, usePetHub } from '../context/PetHubContext';

export const OffersPage: React.FC = () => {
  const { products, services, addProductToCart, openBookingModal, pushToast } =
    usePetHub();

  const [searchTerm, setSearchTerm] = useState('');
  const [freeShippingOnly, setFreeShippingOnly] = useState(true);
  const [maxPrice100, setMaxPrice100] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [offerFilter, setOfferFilter] = useState<string>('Todos');

  const offerCircles = [
    { label: 'Rações\n20%+', icon: PawPrint, key: 'Rações' },
    { label: 'Banho &\nTosa', icon: Bath, key: 'Banho' },
    { label: 'Farmácia\nPet', icon: Pill, key: 'Farmácia' },
    { label: 'Sachês 3x2', icon: Cookie, key: 'Petiscos' },
    { label: 'Frete\nGrátis', icon: Truck, key: 'Todos' },
    { label: 'Combo\nDuo', icon: Layers, key: 'Todos' },
  ];

  const displayedProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (freeShippingOnly && !p.freeShipping) return false;
      if (maxPrice100 && p.price > 100) return false;
      if (
        offerFilter !== 'Todos' &&
        offerFilter !== 'Banho' &&
        p.category !== offerFilter
      ) {
        return false;
      }
      if (
        searchTerm.trim() &&
        !p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
    if (sortAsc) {
      list = [...list].sort((a, b) => a.price - b.price);
    }
    return list;
  }, [products, freeShippingOnly, maxPrice100, offerFilter, searchTerm, sortAsc]);

  const featuredCombo = services[0];

  return (
    <MobileShell>
      <div className="px-4 pt-4 space-y-4">
        {/* Top Accumulated Savings Banner (tela_oferta.jpg) */}
        <button
          onClick={() =>
            pushToast(
              'Extrato Clube PetHub Ouro',
              'R$ 124,50 em descontos diretos + R$ 60,00 em frete grátis no bairro!',
              'success'
            )
          }
          className="w-full text-left rounded-2xl bg-gradient-to-r from-[#A9503B] via-[#B65744] to-[#E58A73] p-3.5 text-[#FFF6EB] shadow-sm flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF6EB]/20 flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFF6EB]/85">
                Economia Acumulada
              </div>
              <div className="text-xs font-extrabold">
                Você já economizou{' '}
                <span className="underline decoration-[#F3B63F] decoration-2">
                  R$ 184,50
                </span>{' '}
                este mês 🐾
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4.5 h-4.5 text-[#A9503B] absolute left-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar promoções, cupons ou lojas com frete"
            className="w-full pl-11 pr-11 py-3.5 rounded-full bg-white border border-[#C57969]/20 text-xs focus:outline-none focus:border-[#B65744]"
          />
          <SlidersHorizontal className="w-4 h-4 text-[#A9503B] absolute right-4" />
        </div>

        {/* Hero Split Banner: FESTIVAL PET HITS */}
        <section className="rounded-[26px] overflow-hidden bg-[#9D4430] text-[#FFF6EB] grid grid-cols-12 shadow-md">
          <div className="col-span-7 p-4.5 flex flex-col justify-between space-y-2.5">
            <span className="self-start px-2.5 py-0.5 rounded-full bg-[#FFF6EB] text-[#9D4430] text-[10px] font-black uppercase tracking-wide">
              🔥 Festival Pet Hits
            </span>
            <div>
              <h2 className="text-lg font-extrabold leading-tight">
                Rações e Banho a partir de R$ 19,90
              </h2>
              <p className="text-[11px] text-[#FFF6EB]/85 mt-1">
                🛵 + Entrega Grátis até 18h
              </p>
            </div>
            <button
              onClick={() => openBookingModal(services[1])}
              className="self-start px-3.5 py-2 rounded-full bg-[#FFF6EB] text-[#9D4430] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              Aproveitar Agora
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="col-span-5 relative">
            <img
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=500&q=80"
              alt="Festival Pet Hits"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Explorar por Oferta */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold">Explorar por Oferta</h2>
            <button
              onClick={() => setOfferFilter('Todos')}
              className="text-xs font-bold text-[#A9503B] cursor-pointer"
            >
              Descontos Reais
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {offerCircles.map((item) => {
              const Icon = item.icon;
              const active = offerFilter === item.key && item.key !== 'Todos';
              return (
                <button
                  key={item.label}
                  onClick={() =>
                    setOfferFilter((prev) =>
                      prev === item.key ? 'Todos' : item.key
                    )
                  }
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                      active
                        ? 'bg-[#A9503B] text-[#FFF6EB]'
                        : 'bg-[#EFE6DD] text-[#A9503B]'
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[11px] font-bold text-center whitespace-pre-line leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSortAsc((v) => !v)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border flex items-center gap-1 shrink-0 cursor-pointer ${
              sortAsc
                ? 'bg-[#A9503B] text-[#FFF6EB] border-[#A9503B]'
                : 'bg-white text-[#302B29] border-[#C57969]/20'
            }`}
          >
            {sortAsc ? 'Menor preço' : 'Ordenar por'}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMaxPrice100((v) => !v)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border flex items-center gap-1 shrink-0 cursor-pointer ${
              maxPrice100
                ? 'bg-[#A9503B] text-[#FFF6EB] border-[#A9503B]'
                : 'bg-white text-[#302B29] border-[#C57969]/20'
            }`}
          >
            {maxPrice100 ? 'Até R$ 100' : 'Preço máximo'}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFreeShippingOnly((v) => !v)}
            className={`px-3.5 py-2 rounded-full text-xs font-extrabold border flex items-center gap-1.5 shrink-0 cursor-pointer ${
              freeShippingOnly
                ? 'bg-[#B65744] text-[#FFF6EB] border-[#B65744]'
                : 'bg-white text-[#302B29] border-[#C57969]/20'
            }`}
          >
            {freeShippingOnly && <Check className="w-3.5 h-3.5" />}
            Frete Grátis
          </button>
        </div>

        {/* PetHub Indica (2-column Product + Spa Combo Grid from tela_oferta.jpg) */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold">PetHub Indica</h2>
                <BadgeCheck className="w-4.5 h-4.5 fill-[#A9503B] text-[#FFF6EB]" />
              </div>
              <p className="text-[11px] text-[#302B29]/60">
                Os melhores achados e combos no precinho
              </p>
            </div>
            <span className="text-xs font-bold text-[#A9503B]">Ver mais</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Featured Spa Service Card */}
            {offerFilter === 'Todos' || offerFilter === 'Banho' ? (
              <div className="rounded-3xl bg-white p-3 border border-[#C57969]/18 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="relative h-36 rounded-2xl overflow-hidden mb-2">
                    <img
                      src={featuredCombo.imageUrl}
                      alt={featuredCombo.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#9D4430] text-[#FFF6EB] text-[10px] font-extrabold">
                      33% OFF
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-white/95 text-[#A9503B] text-[10px] font-extrabold">
                      Hoje
                    </span>
                  </div>
                  <p className="text-[10px] text-[#302B29]/55">
                    Spa Vila Pet • 800m
                  </p>
                  <h3 className="text-xs font-extrabold leading-snug line-clamp-2 mt-0.5">
                    Combo Spa: Banho + Tosa + Unhas
                  </h3>
                </div>

                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-[#302B29]/45 line-through">
                      R$ 120,00
                    </div>
                    <div className="text-base font-extrabold text-[#A9503B]">
                      {formatBRL(featuredCombo.priceBySize.Médio)}
                    </div>
                  </div>
                  <button
                    onClick={() => openBookingModal(featuredCombo)}
                    className="w-9 h-9 rounded-full bg-[#B65744] hover:bg-[#A9503B] text-[#FFF6EB] flex items-center justify-center shadow-xs cursor-pointer"
                    title="Agendar horário"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Filtered Product Cards */}
            {displayedProducts.map((prod) => (
              <div
                key={prod.id}
                className="rounded-3xl bg-white p-3 border border-[#C57969]/18 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-36 rounded-2xl overflow-hidden bg-[#FFF6EB] mb-2">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                    {prod.discountBadge && (
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#B65744] text-[#FFF6EB] text-[10px] font-extrabold">
                        {prod.discountBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#302B29]/55">
                    {prod.storeName} • Grátis
                  </p>
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
                    <div className="text-base font-extrabold text-[#A9503B]">
                      {formatBRL(prod.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => addProductToCart(prod, 1)}
                    className="w-9 h-9 rounded-full bg-[#F5E8DC] hover:bg-[#A9503B] text-[#A9503B] hover:text-[#FFF6EB] flex items-center justify-center transition cursor-pointer"
                    title="Adicionar à comanda"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
};
