export type PetSize = 'Pequeno' | 'Médio' | 'Grande';
export type PetSpecies = 'Cão' | 'Gato';

export interface PetProfile {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  ageLabel: string;
  weightKg: number;
  size: PetSize;
  avatarUrl: string;
  vaccineStatus: string;
  healthAlert?: string;
  dermatitisOrParasiteHistory?: boolean; // RN-06
  behavioralNotes?: string[]; // REQ-06
}

export type ProductCategory =
  | 'Rações'
  | 'Farmácia'
  | 'Petiscos'
  | 'Higiene'
  | 'Brinquedos';

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  imageUrl: string;
  stock: number;
  unitLabel: string;
  isExpress?: boolean;
  freeShipping?: boolean;
}

export interface GroomingService {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceBySize: Record<PetSize, number>;
  originalPrice?: number;
  discountBadge?: string;
  category: 'Banho' | 'Banho & Tosa' | 'Hidratação' | 'Clínica & Unhas';
  imageUrl: string;
}

export interface BaySlot {
  time: string; // e.g. "14:30"
  availableSizes: PetSize[]; // REQ-02: bay availability per pet size
}

export interface PetShop {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  distanceKm: number; // REQ-01
  deliveryTimeLabel: string; // REQ-01
  deliveryFee: number;
  isPro?: boolean;
  isVerified?: boolean;
  nextAvailableBath?: string;
  bannerUrl: string;
  logoUrl: string;
  neighborhood: string;
  slotsToday: BaySlot[];
  slotsTomorrow: BaySlot[];
}

export interface CartProductItem {
  product: Product;
  quantity: number;
}

export interface CartServiceItem {
  service: GroomingService;
  petId: string;
  petName: string;
  petSize: PetSize;
  dateLabel: 'Hoje' | 'Amanhã';
  timeSlot: string;
  taxiDog: boolean;
  price: number;
}

export type OrderStatus =
  | 'PENDENTE_CONFIRMACAO' // RN-02: 15 min SLA
  | 'ACEITO_EM_PREPARO'
  | 'EM_ATENDIMENTO_ESTETICA' // PRC-02
  | 'SAIU_PARA_ENTREGA'
  | 'PRONTO_RETIRADA' // RN-03
  | 'CONCLUIDO'
  | 'RECUSADO_OU_TIMEOUT';

export interface CrossSellAddOn {
  id: string;
  title: string;
  reason: string;
  price: number;
  mandatorySanitary?: boolean; // RN-06
  status: 'PENDENTE_TUTOR' | 'APROVADO' | 'RECUSADO';
}

export interface Order {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  storeLogoUrl: string;
  createdAtIso: string;
  slaDeadlineMs: number; // RN-02: 15 minutes from creation
  status: OrderStatus;
  rejectionReason?: string;
  fulfillmentMode: 'ENTREGA_LOCAL' | 'RETIRADA_HIBRIDA'; // RN-03
  paymentMethod: 'PIX' | 'CARTAO'; // REQ-05
  products: CartProductItem[];
  serviceBooking?: CartServiceItem;
  crossSellAddOns: CrossSellAddOn[]; // REQ-04 & RN-06
  subtotal: number;
  deliveryFee: number;
  total: number;
  platformTakeRateAmount: number; // RN-04: 10%
  merchantNetAmount: number; // RN-04: 90%
  groomingStageLabel?: string;
  deliveryStep?: 1 | 2 | 3 | 4;
  rating?: number; // REQ-06
  reviewComment?: string;
  groomerBehavioralNote?: string; // REQ-06
}
