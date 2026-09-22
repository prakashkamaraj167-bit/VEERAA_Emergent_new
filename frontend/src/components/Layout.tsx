import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, LogOut, LayoutDashboard, Package } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import BackButton from "@/components/BackButton";
import { useCart } from "@/lib/cart";
import { useAuth, useSession } from "@/lib/session";
import { whatsappLink } from "@/lib/types";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/shop?category=earrings", label: "Earrings" },
  { to: "/shop?category=chains", label: "Chains" },
  { to: "/shop?category=rings", label: "Rings" },
  { to: "/shop?category=bracelets", label: "Bracelets" },
  { to: "/track", label: "Track Order" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const { user } = useAuth();
  const { endSession } = useSession();
  const navigate = useNavigate();
  const count = cart.reduce((s, i) => s + i.qty, 0);

  async function logout() {
    await endSession();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#E7E0D6] bg-[#FAF7F2]/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center gap-6">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-button" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading tracking-[0.3em] text-amber-900">VEERAA</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV.map((n) => (
                  <Link
                    key={n.label}
                    to={n.to}
                    className="py-2 text-sm text-stone-700 hover:text-amber-800"
                    data-testid={`mobile-nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="font-heading text-xl tracking-[0.35em] text-amber-900" data-testid="brand-logo-link">
            VEERAA
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-4">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                to={n.to}
                className="text-[13px] tracking-wide text-stone-600 transition-colors duration-200 hover:text-amber-800"
                data-testid={`nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 text-stone-700 hover:text-amber-800 transition-colors duration-200"
              data-testid="cart-link"
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-amber-700 text-white text-[10px] grid place-items-center"
                  data-testid="cart-count-badge"
                >
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link
                    to="/admin"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    data-testid="admin-link"
                  >
                    <LayoutDashboard className="size-4" /> Admin
                  </Link>
                ) : (
                  <Link
                    to="/my-orders"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    data-testid="my-orders-link"
                  >
                    <Package className="size-4" /> My Orders
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-button">
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className={buttonVariants({ size: "sm" })}
                data-testid="login-link"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <BackButton />
        {children}
      </main>

      <footer className="border-t border-[#E7E0D6] bg-white/60 mt-20">
        <div className="mx-auto max-w-6xl px-5 py-12 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-lg tracking-[0.3em] text-amber-900">VEERAA</p>
            <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-xs">
              Gold plated and 925 silver jewellery made sweat proof and anti-tarnish, for every single day.
            </p>
          </div>
          <div className="text-sm text-stone-600 space-y-2">
            <Link to="/exchange" className="block hover:text-amber-800" data-testid="footer-exchange-link">
              Exchange &amp; Returns
            </Link>
            <Link to="/track" className="block hover:text-amber-800" data-testid="footer-track-link">
              Track your order
            </Link>
            <Link to="/shop" className="block hover:text-amber-800" data-testid="footer-shop-link">
              Shop all
            </Link>
          </div>
          <div className="text-sm text-stone-600">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Enquiries</p>
            <a
              href={whatsappLink("Hi Veeraa, I have a question about your jewellery.")}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-green-700 hover:underline"
              data-testid="footer-whatsapp-link"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-stone-500">© {new Date().getFullYear()} Veeraa Jewellery</p>
      </footer>
      <Toaster richColors />
    </div>
  );
}
