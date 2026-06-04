"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ProductItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge: string;
};

type CartItem = { productId: string; quantity: number };

const CART_KEY = "luma_cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("luma_cart_updated"));
}

export function ProductListClient({ products }: { products: ProductItem[] }) {
  const [count, setCount] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const syncCart = () => {
      const current = readCart();
      setCart(current);
      setCount(current.reduce((sum, i) => sum + i.quantity, 0));
    };

    window.addEventListener("luma_cart_updated", syncCart);
    window.addEventListener("storage", syncCart);
    
    const currentCart = readCart();
    if (currentCart.length === 0 && products.length > 0) {
      const defaultProduct = products[0];
      const newCart = [{ productId: defaultProduct._id, quantity: 1 }];
      saveCart(newCart);
      setCart(newCart);
      setCount(1);
    } else {
      syncCart();
    }
    
    setInitialized(true);

    return () => {
      window.removeEventListener("luma_cart_updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, [products]);

  function addToCart(productId: string) {
    const items = readCart();
    const idx = items.findIndex((i) => i.productId === productId);

    if (idx >= 0) {
      items[idx].quantity = Math.min(99, items[idx].quantity + 1);
    } else {
      items.push({ productId, quantity: 1 });
    }

    saveCart(items);
    setCart(items);
    setCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }

  const cartMap = new Map(cart.map((item) => [item.productId, item.quantity]));
  const featuredProduct = products[0];
  const inCartQuantity = featuredProduct ? cartMap.get(featuredProduct._id) ?? 0 : 0;

  return (
    <>
      {featuredProduct ? (
        <div id="products" className="mx-auto ">
          <Card className={`overflow-hidden border-0 bg-white shadow-lg shadow-sky-100/60 p-0 ${inCartQuantity > 0 ? "ring-2 ring-green-500" : ""}`}>
            <div className="flex flex-col lg:flex-row">
              <div className="relative h-44 lg:h-auto lg:w-1/2">
                <Image src={featuredProduct.image} alt={featuredProduct.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col justify-between p-6 lg:w-1/2">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="w-fit rounded-full bg-sky-100 text-sky-700">{featuredProduct.badge}</Badge>
                    {inCartQuantity > 0 ? (
                      <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-700">Selected</Badge>
                    ) : null}
                  </div>
                  <div>
                    <CardTitle className="sm:text-3xl text-xl">{featuredProduct.name}</CardTitle>
                    <CardDescription className="mt-3 text-zinc-600 sm:line-clamp-4 line-clamp-1">
                      {featuredProduct.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-4">
                  <p className="text-4xl font-black text-zinc-900">৳{featuredProduct.price}</p>
                  <Button
                    type="button"
                    onClick={() => addToCart(featuredProduct._id)}
                    className="w-full rounded-xl bg-green-600 text-white hover:bg-green-500"
                    variant={inCartQuantity > 0 ? "secondary" : "default"}
                  >
                    {inCartQuantity > 0 ? `Add More (${inCartQuantity})` : "Add To Cart"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-zinc-600">No products are available right now.</p>
        </div>
      )}
    </>
  );
}
