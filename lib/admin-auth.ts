import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_session";

function getAdminKey() {
  const key = process.env.ADMIN_ACCESS_KEY;
  if (!key) {
    throw new Error("Missing ADMIN_ACCESS_KEY in environment variables.");
  }
  return key;
}

function signValue(value: string) {
  return crypto
    .createHmac("sha256", getAdminKey())
    .update(value)
    .digest("hex");
}

export async function isAdminAuthenticated() {
  try {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE)?.value;
    if (!token) return false;
    return token === signValue("admin-authenticated");
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, signValue("admin-authenticated"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function verifyAdminPassword(password: string) {
  return password === getAdminKey();
}
