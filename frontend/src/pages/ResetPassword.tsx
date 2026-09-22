import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, ApiError } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>("/auth/reset", { token, password }),
    onSuccess: () => {
      toast.success("Password updated — please sign in.");
      navigate("/login");
    },
    onError: (e) => {
      const detail = e instanceof ApiError ? String((e.body as { detail?: string })?.detail ?? "") : "";
      toast.error(detail || "Could not reset password");
    },
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center" data-testid="reset-invalid">
        <h1 className="font-heading text-2xl text-stone-900">Invalid reset link</h1>
        <p className="mt-2 text-sm text-stone-600">This link is missing its token. Request a new one.</p>
        <Link to="/forgot-password" className={buttonVariants({ className: "mt-5" })} data-testid="reset-request-new">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16" data-testid="reset-password-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800 text-center">Veeraa account</p>
      <h1 className="mt-3 text-center font-heading text-3xl font-light tracking-tight text-stone-900">
        Set a new password
      </h1>

      <form
        className="mt-8 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
          }
          mutation.mutate();
        }}
        data-testid="reset-form"
      >
        <div className="grid gap-2">
          <Label htmlFor="rp-password">New password</Label>
          <Input
            id="rp-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="reset-password-input"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rp-confirm">Confirm password</Label>
          <Input
            id="rp-confirm"
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            data-testid="reset-confirm-input"
          />
        </div>
        <Button type="submit" disabled={mutation.isPending} data-testid="reset-submit-button">
          {mutation.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
