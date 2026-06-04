import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ServiceCardEditor from "@/components/admin/service-card-editor";
import { adminLogin, adminLogout } from "@/lib/actions/admin-actions";
import { getHeaderBanner, getServiceCards } from "@/lib/actions/site-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const isAuthed = await isAdminAuthenticated();

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-600">Login to manage products and orders.</p>
          {params.error === "invalid_credentials" && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">Invalid admin password</p>}
          <form action={adminLogin} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" type="submit">Login</Button>
          </form>
        </div>
      </main>
    );
  }

  await dbConnect();
  const [productsCount, ordersCount, pendingCount, headerBanner, serviceCards] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
    getHeaderBanner(),
    getServiceCards(),
  ]);

  const serviceCardsWithDefaults = serviceCards.length > 0 ? serviceCards : [{ icon: "", title: "", description: "" }];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6 px-0 sm:px-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-black">Admin Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/"><Button variant="outline">Store</Button></Link>
            <form action={adminLogout}><Button variant="secondary" type="submit">Logout</Button></form>
          </div>
        </div>

        {params.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {params.error}
          </div>
        )}
        {params.success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {params.success === "services_updated" ? "Service cards updated successfully." : params.success === "banner_updated" ? "Banner updated successfully." : "Saved successfully."}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4"><p className="text-sm text-zinc-500">Products</p><p className="text-3xl font-bold">{productsCount}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-sm text-zinc-500">Orders</p><p className="text-3xl font-bold">{ordersCount}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-sm text-zinc-500">Need Action</p><p className="text-3xl font-bold">{pendingCount}</p></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/products" className="rounded-xl border bg-white p-6 hover:bg-zinc-50">
            <h2 className="text-xl font-bold">Product Management</h2>
            <p className="text-zinc-600">Add products, publish/unpublish, and remove products.</p>
          </Link>
          <Link href="/admin/orders" className="rounded-xl border bg-white p-6 hover:bg-zinc-50">
            <h2 className="text-xl font-bold">Order Management</h2>
            <p className="text-zinc-600">Search orders, update status, and set tracking code.</p>
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Header Banner</h2>
            <p className="text-zinc-600">Update the image shown at the top of the store.</p>
          </div>
          <form action="/admin/banner" method="post" className="space-y-4">
            <div>
              <Label htmlFor="image">Banner Image URL</Label>
              <Input
                id="image"
                name="image"
                type="url"
                defaultValue={headerBanner.image}
                placeholder="Enter a full image URL, or leave blank for no background image."
              />
            </div>
            <Button type="submit">Save Banner</Button>
          </form>
        </div>

        {/* <div className="rounded-xl border bg-white p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Service Cards</h2>
            <p className="text-zinc-600">Manage the icon, title and description shown in the service grid.</p>
          </div>
          <form action="/admin/services" method="post" className="space-y-6">
            <ServiceCardEditor initialCards={serviceCardsWithDefaults} />
            <Button type="submit">Save Service Cards</Button>
          </form>
        </div> */}
      </section>
    </main>
  );
}
