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
      items[idx].quantity = Math.min(10, items[idx].quantity + 1);
    } else {
      items.push({ productId, quantity: 1 });
    }

    saveCart(items);
    setCart(items);
    setCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }

  const cartMap = new Map(cart.map((item) => [item.productId, item.quantity]));

  return (
    <>

      <div id="products" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const inCartQuantity = cartMap.get(product._id) ?? 0;
          return (
            <Card
              key={product._id}
              className={`overflow-hidden border-0 bg-white shadow-md shadow-sky-100/60 p-0 ${inCartQuantity > 0 ? "ring-2 ring-sky-500" : ""}`}
            >
              <div className="relative h-56 w-full">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="w-fit rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100">{product.badge}</Badge>
                  {inCartQuantity > 0 ? (
                    <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-700">Selected</Badge>
                  ) : null}
                </div>
                <CardTitle className="pt-3 text-xl">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-zinc-900">৳{product.price}</p>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  onClick={() => addToCart(product._id)}
                  className="w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
                  variant={inCartQuantity > 0 ? "secondary" : "default"}
                >
                  {inCartQuantity > 0 ? `Add More (${inCartQuantity})` : "Add To Cart"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
