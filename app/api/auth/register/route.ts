import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { generateToken, hashPassword } from "../../../../lib/auth";

export async function POST(request: Request) {
  const { email, password, name } = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const existingAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
  const role = existingAdmins === 0 ? "ADMIN" : "LEARNER";

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });

  let token: string | null = null;
  try {
    token = generateToken({ sub: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("Failed to generate JWT", error);
  }

  return NextResponse.json({ user, token });
}
