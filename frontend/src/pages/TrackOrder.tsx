import { useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";
import { rupees } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = ["placed", "shipped", "delivered"];

export default function TrackOrder() {
  const [num, setNum] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      setOrder(await apiGet<Order>(`/track/${num.trim()}`));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "No order found with that number."
          : "Could not look up that order right now.",
      );
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-5 py-14" data-testid="track-order-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Where is my parcel</p>
      <h1 className="mt-2 font-heading text-3xl font-light tracking-tight text-stone-900">Track your order</h1>

      <form className="mt-7 flex items-end gap-3" onSubmit={search} data-testid="track-form">
        <div className="grid gap-2 flex-1">
          <Label htmlFor="track-num">Order number</Label>
          <Input
            id="track-num"
            placeholder="VRA2601011234"
            required
            value={num}
            onChange={(e) => setNum(e.target.value)}
            data-testid="track-order-input"
          />
        </div>
        <Button type="submit" disabled={busy} data-testid="track-submit-button">
          {busy ? "Checking…" : "Track"}
        </Button>
      </form>

      {error && (
        <p className="mt-5 text-sm text-red-800" data-testid="track-error">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 rounded-xl border border-[#E7E0D6] bg-white p-6" data-testid="track-result">
          <p className="font-heading text-xl text-stone-900">{order.order_number}</p>
          <p className="mt-1 text-sm text-stone-600">
            {rupees(order.total)} · payment {order.payment_status}
          </p>
          <div className="mt-6 flex items-center">
            {STEPS.map((s, idx) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`size-3 rounded-full ${idx <= stepIndex ? "bg-amber-700" : "bg-stone-300"}`}
                    data-testid={`track-step-${s}`}
                  />
                  <span className="mt-2 text-xs capitalize text-stone-600">{s}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <span className={`h-px flex-1 ${idx < stepIndex ? "bg-amber-700" : "bg-stone-300"}`} />
                )}
              </div>
            ))}
          </div>
          {order.status === "cancelled" && (
            <p className="mt-4 text-sm text-red-800">This order was cancelled.</p>
          )}
          <p className="mt-6 text-sm text-stone-600">
            Shipping to {order.shipping.full_name}, {order.shipping.city} — {order.shipping.pincode}
          </p>
        </div>
      )}
    </div>
  );
}
