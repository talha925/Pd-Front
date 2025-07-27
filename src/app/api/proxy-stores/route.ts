// ✅ FILE: src/app/api/proxy-stores/route.ts
import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_CONFIG } from '@/lib/config';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds
    let res;
    try {
      res = await fetch(buildApiUrl(BACKEND_CONFIG.ENDPOINTS.STORES), {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchError) {
      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json({ error: "Request timed out" }, { status: 504 });
      }
      return NextResponse.json({ error: "Failed to fetch data from backend" }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Backend returned status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

