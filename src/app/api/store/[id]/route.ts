

import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_CONFIG } from '@/lib/config';

// Optional: move this to a types.ts file
type Store = {
  _id: string;
  name: string;
  image: { url: string; alt: string };
  about?: string;
  coupons: {
    _id: string;
    offerDetails: string;
    code: string;
    active: boolean;
    isValid: boolean;
  }[];
};

// export async function GET(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const res = await fetch("https://coupon-app-backend.vercel.app/api/stores");
//     if (!res.ok) throw new Error("Failed to fetch stores");

//     const json = await res.json();
//     const store = (json.data as Store[]).find((s) => s._id === params.id);

//     if (!store) {
//       return NextResponse.json({ message: "Store not found" }, { status: 404 });
//     }

//     return NextResponse.json(store);
//   } catch (error) {
//     console.error("Error fetching store:", error);
//     return NextResponse.json({ message: "Error fetching store" }, { status: 500 });
//   }
// }








// import { NextResponse } from "next/server";


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    // const res = await fetch("https://coupon-app-backend.vercel.app/api/stores");
    const res = await fetch(buildApiUrl(BACKEND_CONFIG.ENDPOINTS.STORES), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const stores = data.data || data || [];
    const store = stores.find((s: any) => s.id === id);

    if (!store) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}