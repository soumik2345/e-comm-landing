"use client";

import { useTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeCartOrder } from "@/lib/actions/order-actions";

type ProductItem = {
  _id: string;
  name: string;
  price: number;
};

type CartItem = { productId: string; quantity: number };

const CART_KEY = "luma_cart";

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[]) {
  if (items.length > 0) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } else {
    localStorage.removeItem(CART_KEY);
  }

  window.setTimeout(() => {
    window.dispatchEvent(new Event("luma_cart_updated"));
  }, 0);
}

export function CartPageClient({ products }: { products: ProductItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingQty, setLoadingQty] = useState<Record<string, boolean>>({});
  const [loadingRemove, setLoadingRemove] = useState<Record<string, boolean>>(
    {},
  );
  const [isClearLoading, setIsClearLoading] = useState(false);

  useEffect(() => {
    const syncCart = () => setCart(readCart());
    window.addEventListener("luma_cart_updated", syncCart);
    window.addEventListener("storage", syncCart);
    syncCart();
    setIsHydrated(true);
    return () => {
      window.removeEventListener("luma_cart_updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const map = useMemo(
    () => new Map(products.map((p) => [p._id, p])),
    [products],
  );
  const lines = cart
    .map((item) => ({ ...item, product: map.get(item.productId) }))
    .filter((i) => i.product);
  const total = lines.reduce(
    (sum, line) => sum + line.product!.price * line.quantity,
    0,
  );
  const [cleanupMessage, setCleanupMessage] = useState("");

  useEffect(() => {
    if (!isHydrated) return;
    const unavailableItems = cart.filter((item) => !map.has(item.productId));
    if (unavailableItems.length === 0) return;

    const nextCart = cart.filter((item) => map.has(item.productId));
    setCart(nextCart);
    persistCart(nextCart);
    setCleanupMessage("Some unavailable products were removed from your cart.");
  }, [cart, isHydrated, map]);

  function setQty(productId: string, quantity: number) {
    setLoadingQty((prev) => ({ ...prev, [productId]: true }));
    const nextQty = Math.max(1, Math.min(99, quantity));
    const nextCart = cart
      .map((item) =>
        item.productId === productId ? { ...item, quantity: nextQty } : item,
      )
      .filter((item) => item.quantity > 0);

    setCart(nextCart);
    persistCart(nextCart);
    setQtyEdits((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setTimeout(() => {
      setLoadingQty((prev) => ({ ...prev, [productId]: false }));
    }, 300);
  }

  function updateQtyInput(productId: string, value: string) {
    setQtyEdits((current) => ({ ...current, [productId]: value }));
  }

  function commitQtyEdit(productId: string) {
    const raw = qtyEdits[productId];
    const parsed = Number(raw);
    const nextQty = Number.isInteger(parsed)
      ? Math.max(1, Math.min(99, parsed))
      : 1;
    setQty(productId, nextQty);
    setQtyEdits((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function removeItem(productId: string) {
    setLoadingRemove((prev) => ({ ...prev, [productId]: true }));
    const nextCart = cart.filter((item) => item.productId !== productId);
    setCart(nextCart);
    persistCart(nextCart);
    setTimeout(() => {
      setLoadingRemove((prev) => ({ ...prev, [productId]: false }));
    }, 300);
  }

  const scrollIntoView = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;

    setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Added optional chaining here: window.visualViewport?.height
      if (window.visualViewport) {
        setTimeout(() => {
          const rect = target.getBoundingClientRect();

          // Safe check using optional chaining
          if (rect.bottom > (window.visualViewport?.height ?? 0)) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 250);
      }
    }, 200);
  };
  function clearCart() {
    setIsClearLoading(true);
    setCart([]);
    persistCart([]);
    setTimeout(() => {
      setIsClearLoading(false);
    }, 300);
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="mb-4 text-zinc-600">Your cart is empty.</p>
        <Link href="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Cart Items</h2>
            <p className="text-sm text-zinc-500">
              Review or edit products before checkout.
            </p>
          </div>
          <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
            {lines.length} item{lines.length === 1 ? "" : "s"}
          </div>
        </div>
        {cleanupMessage ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {cleanupMessage}
          </div>
        ) : null}
        <div className="space-y-4">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-700">
                  Selected
                </Badge>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {line.product!.name}
                  </p>
                  <p className="text-sm text-zinc-600">
                    ৳{line.product!.price} each
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQty(line.productId, line.quantity - 1)}
                      disabled={
                        line.quantity <= 1 || loadingQty[line.productId]
                      }
                    >
                      {loadingQty[line.productId] ? (
                        <span className="animate-spin">⚙️</span>
                      ) : (
                        "-"
                      )}
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={
                        qtyEdits[line.productId] ?? line.quantity.toString()
                      }
                      onChange={(e) =>
                        updateQtyInput(line.productId, e.target.value)
                      }
                      onBlur={() => commitQtyEdit(line.productId)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && commitQtyEdit(line.productId)
                      }
                      className="w-24 text-center"
                      disabled={loadingQty[line.productId]}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQty(line.productId, line.quantity + 1)}
                      disabled={
                        line.quantity >= 99 || loadingQty[line.productId]
                      }
                    >
                      {loadingQty[line.productId] ? (
                        <span className="animate-spin">⚙️</span>
                      ) : (
                        "+"
                      )}
                    </Button>
                  </div>
                  {/* <Button type="button" variant="outline" onClick={() => removeItem(line.productId)} disabled={loadingRemove[line.productId]}>
                    {loadingRemove[line.productId] ? <span className="animate-spin">⚙️</span> : "Remove"}
                  </Button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-3xl bg-zinc-100 p-4 text-sm text-zinc-700">
          <div className="flex items-center justify-between font-semibold text-zinc-900">
            <span>Subtotal</span>
            <span>৳{total}</span>
          </div>
          {/* <div className="mt-4 text-right">
            <Button
              variant="secondary"
              onClick={() => clearCart()}
              disabled={isClearLoading}
              type="button"
            >
              {isClearLoading ? <span className="animate-spin">⚙️</span> : "Clear Cart"}
            </Button>
          </div> */}
        </div>
      </div>
      <div className="sm:pb-0 pb-80">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Checkout (চেকআউট)</h2>
            <p className="text-sm text-zinc-500">
              Fill in your details to place the order.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              localStorage.setItem(CART_KEY, JSON.stringify(cart));

              const toastId = toast.loading("Processing your order...");

              startTransition(async () => {
                try {
                  await placeCartOrder(formData);
                  toast.dismiss(toastId);
                  toast.success("Order placed successfully!");
                  setCart([]);
                  persistCart([]);
                } catch (error) {
                  toast.dismiss(toastId);
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to place order",
                  );
                }
              });
            }}
            className="grid gap-4"
          >
            <input
              type="hidden"
              name="cartPayload"
              value={JSON.stringify(cart)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name (নাম)</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  className="mt-1"
                  onFocus={scrollIntoView}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone (ফোন)</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  required
                  className="mt-1"
                  onFocus={scrollIntoView}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Address (ঠিকানা)</Label>
              <Input
                id="shippingAddress"
                name="shippingAddress"
                required
                className="mt-1 min-h-20"
                onFocus={scrollIntoView}
              />
            </div>
            {/* <div className="space-y-2">
            <Label htmlFor="note">Note (নোট)</Label>
            <Input id="note" name="note" className="mt-1 min-h-20" />
          </div> */}
            <Button
              className="w-full rounded-2xl bg-green-600 text-white hover:bg-green-500"
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                <span className="animate-spin">⚙️</span>
              ) : (
                "Place Cart Order (অর্ডার করুন)"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
