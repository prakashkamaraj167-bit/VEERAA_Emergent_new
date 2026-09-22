import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import type { Order, PaymentConfig } from "@/lib/types";
import { rupees } from "@/lib/types";
import { useCart, cartTotal, clearCart } from "@/lib/cart";
import { useAuth } from "@/lib/session";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Checkout() {
  const items = useCart();
  const total = cartTotal(items);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState<Order | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "", pincode: "" });

  const { data: config } = useQuery<PaymentConfig>({
    queryKey: ["payment-config"],
    queryFn: () => apiGet<PaymentConfig>("/payments/config"),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const order = await apiPost<Order>("/orders", { items, shipping: form });
      return await apiPost<Order>(`/orders/${order.id}/pay`);
    },
    onSuccess: (order) => {
      clearCart();
      setPlaced(order);
      toast.success("Payment successful — order confirmed!");
    },
    onError: () => toast.error("Could not place the order. Please try again."),
  });

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center" data-testid="order-success">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Thank you</p>
        <h1 className="mt-3 font-heading text-3xl font-light text-stone-900">Your order is confirmed</h1>
        <p className="mt-4 text-sm text-stone-600">Order number</p>
        <p className="font-heading text-2xl text-amber-950" data-testid="order-number">
          {placed.order_number}
        </p>
        <p className="mt-2 text-sm text-stone-600">Paid {rupees(placed.total)}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/my-orders" className={buttonVariants()} data-testid="success-my-orders-link">
            View my orders
          </Link>
          <Link to="/shop" className={buttonVariants({ variant: "outline" })} data-testid="success-shop-link">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]" data-testid="checkout-page">
      <div>
        <h1 className="font-heading text-3xl font-light tracking-tight text-stone-900">Checkout</h1>

        {!isLoading && !user && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5" data-testid="checkout-login-notice">
            <p className="text-sm text-amber-900">Please sign in to place your order.</p>
            <Link to="/login" className={buttonVariants({ size: "sm", className: "mt-3" })} data-testid="checkout-login-link">
              Sign in
            </Link>
          </div>
        )}

        <form
          className="mt-7 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!user) {
              toast.error("Please sign in first");
              return;
            }
            if (items.length === 0) {
              toast.error("Your bag is empty");
              navigate("/shop");
              return;
            }
            mutation.mutate();
          }}
          data-testid="checkout-form"
        >
          {(
            [
              ["full_name", "Full name", "sm:col-span-2"],
              ["phone", "Phone number", ""],
              ["pincode", "Pincode", ""],
              ["address", "Address", "sm:col-span-2"],
              ["city", "City", "sm:col-span-2"],
            ] as const
          ).map(([key, label, span]) => (
            <div key={key} className={`grid gap-2 ${span}`}>
              <Label htmlFor={`co-${key}`}>{label}</Label>
              <Input
                id={`co-${key}`}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                data-testid={`checkout-${key.replace("_", "-")}-input`}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending || items.length === 0}
              data-testid="place-order-button"
            >
              {mutation.isPending ? "Processing…" : `Pay ${rupees(total)} with Razorpay`}
            </Button>
            <p className="mt-2 text-xs text-stone-500" data-testid="payment-mode-note">
              {config?.demo_mode === false
                ? "Secure Razorpay checkout."
                : "Razorpay demo mode — payment is simulated until live keys are added."}
            </p>
          </div>
        </form>
      </div>

      <aside className="rounded-xl border border-[#E7E0D6] bg-white p-6 h-fit" data-testid="checkout-summary">
        <h2 className="font-heading text-lg text-stone-900">Order summary</h2>
        <div className="mt-4 space-y-3">
          {items.map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm text-stone-700">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{rupees(i.price * i.qty)}</span>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-stone-500">Your bag is empty.</p>}
        </div>
        <div className="mt-5 border-t border-[#E7E0D6] pt-4 flex justify-between">
          <span className="text-sm text-stone-600">Total</span>
          <span className="font-heading text-lg font-semibold text-amber-950" data-testid="checkout-total">
            {rupees(total)}
          </span>
        </div>
      </aside>
    </div>
  );
}
