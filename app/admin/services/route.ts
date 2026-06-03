import { NextResponse } from "next/server";
import { saveServiceCards } from "@/lib/actions/site-actions";

export async function POST(request: Request) {
  const formData = await request.formData();
  await saveServiceCards(formData);
  return NextResponse.redirect(new URL("/admin?success=services_updated", request.url));
}
