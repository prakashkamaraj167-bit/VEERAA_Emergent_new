import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart, setQty, removeFromCart, cartTotal } from "@/lib/cart";
import { rupees } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";

export default function CartPage() {
  const items = useCart();
  const navigate = useNavigate();
  const total = cartTotal(items);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12" data-testid="cart-page">
      <h1 className="font-heading text-3xl font-light tracking-tight text-stone-900">Your bag</h1>

      {items.length === 0 ? (
        <div className="mt-8" data-testid="cart-empty-state">
          <p className="text-sm text-stone-600">Your bag is empty.</p>
          <Link to="/shop" className={buttonVariants({ className: "mt-5" })} data-testid="cart-shop-link">
            Browse the collection
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {items.map((i) => (
              <div
                key={i.product_id}
                className="flex items-center gap-4 rounded-xl border border-[#E7E0D6] bg-white p-4"
                data-testid={`cart-item-${i.product_id}`}
              >
                <img src={i.image_url} alt={i.name} className="size-20 rounded-lg object-cover bg-[#F3EDE4]" />
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-stone-900">{i.name}</p>
                  <p className="text-sm text-stone-600">{rupees(i.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setQty(i.product_id, i.qty - 1)}
                    data-testid={`cart-decrease-${i.product_id}`}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm" data-testid={`cart-qty-${i.product_id}`}>
                    {i.qty}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setQty(i.product_id, i.qty + 1)}
                    data-testid={`cart-increase-${i.product_id}`}
                  >
                    +
                  </Button>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removeFromCart(i.product_id)}
                  data-testid={`cart-remove-${i.product_id}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl border border-[#E7E0D6] bg-white p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Order total</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-amber-950" data-testid="cart-total">
                {rupees(total)}
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/checkout")} data-testid="checkout-button">
              Proceed to checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
