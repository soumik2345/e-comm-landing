import { NextResponse } from "next/server";
import { saveHeaderBanner } from "@/lib/actions/site-actions";

export async function POST(request: Request) {
  const formData = await request.formData();
  await saveHeaderBanner(formData);
  return NextResponse.redirect(new URL("/admin?success=banner_updated", request.url));
}
