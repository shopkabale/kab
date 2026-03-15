export type Role = "customer" | "vendor" | "admin";
export type ProductCategory = "electronics" | "agriculture" | "student_item" | "general" | string;
export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered";
export type PaymentType = "store_subscription" | "featured_listing" | "urgent_listing" | "homepage_ad";

export interface User {
  id: string; // Matches Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  createdAt: number;
}

export interface Product {
  id: string;
  publicId: string;
  name: string;
  slug: string;
  category: ProductCategory;
  storeId?: string;
  price: number;
  stock: number; 
  images: string[];
  createdAt: number;
  
  // Optional detailed fields for quick-listing compatibility
  condition?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  status?: string;
  views?: number;

  // --- MONETIZATION FIELDS ---
  featured?: boolean;
  featuredUntil?: number;
  urgent?: boolean;
  urgentUntil?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  sellerId?: string; // Important for vendor dashboard routing
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: "cash_on_delivery";
  status: OrderStatus;
  createdAt: number;
}

export interface Store {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string;
  isApproved: boolean;
  createdAt: number;
  expiresAt?: number;
  
  // --- BRANDING ---
  logo?: string;
  banner?: string;

  // --- NEW: PHYSICAL BUSINESS INFO ---
  location?: {
    district: string; 
    town: string;     
    street: string;   
    landmark?: string; 
    lat?: number;
    lng?: number;
  };

  // --- NEW: CONTACT INFO ---
  phone?: string;
  whatsapp?: string; 
  email?: string;

  // --- NEW: DELIVERY OPTIONS ---
  deliveryOptions?: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
  };

  // --- NEW: OPERATING HOURS ---
  operatingHours?: {
    monday: { open: string, close: string, isClosed: boolean };
    tuesday: { open: string, close: string, isClosed: boolean };
    wednesday: { open: string, close: string, isClosed: boolean };
    thursday: { open: string, close: string, isClosed: boolean };
    friday: { open: string, close: string, isClosed: boolean };
    saturday: { open: string, close: string, isClosed: boolean };
    sunday: { open: string, close: string, isClosed: boolean };
  };

  // --- NEW: TRUST & ACTIVITY METRICS ---
  rating?: number;
  ratingCount?: number;
  followersCount?: number;
  totalSales?: number;       
  averageResponseTimeMin?: number; 
  lastActiveAt?: number;     
}

export interface Payment {
  id: string;
  transactionId?: string; // Added after successful Flutterwave verification
  userId: string;
  paymentType: PaymentType;
  referenceId: string; // The storeId or productId being upgraded
  amount: number;
  currency: "UGX";
  status: "pending" | "successful" | "failed";
  tx_ref: string;
  createdAt: number;
}
