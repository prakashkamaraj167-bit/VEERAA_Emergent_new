// TS mirrors of backend/models/schemas.py — keep both sides in sync in one edit.
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  metal: string;
  price: number;
  image_url: string;
  description: string;
  sweat_proof: boolean;
  daily_wear: boolean;
  anti_tarnish: boolean;
  stock: number;
  is_new: boolean;
  created_at: string;
}

export interface ProductInput {
  name: string;
  category: string;
  metal: string;
  price: number;
  image_url: string;
  description: string;
  sweat_proof: boolean;
  daily_wear: boolean;
  anti_tarnish: boolean;
  stock: number;
  is_new: boolean;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image_url: string;
}

export interface Shipping {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  user_email: string;
  user_name: string;
  items: OrderItem[];
  shipping: Shipping;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  rating: number;
  message: string;
  created_at: string;
}

export interface PaymentConfig {
  provider: string;
  demo_mode: boolean;
  key_id: string;
}

export const WHATSAPP_NUMBER = "919876543210"; // placeholder — change to the store number
export const CATEGORIES = ["earrings", "chains", "rings", "bracelets"] as const;

export function rupees(n: number): string {
  return "\u20B9" + n.toLocaleString("en-IN");
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
