import CartSection from "@/components/store/cart-section";
import { ProductListClient } from "@/components/store/product-list-client";
import { seedProducts } from "@/lib/actions/product-actions";
import { dbConnect } from "@/lib/db";
import Product, { type ProductDoc } from "@/models/Product";
import HeaderBanner from "@/components/ui/header-banner";

export const dynamic = "force-dynamic";

async function getProducts() {
  await dbConnect();
  const items = await Product.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .limit(6)
    .lean<ProductDoc[]>();

  return items.map((p) => ({
    _id: String(p._id),
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    badge: p.badge,
  }));
}

export default async function Home() {
  await seedProducts();
  const products = await getProducts();

  return (
    <>
      <HeaderBanner />
      <main className="min-h-dvh bg-[radial-gradient(circle_at_top_right,#ecf6ff_10%,#f9fbff_40%,#ffffff_70%)] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto mt-10 max-w-7xl px-0 sm:px-2">
          <ProductListClient products={products} />
        </section>

        {/* <section className="mx-auto max-w-7xl px-0 sm:px-2 mt-10">
            <div className="mb-8 max-w-3xl space-y-4">
              <p className="text-xl uppercase  text-sky-600">আমাদের বিশেষত্ব</p>
              <h2 className="text-3xl font-black text-zinc-900">কেন আমাদের থেকে কিনবেন?</h2>
              <p className="text-zinc-600">
                স্টাইলিশ ডিজাইন, আরামদায়ক ফেব্রিক এবং সেরা মূল্যে প্রিমিয়াম কোয়ালিটির টি-শার্ট — সবকিছু এক জায়গায়।
              </p>
            </div>
            <ServiceCards />
          </section> */}

        <section className="mx-auto mt-10 max-w-7xl px-0 sm:px-2">
          <CartSection />
        </section>
      </main>
    </>
  );
}
