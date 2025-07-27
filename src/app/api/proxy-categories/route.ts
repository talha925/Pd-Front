import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_CONFIG } from '@/lib/config';

export async function GET() {
  try {
    const res = await fetch(buildApiUrl(BACKEND_CONFIG.ENDPOINTS.CATEGORIES));
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch data from backend" }, { status: 500 });
  }
}
