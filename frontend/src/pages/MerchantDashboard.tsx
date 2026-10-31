import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bath,
  BellRing,
  CheckCircle2,
  Clock,
  DollarSign,
  LayoutDashboard,
  Package,
  Plus,
  Smartphone,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import { PetHubWordmark } from '../components/BrandAssets';
import { formatBRL, usePetHub } from '../context/PetHubContext';
import type { Order, ProductCategory } from '../types/pethub';

export const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    products,
    stores,
    merchantAcceptOrder,
    merchantRejectOrder,
    merchantAdvanceOrderStatus,
    merchantRequestAddOn,
    merchantSaveBehavioralNote,
    toggleProductStock,
    addMerchantProduct,
    toasts,
  } = usePetHub();

  const [section, setSection] = useState<
    'fila' | 'estetica' | 'catalogo' | 'financeiro'
  >('fila');
  const [nowMs, setNowMs] = useState(Date.now());
  const [rejectOrderTarget, setRejectOrderTarget] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Baia de grande porte em higienização emergencial neste horário.'
  );
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // New Product Quick Form (PRC-03)
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('12');
  const [newProdCategory, setNewProdCategory] =
    useState<ProductCategory>('Rações');

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // REQ-03: Audible alert simulation via Web Audio API
  const playSlaSoundAlert = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Ignore if browser audio blocked
    }
  };

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PENDENTE_CONFIRMACAO'),
    [orders]
  );

  const activeExecutionOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === 'ACEITO_EM_PREPARO' ||
          o.status === 'EM_ATENDIMENTO_ESTETICA' ||
          o.status === 'SAIU_PARA_ENTREGA' ||
          o.status === 'PRONTO_RETIRADA'
      ),
    [orders]
  );

  const financialTotals = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'RECUSADO_OU_TIMEOUT');
    const gross = valid.reduce((acc, o) => acc + o.total, 0);
    const takeRate = valid.reduce(
      (acc, o) => acc + o.platformTakeRateAmount,
      0
    );
    const net = valid.reduce((acc, o) => acc + o.merchantNetAmount, 0);
    return { gross, takeRate, net, count: valid.length };
  }, [orders]);

  const formatSla = (deadline: number) => {
    const rem = Math.max(0, Math.floor((deadline - nowMs) / 1000));
    const m = String(Math.floor(rem / 60)).padStart(2, '0');
    const s = String(rem % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    addMerchantProduct({
      storeId: stores[0].id,
      storeName: stores[0].name,
      name: newProdName.trim(),
      description: 'Cadastrado via Painel do Lojista PetHub (PRC-03).',
      category: newProdCategory,
      price: Number(newProdPrice),
      imageUrl:
        'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80',
      stock: Number(newProdStock) || 10,
      unitLabel: 'Unidade',
      freeShipping: true,
    });
    setNewProdName('');
    setNewProdPrice('');
  };

  return (
    <div className="min-h-dvh bg-[#FFF6EB] text-[#302B29] flex flex-col lg:flex-row">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl bg-[#302B29] text-[#FFF6EB] px-4 py-3 shadow-lg border border-[#F3B63F]/60 text-xs animate-fade-in"
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

      {/* Sidebar (#302B29 Carvão) */}
      <aside className="w-full lg:w-68 bg-[#302B29] text-[#FFF6EB] p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <PetHubWordmark light size="md" />
              <p className="text-[11px] text-[#FFF6EB]/65 mt-1">
                Painel do Lojista Parceiro (B2B)
              </p>
            </div>
            <button
              onClick={() => navigate('/inicio')}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-[#B65744] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              App Tutor
            </button>
          </div>

          <div className="rounded-2xl bg-[#FFF6EB]/8 p-3.5 border border-[#FFF6EB]/10">
            <div className="text-xs font-extrabold text-[#F3B63F]">
              Vila Pet &amp; Banho Spa
            </div>
            <div className="text-[11px] text-[#FFF6EB]/75 mt-0.5">
              Status: Loja Aberta • Raio 3 km ativo
            </div>
          </div>

          <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <button
              onClick={() => setSection('fila')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
                section === 'fila'
                  ? 'bg-[#B65744] text-[#FFF6EB]'
                  : 'text-[#FFF6EB]/75 hover:bg-[#FFF6EB]/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <BellRing className="w-4 h-4" />
                Fila &amp; SLA (PRC-01)
              </span>
              {pendingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F3B63F] text-[#302B29] text-[10px] font-black">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSection('estetica')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
                section === 'estetica'
                  ? 'bg-[#B65744] text-[#FFF6EB]'
                  : 'text-[#FFF6EB]/75 hover:bg-[#FFF6EB]/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bath className="w-4 h-4" />
                Estética &amp; Comanda
              </span>
              <span className="text-[10px] opacity-80">
                {activeExecutionOrders.length}
              </span>
            </button>

            <button
              onClick={() => setSection('catalogo')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                section === 'catalogo'
                  ? 'bg-[#B65744] text-[#FFF6EB]'
                  : 'text-[#FFF6EB]/75 hover:bg-[#FFF6EB]/10'
              }`}
            >
              <Package className="w-4 h-4" />
              Catálogo &amp; Baias (PRC-03)
            </button>

            <button
              onClick={() => setSection('financeiro')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                section === 'financeiro'
                  ? 'bg-[#B65744] text-[#FFF6EB]'
                  : 'text-[#FFF6EB]/75 hover:bg-[#FFF6EB]/10'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Split &amp; Repasses (RN-04)
            </button>
          </nav>
        </div>

        <div className="hidden lg:block pt-6">
          <button
            onClick={() => navigate('/inicio')}
            className="w-full py-3 px-4 rounded-2xl bg-[#FFF6EB] text-[#302B29] hover:bg-[#F3B63F] text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#A9503B]" />
            Voltar ao App do Tutor (B2C)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Top Operational Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C57969]/25 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#A9503B] uppercase tracking-wider">
              <LayoutDashboard className="w-4 h-4" />
              Gestão Operacional em Tempo Real
            </div>
            <h1 className="text-2xl font-extrabold mt-0.5">
              {section === 'fila' &&
                'Recebimento de Pedidos Híbridos & Aceite SLA'}
              {section === 'estetica' &&
                'Execução de Estética, Triagem & Cross-Selling (PRC-02)'}
              {section === 'catalogo' &&
                'Catálogo de Produtos & Grade de Baias (PRC-03)'}
              {section === 'financeiro' &&
                'Conciliação & Split Automático 90/10 (RN-04)'}
            </h1>
          </div>

          <button
            onClick={playSlaSoundAlert}
            className="px-4 py-2.5 rounded-2xl bg-white border border-[#C57969]/35 text-xs font-extrabold text-[#A9503B] hover:bg-[#F3B63F]/20 flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            Testar Alerta Sonoro (REQ-03)
          </button>
        </div>

        {/* SECTION 1: FILA DE ACEITE SLA 15M */}
        {section === 'fila' && (
          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 border border-[#C57969]/20 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-extrabold">
                  Nenhuma solicitação pendente de SLA no momento!
                </h3>
                <p className="text-xs text-[#302B29]/65 max-w-md mx-auto">
                  Experimente fazer um pedido combinado (Ração + Banho) pelo App
                  do Tutor e volte aqui para ver o alerta visual/sonoro e o
                  cronômetro de 15 minutos (RN-02).
                </p>
                <button
                  onClick={() => navigate('/loja/store-vila-pet')}
                  className="px-4 py-2.5 rounded-xl bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold cursor-pointer"
                >
                  Simular Novo Pedido como Tutor →
                </button>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white p-5 border-2 border-[#F3B63F] shadow-md space-y-4 animate-fade-in"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-[#F3B63F] text-[#302B29] text-xs font-black animate-pulse">
                        NOVO PEDIDO {order.code}
                      </span>
                      <span className="text-sm font-extrabold">
                        Modalidade:{' '}
                        {order.fulfillmentMode === 'RETIRADA_HIBRIDA'
                          ? 'Comanda Híbrida (Retirada c/ Pet - RN-03)'
                          : 'Entrega Local Bairro'}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-4 h-4" />
                      SLA restante: {formatSla(order.slaDeadlineMs)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {order.serviceBooking && (
                      <div className="rounded-2xl bg-[#FFF6EB] p-3.5 border border-[#C57969]/25">
                        <div className="text-[10px] font-extrabold uppercase text-[#A9503B]">
                          Ordem de Serviço Estética (Baia Pré-validada)
                        </div>
                        <div className="text-sm font-extrabold mt-1">
                          {order.serviceBooking.service.name}
                        </div>
                        <div className="text-xs text-[#302B29]/75 mt-0.5">
                          Pet: <strong>{order.serviceBooking.petName}</strong> •
                          Porte {order.serviceBooking.petSize}
                        </div>
                        <div className="text-xs font-bold text-[#A9503B] mt-1">
                          Horário: {order.serviceBooking.dateLabel} às{' '}
                          {order.serviceBooking.timeSlot}
                        </div>
                      </div>
                    )}

                    {order.products.length > 0 && (
                      <div className="rounded-2xl bg-[#FAF8F6] p-3.5 border border-[#302B29]/10">
                        <div className="text-[10px] font-extrabold uppercase text-[#302B29]/60">
                          Ordem de Separação de Estoque
                        </div>
                        <ul className="mt-1.5 space-y-1 text-xs font-semibold">
                          {order.products.map(({ product, quantity }) => (
                            <li key={product.id}>
                              {quantity}x {product.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#302B29]/10">
                    <div className="text-xs">
                      Total Bruto: <strong>{formatBRL(order.total)}</strong> •
                      Seu Líquido (90% RN-04):{' '}
                      <strong className="text-emerald-700">
                        {formatBRL(order.merchantNetAmount)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setRejectOrderTarget(order)}
                        className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Recusar c/ Justificativa
                      </button>

                      <button
                        onClick={() => {
                          playSlaSoundAlert();
                          merchantAcceptOrder(order.id);
                          setSection('estetica');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Pedido &amp; Gerar O.S.
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SECTION 2: EXECUÇÃO DE ESTÉTICA & COMANDA DIGITAL (PRC-02, REQ-04, RN-06) */}
        {section === 'estetica' && (
          <div className="space-y-4">
            {activeExecutionOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl bg-white p-5 border border-[#C57969]/25 shadow-2xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-[#A9503B]">
                      Comanda Ativa {order.code} • {order.storeName}
                    </span>
                    <h3 className="text-base font-extrabold">
                      {order.serviceBooking
                        ? `${order.serviceBooking.petName} — ${order.serviceBooking.service.name}`
                        : `Separação Expressa (${order.products.length} itens)`}
                    </h3>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#FFF6EB] border border-[#C57969]/35 text-xs font-extrabold text-[#A9503B]">
                    {order.groomingStageLabel ?? order.status}
                  </span>
                </div>

                {/* Stage Progression Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.serviceBooking && (
                    <>
                      <button
                        onClick={() =>
                          merchantAdvanceOrderStatus(
                            order.id,
                            'EM_ATENDIMENTO_ESTETICA',
                            'Pet no Banho Morno & Hidratação 🫧'
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-[#FFF6EB] hover:bg-[#F3B63F]/25 text-xs font-bold border border-[#C57969]/30 cursor-pointer"
                      >
                        1. Em Banho / Tosa
                      </button>
                      <button
                        onClick={() =>
                          merchantAdvanceOrderStatus(
                            order.id,
                            'PRONTO_RETIRADA',
                            'Pet cheiroso & pronto para retirada no balcão! 🎀'
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-[#FFF6EB] hover:bg-[#F3B63F]/25 text-xs font-bold border border-[#C57969]/30 cursor-pointer"
                      >
                        2. Pronto p/ Retirada (+ Produtos Reservados RN-03)
                      </button>
                    </>
                  )}

                  {!order.serviceBooking && (
                    <button
                      onClick={() =>
                        merchantAdvanceOrderStatus(
                          order.id,
                          'SAIU_PARA_ENTREGA'
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-[#FFF6EB] hover:bg-[#F3B63F]/25 text-xs font-bold border border-[#C57969]/30 cursor-pointer"
                    >
                      Despachar Entregador Local
                    </button>
                  )}

                  <button
                    onClick={() =>
                      merchantAdvanceOrderStatus(
                        order.id,
                        'CONCLUIDO',
                        'Atendimento finalizado com sucesso!'
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Liquidar Comanda &amp; Liberar Avaliação (REQ-06)
                  </button>
                </div>

                {/* Cross-selling & Sanitary Mandatory Trigger (REQ-04 / RN-06) */}
                {order.serviceBooking && (
                  <div className="rounded-2xl bg-[#FAF3EE] p-4 space-y-3 border border-[#C57969]/25">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5 text-[#A9503B]">
                        <Sparkles className="w-4 h-4" />
                        Comanda Digital &amp; Triagem Clínica (REQ-04 / RN-06)
                      </span>
                      <span className="text-[11px] text-[#302B29]/60">
                        Dispara aprovação em tempo real no celular do tutor
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          merchantRequestAddOn(order.id, {
                            title:
                              'Banho Terapêutico Antisséptico (Validação RN-06)',
                            reason:
                              'Detectada presença de ectoparasitas/dermatite na triagem inicial. Aplicação sanitária obrigatória mediante aprovação.',
                            price: 29.9,
                            mandatorySanitary: true,
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-white border border-[#B65744] text-[#A9503B] text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#B65744] hover:text-white transition cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Solicitar Banho Terapêutico RN-06 (+R$ 29,90)
                      </button>

                      <button
                        onClick={() =>
                          merchantRequestAddOn(order.id, {
                            title: 'Hidratação de Pelagem + Desembolo Suave',
                            reason:
                              'Tosador identificou nós nas orelhas e sugere máscara desembaraçante.',
                            price: 22.0,
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-white border border-[#302B29]/15 text-xs font-bold hover:border-[#A9503B] transition cursor-pointer"
                      >
                        + Sugerir Hidratação Cross-Sell (+R$ 22,00)
                      </button>
                    </div>

                    {/* Behavioral Note Input (REQ-06) */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={
                          noteDrafts[order.id] ??
                          order.groomerBehavioralNote ??
                          ''
                        }
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        placeholder="Registrar observação comportamental do pet p/ consultas futuras (REQ-06)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#C57969]/30 text-xs"
                      />
                      <button
                        onClick={() =>
                          merchantSaveBehavioralNote(
                            order.id,
                            noteDrafts[order.id] ||
                              'Pet tranquilo durante banho e secagem.'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#302B29] text-[#FFF6EB] text-xs font-extrabold cursor-pointer"
                      >
                        Salvar Nota
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SECTION 3: CATÁLOGO & GRADE DE BAIAS (PRC-03) */}
        {section === 'catalogo' && (
          <div className="space-y-6">
            <form
              onSubmit={handleAddProduct}
              className="rounded-3xl bg-white p-5 border border-[#C57969]/25 space-y-3"
            >
              <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#A9503B]" />
                Publicar Produto Físico na Vitrine Local
              </h3>
              <div className="grid sm:grid-cols-5 gap-2.5">
                <input
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Nome do produto (ex: Ração N&D 10kg)"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-[#FAF8F6] border border-[#302B29]/12 text-xs"
                />
                <select
                  value={newProdCategory}
                  onChange={(e) =>
                    setNewProdCategory(e.target.value as ProductCategory)
                  }
                  className="px-3 py-2.5 rounded-xl bg-[#FAF8F6] border border-[#302B29]/12 text-xs font-bold"
                >
                  <option value="Rações">Rações</option>
                  <option value="Farmácia">Farmácia</option>
                  <option value="Higiene">Higiene</option>
                  <option value="Petiscos">Petiscos</option>
                </select>
                <input
                  required
                  type="number"
                  min={1}
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  placeholder="Estoque"
                  className="px-3 py-2.5 rounded-xl bg-[#FAF8F6] border border-[#302B29]/12 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="R$ Preço"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F6] border border-[#302B29]/12 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold shrink-0 cursor-pointer"
                  >
                    Publicar
                  </button>
                </div>
              </div>
            </form>

            {/* Stock Grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl bg-white p-3.5 border border-[#C57969]/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold truncate">
                        {prod.name}
                      </h4>
                      <p className="text-xs font-bold text-[#A9503B]">
                        {formatBRL(prod.price)} • Estoque: {prod.stock} un
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        toggleProductStock(
                          prod.id,
                          prod.stock > 0 ? 0 : 15
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer ${
                        prod.stock > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {prod.stock > 0 ? 'Ativo' : 'Pausado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: FINANCEIRO & SPLIT 90/10 (RN-04 / REQ-05) */}
        {section === 'financeiro' && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-3xl bg-white p-5 border border-[#C57969]/20">
                <span className="text-xs font-bold text-[#302B29]/60">
                  Volume Bruto Transacionado
                </span>
                <div className="text-2xl font-extrabold text-[#302B29] mt-1">
                  {formatBRL(financialTotals.gross)}
                </div>
                <span className="text-[11px] text-[#302B29]/55">
                  {financialTotals.count} comandas processadas
                </span>
              </div>

              <div className="rounded-3xl bg-white p-5 border border-[#C57969]/20">
                <span className="text-xs font-bold text-[#A9503B]">
                  Take-Rate PetHub (10% RN-04)
                </span>
                <div className="text-2xl font-extrabold text-[#A9503B] mt-1">
                  - {formatBRL(financialTotals.takeRate)}
                </div>
                <span className="text-[11px] text-[#302B29]/55">
                  Retido via split automático no gateway
                </span>
              </div>

              <div className="rounded-3xl bg-[#302B29] text-[#FFF6EB] p-5">
                <span className="text-xs font-bold text-[#F3B63F]">
                  Saldo Líquido Lojista (90%)
                </span>
                <div className="text-2xl font-extrabold mt-1">
                  {formatBRL(financialTotals.net)}
                </div>
                <span className="text-[11px] text-[#FFF6EB]/70">
                  Ciclo semanal D+7 ou antecipação D+1
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Formal Rejection Modal (PRC-01 / RN-02) */}
      {rejectOrderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302B29]/60 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FFF6EB] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-rose-800">
              Recusar Pedido {rejectOrderTarget.code} com Justificativa Formal
            </h3>
            <p className="text-xs text-[#302B29]/75">
              Ao recusar, a baia é liberada imediatamente e a pré-autorização
              bancária do tutor é estornada sem tarifas (PRC-01).
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-2xl bg-white p-3 text-xs border border-[#C57969]/35"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectOrderTarget(null)}
                className="px-4 py-2 rounded-xl bg-white text-xs font-bold cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  merchantRejectOrder(rejectOrderTarget.id, rejectReason);
                  setRejectOrderTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Confirmar Recusa &amp; Estorno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
