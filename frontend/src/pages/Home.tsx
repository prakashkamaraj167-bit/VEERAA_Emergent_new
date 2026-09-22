import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Sun, ShieldCheck, Sparkles } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import FeedbackBox from "@/components/FeedbackBox";

const HERO =
  "https://static.prod-images.emergentagent.com/jobs/c0d76ea6-ce25-4ebe-8c53-680e184e132e/images/510218a90dd9ced0a9c1c6027ffcf5a4f0f5a4450609983e62f3881db399a97c.jpeg";

export default function Home() {
  const { data, isError } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => apiGet<Product[]>("/products"),
  });
  const products = isError ? [] : (data ?? []);
  const justArrived = [...products].sort((a, b) => Number(b.is_new) - Number(a.is_new)).slice(0, 4);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
        <div className="veeraa-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Gold plated &amp; 925 silver</p>
          <h1 className="mt-4 font-heading text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] text-stone-900">
            Everyday jewellery
            <br />
            that never gives up
          </h1>
          <p className="mt-5 text-lg font-light text-stone-700 leading-relaxed max-w-md">
            Sweat proof, anti-tarnish and light enough to forget. Veeraa pieces are made for the shower, the commute
            and the wedding — all in the same week.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className={buttonVariants({ size: "lg" })} data-testid="hero-shop-button">
              Shop the collection
            </Link>
            <Link
              to="/track"
              className={buttonVariants({ variant: "outline", size: "lg" })}
              data-testid="hero-track-button"
            >
              Track your order
            </Link>
          </div>
        </div>
        <div className="veeraa-rise rounded-2xl overflow-hidden border border-[#E7E0D6] shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <img src={HERO} alt="Veeraa gold and silver jewellery" className="w-full h-full object-cover" />
        </div>
      </section>

      {/* Promise strip */}
      <section className="border-y border-[#E7E0D6] bg-white/70">
        <div className="mx-auto max-w-6xl px-5 py-8 grid gap-6 sm:grid-cols-4 text-sm">
          {[
            { icon: Droplets, t: "Sweat proof", d: "Wear it to the gym" },
            { icon: Sun, t: "Daily wear", d: "Light, snag-free finish" },
            { icon: ShieldCheck, t: "Anti-tarnish", d: "6 month colour warranty" },
            { icon: Sparkles, t: "Skin friendly", d: "Nickel &amp; lead free" },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3">
              <f.icon className="size-5 text-amber-700 mt-0.5" />
              <div>
                <p className="font-heading text-stone-900">{f.t}</p>
                <p className="text-stone-600 text-xs mt-0.5">{f.d.replace("&amp;", "&")}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-heading text-2xl sm:text-3xl tracking-tight text-stone-900">Shop by category</h2>
        <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const img = products.find((p) => p.category === c)?.image_url;
            return (
              <Link
                key={c}
                to={`/shop?category=${c}`}
                className="group relative rounded-xl overflow-hidden border border-[#E7E0D6] bg-[#F3EDE4] aspect-[4/5] transition-transform duration-300 hover:-translate-y-1"
                data-testid={`category-tile-${c}`}
              >
                {img && (
                  <img
                    src={img}
                    alt={c}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <span className="absolute bottom-0 inset-x-0 bg-white/85 backdrop-blur-sm px-4 py-3 font-heading capitalize text-stone-900">
                  {c}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Just arrived */}
      <section className="mx-auto max-w-6xl px-5 pb-16" data-testid="just-arrived-section">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Fresh in</p>
            <h2 className="mt-2 font-heading text-2xl sm:text-3xl tracking-tight text-stone-900">Just Arrived</h2>
          </div>
          <Link to="/shop" className="text-sm text-amber-800 hover:underline" data-testid="just-arrived-view-all">
            View all
          </Link>
        </div>
        {justArrived.length === 0 ? (
          <p className="mt-8 text-sm text-stone-500">New pieces are being photographed — check back shortly.</p>
        ) : (
          <div className="mt-6 grid gap-5 grid-cols-2 lg:grid-cols-4">
            {justArrived.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Service tabs */}
      <section className="mx-auto max-w-6xl px-5 pb-16 grid gap-5 sm:grid-cols-2">
        <Link
          to="/track"
          className="rounded-xl border border-[#E7E0D6] bg-white p-7 transition-transform duration-300 hover:-translate-y-1"
          data-testid="home-track-tab"
        >
          <h3 className="font-heading text-xl text-stone-900">Track your order</h3>
          <p className="mt-2 text-sm text-stone-600">
            Enter your Veeraa order number to see exactly where your parcel is.
          </p>
        </Link>
        <Link
          to="/exchange"
          className="rounded-xl border border-[#E7E0D6] bg-white p-7 transition-transform duration-300 hover:-translate-y-1"
          data-testid="home-exchange-tab"
        >
          <h3 className="font-heading text-xl text-stone-900">Exchange &amp; Returns</h3>
          <p className="mt-2 text-sm text-stone-600">
            7 day easy exchange and returns on every piece. Read how it works.
          </p>
        </Link>
      </section>

      <FeedbackBox />
    </div>
  );
}
