import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuth } from "@/lib/session";

export function useWishlist() {
  const { user } = useAuth();
  const query = useQuery<Product[]>({
    queryKey: ["wishlist"],
    queryFn: () => apiGet<Product[]>("/wishlist"),
    enabled: !!user,
    retry: false,
  });
  const items = query.data ?? [];
  const ids = new Set(items.map((p) => p.id));
  return { items, ids, isLoading: query.isLoading };
}
