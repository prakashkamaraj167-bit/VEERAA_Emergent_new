import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiPost } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuth } from "@/lib/session";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export default function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const saved = ids.has(productId);

  const toggle = useMutation({
    mutationFn: async () => {
      if (saved) await apiDelete<{ ok: boolean }>(`/wishlist/${productId}`);
      else await apiPost<Product>(`/wishlist/${productId}`);
    },
    onSuccess: () => {
      toast.success(saved ? "Removed from wishlist" : "Saved to your wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: () => toast.error("Could not update your wishlist"),
  });

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          toast.info("Sign in to save your favourites");
          navigate("/login");
          return;
        }
        toggle.mutate();
      }}
      disabled={toggle.isPending}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/85 text-stone-700 shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-110",
        className,
      )}
      data-testid={`wishlist-toggle-${productId}`}
    >
      <Heart className={cn("size-5", saved && "fill-red-500 text-red-500")} />
    </button>
  );
}
