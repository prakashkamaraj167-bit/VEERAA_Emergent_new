import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";
  const metal = params.get("metal") ?? "all";

  const { data, isError, isLoading } = useQuery<Product[]>({
    queryKey: ["products", category, metal],
    queryFn: () => apiGet<Product[]>(`/products?category=${category}&metal=${metal}`),
  });
  const products = isError ? [] : (data ?? []);

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12" data-testid="shop-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800">The collection</p>
      <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-light tracking-tight text-stone-900">
        Shop Veeraa
      </h1>

      <div className="mt-7 flex flex-wrap gap-2" data-testid="shop-filters">
        {["all", ...CATEGORIES].map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            className="capitalize"
            onClick={() => set("category", c)}
            data-testid={`filter-category-${c}`}
          >
            {c}
          </Button>
        ))}
        <span className="w-px bg-[#E7E0D6] mx-2 hidden sm:block" />
        {["all", "gold", "silver"].map((m) => (
          <Button
            key={m}
            size="sm"
            variant={metal === m ? "secondary" : "ghost"}
            className="capitalize"
            onClick={() => set("metal", m)}
            data-testid={`filter-metal-${m}`}
          >
            {m}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-10 text-sm text-stone-500">Loading pieces…</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-sm text-stone-500" data-testid="shop-empty-state">
          No pieces match this filter right now.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 grid-cols-2 lg:grid-cols-4" data-testid="shop-product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
