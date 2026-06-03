import Link from "next/link";
import { Button } from "@/components/ui/button";
import CartSection from "@/components/store/cart-section";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-screen-xl space-y-6 px-0 sm:px-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-black">Your Cart</h1>
          <Link href="/"><Button variant="outline">Back to Shop</Button></Link>
        </div>
        <CartSection />
      </section>
    </main>
  );
}
