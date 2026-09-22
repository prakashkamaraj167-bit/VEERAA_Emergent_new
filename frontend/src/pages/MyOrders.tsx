import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Order } from "@/lib/types";
import { rupees } from "@/lib/types";
import { useAuth } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OrderRow({ order }: { order: Order }) {
  return (
    <div
      className="rounded-xl border border-[#E7E0D6] bg-white p-5"
      data-testid={`order-row-${order.order_number}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-heading text-stone-900">{order.order_number}</p>
          <p className="text-xs text-stone-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {order.status}
          </Badge>
          <Badge variant={order.payment_status === "paid" ? "secondary" : "outline"} className="capitalize">
            {order.payment_status}
          </Badge>
          <span className="font-heading font-semibold text-amber-950">{rupees(order.total)}</span>
        </div>
      </div>
      <ul className="mt-3 text-sm text-stone-600">
        {order.items.map((i) => (
          <li key={i.product_id}>
            {i.name} × {i.qty}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MyOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isError } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: () => apiGet<Order[]>("/orders/mine"),
    enabled: !!user,
    retry: false,
  });
  const orders = isError ? [] : (data ?? []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12" data-testid="my-orders-page">
      <h1 className="font-heading text-3xl font-light tracking-tight text-stone-900">My orders</h1>

      {!authLoading && !user ? (
        <div className="mt-6">
          <p className="text-sm text-stone-600">Sign in to see your purchase history.</p>
          <Link to="/login" className={buttonVariants({ className: "mt-4" })} data-testid="my-orders-login-link">
            Sign in
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-stone-600" data-testid="my-orders-empty">
          No orders yet.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
