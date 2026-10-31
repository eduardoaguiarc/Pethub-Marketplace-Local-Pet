import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_PETS,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_STORES,
} from '../data/mockData';
import type {
  CartProductItem,
  CartServiceItem,
  GroomingService,
  Order,
  OrderStatus,
  PetProfile,
  PetShop,
  Product,
} from '../types/pethub';

interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  tone?: 'default' | 'success' | 'warning';
}

interface PetHubContextValue {
  // User & Auth
  tutorName: string;
  address: string;
  setAddress: (addr: string) => void;
  isAuthenticated: boolean;
  loginAsTutor: (name?: string) => void;
  logout: () => void;

  // Pets
  pets: PetProfile[];
  selectedPetId: string;
  selectedPet: PetProfile;
  setSelectedPetId: (id: string) => void;
  addPet: (pet: Omit<PetProfile, 'id'>) => void;

  // Catalog
  stores: PetShop[];
  products: Product[];
  services: GroomingService[];
  toggleProductStock: (productId: string, newStock: number) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  addMerchantProduct: (prod: Omit<Product, 'id'>) => void;

  // Unified Comanda (Cart - PRC-01)
  cartStoreId: string | null;
  cartProducts: CartProductItem[];
  cartService: CartServiceItem | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addProductToCart: (product: Product, qty?: number) => void;
  updateCartProductQty: (productId: string, delta: number) => void;
  setCartServiceBooking: (booking: CartServiceItem | null) => void;
  clearCart: () => void;
  cartItemsCount: number;
  cartSubtotal: number;

  // Checkout & Orders (PRC-01, PRC-02, RN-02, RN-03, RN-04, REQ-04, REQ-06)
  orders: Order[];
  activeOrdersCount: number;
  placeUnifiedOrder: (params: {
    fulfillmentMode: 'ENTREGA_LOCAL' | 'RETIRADA_HIBRIDA';
    paymentMethod: 'PIX' | 'CARTAO';
  }) => Order | null;
  merchantAcceptOrder: (orderId: string) => void;
  merchantRejectOrder: (orderId: string, justification: string) => void;
  merchantAdvanceOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    groomingLabel?: string
  ) => void;
  merchantRequestAddOn: (
    orderId: string,
    addOn: {
      title: string;
      reason: string;
      price: number;
      mandatorySanitary?: boolean;
    }
  ) => void;
  tutorRespondAddOn: (
    orderId: string,
    addOnId: string,
    decision: 'APROVADO' | 'RECUSADO'
  ) => void;
  merchantSaveBehavioralNote: (orderId: string, note: string) => void;
  tutorSubmitRating: (orderId: string, rating: number, comment: string) => void;

  // Service Booking Modal Helper
  bookingModalService: GroomingService | null;
  openBookingModal: (service: GroomingService) => void;
  closeBookingModal: () => void;

  // Toast feedback
  toasts: ToastMessage[];
  pushToast: (title: string, subtitle?: string, tone?: ToastMessage['tone']) => void;
}

const PetHubContext = createContext<PetHubContextValue | null>(null);

