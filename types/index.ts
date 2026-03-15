export type Role = "customer" | "vendor" | "admin";
// Added "general" and string to safely handle your older database items
export type ProductCategory = "electronics" | "agriculture" | "student_item" | "general" | string;
export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered";

export interface User {
  id: string; // Matches Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  createdAt: number;
}

export interface Product {
  id: string; // Firestore auto-generated ID
  publicId: string; // e.g., ELC-0001
  name: string;
  slug: string;
  category: ProductCategory;
  storeId?: string; // Made optional since we are transitioning to sellerId
  price: number;
  stock: number;
  images: string[]; // Cloudinary URLs
  createdAt: number;
  
  // --- NEW FIELDS FOR MVP ---
  condition?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  status?: string;
  views?: number;
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
  phone?: string; // Added to match the Vendor Application form
  isApproved: boolean;
  createdAt: number;
}