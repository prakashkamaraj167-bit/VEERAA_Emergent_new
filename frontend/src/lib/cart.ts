import { useSyncExternalStore } from "react";
import type { OrderItem, Product } from "@/lib/types";

const KEY = "veeraa_cart";
const listeners = new Set<() => void>();
let cache: OrderItem[] | null = null;

function read(): OrderItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as OrderItem[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: OrderItem[]) {
  cache = items;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCart(): OrderItem[] {
  return useSyncExternalStore(subscribe, read, () => []);
}

export function addToCart(product: Product, qty = 1) {
  const items = [...read()];
  const found = items.find((i) => i.product_id === product.id);
  if (found) found.qty += qty;
  else
    items.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      qty,
      image_url: product.image_url,
    });
  write(items);
}

export function setQty(productId: string, qty: number) {
  write(read().map((i) => (i.product_id === productId ? { ...i, qty: Math.max(1, qty) } : i)));
}

export function removeFromCart(productId: string) {
  write(read().filter((i) => i.product_id !== productId));
}

export function clearCart() {
  write([]);
}

export function cartTotal(items: OrderItem[]): number {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}
