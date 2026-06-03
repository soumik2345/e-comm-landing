"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);

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

  const map = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const lines = cart.map((item) => ({ ...item, product: map.get(item.productId) })).filter((i) => i.product);
  const total = lines.reduce((sum, line) => sum + line.product!.price * line.quantity, 0);

  function setQty(productId: string, quantity: number) {
    const nextQty = Math.max(1, Math.min(99, quantity));
    const nextCart = cart
      .map((item) => (item.productId === productId ? { ...item, quantity: nextQty } : item))
      .filter((item) => item.quantity > 0);

    setCart(nextCart);
    persistCart(nextCart);
    setQtyEdits((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function updateQtyInput(productId: string, value: string) {
    setQtyEdits((current) => ({ ...current, [productId]: value }));
  }

  function commitQtyEdit(productId: string) {
    const raw = qtyEdits[productId];
    const parsed = Number(raw);
    const nextQty = Number.isInteger(parsed) ? Math.max(1, Math.min(99, parsed)) : 1;
    setQty(productId, nextQty);
    setQtyEdits((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function removeItem(productId: string) {
    const nextCart = cart.filter((item) => item.productId !== productId);
    setCart(nextCart);
    persistCart(nextCart);
  }

  function clearCart() {
    setCart([]);
    persistCart([]);
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
            <p className="text-sm text-zinc-500">Review or edit products before checkout.</p>
          </div>
          <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">{lines.length} item{lines.length === 1 ? "" : "s"}</div>
        </div>
        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.productId} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-700">Selected</Badge>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">{line.product!.name}</p>
                  <p className="text-sm text-zinc-600">৳{line.product!.price} each</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQty(line.productId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={qtyEdits[line.productId] ?? line.quantity.toString()}
                      onChange={(e) => updateQtyInput(line.productId, e.target.value)}
                      onBlur={() => commitQtyEdit(line.productId)}
                      onKeyDown={(e) => e.key === "Enter" && commitQtyEdit(line.productId)}
                      className="w-24 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQty(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= 99}
                    >
                      +
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={() => removeItem(line.productId)}>Remove</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-3xl bg-zinc-100 p-4 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">Order summary</p>
          <div className="mt-3 flex items-center justify-between">
            <span>Subtotal</span>
            <span>৳{total}</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Shipping, taxes and discounts will be calculated at the next step.</p>
          <div className="mt-4 text-right">
            <Button variant="secondary" onClick={clearCart}>Clear Cart</Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Checkout (চেকআউট)</h2>
          <p className="text-sm text-zinc-500">Fill in your details to place the order.</p>
        </div>
        <form
          action={placeCartOrder}
          onSubmit={() => {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="cartPayload" value={JSON.stringify(cart)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name (নাম)</Label>
              <Input id="customerName" name="customerName" required className="mt-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone (ফোন)</Label>
              <Input id="customerPhone" name="customerPhone" required className="mt-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingAddress">Address (ঠিকানা)</Label>
            <Input id="shippingAddress" name="shippingAddress" required className="mt-1 min-h-20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (নোট)</Label>
            <Input id="note" name="note" className="mt-1 min-h-20" />
          </div>
          <Button className="w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800" type="submit">Place Cart Order (অর্ডার করুন)</Button>
        </form>
      </div>
    </div>
  );
}
