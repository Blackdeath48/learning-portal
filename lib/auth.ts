import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Authentication endpoints will fail until it is configured.");
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: AuthTokenPayload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export async function requireAuth(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    throw new Error("Missing Authorization header");
  }

  const token = authorization.replace("Bearer ", "");
  const payload = verifyToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request);
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return user;
}
