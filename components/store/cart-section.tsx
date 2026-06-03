import { CartPageClient } from "@/components/store/cart-page-client";
import { dbConnect } from "@/lib/db";
import Product, { type ProductDoc } from "@/models/Product";

export default async function CartSection() {
  await dbConnect();
  const items = await Product.find({ isPublished: true }).lean<ProductDoc[]>();

  const products = items.map((p) => ({
    _id: String(p._id),
    name: p.name,
    price: p.price,
  }));

  return <CartPageClient products={products} />;
}
