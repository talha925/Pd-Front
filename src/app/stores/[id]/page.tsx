'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { decodeHTML } from '@/lib/utils/formatting';
import toast, { Toaster } from 'react-hot-toast';

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

// Modal Component
const CouponModal = ({ 
  isOpen, 
  onClose, 
  code, 
  onContinue 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  code: string; 
  onContinue: () => void; 
}) => {
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="text-4xl">🎁</div>
            <h2 className="text-2xl font-bold text-gray-800">Your Coupon Code</h2>
            <p className="text-gray-600">Copy this code and use it at checkout!</p>
          </div>

          {/* Code Box */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-6">
            <div className="text-3xl font-mono font-bold text-gray-800 tracking-wider">
              {code}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCopy}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Code</span>
            </button>
            
            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Continue to Store</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Storelist = () => {
  const params = useParams();
  const id = params?.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Check for pending code on page load (return from redirect)
  useEffect(() => {
    const pendingCode = localStorage.getItem("pendingCode");
    const wasRedirected = localStorage.getItem("wasRedirected");

    if (pendingCode && wasRedirected === "true") {
      setSelectedCode(pendingCode);
      setShowModal(true);
    }
  }, []);

  // Listen for visibility change to detect when user returns to tab
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

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showModal]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch(`/api/store/${id}`);
        if (!res.ok) throw new Error('Store not found');
        const data = await res.json();
        setStore(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [id]);

  const handleGetDeal = (coupon: Coupon) => {
    if (coupon.code) {
      // Save coupon code and set redirect flag
      localStorage.setItem("pendingCode", coupon.code);
      localStorage.setItem("wasRedirected", "true");
      
      // Redirect to store immediately
      if (store?.trackingUrl) {
        const decodedUrl = decodeHTML(store.trackingUrl);
        window.open(decodedUrl, '_blank');
      } else {
        toast.error('Tracking URL not available for this store.');
        // Clear localStorage if no redirect
        localStorage.removeItem("pendingCode");
        localStorage.removeItem("wasRedirected");
      }
    } else {
      // No code, directly redirect
      if (store?.trackingUrl) {
        const decodedUrl = decodeHTML(store.trackingUrl);
        window.open(decodedUrl, '_blank');
      } else {
        toast.error('Tracking URL not available for this store.');
      }
    }
  };

  const handleContinueToStore = () => {
    if (store?.trackingUrl) {
      const decodedUrl = decodeHTML(store.trackingUrl);
      window.open(decodedUrl, '_blank');
    } else {
      toast.error('Tracking URL not available for this store.');
    }
    // Clear localStorage
    localStorage.removeItem("pendingCode");
    localStorage.removeItem("wasRedirected");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCode(null);
    // Clear localStorage
    localStorage.removeItem("pendingCode");
    localStorage.removeItem("wasRedirected");
  };

  if (loading)
    return (
      <p className="text-center py-20 text-gray-600 font-medium text-lg">
        Loading store details...
      </p>
    );
  if (!store)
    return (
      <p className="text-center py-20 text-red-600 font-semibold text-xl">
        Store not found
      </p>
    );

  const aboutText =
    store.about ||
    store.long_description ||
    store.short_description ||
    'Discover amazing offers and coupons from our store. Save more every time you shop with us!';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 bg-gray-50 min-h-screen">
      {/* Toast Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showModal}
        onClose={handleCloseModal}
        code={selectedCode || ''}
        onContinue={handleContinueToStore}
      />

      {/* Store Name */}
      <div className="flex justify-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800">
          {store.name}
        </h1>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Coupons Section */}
        <main className="w-full lg:flex-1 space-y-6">
          {store.coupons.length === 0 ? (
            <p className="text-gray-500 text-center py-10 text-lg">
              No coupons available at the moment.
            </p>
          ) : (
            store.coupons.map((coupon) => (
              <div
                key={coupon._id}
                className="bg-gray-200 rounded-xl shadow-lg p-6 md:p-10 flex flex-row gap-6 items-center"
              >
                {/* Logo Image */}
                <div className="bg-white rounded-lg w-[100px] h-[100px] md:w-[120px] md:h-[120px] flex items-center justify-center shadow-sm">
                  <Image
                    src={store.image.url}
                    alt={store.image.alt}
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                </div>

                {/* Coupon Info */}
                <div className="flex-1 space-y-3 text-center md:text-left w-full">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">
                    {coupon.offerDetails}
                  </h3>

                  {/* Button + Code */}
                  <div className="relative w-full h-12 mt-2">
                    <button
                      onClick={() => handleGetDeal(coupon)}
                      className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-black to-blue-800 text-white font-bold uppercase tracking-wide rounded-md transition-all duration-200 active:scale-95 hover:opacity-90 flex items-center justify-center text-sm"
                    >
                      {coupon.code ? 'GET CODE' : 'GET DEAL'}
                    </button>

                    {coupon.code && (
                      <div className="absolute right-0 top-0 h-full w-[70px] bg-white border-dashed border-2 border-gray-400 rounded-tr-md rounded-br-md flex items-center justify-center text-xs font-bold text-black shadow-sm font-mono">
                        •••{coupon.code.slice(-3)}
                    </div>
                    )}
                  </div>
                  
                  {/* Expiry & Usage */}
                  <div className="text-xs text-gray-600 pt-2 space-y-1">
                    {coupon.expires && <p>EXPIRES: {coupon.expires}</p>}
                    {coupon.usedCount !== undefined && <p>USED: {coupon.usedCount}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>

        {/* Sidebar: About Section */}
        <aside className="w-full lg:w-80 bg-white shadow-xl rounded-xl p-4 flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">About</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-6">{aboutText}</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-md text-sm font-medium">
            view
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Storelist;
