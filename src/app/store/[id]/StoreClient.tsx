// app/store/[id]/StoreClient.tsx

'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { decodeHTML } from '@/lib/utils/formatting';
import toast, { Toaster } from 'react-hot-toast';

// --- Types (No changes) ---
type Coupon = {
  _id: string;
  offerDetails: string;
  code: string;
  active: boolean;
  isValid: boolean;
  expires?: string;
  usedCount?: number;
};

type Store = {
  _id: string;
  image: {
    url: string;
    alt: string;
  };
  name: string;
  about?: string;
  short_description?: string;
  long_description?: string;
  trackingUrl?: string;
  coupons: Coupon[];
};

interface StoreClientProps {
  initialStore: Store | null;
  serverError?: string;
}

// --- CouponModal Component (No changes) ---
const CouponModal = ({ isOpen, onClose, code, onContinue }: { isOpen: boolean; onClose: () => void; code: string; onContinue: () => void; }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied to clipboard!`);
  };

  const handleContinue = () => {
    onContinue();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-4xl">🎁</div>
            <h2 className="text-2xl font-bold text-gray-800">Your Coupon Code</h2>
            <p className="text-gray-600">Copy this code and use it at checkout!</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-6">
            <div className="text-3xl font-mono font-bold text-gray-800 tracking-wider">{code}</div>
          </div>
          <div className="space-y-3">
            <button onClick={handleCopy} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>Copy Code</span>
            </button>
            <button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              <span>Continue to Store</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Client Component ---
export default function StoreClient({ initialStore, serverError }: StoreClientProps) {
  const [store, setStore] = useState<Store | null>(initialStore);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // All useEffects and handlers remain the same as your old code
  useEffect(() => {
    const pendingCode = localStorage.getItem("pendingCode");
    const wasRedirected = localStorage.getItem("wasRedirected");
    if (pendingCode && wasRedirected === "true") {
      setSelectedCode(pendingCode);
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const pendingCode = localStorage.getItem("pendingCode");
        const wasRedirected = localStorage.getItem("wasRedirected");
        if (pendingCode && wasRedirected === "true" && !showModal) {
          setSelectedCode(pendingCode);
          setShowModal(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showModal]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);

  const handleGetDeal = (coupon: Coupon) => {
    if (coupon.code) {
      localStorage.setItem("pendingCode", coupon.code);
      localStorage.setItem("wasRedirected", "true");
      if (store?.trackingUrl) {
        window.open(decodeHTML(store.trackingUrl), '_blank');
      } else {
        toast.error('Tracking URL not available.');
        localStorage.removeItem("pendingCode");
        localStorage.removeItem("wasRedirected");
      }
    } else {
      if (store?.trackingUrl) {
        window.open(decodeHTML(store.trackingUrl), '_blank');
      } else {
        toast.error('Tracking URL not available.');
      }
    }
  };

  const handleContinueToStore = () => {
    if (store?.trackingUrl) {
      window.open(decodeHTML(store.trackingUrl), '_blank');
    } else {
      toast.error('Tracking URL not available.');
    }
    localStorage.removeItem("pendingCode");
    localStorage.removeItem("wasRedirected");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCode(null);
    localStorage.removeItem("pendingCode");
    localStorage.removeItem("wasRedirected");
  };

  // --- Render Logic ---
  if (serverError) return <p className="text-center py-20 text-red-600 font-semibold text-xl">Error: {serverError}</p>;
  if (!store) return <p className="text-center py-20 text-red-600 font-semibold text-xl">Store not found</p>;

  const aboutText = store.about || store.long_description || store.short_description || 'Discover amazing offers from this store!';

  // UPDATED: UI is now exactly like your old code
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <CouponModal isOpen={showModal} onClose={handleCloseModal} code={selectedCode || ''} onContinue={handleContinueToStore} />

      <div className="flex justify-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800">{store.name}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Coupons Section */}
        <main className="w-full lg:flex-1 space-y-6">
          {store.coupons.length === 0 ? (
            <p className="text-gray-500 text-center py-10 text-lg">No coupons available at the moment.</p>
          ) : (
            store.coupons.filter(c => c.active && c.isValid).map((coupon) => (
              <div key={coupon._id} className="bg-gray-200 rounded-xl shadow-lg p-6 md:p-10 flex flex-col md:flex-row gap-6 items-center">
                
                {/* Logo Image (Repeated for each coupon like old UI) */}
                <div className="bg-white rounded-lg w-[100px] h-[100px] flex-shrink-0 flex items-center justify-center shadow-sm">
                  <Image src={store.image.url} alt={store.image.alt} width={100} height={100} className="object-contain p-2" />
                </div>

                {/* Coupon Info */}
                <div className="flex-1 space-y-3 text-center md:text-left w-full">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">{decodeHTML(coupon.offerDetails)}</h3>
                  
                  {/* Button + Code (Old UI Style) */}
                  <div className="relative w-full h-12 mt-2">
                    <button onClick={() => handleGetDeal(coupon)} className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-black to-blue-800 text-white font-bold uppercase tracking-wide rounded-md transition-all duration-200 active:scale-95 hover:opacity-90 flex items-center justify-center text-sm">
                      {coupon.code ? 'GET CODE' : 'GET DEAL'}
                    </button>
                    {coupon.code && (
                      <div className="absolute right-0 top-0 h-full w-[80px] bg-white border-dashed border-2 border-gray-400 rounded-tr-md rounded-br-md flex items-center justify-center text-xs font-bold text-black shadow-sm font-mono">
                        •••{coupon.code.slice(-3)}
                      </div>
                    )}
                  </div>
                  
                  {/* Expiry & Usage */}
                  <div className="text-xs text-gray-600 pt-2 space-y-1">
                    {coupon.expires && <p>EXPIRES: {new Date(coupon.expires).toLocaleDateString()}</p>}
                    {coupon.usedCount !== undefined && <p>USED: {coupon.usedCount}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>

        {/* Sidebar: About Section */}
        <aside className="w-full lg:w-80 bg-white shadow-xl rounded-xl p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">About {store.name}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-6">{decodeHTML(aboutText)}</p>
          <button 
            onClick={() => window.open(decodeHTML(store.trackingUrl || ''), '_blank')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Visit Store
          </button>
        </aside>
      </div>
    </div>
  );
}