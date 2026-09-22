import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Login() {
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { beginSession } = useSession();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      const path = tab === "signin" ? "/auth/login" : "/auth/signup";
      const body = tab === "signin" ? { email, password } : { name, email, password };
      return await apiPost<User>(path, body);
    },
    onSuccess: async (user) => {
      await beginSession();
      toast.success(`Welcome, ${user.name}`);
      navigate(user.role === "admin" ? "/admin" : "/");
    },
    onError: (e) => {
      const detail = e instanceof ApiError ? String((e.body as { detail?: string })?.detail ?? "") : "";
      toast.error(detail || "Sign in failed");
    },
  });

  return (
    <div className="mx-auto max-w-md px-5 py-16" data-testid="login-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800 text-center">Veeraa account</p>
      <h1 className="mt-3 text-center font-heading text-3xl font-light tracking-tight text-stone-900">
        Welcome back
      </h1>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="mt-8">
        <TabsList className="w-full">
          <TabsTrigger value="signin" className="flex-1" data-testid="signin-tab">
            Sign in
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1" data-testid="signup-tab">
            Create account
          </TabsTrigger>
        </TabsList>

        {["signin", "signup"].map((t) => (
          <TabsContent key={t} value={t}>
            <form
              className="mt-6 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              data-testid={`${t}-form`}
            >
              {t === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="au-name">Full name</Label>
                  <Input
                    id="au-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="auth-name-input"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor={`au-email-${t}`}>Email</Label>
                <Input
                  id={`au-email-${t}`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="auth-email-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`au-password-${t}`}>Password</Label>
                <Input
                  id={`au-password-${t}`}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="auth-password-input"
                />
              </div>
              <Button type="submit" disabled={mutation.isPending} data-testid="auth-submit-button">
                {mutation.isPending ? "Please wait…" : t === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
