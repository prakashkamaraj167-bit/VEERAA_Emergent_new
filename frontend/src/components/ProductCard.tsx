import { Link } from "react-router-dom";
import { Droplets, Sun } from "lucide-react";
import { rupees } from "@/lib/types";
import type { Product } from "@/lib/types";
import WishlistButton from "@/components/WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block rounded-xl border border-[#E7E0D6] bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F3EDE4]">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          data-testid={`product-image-${product.id}`}
        />
        <WishlistButton productId={product.id} className="absolute top-2 right-2" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base text-stone-900 leading-snug" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
          {product.is_new && (
            <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-amber-800">New</span>
          )}
        </div>
        <p className="mt-1 text-xs text-stone-500 capitalize">
          {product.metal === "gold" ? "18k Gold Plated" : "925 Sterling Silver"} · {product.category}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.sweat_proof && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Droplets className="size-3" /> Sweat proof
            </span>
          )}
          {product.daily_wear && (
            <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sun className="size-3" /> Daily wear
            </span>
          )}
        </div>
        <p className="mt-3 font-heading text-lg font-semibold text-amber-950" data-testid={`product-price-${product.id}`}>
          {rupees(product.price)}
        </p>
      </div>
    </Link>
  );
}
