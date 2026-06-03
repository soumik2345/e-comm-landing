import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrder } from "@/lib/actions/order-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dbConnect } from "@/lib/db";
import Order, { type OrderDoc } from "@/models/Order";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ q?: string }> };

async function getOrders(query: string) {
  await dbConnect();
  const filter = query
    ? {
        $or: [
          { orderNumber: { $regex: query, $options: "i" } },
          { trackingCode: { $regex: query, $options: "i" } },
          { customerEmail: { $regex: query, $options: "i" } },
          { customerName: { $regex: query, $options: "i" } },
        ],
      }
    : {};

  return Order.find(filter).sort({ createdAt: -1 }).lean<OrderDoc[]>();
}

function statusColor(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "shipped") return "bg-blue-100 text-blue-700";
  if (status === "processing") return "bg-amber-100 text-amber-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-zinc-100 text-zinc-700";
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin");

  const params = await searchParams;
  const query = params.q?.trim() || "";
  const orders = await getOrders(query);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6 px-0 sm:px-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Order Management</h1>
            <p className="text-sm text-zinc-600">Track, update, and manage all customer orders.</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <form action="/admin/orders" className="flex flex-col gap-2 md:flex-row">
            <Input name="q" placeholder="Search by order number, tracking, name, or email" defaultValue={query} />
            <Button type="submit" variant="outline">Search</Button>
          </form>
        </section>

        <section className="space-y-4">
          {orders.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center text-zinc-500">No orders found.</div>
          )}

          {orders.map((order) => {
            return (
              <article key={order._id.toString()} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-500">Order Number</p>
                    <p className="text-lg font-bold">{order.orderNumber}</p>
                  </div>
                  <Badge className={statusColor(order.status)}>{order.status}</Badge>
                </div>

                <div className="grid gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="mb-2 text-zinc-500">Items</p>
                    <div className="space-y-1">
                      {order.items?.length ? (
                        order.items.map((i, idx) => (
                          <div key={`${order._id.toString()}-${idx}`} className="flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1">
                            <span className="truncate pr-2 text-zinc-800">{i.productName}</span>
                            <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold">x{i.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1">
                          <span className="truncate pr-2 text-zinc-800">{order.productName || "Legacy item"}</span>
                          <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold">x{order.quantity || 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-500">Customer</p>
                    <p>{order.customerName}</p>
                    <p>{order.customerEmail}</p>
                    <p>{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Total</p>
                    <p className="text-lg font-bold">৳{order.totalPrice}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Tracking</p>
                    <p className="font-medium">{order.trackingCode || "Not assigned"}</p>
                  </div>
                </div>

                <form action={updateOrder} className="mt-5 grid gap-3 rounded-xl border bg-zinc-50 p-4 md:grid-cols-4">
                  <input type="hidden" name="id" value={order._id.toString()} />
                  <div>
                    <Label htmlFor={`status-${order._id}`}>Status</Label>
                    <select
                      id={`status-${order._id}`}
                      name="status"
                      defaultValue={order.status}
                      className="h-9 w-full rounded-md border bg-white px-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`tracking-${order._id}`}>Tracking Code</Label>
                    <Input id={`tracking-${order._id}`} name="trackingCode" defaultValue={order.trackingCode ?? ""} placeholder="e.g. TRK2390" />
                  </div>
                  <div>
                    <Label htmlFor={`note-${order._id}`}>Internal Note</Label>
                    <Input id={`note-${order._id}`} name="note" defaultValue={order.note ?? ""} placeholder="Note for admin" />
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" className="w-full" type="submit">Save Update</Button>
                  </div>
                </form>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
