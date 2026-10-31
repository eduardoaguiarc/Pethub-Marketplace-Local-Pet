import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bath,
  Bone,
  Car,
  CheckCircle2,
  Clock,
  Cookie,
  HeartPulse,
  PawPrint,
  Pill,
  Plus,
  RotateCw,
  ShoppingBasket,
  Sparkles,
  Star,
  TicketPercent,
  X,
  Zap,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { TopLocationHeader } from '../components/TopLocationHeader';
import { formatBRL, usePetHub } from '../context/PetHubContext';
import type { PetSize, PetSpecies } from '../types/pethub';

export const HomePage: React.FC = () => {
  const {
    pets,
    selectedPet,
    setSelectedPetId,
    addPet,
    products,
    services,
    stores,
    addProductToCart,
    openBookingModal,
  } = usePetHub();
  const navigate = useNavigate();

  // Flash deals live countdown (02:44:17 in tela_inicio.jpg)
  const [secondsLeft, setSecondsLeft] = useState(2 * 3600 + 44 * 60 + 17);
  const [showAddPetModal, setShowAddPetModal] = useState(false);

  // Add Pet form state
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<PetSpecies>('Cão');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetWeight, setNewPetWeight] = useState('8');
  const [newPetSize, setNewPetSize] = useState<PetSize>('Médio');

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 9857));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formattedCountdown = useMemo(() => {
    const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
    const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [secondsLeft]);

  // Personalized reorder item depending on selected pet (Thor = Dog 15kg food, Mia = Cat Churu/Pipicat)
  const reorderProduct = useMemo(() => {
    if (selectedPet.species === 'Gato') {
      return products.find((p) => p.id === 'prod-pipicat') ?? products[0];
    }
    return products.find((p) => p.id === 'prod-premier-15kg') ?? products[0];
  }, [selectedPet, products]);

  const sortedStores = useMemo(
    () => [...stores].sort((a, b) => a.distanceKm - b.distanceKm),
    [stores]
  );

  const flashProducts = useMemo(
    () =>
      products.filter((p) =>
        ['prod-simparic', 'prod-pipicat', 'prod-bifinhos'].includes(p.id)
      ),
    [products]
  );

  const categories = [
    {
      label: 'Banho/Tosa',
      icon: Bath,
      badge: 'Hoje',
      action: () => openBookingModal(services[0]),
    },
    {
      label: 'Rações',
      icon: PawPrint,
      action: () => navigate('/busca?cat=Rações'),
    },
    {
      label: 'Farmácia',
      icon: Pill,
      badge: 'Express',
      action: () => navigate('/busca?cat=Farmácia'),
    },
    {
      label: 'Petiscos',
      icon: Cookie,
      action: () => navigate('/busca?cat=Petiscos'),
    },
    {
      label: 'Higiene',
      icon: Sparkles,
      action: () => navigate('/busca?cat=Higiene'),
    },
    {
      label: 'Brinquedos',
      icon: Car,
      action: () => navigate('/busca?cat=Brinquedos'),
    },
    {
      label: 'Clínicas',
      icon: HeartPulse,
      action: () => navigate(`/loja/${stores[0].id}`),
    },
    {
      label: 'Cupons',
      icon: TicketPercent,
      action: () => navigate('/ofertas'),
    },
  ];

  const handleCreatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) return;
    addPet({
      name: newPetName.trim(),
      species: newPetSpecies,
      breed: newPetBreed.trim() || (newPetSpecies === 'Cão' ? 'SRD' : 'Felino'),
      ageLabel: '1 ano',
      weightKg: Number(newPetWeight) || 8,
      size: newPetSize,
      avatarUrl:
        newPetSpecies === 'Gato'
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80',
      vaccineStatus: 'Vacinas em dia',
    });
    setNewPetName('');
    setNewPetBreed('');
    setShowAddPetModal(false);
  };

  return (
    <MobileShell>
      <TopLocationHeader />

      <div className="px-4 space-y-5 pt-1">
        {/* PERSONALIZADO PARA SEU PET (tela_inicio.jpg) */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#302B29]/70">
              Personalizado para seu pet
            </span>
            <button
              onClick={() => navigate('/perfil')}
              className="text-xs font-bold text-[#A9503B] hover:underline cursor-pointer"
            >
              Trocar perfil
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {pets.map((pet) => {
              const active = pet.id === selectedPet.id;
              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#A9503B] text-[#FFF6EB] font-extrabold shadow-xs'
                      : 'bg-white text-[#302B29] border border-[#C57969]/25 font-semibold hover:border-[#B65744]'
                  }`}
                >
                  <img
                    src={pet.avatarUrl}
                    alt={pet.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>
                    <strong>{pet.name}</strong> ({pet.breed.split(' ')[0]})
                  </span>
                  {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}

            <button
              onClick={() => setShowAddPetModal(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#F5E8DC] text-[#A9503B] text-xs font-extrabold shrink-0 hover:bg-[#C57969]/25 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Pet
            </button>
          </div>
        </section>

        {/* HERO PROMO BANNER: Quarta do Banho Cheiroso */}
        <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#A9503B] via-[#B65744] to-[#C57969] p-5 text-[#FFF6EB] shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2.5 max-w-[62%]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF6EB]/20 text-[11px] font-bold">
                🛁 Quarta Especial
              </span>
              <h2 className="text-xl font-extrabold leading-tight">
                Quarta do Banho Cheiroso
              </h2>
              <p className="text-xs text-[#FFF6EB]/90 leading-snug">
                Busca &amp; leva grátis no seu bairro a partir de{' '}
                <strong className="text-[#F3B63F]">R$ 39,90</strong>
              </p>
              <button
                onClick={() => openBookingModal(services[1])}
                className="mt-1 px-4 py-2.5 rounded-full bg-[#FFF6EB] text-[#A9503B] text-xs font-extrabold shadow-sm hover:bg-white transition cursor-pointer"
              >
                Agendar Agora
              </button>
            </div>

            <div className="w-28 h-32 rounded-2xl overflow-hidden border-2 border-[#FFF6EB]/30 shadow-md shrink-0">
              <img
                src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80"
                alt="Golden no banho"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* PEÇA DE NOVO PARA THOR / MIA */}
        <section className="rounded-3xl bg-white p-4 shadow-xs border border-[#C57969]/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#302B29]">
              <RotateCw className="w-3.5 h-3.5 text-[#A9503B]" />
              Peça de Novo para {selectedPet.name}
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C57969]/15 text-[#A9503B] text-[10px] font-extrabold">
              <Zap className="w-3 h-3" />
              25–35 min
            </span>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={reorderProduct.imageUrl}
              alt={reorderProduct.name}
              className="w-16 h-16 rounded-2xl object-cover bg-[#FFF6EB] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-extrabold text-[#302B29] truncate">
                {reorderProduct.name}
              </h3>
              <p className="text-[11px] text-[#302B29]/60 mt-0.5">
                {reorderProduct.storeName} • Reposição mensal
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-extrabold text-[#A9503B]">
                  {formatBRL(reorderProduct.price)}
                </span>
                <button
                  onClick={() => addProductToCart(reorderProduct, 1)}
                  className="px-3.5 py-1.5 rounded-full bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ShoppingBasket className="w-3.5 h-3.5" />
                  Repor
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIAS (8-Grid from tela_inicio.jpg) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold">Categorias</h2>
            <button
              onClick={() => navigate('/busca')}
              className="text-xs font-bold text-[#A9503B] hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.label}
                  onClick={cat.action}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="relative w-15 h-15 rounded-2xl bg-[#EFE6DD] group-hover:bg-[#B65744]/18 flex items-center justify-center text-[#A9503B] transition">
                    <Icon className="w-6 h-6" />
                    {cat.badge && (
                      <span
                        className={`absolute -top-1.5 -right-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#FFF6EB] ${
                          cat.badge === 'Express'
                            ? 'bg-[#B65744]'
                            : 'bg-[#8E4B3A]'
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#302B29]/85">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* OFERTAS RELÂMPAGO */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-[#A9503B]" />
              <h2 className="text-base font-extrabold">Ofertas Relâmpago</h2>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#EFE6DD] text-[11px] font-bold">
              <span className="text-[#A9503B]">Termina em </span>
              <span className="font-extrabold text-[#302B29] tabular-nums">
                {formattedCountdown}
              </span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {flashProducts.map((item) => (
              <div
                key={item.id}
                className="w-40 shrink-0 rounded-2xl bg-white p-3 border border-[#C57969]/15 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-25 rounded-xl overflow-hidden bg-[#FFF6EB] mb-2">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.discountBadge && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#B65744] text-[#FFF6EB] text-[10px] font-extrabold">
                        {item.discountBadge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-2 pt-1 flex items-end justify-between">
                  <div>
                    {item.originalPrice && (
                      <div className="text-[10px] text-[#302B29]/45 line-through">
                        {formatBRL(item.originalPrice)}
                      </div>
                    )}
                    <div className="text-sm font-extrabold text-[#A9503B]">
                      {formatBRL(item.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => addProductToCart(item, 1)}
                    className="w-7 h-7 rounded-full bg-[#A9503B] text-[#FFF6EB] flex items-center justify-center hover:bg-[#B65744] transition cursor-pointer"
                    aria-label="Adicionar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PETSHOPS DO SEU BAIRRO (REQ-01: Ordenados por Distância + Vitrine Unificada) */}
        <section className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold">
                Petshops no seu Bairro
              </h2>
              <p className="text-[11px] text-[#302B29]/60">
                Toque para abrir vitrine de produtos + agenda de banho
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedStores.map((store) => (
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
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-[#B65744] text-[#FFF6EB] text-[9px] font-black">
                      PRO
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold truncate">
                      {store.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#302B29] shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#F3B63F] text-[#F3B63F]" />
                      {store.rating}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#302B29]/60 mt-0.5">
                    {store.subtitle} • {store.distanceKm} km
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF6EB] text-[#A9503B] text-[10px] font-bold">
                      🕒 {store.deliveryTimeLabel}
                    </span>
                    {store.nextAvailableBath && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C57969]/15 text-[#A9503B] text-[10px] font-extrabold">
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

      {/* Modal: + Novo Pet */}
      {showAddPetModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#302B29]/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreatePet}
            className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-[#FFF6EB] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bone className="w-5 h-5 text-[#A9503B]" />
                <h3 className="text-base font-extrabold">Cadastrar Novo Pet</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPetModal(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['Cão', 'Gato'] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setNewPetSpecies(sp)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                    newPetSpecies === sp
                      ? 'bg-[#A9503B] text-[#FFF6EB] border-[#A9503B]'
                      : 'bg-white text-[#302B29] border-[#302B29]/10'
                  }`}
                >
                  {sp === 'Cão' ? '🐶 Cachorro' : '🐱 Gato'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-[#302B29]/70">
                  Nome do Pet
                </label>
                <input
                  required
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  placeholder="Ex: Luna"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-[#302B29]/12 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-[#302B29]/70">
                  Raça
                </label>
                <input
                  value={newPetBreed}
                  onChange={(e) => setNewPetBreed(e.target.value)}
                  placeholder="Ex: Shih-tzu"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-[#302B29]/12 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-[#302B29]/70">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newPetWeight}
                  onChange={(e) => setNewPetWeight(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-[#302B29]/12 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-[#302B29]/70">
                  Porte (Baia REQ-02)
                </label>
                <select
                  value={newPetSize}
                  onChange={(e) => setNewPetSize(e.target.value as PetSize)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-[#302B29]/12 text-xs font-bold"
                >
                  <option value="Pequeno">Pequeno (até 10kg)</option>
                  <option value="Médio">Médio (10 a 20kg)</option>
                  <option value="Grande">Grande (+20kg)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold cursor-pointer"
            >
              Salvar Pet no Perfil
            </button>
          </form>
        </div>
      )}
    </MobileShell>
  );
};
