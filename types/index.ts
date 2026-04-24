export type Role = "customer" | "vendor" | "admin";

export type ProductCategory = "electronics" | "agriculture" | "student_item" | "general" | string;

// 🔥 ADDED new statuses for LivePay and Unified Orders
export type OrderStatus = "new" | "pending" | "processing" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled" | "lead" | "closed";

export interface User {
  id: string; 
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  createdAt: number;

  // 🚀 ADDED: Referral System Fields
  referralCode?: string;
  referrerId?: string | null;
  referralBalance?: number;
  referralCount?: number;
  
  // 🔥 FIXED: Moved referralName here!
  referralName?: string;
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

  condition?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  status?: string;
  views?: number;
  inquiries?: number;
  aiScore?: number;

  isBoosted?: boolean;
  boostExpiresAt?: number;
  isFeatured?: boolean;
  featureExpiresAt?: number;

  locked?: boolean;
  isUrgent?: boolean;
  urgentExpiresAt?: number | null;
  updatedAt?: number;
}

export interface Order {
  id: string;
  orderId?: string;       // Master Order ID (KAB-XXXX)
  orderNumber?: string;   // Legacy ID
  userId: string;

  buyerName?: string;
  buyerEmail?: string | null;
  buyerPhone?: string;
  contactPhone?: string;
  buyerLocation?: string;

  // 🔥 UNIFIED MASTER SCHEMA
  source?: string;
  paymentMode?: "COD" | "FULL" | string;
  paymentStatus?: "pending" | "paid" | "failed" | "payment_failed" | string;
  transactionId?: string;
  referenceId?: string;

  // 🚀 ADDED: Lead Injection Tracking
  referralCodeUsed?: string | null;

  totalAmount?: number;   // New Master Total
  total?: number;         // Legacy Total

  cartItems?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    sellerId?: string;
    sellerPhone?: string;
    image?: string;
  }>;

  sellerOrders?: Array<{
    sellerId: string;
    sellerPhone: string;
    subtotal: number;
    items: Array<any>;
  }>;

  sellerIds?: string[];   // Flat array for dashboard rules

  items?: Array<any>;     // Legacy items array

  status: OrderStatus;
  cancelReason?: string;
  updatedAt?: number;
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
}
