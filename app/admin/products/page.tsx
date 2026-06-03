import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, deleteProduct, updateProduct } from "@/lib/actions/product-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dbConnect } from "@/lib/db";
import Product, { type ProductDoc } from "@/models/Product";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ success?: string; error?: string }> };

async function getAllProducts() {
  await dbConnect();
  return Product.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean<ProductDoc[]>();
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");
  const params = await searchParams;

  const products = await getAllProducts();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8 px-0 sm:px-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Product Management</h1>
            <p className="text-sm text-zinc-600">Create, update, publish, and remove products.</p>
          </div>
          <Link href="/admin"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          {params.success && (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {params.success}
            </p>
          )}
          {params.error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠️ {params.error}
            </p>
          )}
          <h2 className="mb-4 text-xl font-bold">Add Product</h2>
          <form action={createProduct} className="grid gap-4 md:grid-cols-2">
            <div><Label htmlFor="name">Name *</Label><Input id="name" name="name" required minLength={2} maxLength={120} /></div>
            <div><Label htmlFor="price">Price *</Label><Input id="price" name="price" type="number" step="0.01" min="0" required /></div>
            <div className="md:col-span-2"><Label htmlFor="description">Description *</Label><Input id="description" name="description" required minLength={8} maxLength={300} /></div>
            <div className="md:col-span-2"><Label htmlFor="image">Image URL * (must start with http:// or https://)</Label><Input id="image" name="image" type="text" required placeholder="https://example.com/image.jpg" /></div>
            <div><Label htmlFor="badge">Badge</Label><Input id="badge" name="badge" defaultValue="New" maxLength={24} /></div>
            <div><Label htmlFor="cta">CTA Text</Label><Input id="cta" name="cta" defaultValue="Buy now" maxLength={30} /></div>
            <div><Label htmlFor="sortOrder">Sort Order</Label><Input id="sortOrder" name="sortOrder" type="number" min="0" max="50" defaultValue={1} /></div>
            <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" name="isPublished" defaultChecked /> Published</label>
            <div className="md:col-span-2"><Button className="w-full" type="submit">Create Product</Button></div>
          </form>
        </section>

        <section className="space-y-4">
          {products.map((item) => (
            <article key={item._id.toString()} className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <p className="text-sm text-zinc-500">Current price: ৳{item.price} · Sort: {item.sortOrder}</p>
                </div>
                <Badge className={item.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"}>
                  {item.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <form action={updateProduct} className="grid gap-3 rounded-2xl bg-zinc-50 p-4 md:grid-cols-2">
                <input type="hidden" name="id" value={item._id.toString()} />
                <div><Label htmlFor={`name-${item._id}`}>Name</Label><Input id={`name-${item._id}`} name="name" defaultValue={item.name} required /></div>
                <div><Label htmlFor={`price-${item._id}`}>Price</Label><Input id={`price-${item._id}`} name="price" type="number" step="0.01" defaultValue={item.price} required /></div>
                <div className="md:col-span-2"><Label htmlFor={`description-${item._id}`}>Description</Label><Input id={`description-${item._id}`} name="description" defaultValue={item.description} required /></div>
                <div className="md:col-span-2"><Label htmlFor={`image-${item._id}`}>Image URL</Label><Input id={`image-${item._id}`} name="image" type="text" defaultValue={item.image} required /></div>
                <div><Label htmlFor={`badge-${item._id}`}>Badge</Label><Input id={`badge-${item._id}`} name="badge" defaultValue={item.badge} /></div>
                <div><Label htmlFor={`cta-${item._id}`}>CTA Text</Label><Input id={`cta-${item._id}`} name="cta" defaultValue={item.cta} /></div>
                <div><Label htmlFor={`sort-${item._id}`}>Sort Order</Label><Input id={`sort-${item._id}`} name="sortOrder" type="number" defaultValue={item.sortOrder} /></div>
                <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" name="isPublished" defaultChecked={item.isPublished} /> Published</label>
                <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
                  <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">Save Product Update</Button>
                </div>
              </form>

              <form action={deleteProduct} className="mt-3">
                <input type="hidden" name="id" value={item._id.toString()} />
                <Button size="sm" variant="destructive" type="submit">Delete Product</Button>
              </form>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
