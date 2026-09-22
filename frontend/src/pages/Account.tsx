import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import type { Order, Product, Shipping, User } from "@/lib/types";
import { rupees } from "@/lib/types";
import { useAuth } from "@/lib/session";
import { useWishlist } from "@/lib/wishlist";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function addressKey(s: Shipping): string {
  return `${s.full_name}|${s.address}|${s.city}|${s.pincode}|${s.phone}`.toLowerCase();
}

export default function Account() {
  const { user, isLoading } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { items: wishlist } = useWishlist();

  const removeWish = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/wishlist/${id}`),
    onSuccess: () => {
      toast.success("Removed from wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: () => toast.error("Could not update your wishlist"),
  });

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: () => apiGet<Order[]>("/orders/mine"),
    enabled: !!user,
    retry: false,
  });

  const save = useMutation({
    mutationFn: () => apiPatch<User>("/auth/profile", { name }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast.error("Could not update your profile"),
  });

  // Saved addresses = unique shipping addresses from this customer's past orders.
  const addresses: Shipping[] = [];
  const seen = new Set<string>();
  for (const o of orders ?? []) {
    const k = addressKey(o.shipping);
    if (!seen.has(k)) {
      seen.add(k);
      addresses.push(o.shipping);
    }
  }

  if (!isLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-5 py-16" data-testid="account-signin-required">
        <h1 className="font-heading text-2xl text-stone-900">Your account</h1>
        <p className="mt-2 text-sm text-stone-600">Sign in to view and edit your profile.</p>
        <Link to="/login" className={buttonVariants({ className: "mt-5" })} data-testid="account-login-link">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12" data-testid="account-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Your account</p>
      <h1 className="mt-2 font-heading text-3xl font-light tracking-tight text-stone-900">Profile</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-[#E7E0D6] bg-white p-6">
          <h2 className="font-heading text-lg text-stone-900">Details</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            data-testid="account-form"
          >
            <div className="grid gap-2">
              <Label htmlFor="ac-name">Full name</Label>
              <Input
                id="ac-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="account-name-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ac-email">Email</Label>
              <Input id="ac-email" value={user?.email ?? ""} disabled data-testid="account-email-input" />
              <p className="text-xs text-stone-500">Email can't be changed. Contact us to update it.</p>
            </div>
            <Button
              type="submit"
              disabled={save.isPending || name.trim() === (user?.name ?? "")}
              data-testid="account-save-button"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-[#E7E0D6] bg-white p-6">
          <h2 className="font-heading text-lg text-stone-900">Saved addresses</h2>
          <p className="mt-1 text-xs text-stone-500">From your past orders.</p>
          {addresses.length === 0 ? (
            <p className="mt-5 text-sm text-stone-600" data-testid="account-no-addresses">
              No saved addresses yet — they'll appear here after your first order.
            </p>
          ) : (
            <ul className="mt-5 space-y-3" data-testid="account-addresses">
              {addresses.map((a, i) => (
                <li
                  key={addressKey(a)}
                  className="rounded-lg border border-[#E7E0D6] bg-[#FAF7F2] p-4 text-sm"
                  data-testid={`account-address-${i}`}
                >
                  <p className="flex items-center gap-2 font-medium text-stone-900">
                    <MapPin className="size-4 text-amber-700" /> {a.full_name}
                  </p>
                  <p className="mt-1 text-stone-600">{a.address}</p>
                  <p className="text-stone-600">
                    {a.city} — {a.pincode}
                  </p>
                  <p className="text-stone-600">{a.phone}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/my-orders"
            className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}
            data-testid="account-orders-link"
          >
            View my orders
          </Link>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-[#E7E0D6] bg-white p-6" data-testid="account-wishlist">
        <h2 className="flex items-center gap-2 font-heading text-lg text-stone-900">
          <Heart className="size-5 text-red-500" /> My wishlist
        </h2>
        {wishlist.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600" data-testid="account-wishlist-empty">
            No saved pieces yet — tap the heart on any product to save it here.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4" data-testid="account-wishlist-items">
            {wishlist.map((p: Product) => (
              <div
                key={p.id}
                className="relative rounded-xl border border-[#E7E0D6] overflow-hidden bg-white"
                data-testid={`wishlist-item-${p.id}`}
              >
                <button
                  type="button"
                  onClick={() => removeWish.mutate(p.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/85 text-stone-700 shadow-sm transition-transform duration-200 hover:scale-110"
                  data-testid={`wishlist-remove-${p.id}`}
                >
                  <X className="size-4" />
                </button>
                <Link to={`/product/${p.id}`} data-testid={`wishlist-link-${p.id}`}>
                  <div className="aspect-square bg-[#F3EDE4]">
                    <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-heading text-sm text-stone-900 leading-snug">{p.name}</p>
                    <p className="mt-1 font-heading text-sm font-semibold text-amber-950">{rupees(p.price)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
