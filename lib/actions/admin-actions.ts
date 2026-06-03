"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession, verifyAdminPassword } from "@/lib/admin-auth";

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const ok = await verifyAdminPassword(password);

  if (!ok) {
    redirect("/admin?error=invalid_credentials");
  }

  await createAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}
