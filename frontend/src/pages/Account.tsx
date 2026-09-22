import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import type { Order, Shipping, User } from "@/lib/types";
import { useAuth } from "@/lib/session";
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
    </div>
  );
}
