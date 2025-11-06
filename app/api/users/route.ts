import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { hashPassword, requireAdmin } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const { email, password, name, role } = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
    role?: "ADMIN" | "LEARNER";
  };

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role ?? "LEARNER"
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  return NextResponse.json({ user }, { status: 201 });
}
