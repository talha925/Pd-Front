// ✅ FILE: src/app/api/proxy-stores/route.ts
import { NextResponse } from "next/server";
import config from '@/lib/config';

export async function GET() {
  try {
    // ISR: Enable caching with revalidation for stores proxy API
    const res = await fetch(`${config.api.baseUrl}/api/stores`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['stores'] // Enable tag-based revalidation
      }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch data from backend" }, { status: 500 });
  }
}

