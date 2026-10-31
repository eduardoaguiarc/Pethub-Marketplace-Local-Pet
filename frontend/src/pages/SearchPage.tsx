import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bath,
  Car,
  Compass,
  Cookie,
  FileHeart,
  Pill,
  Plus,
  ScanLine,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { TopLocationHeader } from '../components/TopLocationHeader';
import { formatBRL, usePetHub } from '../context/PetHubContext';
import { TRENDING_SEARCHES } from '../data/mockData';

export const SearchPage: React.FC = () => {
  const { products, services, stores, addProductToCart, openBookingModal } =
    usePetHub();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCat = searchParams.get('cat') ?? '';
  const [query, setQuery] = useState(initialCat);
  const [activeTab, setActiveTab] = useState<
    'Tudo' | 'Produtos' | 'Banho & Tosa' | 'Farmácia'
  >(initialCat === 'Farmácia' ? 'Farmácia' : 'Tudo');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === 'Banho & Tosa') return false;
      if (activeTab === 'Farmácia' && p.category !== 'Farmácia') return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, query, activeTab]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (activeTab === 'Produtos' || activeTab === 'Farmácia') return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        q.includes('táxi') ||
        q.includes('banho')
      );
    });
  }, [services, query, activeTab]);

  const exploreCards = [
    { label: 'Rações &\nDietas', icon: Cookie, q: 'Rações' },
    { label: 'Farmácia &\nAntipulgas', icon: Pill, q: 'Farmácia' },
    { label: 'Banho &\nEstética', icon: Bath, q: 'Banho' },
    { label: 'Petiscos &\nBifinhos', icon: Cookie, q: 'Petiscos' },
    { label: 'Brinquedos &\nLazer', icon: Sparkles, q: 'Brinquedos' },
    { label: 'Areias &\nTapetes', icon: Sparkles, q: 'Higiene' },
    { label: 'Camas &\nGuias', icon: Compass, q: 'Rações' },
    { label: 'Consultas &\nVet', icon: FileHeart, q: 'Banho' },
  ];

  const showResults = query.trim().length > 0 || activeTab !== 'Tudo';

  return (
    <MobileShell>
      <TopLocationHeader />

      <div className="px-4 space-y-5 pt-1">
        {/* Search Bar (tela_busca.jpg) */}
        <div className="relative flex items-center">
          <Search className="w-4.5 h-4.5 text-[#A9503B] absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rações, banho, remédios ou lojas..."
            className="w-full pl-11 pr-12 py-3.5 rounded-full bg-white shadow-2xs border border-[#C57969]/20 text-xs font-medium focus:outline-none focus:border-[#B65744]"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 px-2 py-1 text-[10px] font-bold text-[#A9503B] cursor-pointer"
            >
              Limpar
            </button>
          ) : (
            <span className="absolute right-2.5 w-8 h-8 rounded-full bg-[#F5E8DC] text-[#A9503B] flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'Tudo', label: 'Tudo' },
              { key: 'Produtos', label: 'Produtos 🛍️' },
              { key: 'Banho & Tosa', label: 'Banho & Tosa 🛁' },
              { key: 'Farmácia', label: 'Farmácia 💊' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#A9503B] text-[#FFF6EB] shadow-xs'
                  : 'bg-white text-[#302B29] border border-[#C57969]/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Filtered Results when searching */}
        {showResults && (
          <section className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">
                Resultados encontrados (
                {filteredProducts.length + filteredServices.length})
              </h2>
              <button
                onClick={() => {
                  setQuery('');
                  setActiveTab('Tudo');
                }}
                className="text-xs font-bold text-[#A9503B] underline cursor-pointer"
              >
                Ver vitrine completa
              </button>
            </div>

            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="rounded-2xl bg-white p-3.5 border border-[#B65744]/25 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold text-[#A9503B] uppercase">
                      🛁 {srv.storeName}
                    </span>
                    <h3 className="text-xs font-extrabold">{srv.name}</h3>
                    <p className="text-xs font-bold text-[#A9503B] mt-0.5">
                      A partir de {formatBRL(srv.priceBySize.Pequeno)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openBookingModal(srv)}
                  className="px-3 py-2 rounded-xl bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold shrink-0 cursor-pointer"
                >
                  Agendar
                </button>
              </div>
            ))}

            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="rounded-2xl bg-white p-3 border border-[#302B29]/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-semibold text-[#302B29]/55">
                      {prod.storeName}
                    </span>
                    <h3 className="text-xs font-extrabold line-clamp-1">
                      {prod.name}
                    </h3>
                    <p className="text-xs font-extrabold text-[#A9503B] mt-0.5">
                      {formatBRL(prod.price)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => addProductToCart(prod, 1)}
                  className="w-8 h-8 rounded-full bg-[#A9503B] text-[#FFF6EB] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </section>
        )}

        {/* Featured Banner (tela_busca.jpg) */}
        <section className="relative rounded-[26px] overflow-hidden h-44 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=80"
            alt="Festival de Banho e Tosa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#302B29]/85 via-[#302B29]/55 to-transparent p-5 flex flex-col justify-between text-[#FFF6EB]">
            <span className="self-start px-2.5 py-0.5 rounded-full bg-[#E07A5F] text-[10px] font-extrabold uppercase tracking-wider">
              Destaque da Semana
            </span>
            <div>
              <h2 className="text-lg font-extrabold leading-tight">
                Festival de Banho &amp; Tosa
              </h2>
              <p className="text-[11px] text-[#FFF6EB]/85 mt-0.5 max-w-[230px]">
                Agende perto de você com até 30% OFF no pacote VIP
              </p>
            </div>
            <button
              onClick={() => openBookingModal(services[0])}
              className="self-start px-4 py-2 rounded-full bg-[#A9503B] hover:bg-[#B65744] text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            >
              Agendar Agora
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Mais buscados no bairro */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#A9503B]" />
              <h2 className="text-sm font-extrabold">Mais buscados no bairro</h2>
            </div>
            <span className="text-[11px] font-bold text-[#A9503B]">
              Moema &amp; Jardins
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((item) => (
              <button
                key={item.label}
                onClick={() => setQuery(item.label.split(' ')[0])}
                className="px-3 py-1.5 rounded-full bg-[#F3EAE0] hover:bg-[#C57969]/25 text-xs font-semibold text-[#302B29] flex items-center gap-1.5 transition cursor-pointer"
              >
                {item.type === 'taxi' ? (
                  <Car className="w-3.5 h-3.5 text-[#A9503B]" />
                ) : (
                  <Search className="w-3 h-3 text-[#A9503B]" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* Explorar Categorias */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold">Explorar Categorias</h2>
              <p className="text-[11px] text-[#302B29]/60">
                Tudo para seu cão, gato ou pet exótico
              </p>
            </div>
            <button
              onClick={() => navigate(`/loja/${stores[0].id}`)}
              className="text-xs font-bold text-[#A9503B] cursor-pointer"
            >
              Ver catálogo
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {exploreCards.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  onClick={() => setQuery(c.q)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#EFE6DD] group-hover:bg-[#B65744]/15 flex items-center justify-center transition">
                    <div className="w-10 h-10 rounded-xl bg-[#FADCD2] text-[#A9503B] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-center whitespace-pre-line leading-tight text-[#302B29]/85">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Petshops & Spas em Destaque */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold">
                Petshops &amp; Spas em Destaque
              </h2>
              <p className="text-[11px] text-[#302B29]/60">
                Lojas com entrega ultra rápida ou agendamento hoje
              </p>
            </div>
            <span className="text-xs font-bold text-[#A9503B]">Filtros</span>
          </div>

          <div className="space-y-3">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => navigate(`/loja/${store.id}`)}
                className="w-full text-left rounded-3xl bg-white p-3.5 border border-[#C57969]/18 shadow-2xs hover:border-[#B65744] transition flex items-center gap-3.5 cursor-pointer"
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                  {store.isPro && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-[#E07A5F] text-white text-[9px] font-black">
                      PRO
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold truncate">
                      {store.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
                      {store.rating}{' '}
                      <span className="text-[#302B29]/45 font-medium">
                        ({store.reviewCount}+)
                      </span>
                    </span>
                  </div>

                  <p className="text-[11px] text-[#302B29]/60 mt-0.5">
                    {store.subtitle} • {store.distanceKm} km
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF6EB] text-[#A9503B] text-[10px] font-bold">
                      🕒 {store.deliveryTimeLabel}
                    </span>
                    {store.nextAvailableBath && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FADCD2]/65 text-[#A9503B] text-[10px] font-extrabold">
                        🛁 {store.nextAvailableBath}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
};
