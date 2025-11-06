import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, requireAdmin } from "../../../../lib/auth";

interface Params {
  params: { id: string };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  let adminId: string;
  try {
    const admin = await requireAdmin(request);
    adminId = admin.id;
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  if (params.id === adminId) {
    return NextResponse.json({ message: "Admins cannot delete themselves" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "User deleted" });
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const { name, role, password } = (await request.json()) as {
    name?: string | null;
    role?: "ADMIN" | "LEARNER";
    password?: string;
  };

  const data: Record<string, unknown> = {};
  if (typeof name !== "undefined") {
    data.name = name;
  }
  if (role) {
    data.role = role;
  }
  if (password) {
    data.passwordHash = await hashPassword(password);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  return NextResponse.json({ user });
}
