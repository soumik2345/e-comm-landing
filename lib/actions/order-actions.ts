"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const placeCartOrderSchema = z.object({
  customerName: z.string().min(2).max(80),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(6).max(20),
  shippingAddress: z.string().min(10).max(300),
  note: z.string().max(300).optional().default(""),
  cartPayload: z.string().min(2),
});

const updateOrderSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  trackingCode: z.string().max(60).optional().default(""),
  note: z.string().max(300).optional().default(""),
});

function makeOrderNumber() {
  const now = new Date();
  const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${prefix}-${suffix}`;
}

export async function placeCartOrder(formData: FormData) {
  const parsed = placeCartOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid order input");
  }

  const cartParsed = z.array(cartItemSchema).safeParse(JSON.parse(parsed.data.cartPayload));
  if (!cartParsed.success || cartParsed.data.length === 0) {
    throw new Error("Cart is empty or invalid");
  }

  await dbConnect();

  const ids = cartParsed.data.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, isPublished: true }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const items = cartParsed.data.map((item) => {
    const p = productMap.get(item.productId);
    if (!p) throw new Error("Some cart products are unavailable");

    return {
      productId: p._id,
      productName: p.name,
      unitPrice: p.price,
      quantity: item.quantity,
      lineTotal: p.price * item.quantity,
    };
  });

  const totalPrice = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const firstItem = items[0];

  await Order.create({
    orderNumber: makeOrderNumber(),
    items,
    // Backward-compatible fields for existing model cache/legacy schema validation
    productId: firstItem.productId,
    productName: firstItem.productName,
    unitPrice: firstItem.unitPrice,
    quantity: firstItem.quantity,
    totalPrice,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail ?? "",
    customerPhone: parsed.data.customerPhone,
    shippingAddress: parsed.data.shippingAddress,
    note: parsed.data.note,
    status: "pending",
    trackingCode: "",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function updateOrder(formData: FormData) {
  const admin = await isAdminAuthenticated();
  if (!admin) throw new Error("Unauthorized");

  const parsed = updateOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid order update");
  }

  await dbConnect();
  await Order.findByIdAndUpdate(parsed.data.id, {
    status: parsed.data.status,
    trackingCode: parsed.data.trackingCode,
    note: parsed.data.note,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}
