import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { generateToken, verifyPassword } from "../../../../lib/auth";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  let token: string | null = null;
  try {
    token = generateToken({ sub: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("Failed to generate JWT", error);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  });
}