export const PetHubProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tutorName, setTutorName] = useState('Eduardo Silva');
  const [address, setAddress] = useState('Rua das Palmeiras, 14');
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [pets, setPets] = useState<PetProfile[]>(INITIAL_PETS);
  const [selectedPetId, setSelectedPetId] = useState<string>(INITIAL_PETS[0].id);

  const [stores, setStores] = useState<PetShop[]>(INITIAL_STORES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [services] = useState<GroomingService[]>(INITIAL_SERVICES);

  const [cartStoreId, setCartStoreId] = useState<string | null>(null);
  const [cartProducts, setCartProducts] = useState<CartProductItem[]>([]);
  const [cartService, setCartService] = useState<CartServiceItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [bookingModalService, setBookingModalService] =
    useState<GroomingService | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (
    title: string,
    subtitle?: string,
    tone: ToastMessage['tone'] = 'default'
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, subtitle, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  // RN-02: Auto-cancel orders exceeding 15-minute SLA if still PENDENTE_CONFIRMACAO
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOrders((prev) =>
        prev.map((order) => {
          if (
            order.status === 'PENDENTE_CONFIRMACAO' &&
            now > order.slaDeadlineMs
          ) {
            pushToast(
              `Pedido ${order.code} cancelado por SLA (RN-02)`,
              'Tempo limite de 15 min excedido. Pré-autorização estornada sem tarifas.',
              'warning'
            );
            return {
              ...order,
              status: 'RECUSADO_OU_TIMEOUT',
              rejectionReason:
                'Timeout automático de SLA (15 min sem resposta do petshop). Estorno integral realizado.',
            };
          }
          return order;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) ?? pets[0],
    [pets, selectedPetId]
  );

  const loginAsTutor = (name?: string) => {
    if (name && name.trim()) setTutorName(name.trim());
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const addPet = (petData: Omit<PetProfile, 'id'>) => {
    const newPet: PetProfile = {
      ...petData,
      id: `pet-${Date.now()}`,
    };
    setPets((prev) => [...prev, newPet]);
    setSelectedPetId(newPet.id);
    pushToast(
      `${newPet.name} adicionado ao seu perfil!`,
      `Recomendações e porte (${newPet.size}) atualizados.`,
      'success'
    );
  };

  const addProductToCart = (product: Product, qty = 1) => {
    if (product.stock <= 0) {
      pushToast('Produto sem estoque no momento', product.name, 'warning');
      return;
    }

    if (cartStoreId && cartStoreId !== product.storeId) {
      // Switch store cleanly in unified cart
      setCartProducts([{ product, quantity: qty }]);
      setCartService(null);
      setCartStoreId(product.storeId);
      pushToast(
        `Nova comanda iniciada em ${product.storeName}`,
        `${product.name} adicionado.`,
        'success'
      );
      return;
    }

    setCartStoreId(product.storeId);
    setCartProducts((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + qty);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    pushToast('Adicionado à comanda!', product.name, 'success');
  };

  const updateCartProductQty = (productId: string, delta: number) => {
    setCartProducts((prev) => {
      const updated = prev
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.min(
                  item.product.stock,
                  item.quantity + delta
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0);

      if (updated.length === 0 && !cartService) {
        setCartStoreId(null);
      }
      return updated;
    });
  };

  const setCartServiceBooking = (booking: CartServiceItem | null) => {
    if (!booking) {
      setCartService(null);
      if (cartProducts.length === 0) setCartStoreId(null);
      return;
    }

    if (cartStoreId && cartStoreId !== booking.service.storeId) {
      setCartProducts([]);
    }
    setCartStoreId(booking.service.storeId);
    setCartService(booking);
    pushToast(
      'Horário reservado na comanda única!',
      `${booking.service.name} • ${booking.dateLabel} às ${booking.timeSlot}`,
      'success'
    );
  };

  const clearCart = () => {
    setCartProducts([]);
    setCartService(null);
    setCartStoreId(null);
  };

  const cartItemsCount = useMemo(() => {
    const prodCount = cartProducts.reduce((acc, i) => acc + i.quantity, 0);
    return prodCount + (cartService ? 1 : 0);
  }, [cartProducts, cartService]);

  const cartSubtotal = useMemo(() => {
    const prodSum = cartProducts.reduce(
      (acc, i) => acc + i.product.price * i.quantity,
      0
    );
    const srvSum = cartService
      ? cartService.price + (cartService.taxiDog ? 15 : 0)
      : 0;
    return Number((prodSum + srvSum).toFixed(2));
  }, [cartProducts, cartService]);

  const placeUnifiedOrder = ({
    fulfillmentMode,
    paymentMethod,
  }: {
    fulfillmentMode: 'ENTREGA_LOCAL' | 'RETIRADA_HIBRIDA';
    paymentMethod: 'PIX' | 'CARTAO';
  }): Order | null => {
    if (!cartStoreId || (cartProducts.length === 0 && !cartService)) return null;
    const store = stores.find((s) => s.id === cartStoreId) ?? stores[0];

    const deliveryFee =
      fulfillmentMode === 'RETIRADA_HIBRIDA' ? 0 : store.deliveryFee;
    const total = Number((cartSubtotal + deliveryFee).toFixed(2));
    // RN-04: 10% platform take-rate, 90% merchant split
    const platformTakeRateAmount = Number((total * 0.1).toFixed(2));
    const merchantNetAmount = Number((total - platformTakeRateAmount).toFixed(2));

    // Decrement product stock & reserve grooming bay (REQ-02)
    if (cartProducts.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const inCart = cartProducts.find((c) => c.product.id === p.id);
          return inCart ? { ...p, stock: Math.max(0, p.stock - inCart.quantity) } : p;
        })
      );
    }

    if (cartService) {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== store.id) return s;
          const targetKey =
            cartService.dateLabel === 'Hoje' ? 'slotsToday' : 'slotsTomorrow';
          return {
            ...s,
            [targetKey]: s[targetKey].map((slot) =>
              slot.time === cartService.timeSlot
                ? {
                    ...slot,
                    availableSizes: slot.availableSizes.filter(
                      (sz) => sz !== cartService.petSize
                    ),
                  }
                : slot
            ),
          };
        })
      );
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: `#${Math.floor(4821 + Math.random() * 170)}`,
      storeId: store.id,
      storeName: store.name,
      storeLogoUrl: store.logoUrl,
      createdAtIso: new Date().toISOString(),
      slaDeadlineMs: Date.now() + 15 * 60 * 1000, // RN-02: 15 minutes SLA
      status: 'PENDENTE_CONFIRMACAO',
      fulfillmentMode,
      paymentMethod,
      products: [...cartProducts],
      serviceBooking: cartService ?? undefined,
      crossSellAddOns: [],
      subtotal: cartSubtotal,
      deliveryFee,
      total,
      platformTakeRateAmount,
      merchantNetAmount,
      deliveryStep: 1,
      groomingStageLabel: cartService
        ? 'Aguardando confirmação da baia pelo petshop'
        : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setIsCartOpen(false);
    pushToast(
      `Pedido ${newOrder.code} enviado ao Petshop!`,
      'Aguardando confirmação do lojista (SLA máximo de 15 min).',
      'success'
    );
    return newOrder;
  };

  const merchantAcceptOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const nextStatus: OrderStatus = o.serviceBooking
          ? 'EM_ATENDIMENTO_ESTETICA'
          : 'ACEITO_EM_PREPARO';
        return {
          ...o,
          status: nextStatus,
          deliveryStep: 2,
          groomingStageLabel: o.serviceBooking
            ? `${o.serviceBooking.petName.split(' ')[0]} em Triagem Clínica & Recepção`
            : undefined,
        };
      })
    );
    pushToast(
      'Pedido aceito com sucesso!',
      'Split 90/10 processado e O.S. digital + separação geradas.',
      'success'
    );
  };

  const merchantRejectOrder = (orderId: string, justification: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'RECUSADO_OU_TIMEOUT',
              rejectionReason: justification || 'Indisponibilidade operacional na baia.',
            }
          : o
      )
    );
    pushToast(
      'Pedido recusado formalmente',
      'Baia liberada e pré-autorização do tutor estornada sem tarifas.',
      'warning'
    );
  };

  const merchantAdvanceOrderStatus = (
    orderId: string,
    nextStatus: OrderStatus,
    groomingLabel?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const step =
          nextStatus === 'SAIU_PARA_ENTREGA' || nextStatus === 'PRONTO_RETIRADA'
            ? 3
            : nextStatus === 'CONCLUIDO'
              ? 4
              : 2;
        return {
          ...o,
          status: nextStatus,
          deliveryStep: step,
          groomingStageLabel: groomingLabel ?? o.groomingStageLabel,
        };
      })
    );
    pushToast('Status da comanda atualizado!', groomingLabel ?? nextStatus, 'success');
  };

  const merchantRequestAddOn = (
    orderId: string,
    addOn: {
      title: string;
      reason: string;
      price: number;
      mandatorySanitary?: boolean;
    }
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              crossSellAddOns: [
                ...o.crossSellAddOns,
                {
                  id: `addon-${Date.now()}`,
                  ...addOn,
                  status: 'PENDENTE_TUTOR',
                },
              ],
            }
          : o
      )
    );
    pushToast(
      'Solicitação enviada ao celular do Tutor!',
      `${addOn.title} (+R$ ${addOn.price.toFixed(2).replace('.', ',')})`,
      'success'
    );
  };

  const tutorRespondAddOn = (
    orderId: string,
    addOnId: string,
    decision: 'APROVADO' | 'RECUSADO'
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const target = o.crossSellAddOns.find((a) => a.id === addOnId);
        const addPrice =
          decision === 'APROVADO' && target ? target.price : 0;
        const nextTotal = Number((o.total + addPrice).toFixed(2));
        return {
          ...o,
          total: nextTotal,
          subtotal: Number((o.subtotal + addPrice).toFixed(2)),
          platformTakeRateAmount: Number((nextTotal * 0.1).toFixed(2)),
          merchantNetAmount: Number((nextTotal * 0.9).toFixed(2)),
          crossSellAddOns: o.crossSellAddOns.map((a) =>
            a.id === addOnId ? { ...a, status: decision } : a
          ),
        };
      })
    );
    pushToast(
      decision === 'APROVADO'
        ? 'Adicional aprovado na comanda!'
        : 'Adicional recusado pelo tutor',
      decision === 'APROVADO'
        ? 'O tosador já foi notificado para prosseguir.'
        : 'O petshop foi notificado da sua decisão.',
      decision === 'APROVADO' ? 'success' : 'default'
    );
  };

  const merchantSaveBehavioralNote = (orderId: string, note: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, groomerBehavioralNote: note } : o
      )
    );
    pushToast('Observação comportamental registrada (REQ-06)!', note, 'success');
  };

  const tutorSubmitRating = (
    orderId: string,
    rating: number,
    comment: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, rating, reviewComment: comment } : o
      )
    );
    pushToast(
      `Avaliação de ${rating} estrelas enviada!`,
      'Obrigado por ajudar a comunidade PetHub do seu bairro.',
      'success'
    );
  };

  const toggleProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    pushToast('Estoque sincronizado na vitrine!', undefined, 'success');
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
    );
    pushToast('Preço atualizado no catálogo!', undefined, 'success');
  };

  const addMerchantProduct = (prod: Omit<Product, 'id'>) => {
    const created: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [created, ...prev]);
    pushToast('Novo item publicado na vitrine!', created.name, 'success');
  };

  const activeOrdersCount = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'CONCLUIDO' && o.status !== 'RECUSADO_OU_TIMEOUT'
      ).length,
    [orders]
  );

  return (
    <PetHubContext.Provider
      value={{
        tutorName,
        address,
        setAddress,
        isAuthenticated,
        loginAsTutor,
        logout,
        pets,
        selectedPetId,
        selectedPet,
        setSelectedPetId,
        addPet,
        stores,
        products,
        services,
        toggleProductStock,
        updateProductPrice,
        addMerchantProduct,
        cartStoreId,
        cartProducts,
        cartService,
        isCartOpen,
        setIsCartOpen,
        addProductToCart,
        updateCartProductQty,
        setCartServiceBooking,
        clearCart,
        cartItemsCount,
        cartSubtotal,
        orders,
        activeOrdersCount,
        placeUnifiedOrder,
        merchantAcceptOrder,
        merchantRejectOrder,
        merchantAdvanceOrderStatus,
        merchantRequestAddOn,
        tutorRespondAddOn,
        merchantSaveBehavioralNote,
        tutorSubmitRating,
        bookingModalService,
        openBookingModal: (s) => setBookingModalService(s),
        closeBookingModal: () => setBookingModalService(null),
        toasts,
        pushToast,
      }}
    >
      {children}
    </PetHubContext.Provider>
  );
};

export function usePetHub() {
  const ctx = useContext(PetHubContext);
  if (!ctx) {
    throw new Error('usePetHub must be used inside PetHubProvider');
  }
  return ctx;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
