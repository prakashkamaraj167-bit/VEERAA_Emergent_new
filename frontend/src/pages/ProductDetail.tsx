import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Sun, ShieldCheck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/types";
import { rupees, whatsappLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isError, isLoading } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    retry: false,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-sm text-stone-500">Loading…</div>;
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20" data-testid="product-not-found">
        <h1 className="font-heading text-2xl text-stone-900">This piece is unavailable</h1>
        <p className="mt-2 text-sm text-stone-600">It may have been removed. Browse the rest of the collection.</p>
        <Button className="mt-5" onClick={() => navigate("/shop")} data-testid="back-to-shop-button">
          Back to shop
        </Button>
      </div>
    );
  }

  const p = data;
  const enquiry = whatsappLink(`Hi Veeraa, I'd like to know more about "${p.name}" (${rupees(p.price)}).`);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 lg:grid-cols-2" data-testid="product-detail-page">
      <div className="rounded-2xl overflow-hidden border border-[#E7E0D6] bg-[#F3EDE4]">
        <img src={p.image_url} alt={p.name} className="w-full object-cover aspect-square" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-amber-800">
          {p.metal === "gold" ? "18k Gold Plated" : "925 Sterling Silver"}
        </p>
        <h1
          className="mt-3 font-heading text-3xl sm:text-4xl font-light tracking-tight text-stone-900"
          data-testid="product-detail-name"
        >
          {p.name}
        </h1>
        <p className="mt-4 font-heading text-2xl font-semibold text-amber-950" data-testid="product-detail-price">
          {rupees(p.price)}
        </p>

        <p className="mt-5 text-base leading-relaxed text-stone-700" data-testid="product-detail-description">
          {p.description}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {p.sweat_proof && (
            <Feature icon={Droplets} title="Sweat proof" text="Resists sweat and water — gym, monsoon, all of it." />
          )}
          {p.daily_wear && (
            <Feature icon={Sun} title="Daily wear" text="Lightweight, snag-free and comfortable all day." />
          )}
          {p.anti_tarnish && (
            <Feature icon={ShieldCheck} title="Anti-tarnish" text="Protective coating keeps the colour for months." />
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={() => {
              addToCart(p);
              toast.success(`${p.name} added to your bag`);
            }}
            data-testid="add-to-cart-button"
          >
            Add to bag
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              addToCart(p);
              navigate("/cart");
            }}
            data-testid="buy-now-button"
          >
            Buy now
          </Button>
          <a
            href={enquiry}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-green-700 px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-800"
            data-testid="whatsapp-enquiry-button"
          >
            <MessageCircle className="size-4" /> Enquire on WhatsApp
          </a>
        </div>

        <p className="mt-5 text-xs text-stone-500">
          In stock: {p.stock} · Free shipping over ₹999 · 7 day easy exchange
        </p>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Droplets;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-[#E7E0D6] bg-white p-4">
      <p className="flex items-center gap-2 font-heading text-stone-900">
        <Icon className="size-4 text-amber-700" /> {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-stone-600">{text}</p>
    </div>
  );
}
