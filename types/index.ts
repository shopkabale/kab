export type Role = "customer" | "vendor" | "admin";
export type ProductCategory = "electronics" | "agriculture" | "student_item" | "general" | string;
export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered";

// --- NEW PAYMENT TYPE ---
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
  stock: number; // You use stock instead of quantity, which is perfect
  images: string[];
  createdAt: number;
  condition?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  status?: string;
  views?: number;

  // --- NEW MONETIZATION FIELDS ---
  featured?: boolean;
  featuredUntil?: number;
  urgent?: boolean;
  urgentUntil?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
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
  phone?: string;
  isApproved: boolean;
  createdAt: number;

  // --- NEW SUBSCRIPTION FIELDS ---
  logo?: string;
  banner?: string;
  expiresAt?: number;
  rating?: number;
  ratingCount?: number;
}

// --- NEW PAYMENT INTERFACE ---
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
