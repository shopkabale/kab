export type Role = "customer" | "vendor" | "admin";
export type ProductCategory = "electronics" | "agriculture" | "student_item";
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
  storeId: string;
  price: number;
  stock: number;
  images: string[]; // Cloudinary URLs
  createdAt: number;
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
  isApproved: boolean;
  createdAt: number;
}