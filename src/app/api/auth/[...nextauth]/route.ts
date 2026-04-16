import { NextResponse } from "next/server";

const message =
  "Autentikasi NextAuth sudah dimigrasikan ke Express. Gunakan backend Express /api/auth/login.";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 410 }
  );
}
