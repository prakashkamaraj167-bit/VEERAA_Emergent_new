import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>("/auth/forgot", { email }),
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // never reveal whether the email exists
  });

  return (
    <div className="mx-auto max-w-md px-5 py-16" data-testid="forgot-password-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800 text-center">Veeraa account</p>
      <h1 className="mt-3 text-center font-heading text-3xl font-light tracking-tight text-stone-900">
        Forgot password
      </h1>

      {sent ? (
        <div className="mt-8 rounded-xl border border-[#E7E0D6] bg-white p-6 text-center" data-testid="forgot-sent">
          <p className="text-sm text-stone-700">
            If an account exists for <strong>{email}</strong>, we've emailed a link to reset your
            password. The link expires in 1 hour.
          </p>
          <Link to="/login" className={buttonVariants({ className: "mt-5" })} data-testid="forgot-back-login">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          data-testid="forgot-form"
        >
          <p className="text-sm text-stone-600 text-center">
            Enter your account email and we'll send you a reset link.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="fp-email">Email</Label>
            <Input
              id="fp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="forgot-email-input"
            />
          </div>
          <Button type="submit" disabled={mutation.isPending} data-testid="forgot-submit-button">
            {mutation.isPending ? "Sending…" : "Send reset link"}
          </Button>
          <Link to="/login" className="text-center text-sm text-amber-800 hover:underline" data-testid="forgot-login-link">
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
