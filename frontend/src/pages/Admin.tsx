import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Star, Upload, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { Feedback, Order, Product, ProductInput, User } from "@/lib/types";
import { rupees, CATEGORIES } from "@/lib/types";
import { useAuth } from "@/lib/session";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const EMPTY: ProductInput = {
  name: "",
  category: "earrings",
  metal: "gold",
  price: 999,
  image_url: "",
  description: "",
  images: [],
  sweat_proof: true,
  daily_wear: true,
  anti_tarnish: true,
  stock: 10,
  is_new: true,
};

const STATUSES = ["placed", "shipped", "delivered", "cancelled"];

export default function Admin() {
  const { user, isLoading } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File): Promise<string | null> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body });
    if (!res.ok) return null;
    return ((await res.json()) as { url: string }).url;
  }

  const isAdmin = user?.role === "admin";

  const products = useQuery<Product[]>({
    queryKey: ["products", "admin"],
    queryFn: () => apiGet<Product[]>("/products"),
    enabled: isAdmin,
  });
  const orders = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => apiGet<Order[]>("/orders"),
    enabled: isAdmin,
    retry: false,
  });
  const feedback = useQuery<Feedback[]>({
    queryKey: ["admin-feedback"],
    queryFn: () => apiGet<Feedback[]>("/feedback"),
    enabled: isAdmin,
    retry: false,
  });
  const users = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiGet<User[]>("/auth/users"),
    enabled: isAdmin,
    retry: false,
  });

  const setRole = useMutation({
    mutationFn: (v: { id: string; role: string }) =>
      apiPatch<User>(`/auth/users/${v.id}/role`, { role: v.role }),
    onSuccess: (u) => {
      toast.success(`${u.name} is now ${u.role === "admin" ? "an admin" : "a customer"}`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => {
      const detail =
        e && typeof e === "object" && "body" in e
          ? String((e as { body?: { detail?: string } }).body?.detail ?? "")
          : "";
      toast.error(detail || "Could not update the role");
    },
  });

  const save = useMutation({
    mutationFn: () =>
      editing ? apiPut<Product>(`/products/${editing.id}`, form) : apiPost<Product>("/products", form),
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Could not save the product"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product removed");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Could not remove the product"),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: string }) =>
      apiPatch<Order>(`/orders/${v.id}/status`, { status: v.status }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: () => toast.error("Could not update the order"),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/auth/users/${id}`),
    onSuccess: () => {
      toast.success("Account removed");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => {
      const detail =
        e && typeof e === "object" && "body" in e
          ? String((e as { body?: { detail?: string } }).body?.detail ?? "")
          : "";
      toast.error(detail || "Could not remove the account");
    },
  });

  if (!isLoading && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20" data-testid="admin-denied">
        <h1 className="font-heading text-2xl text-stone-900">Admin access required</h1>
        <p className="mt-2 text-sm text-stone-600">Sign in with the Veeraa admin account to manage the store.</p>
        <Link to="/login" className={buttonVariants({ className: "mt-5" })} data-testid="admin-login-link">
          Sign in
        </Link>
      </div>
    );
  }

  const revenue = (orders.data ?? []).reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12" data-testid="admin-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Veeraa admin</p>
      <h1 className="mt-2 font-heading text-3xl font-light tracking-tight text-stone-900">Store dashboard</h1>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ["Products", String(products.data?.length ?? 0), "admin-stat-products"],
          ["Orders", String(orders.data?.length ?? 0), "admin-stat-orders"],
          ["Revenue", rupees(revenue), "admin-stat-revenue"],
        ].map(([label, value, tid]) => (
          <div key={label} className="rounded-xl border border-[#E7E0D6] bg-white p-5" data-testid={tid}>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
            <p className="mt-2 font-heading text-2xl text-amber-950">{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="products" className="mt-10">
        <TabsList>
          <TabsTrigger value="products" data-testid="admin-tab-products">
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="admin-tab-orders">
            Purchase history
          </TabsTrigger>
          <TabsTrigger value="feedback" data-testid="admin-tab-feedback">
            Feedback
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="admin-tab-users">
            Users
          </TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products">
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
                setOpen(true);
              }}
              data-testid="admin-add-product-button"
            >
              <Plus className="size-4" /> Add product
            </Button>
          </div>
          <div className="mt-4 rounded-xl border border-[#E7E0D6] bg-white" data-testid="admin-products-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Metal</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products.data ?? []).map((p) => (
                  <TableRow key={p.id} data-testid={`admin-product-row-${p.id}`}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="capitalize">{p.category}</TableCell>
                    <TableCell className="capitalize">{p.metal}</TableCell>
                    <TableCell>{rupees(p.price)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(p);
                          setForm({
                            name: p.name,
                            category: p.category,
                            metal: p.metal,
                            price: p.price,
                            image_url: p.image_url,
                            description: p.description,
                            images: p.images ?? [],
                            sweat_proof: p.sweat_proof,
                            daily_wear: p.daily_wear,
                            anti_tarnish: p.anti_tarnish,
                            stock: p.stock,
                            is_new: p.is_new,
                          });
                          setOpen(true);
                        }}
                        data-testid={`admin-edit-product-${p.id}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => remove.mutate(p.id)}
                        data-testid={`admin-delete-product-${p.id}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          <div className="mt-5 space-y-4" data-testid="admin-orders-list">
            {(orders.data ?? []).length === 0 && (
              <p className="text-sm text-stone-600" data-testid="admin-orders-empty">
                No orders yet.
              </p>
            )}
            {(orders.data ?? []).map((o) => (
              <div
                key={o.id}
                className="rounded-xl border border-[#E7E0D6] bg-white p-5"
                data-testid={`admin-order-${o.order_number}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-stone-900">{o.order_number}</p>
                    <p className="text-xs text-stone-500">
                      {o.user_name} · {o.user_email} · {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={o.payment_status === "paid" ? "secondary" : "outline"} className="capitalize">
                      {o.payment_status}
                    </Badge>
                    <span className="font-heading font-semibold text-amber-950">{rupees(o.total)}</span>
                    <Select
                      value={o.status}
                      onValueChange={(v: string) => setStatus.mutate({ id: o.id, status: v })}
                    >
                      <SelectTrigger size="sm" className="w-36" data-testid={`admin-order-status-${o.order_number}`}>
                        <SelectValue>{(v) => String(v)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="mt-3 text-sm text-stone-600">
                  {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Ship to: {o.shipping.full_name}, {o.shipping.address}, {o.shipping.city} {o.shipping.pincode} ·{" "}
                  {o.shipping.phone}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback">
          <div className="mt-5 space-y-4" data-testid="admin-feedback-list">
            {(feedback.data ?? []).length === 0 && (
              <p className="text-sm text-stone-600" data-testid="admin-feedback-empty">
                No feedback yet.
              </p>
            )}
            {(feedback.data ?? []).map((f) => (
              <div key={f.id} className="rounded-xl border border-[#E7E0D6] bg-white p-5" data-testid={`admin-feedback-${f.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-heading text-stone-900">
                    {f.name} <span className="text-xs text-stone-500">{f.email}</span>
                  </p>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: f.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-700">{f.message}</p>
                <p className="mt-2 text-xs text-stone-500">{new Date(f.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <div className="mt-5 rounded-xl border border-[#E7E0D6] bg-white" data-testid="admin-users-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data ?? []).map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <TableRow key={u.id} data-testid={`admin-user-row-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-stone-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === "admin" ? "secondary" : "outline"}
                          className="capitalize"
                          data-testid={`admin-user-role-${u.id}`}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          {u.role === "admin" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isSelf || setRole.isPending}
                              onClick={() => setRole.mutate({ id: u.id, role: "customer" })}
                              data-testid={`admin-demote-${u.id}`}
                            >
                              <UserRound className="size-4" /> {isSelf ? "You" : "Make customer"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={setRole.isPending}
                              onClick={() => setRole.mutate({ id: u.id, role: "admin" })}
                              data-testid={`admin-promote-${u.id}`}
                            >
                              <ShieldCheck className="size-4" /> Make admin
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={isSelf || deleteUser.isPending}
                            onClick={() => {
                              if (window.confirm(`Remove ${u.name}'s account? This cannot be undone.`)) {
                                deleteUser.mutate(u.id);
                              }
                            }}
                            data-testid={`admin-delete-user-${u.id}`}
                            aria-label="Delete account"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {(users.data ?? []).length === 0 && (
              <p className="p-5 text-sm text-stone-600" data-testid="admin-users-empty">
                No users yet.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            data-testid="admin-product-form"
          >
            <div className="grid gap-2">
              <Label htmlFor="pf-name">Name</Label>
              <Input
                id="pf-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="admin-product-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: string) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="admin-product-category-select">
                    <SelectValue>{(v) => String(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Metal</Label>
                <Select value={form.metal} onValueChange={(v: string) => setForm({ ...form, metal: v })}>
                  <SelectTrigger data-testid="admin-product-metal-select">
                    <SelectValue>{(v) => String(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">gold</SelectItem>
                    <SelectItem value="silver">silver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pf-price">Price (₹)</Label>
                <Input
                  id="pf-price"
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  data-testid="admin-product-price-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf-stock">Stock</Label>
                <Input
                  id="pf-stock"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  data-testid="admin-product-stock-input"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-image">Product image</Label>
              <div className="flex items-center gap-3">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="size-16 rounded-lg object-cover border border-[#E7E0D6] bg-[#F3EDE4]"
                    data-testid="admin-product-image-preview"
                  />
                ) : (
                  <div className="size-16 rounded-lg border border-dashed border-[#E7E0D6] bg-[#F3EDE4]" />
                )}
                <div className="flex-1">
                  <input
                    id="pf-image-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const url = await uploadFile(file);
                        if (!url) throw new Error();
                        setForm((f) => ({ ...f, image_url: url }));
                        toast.success("Image uploaded");
                      } catch {
                        toast.error("Upload failed — try a JPG/PNG under 5 MB");
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                    data-testid="admin-product-image-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("pf-image-file")?.click()}
                    data-testid="admin-product-upload-button"
                  >
                    <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload image"}
                  </Button>
                </div>
              </div>
              <Input
                id="pf-image"
                placeholder="…or paste an image URL"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                data-testid="admin-product-image-input"
              />
            </div>

            <div className="grid gap-2">
              <Label>Additional photos (gallery)</Label>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2" data-testid="admin-gallery-thumbs">
                  {form.images.map((src, i) => (
                    <div key={`${src}-${i}`} className="relative">
                      <img
                        src={src}
                        alt={`extra ${i + 1}`}
                        className="size-16 rounded-lg object-cover border border-[#E7E0D6] bg-[#F3EDE4]"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-stone-800 text-white text-xs"
                        aria-label="Remove photo"
                        data-testid={`admin-gallery-remove-${i}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                id="pf-gallery-file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const url = await uploadFile(file);
                    if (!url) throw new Error();
                    setForm((f) => ({ ...f, images: [...f.images, url] }));
                    toast.success("Photo added to gallery");
                  } catch {
                    toast.error("Upload failed — try a JPG/PNG under 5 MB");
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
                data-testid="admin-gallery-file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById("pf-gallery-file")?.click()}
                className="w-fit"
                data-testid="admin-gallery-add-button"
              >
                <Upload className="size-4" /> Add gallery photo
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-desc">Description</Label>
              <Textarea
                id="pf-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="admin-product-description-input"
              />
            </div>
            <div className="flex flex-wrap gap-5">
              {(
                [
                  ["sweat_proof", "Sweat proof"],
                  ["daily_wear", "Daily wear"],
                  ["anti_tarnish", "Anti-tarnish"],
                  ["is_new", "Just arrived"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-stone-700">
                  <Checkbox
                    checked={form[key]}
                    onCheckedChange={(c) => setForm({ ...form, [key]: Boolean(c) })}
                    data-testid={`admin-product-${key.replace("_", "-")}-checkbox`}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Button type="submit" disabled={save.isPending} data-testid="admin-save-product-button">
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
