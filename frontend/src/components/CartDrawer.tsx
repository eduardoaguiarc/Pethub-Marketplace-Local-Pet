import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Minus,
  PackageCheck,
  Plus,
  QrCode,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { formatBRL, usePetHub } from '../context/PetHubContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartStoreId,
    cartProducts,
    cartService,
    stores,
    products,
    addProductToCart,
    updateCartProductQty,
    setCartServiceBooking,
    cartSubtotal,
    placeUnifiedOrder,
    openBookingModal,
    services,
  } = usePetHub();

  const navigate = useNavigate();

  const isHybrid = cartProducts.length > 0 && Boolean(cartService);
  const [fulfillmentMode, setFulfillmentMode] = useState<
    'ENTREGA_LOCAL' | 'RETIRADA_HIBRIDA'
  >(isHybrid ? 'RETIRADA_HIBRIDA' : 'ENTREGA_LOCAL');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO'>('PIX');

  if (!isCartOpen) return null;

  const store = stores.find((s) => s.id === cartStoreId) ?? stores[0];
  const effectiveFulfillment = cartService
    ? fulfillmentMode
    : fulfillmentMode === 'RETIRADA_HIBRIDA'
      ? 'RETIRADA_HIBRIDA'
      : 'ENTREGA_LOCAL';

  const deliveryFee =
    effectiveFulfillment === 'RETIRADA_HIBRIDA' ? 0 : store?.deliveryFee ?? 0;
  const finalTotal = cartSubtotal + deliveryFee;

  // Cross-sell suggestion from same store
  const suggestedProduct = products.find(
    (p) =>
      p.storeId === store.id &&
      !cartProducts.some((cp) => cp.product.id === p.id) &&
      p.stock > 0
  );
  const suggestedService = services.find((s) => s.storeId === store.id);

  const handleCheckout = () => {
    const created = placeUnifiedOrder({
      fulfillmentMode: effectiveFulfillment,
      paymentMethod,
    });
    if (created) {
      navigate('/pedidos');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#302B29]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-[#FFF6EB] text-[#302B29] shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#302B29]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B65744]/15 text-[#A9503B] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight">
                Comanda Unificada
              </h3>
              <p className="text-xs text-[#302B29]/65">{store?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-white text-[#302B29] flex items-center justify-center border border-[#302B29]/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {cartProducts.length === 0 && !cartService ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#B65744]/12 text-[#A9503B] mx-auto flex items-center justify-center">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm">Sua comanda está vazia</p>
              <p className="text-xs text-[#302B29]/65 max-w-xs mx-auto">
                Combine rações, farmácia e agendamento de banho & tosa em um
                único pedido no bairro!
              </p>
            </div>
          ) : (
            <>
              {/* Scheduled Service Block */}
              {cartService && (
                <div className="rounded-2xl bg-white p-3.5 border border-[#B65744]/30 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F3B63F]/20 text-[#A9503B] flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3B63F]/30 text-[#302B29] mb-1">
                          Estética Agendada
                        </span>
                        <h4 className="text-xs font-extrabold">
                          {cartService.service.name}
                        </h4>
                        <p className="text-[11px] text-[#302B29]/70 mt-0.5">
                          Pet: <strong>{cartService.petName}</strong> • Porte{' '}
                          {cartService.petSize}
                        </p>
                        <p className="text-[11px] text-[#A9503B] font-bold mt-0.5">
                          {cartService.dateLabel} às {cartService.timeSlot}
                          {cartService.taxiDog ? ' • + Táxi Dog (R$ 15)' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCartServiceBooking(null)}
                      className="text-[#302B29]/45 hover:text-[#A9503B] p-1 cursor-pointer"
                      title="Remover agendamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#302B29]/8 flex justify-between text-xs font-extrabold">
                    <span className="text-[#302B29]/65">Valor do serviço</span>
                    <span className="text-[#A9503B]">
                      {formatBRL(
                        cartService.price + (cartService.taxiDog ? 15 : 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Physical Products Block */}
              {cartProducts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#302B29]/60">
                    Produtos Físicos ({cartProducts.length})
                  </div>
                  {cartProducts.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="rounded-2xl bg-white p-3 border border-[#302B29]/8 flex items-center gap-3"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold leading-snug line-clamp-2">
                          {product.name}
                        </h4>
                        <div className="text-xs font-extrabold text-[#A9503B] mt-1">
                          {formatBRL(product.price * quantity)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#FFF6EB] rounded-xl px-2 py-1 border border-[#C57969]/30">
                        <button
                          onClick={() => updateCartProductQty(product.id, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[#A9503B] hover:bg-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold w-4 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateCartProductQty(product.id, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[#A9503B] hover:bg-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unified Cross-Sell Suggestion */}
              {!cartService && suggestedService && (
                <div className="rounded-2xl bg-[#F3B63F]/15 border border-[#F3B63F]/50 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#A9503B] shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold">
                        Unifique com Banho & Tosa!
                      </div>
                      <div className="text-[11px] text-[#302B29]/70">
                        Reserve um horário na mesma comanda
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      openBookingModal(suggestedService);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#A9503B] text-[#FFF6EB] text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Agendar
                  </button>
                </div>
              )}

              {cartService && cartProducts.length === 0 && suggestedProduct && (
                <div className="rounded-2xl bg-[#B65744]/10 border border-[#B65744]/25 p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold">
                      Falta ração ou antipulgas em casa?
                    </div>
                    <div className="text-[11px] text-[#302B29]/70 line-clamp-1">
                      Adicione {suggestedProduct.name} e retire junto com o pet!
                    </div>
                  </div>
                  <button
                    onClick={() => addProductToCart(suggestedProduct, 1)}
                    className="px-3 py-1.5 rounded-xl bg-[#A9503B] text-[#FFF6EB] text-xs font-bold shrink-0 cursor-pointer"
                  >
                    + {formatBRL(suggestedProduct.price)}
                  </button>
                </div>
              )}

              {/* RN-03: Fulfillment Mode */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#302B29]/60 mb-2">
                  Modalidade de Entrega / Retirada (RN-03)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentMode('RETIRADA_HIBRIDA')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      effectiveFulfillment === 'RETIRADA_HIBRIDA'
                        ? 'bg-[#B65744]/12 border-[#B65744]'
                        : 'bg-white border-[#302B29]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Store className="w-4 h-4 text-[#A9503B]" />
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        Grátis
                      </span>
                    </div>
                    <div className="text-xs font-extrabold">
                      {cartService ? 'Comanda Híbrida' : 'Retirar na Loja'}
                    </div>
                    <div className="text-[10px] text-[#302B29]/65 leading-tight mt-0.5">
                      {cartService
                        ? 'Itens reservados na prateleira p/ retirada com o pet'
                        : 'Pronto em 15 min no balcão'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentMode('ENTREGA_LOCAL')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      effectiveFulfillment === 'ENTREGA_LOCAL'
                        ? 'bg-[#B65744]/12 border-[#B65744]'
                        : 'bg-white border-[#302B29]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Truck className="w-4 h-4 text-[#A9503B]" />
                      <span className="text-[10px] font-extrabold text-[#A9503B]">
                        {store?.deliveryFee === 0
                          ? 'Grátis'
                          : formatBRL(store?.deliveryFee ?? 0)}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold">Delivery Bairro</div>
                    <div className="text-[10px] text-[#302B29]/65 leading-tight mt-0.5">
                      Receba em {store?.deliveryTimeLabel}
                    </div>
                  </button>
                </div>
              </div>

              {/* REQ-05: Payment Method */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#302B29]/60 mb-2">
                  Pagamento Digital com Split Automático (REQ-05)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      paymentMethod === 'PIX'
                        ? 'bg-[#A9503B] text-[#FFF6EB] border-[#A9503B]'
                        : 'bg-white text-[#302B29] border-[#302B29]/10'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    PIX Instantâneo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTAO')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      paymentMethod === 'CARTAO'
                        ? 'bg-[#A9503B] text-[#FFF6EB] border-[#A9503B]'
                        : 'bg-white text-[#302B29] border-[#302B29]/10'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Master •••• 8492
                  </button>
                </div>
              </div>

              {/* SLA Pre-Auth Notice (RN-02) */}
              <div className="rounded-xl bg-white border border-[#C57969]/30 p-2.5 flex items-center gap-2.5 text-[11px] text-[#302B29]/75">
                <Clock className="w-4 h-4 text-[#B65744] shrink-0" />
                <span>
                  <strong>Proteção SLA 15 min (RN-02):</strong> O valor só é
                  capturado após aceite do petshop. Sem resposta em 15m, o
                  estorno é imediato.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {(cartProducts.length > 0 || cartService) && (
          <div className="p-5 bg-white border-t border-[#302B29]/10 rounded-b-3xl space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#302B29]/70">
                <span>Subtotal itens & serviços</span>
                <span>{formatBRL(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#302B29]/70">
                <span>Taxa de entrega local</span>
                <span className="font-bold text-emerald-700">
                  {deliveryFee === 0 ? 'Grátis' : formatBRL(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#302B29] pt-1 border-t border-[#302B29]/8">
                <span>Total da Comanda</span>
                <span className="text-[#A9503B]">{formatBRL(finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#A9503B] hover:bg-[#B65744] text-[#FFF6EB] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PackageCheck className="w-5 h-5" />
              Finalizar Pedido & Agendamento • {formatBRL(finalTotal)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
