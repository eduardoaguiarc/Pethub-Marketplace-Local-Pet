import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Bath,
  Bike,
  Car,
  Check,
  Clock,
  HelpCircle,
  MessageSquare,
  Navigation,
  PawPrint,
  Receipt,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { formatBRL, usePetHub } from '../context/PetHubContext';
import type { Order } from '../types/pethub';

export const OrdersPage: React.FC = () => {
  const {
    orders,
    products,
    addProductToCart,
    tutorRespondAddOn,
    tutorSubmitRating,
    pushToast,
  } = usePetHub();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'ativos' | 'historico'>('ativos');
  const [nowMs, setNowMs] = useState(Date.now());
  const [ratingModalOrder, setRatingModalOrder] = useState<Order | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeOrders = orders.filter(
    (o) => o.status !== 'CONCLUIDO' && o.status !== 'RECUSADO_OU_TIMEOUT'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'CONCLUIDO' || o.status === 'RECUSADO_OU_TIMEOUT'
  );

  const formatSlaRemaining = (deadline: number) => {
    const diff = Math.max(0, Math.floor((deadline - nowMs) / 1000));
    const m = String(Math.floor(diff / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const reorderCandidate = products[0];

  return (
    <MobileShell>
      <div className="px-4 pt-5 space-y-5">
        {/* Header (tela_pedido.jpg) */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#302B29]">
            Meus Pedidos
          </h1>
          <button
            onClick={() =>
              pushToast(
                'Suporte PetHub',
                'Lembrando: petshops têm SLA de 15m para confirmação (RN-02).',
                'default'
              )
            }
            className="px-3 py-1.5 rounded-full bg-[#F5E8DC] text-[#A9503B] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Ajuda
          </button>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 bg-[#EFE6DD] p-1 rounded-full">
          <button
            onClick={() => setTab('ativos')}
            className={`py-2.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'ativos'
                ? 'bg-[#9D4430] text-[#FFF6EB] shadow-xs'
                : 'text-[#302B29]/70'
            }`}
          >
            <span>Em andamento</span>
            <span
              className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                tab === 'ativos'
                  ? 'bg-[#FFF6EB] text-[#9D4430]'
                  : 'bg-[#302B29]/15 text-[#302B29]'
              }`}
            >
              {activeOrders.length}
            </span>
          </button>

          <button
            onClick={() => setTab('historico')}
            className={`py-2.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
              tab === 'historico'
                ? 'bg-[#9D4430] text-[#FFF6EB] shadow-xs'
                : 'text-[#302B29]/70'
            }`}
          >
            Histórico
          </button>
        </div>

        {tab === 'ativos' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] animate-pulse" />
                <h2 className="text-sm font-extrabold">
                  Atividades em tempo real
                </h2>
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A9503B]">
                AO VIVO
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-center space-y-2 border border-[#C57969]/15">
                <p className="text-sm font-extrabold">
                  Nenhum pedido em andamento agora
                </p>
                <p className="text-xs text-[#302B29]/60">
                  Monte uma comanda unificada na aba Início!
                </p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white p-4 shadow-xs border border-[#C57969]/20 space-y-3.5"
                >
                  {/* Card Top */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.storeLogoUrl}
                        alt={order.storeName}
                        className="w-11 h-11 rounded-2xl object-cover border border-[#C57969]/20"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-extrabold">
                            {order.storeName}
                          </h3>
                          <BadgeCheck className="w-4 h-4 fill-[#A9503B] text-white" />
                        </div>
                        <p className="text-[11px] text-[#302B29]/60">
                          Pedido {order.code} • {formatBRL(order.total)}
                        </p>
                      </div>
                    </div>

                    {order.status === 'PENDENTE_CONFIRMACAO' ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#F3B63F]/25 text-[#9D4430] text-[11px] font-extrabold tabular-nums flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        SLA {formatSlaRemaining(order.slaDeadlineMs)}
                      </span>
                    ) : order.serviceBooking ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#EFE6DD] text-[#302B29] text-[11px] font-bold">
                        Baia {order.serviceBooking.timeSlot}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#FADCD2] text-[#9D4430] text-[11px] font-extrabold">
                        🛵 15–25 min
                      </span>
                    )}
                  </div>

                  {/* Status Banner */}
                  {order.status === 'PENDENTE_CONFIRMACAO' && (
                    <div className="rounded-2xl bg-[#FFF6EB] border border-[#F3B63F]/60 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-extrabold text-[#A9503B]">
                        <span>Aguardando aceite do Petshop (RN-02)</span>
                        <button
                          onClick={() => navigate('/lojista')}
                          className="underline text-[11px] cursor-pointer"
                        >
                          Simular no Lojista →
                        </button>
                      </div>
                      <p className="text-[11px] text-[#302B29]/70">
                        Pré-autorização via {order.paymentMethod}. O lojista
                        recebeu alerta sonoro e tem até 15 minutos para
                        confirmar estoque e baia.
                      </p>
                    </div>
                  )}

                  {order.status !== 'PENDENTE_CONFIRMACAO' &&
                    !order.serviceBooking && (
                      <div className="rounded-2xl bg-[#FAF3EE] p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#9D4430] flex items-center gap-1.5">
                            <Bike className="w-4 h-4" />
                            {order.status === 'SAIU_PARA_ENTREGA'
                              ? 'Saiu para entrega com o motoboy'
                              : 'Em separação na prateleira'}
                          </span>
                          <span className="text-[11px] font-bold text-[#302B29]/65">
                            Etapa {order.deliveryStep ?? 2} de 4
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((st) => (
                            <div
                              key={st}
                              className={`h-1.5 rounded-full ${
                                (order.deliveryStep ?? 2) >= st
                                  ? 'bg-[#9D4430]'
                                  : 'bg-[#302B29]/12'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Grooming Live Stage (PRC-02) */}
                  {order.serviceBooking &&
                    order.status !== 'PENDENTE_CONFIRMACAO' && (
                      <div className="rounded-2xl bg-[#FAF3EE] p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#302B29]">
                          <Bath className="w-4 h-4 text-[#A9503B]" />
                          <span>
                            {order.groomingStageLabel ??
                              'Em atendimento na estética'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#302B29]/65">
                          {order.serviceBooking.service.name} •{' '}
                          {order.fulfillmentMode === 'RETIRADA_HIBRIDA' &&
                          order.products.length > 0
                            ? 'Produtos reservados p/ retirada com o pet (RN-03)'
                            : 'Secagem e finalização a seguir'}
                        </p>
                        {order.serviceBooking.taxiDog && (
                          <p className="text-[11px] font-bold text-[#9D4430] flex items-center gap-1 pt-0.5">
                            <Car className="w-3.5 h-3.5" />
                            Táxi Dog Leva &amp; Traz agendado para retorno
                          </p>
                        )}
                      </div>
                    )}

                  {/* REQ-04 & RN-06: Digital Comanda Cross-Selling / Sanitary Approval */}
                  {order.crossSellAddOns.map((addon) => (
                    <div
                      key={addon.id}
                      className={`rounded-2xl p-3.5 border space-y-2 ${
                        addon.status === 'PENDENTE_TUTOR'
                          ? 'bg-[#FFF6EB] border-[#F3B63F] shadow-xs'
                          : 'bg-[#FAF8F6] border-[#302B29]/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#A9503B]">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-[#F3B63F]" />
                          {addon.title}
                        </div>
                        <span className="text-xs font-extrabold text-[#A9503B] shrink-0">
                          + {formatBRL(addon.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#302B29]/75 leading-snug">
                        {addon.reason}
                      </p>

                      {addon.status === 'PENDENTE_TUTOR' ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() =>
                              tutorRespondAddOn(order.id, addon.id, 'APROVADO')
                            }
                            className="py-2 rounded-xl bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprovar na Comanda
                          </button>
                          <button
                            onClick={() =>
                              tutorRespondAddOn(order.id, addon.id, 'RECUSADO')
                            }
                            className="py-2 rounded-xl bg-white border border-[#302B29]/15 text-[#302B29]/75 text-xs font-bold cursor-pointer"
                          >
                            Não incluir
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-emerald-700">
                          Status:{' '}
                          {addon.status === 'APROVADO'
                            ? '✓ Aprovado pelo tutor na comanda'
                            : 'Recusado pelo tutor'}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Items list */}
                  {order.products.length > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      {order.products.map(({ product, quantity }) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 text-xs text-[#302B29]/85"
                        >
                          <span className="w-5 h-5 rounded-md bg-[#EFE6DD] text-[11px] font-extrabold flex items-center justify-center">
                            {quantity}
                          </span>
                          <span className="truncate">{product.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons (tela_pedido.jpg) */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() =>
                        pushToast(
                          order.serviceBooking
                            ? `Câmera / Status ao Vivo • ${order.storeName}`
                            : `Rastreio em Tempo Real • ${order.code}`,
                          order.serviceBooking
                            ? 'Baia higienizada • Temperatura da água 36°C ideal.'
                            : 'Entregador a 650m do seu endereço!',
                          'success'
                        )
                      }
                      className="flex-1 py-3 rounded-full bg-[#9D4430] hover:bg-[#B65744] text-[#FFF6EB] text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {order.serviceBooking ? (
                        <>
                          <PawPrint className="w-4 h-4" />
                          Ver status do pet ao vivo
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4" />
                          Acompanhar entrega
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        pushToast(
                          `Resumo Fiscal ${order.code}`,
                          `Pagamento: ${order.paymentMethod} • Total ${formatBRL(order.total)}`,
                          'default'
                        )
                      }
                      className="w-11 h-11 rounded-full bg-[#F3EAE0] text-[#302B29] flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {order.serviceBooking ? (
                        <MessageSquare className="w-4.5 h-4.5" />
                      ) : (
                        <Receipt className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Peça de novo block (tela_pedido.jpg) */}
            <section className="pt-2 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold">Peça de novo</h2>
                  <p className="text-[11px] text-[#302B29]/60">
                    Seus favoritos com entrega rápida
                  </p>
                </div>
                <button
                  onClick={() => navigate('/inicio')}
                  className="text-xs font-bold text-[#A9503B] cursor-pointer"
                >
                  Ver todos
                </button>
              </div>

              <div className="rounded-3xl bg-white p-4 border border-[#C57969]/18 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold">
                      Petz Bairro Nobre ★
                    </h3>
                    <p className="text-[11px] text-[#302B29]/60">
                      25–35 min • Entrega R$ 4,90
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F3EAE0] text-[#A9503B] text-[10px] font-extrabold">
                    Recorrente
                  </span>
                </div>

                <div className="rounded-2xl bg-[#FAF3EE] p-3 flex items-center gap-3">
                  <img
                    src={reorderCandidate.imageUrl}
                    alt={reorderCandidate.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-extrabold">
                      {reorderCandidate.name}
                    </h4>
                    <p className="text-[11px] text-[#302B29]/60">
                      Pediu pela última vez há 28 dias
                    </p>
                    <p className="text-sm font-extrabold text-[#A9503B] mt-0.5">
                      {formatBRL(reorderCandidate.price)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => addProductToCart(reorderCandidate, 1)}
                  className="w-full py-3 rounded-full bg-[#9D4430] hover:bg-[#B65744] text-[#FFF6EB] text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Adicionar à sacola
                </button>
              </div>
            </section>
          </div>
        ) : (
          /* Histórico & Avaliação 1-5 Estrelas (REQ-06) */
          <div className="space-y-3 pb-4">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl bg-white p-4 border border-[#C57969]/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {order.storeName}
                    </h3>
                    <p className="text-[11px] text-[#302B29]/60">
                      Pedido {order.code} • {formatBRL(order.total)}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      order.status === 'CONCLUIDO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {order.status === 'CONCLUIDO'
                      ? 'Concluído'
                      : 'Cancelado / Estornado'}
                  </span>
                </div>

                {order.rejectionReason && (
                  <p className="text-xs text-rose-700 bg-rose-50 rounded-xl p-2.5">
                    Motivo: {order.rejectionReason}
                  </p>
                )}

                {order.groomerBehavioralNote && (
                  <div className="rounded-xl bg-[#FFF6EB] p-2.5 text-[11px] text-[#302B29]/80">
                    <strong>Prontuário Comportamental (REQ-06):</strong>{' '}
                    {order.groomerBehavioralNote}
                  </div>
                )}

                {order.status === 'CONCLUIDO' && (
                  <div className="pt-1 border-t border-[#302B29]/8 flex items-center justify-between">
                    {order.rating ? (
                      <div className="flex items-center gap-1 text-xs font-extrabold text-[#A9503B]">
                        {Array.from({ length: order.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-3.5 h-3.5 fill-[#F3B63F] text-[#F3B63F]"
                          />
                        ))}
                        <span className="ml-1 text-[#302B29]/70 font-medium">
                          {order.reviewComment}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRatingModalOrder(order);
                          setStars(5);
                          setComment('');
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold cursor-pointer"
                      >
                        Avaliar Atendimento (REQ-06)
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REQ-06 Rating Modal */}
      {ratingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302B29]/60 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#FFF6EB] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                Avaliar {ratingModalOrder.storeName}
              </h3>
              <button
                onClick={() => setRatingModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      stars >= n
                        ? 'fill-[#F3B63F] text-[#F3B63F]'
                        : 'text-[#302B29]/25'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi o atendimento ou cuidado estético do seu pet..."
              className="w-full rounded-2xl bg-white p-3 text-xs border border-[#C57969]/25 focus:outline-none"
            />

            <button
              onClick={() => {
                tutorSubmitRating(ratingModalOrder.id, stars, comment);
                setRatingModalOrder(null);
              }}
              className="w-full py-3 rounded-2xl bg-[#A9503B] text-[#FFF6EB] text-xs font-extrabold cursor-pointer"
            >
              Enviar Avaliação
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
};
