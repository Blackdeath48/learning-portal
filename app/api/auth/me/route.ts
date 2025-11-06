import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }
}
