// ✅ FILE: src/app/api/proxy-stores/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://coupon-app-backend.vercel.app"}/api/stores`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // check repo pull request
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch data from backend" }, { status: 500 });
  }
}

