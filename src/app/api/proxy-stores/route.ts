// ✅ FILE: src/app/api/proxy-stores/route.ts
import { NextResponse } from "next/server";
import config from '@/lib/config';

export async function GET() {
  try {
    const res = await fetch(`${config.api.baseUrl}/api/stores`, {
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

