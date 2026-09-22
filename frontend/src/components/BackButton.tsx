import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === "/") return null;

  return (
    <div className="mx-auto max-w-6xl px-5 pt-5">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        className="inline-flex items-center gap-1 text-sm text-stone-600 transition-colors duration-200 hover:text-amber-800"
        data-testid="back-button"
      >
        <ChevronLeft className="size-4" /> Back
      </button>
    </div>
  );
}
