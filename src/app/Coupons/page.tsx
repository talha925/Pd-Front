


"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { buildApiUrl, BACKEND_CONFIG } from '@/lib/config';

type Coupon = {
  _id: string;
  offerDetails: string;
  code: string;
};

type Store = {
  _id: string;
  name: string;
  trackingUrl: string;
  image: {
    url: string;
    alt: string;
  };
  coupons: Coupon[];
  heading: string;
  language: string;
};

const CouponsPage = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildApiUrl(BACKEND_CONFIG.ENDPOINTS.STORES))
      .then((res) => res.json())
      .then((data) => {
        setStores(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-20 text-xl font-semibold text-gray-600">
        Loading coupons...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <div
          key={store._id}
          className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-5"
        >
          {/* Dynamically show store image */}
          <Image
            src={store.image.url}
            alt={store.image.alt}
            width={100}
            height={100}
            className="rounded-full mx-auto"
          />

          <div className="flex flex-col gap-1 mt-3 text-center">
            <h2 className="text-xl font-bold text-gray-800">{store.name}</h2>
            <a
              href={store.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              Visit Store
            </a>
            <p className="text-sm text-gray-500">{store.heading}</p>
            <p className="text-xs text-gray-400">Language: {store.language}</p>
          </div>

          <h3 className="mt-4 font-semibold text-gray-700">Coupons:</h3>
          {store.coupons.length > 0 ? (
            <ul className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {store.coupons.map((coupon) => (
                <li
                  key={coupon._id}
                  className="bg-gray-100 p-3 rounded-lg text-sm text-gray-800 flex justify-between items-center"
                >
                  <span>{coupon.offerDetails}</span>
                  {coupon.code && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-mono text-xs">
                      {coupon.code}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No coupons available.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CouponsPage;
