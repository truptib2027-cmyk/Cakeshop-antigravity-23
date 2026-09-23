import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { dataStore, User } from "@/db/dataStore";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cakecart_super_secret_jwt_encryption_key_2026_dev"
);

const COOKIE_NAME = "cakecart_session";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // Support quick demo logins or bcrypt hashes
  if (hash === password) return true;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function signSessionToken(payload: {
  userId: string;
  email: string;
  role: "customer" | "baker";
  fullName: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{
  userId: string;
  email: string;
  role: "customer" | "baker";
  fullName: string;
} | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as any;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<User | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.userId) return null;

  const user = dataStore.getUserById(payload.userId);
  return user || null;
}

export { COOKIE_NAME };
