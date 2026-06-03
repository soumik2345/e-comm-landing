"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(8).max(300),
  price: z.coerce.number().positive(),
  image: z
    .string()
    .trim()
    .regex(/^https?:\/\/.+/i, "Image URL must start with http:// or https://"),
  badge: z.string().trim().max(24).optional().default("New"),
  cta: z.string().trim().max(30).optional().default("Buy now"),
  sortOrder: z.coerce.number().int().min(0).max(50).default(0),
  isPublished: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((value) => value === "on" || value === "true"),
});

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/cart");
}

export async function createProduct(formData: FormData) {

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/products?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid input")}`);
  }

  await dbConnect();
  await Product.create(parsed.data);
  revalidateAll();
  redirect("/admin/products?success=Product created");
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse(Object.fromEntries(formData));

  if (!id) redirect("/admin/products?error=Missing product id");
  if (!parsed.success) {
    redirect(`/admin/products?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid input")}`);
  }

  await dbConnect();
  await Product.findByIdAndUpdate(id, parsed.data, { new: true });
  revalidateAll();
  redirect("/admin/products?success=Product updated");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/products?error=Missing product id");

  await dbConnect();
  await Product.findByIdAndDelete(id);
  revalidateAll();
  redirect("/admin/products?success=Product deleted");
}

export async function seedProducts() {
  await dbConnect();
  const count = await Product.countDocuments();
  if (count > 0) return;

  await Product.insertMany([
    {
      name: "Nova Earbuds Pro",
      description: "Premium wireless earbuds with adaptive noise canceling and 36-hour battery.",
      price: 129,
      image:
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80",
      badge: "Best Seller",
      cta: "Get Earbuds",
      sortOrder: 1,
      isPublished: true,
    },
    {
      name: "Orbit Smartwatch X",
      description: "Fitness-first smartwatch with AMOLED display, GPS, and sleep intelligence.",
      price: 179,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
      badge: "Hot",
      cta: "Shop Watch",
      sortOrder: 2,
      isPublished: true,
    },
    {
      name: "Flux Portable Speaker",
      description: "Compact waterproof speaker built for outdoor sound with deep bass response.",
      price: 89,
      image:
        "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1200&q=80",
      badge: "New",
      cta: "Buy Speaker",
      sortOrder: 3,
      isPublished: true,
    },
  ]);

  revalidateAll();
}
