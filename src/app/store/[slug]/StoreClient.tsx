// app/store/[slug]/StoreClient.tsx

'use client';

import SafeImage from '@/components/ui/SafeImage';
import { useEffect, useState } from 'react';
import { decodeHTML } from '@/lib/utils/formatting';
import toast, { Toaster } from 'react-hot-toast';
import { Store } from '@/lib/types/store';

// --- Types (Updated to use global Store type) ---
type Coupon = {
  _id: string;
  offerDetails: string;
  code: string;
  active: boolean;
  isValid: boolean;
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


  // Helper function to refresh store data with no-cache
  const refreshStoreData = async () => {
    if (!store?.slug && !initialStore?.slug) return;
    
    const slug = store?.slug || initialStore?.slug;
    
    try {
      console.log(`[CLIENT REFRESH] Refreshing store data for slug: ${slug}`);
      // Force fresh data from server by bypassing StoreService caches
      const response = await fetch(`/api/store/${slug}?noCache=true`, {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const freshStore = await response.json();
        setStore(freshStore);
        console.log(`[CLIENT REFRESH] Successfully refreshed store data`);
      }
    } catch (error) {
      console.error('Failed to refresh store data:', error);
    }
  };

  // Mount effect: Only refresh if no initial data (error case)
  useEffect(() => {
    // ✅ CRITICAL FIX: Only refresh if initialStore is null (error case)
    // This prevents duplicate fetches during normal hydration
    if (!initialStore) {
      console.log('[CLIENT MOUNT] No initial store data, refreshing...');
      refreshStoreData();
    } else {
      console.log('[CLIENT MOUNT] Using initial store data, skipping refresh');
    }
  }, []);

  // Focus/Visibility effect: Refresh when tab becomes active (reduced frequency)
  useEffect(() => {
    let lastRefresh = 0;
    const FOCUS_REFRESH_COOLDOWN = 30000; // 30 seconds cooldown
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefresh > FOCUS_REFRESH_COOLDOWN) {
          console.log('[CLIENT FOCUS] Tab became visible, refreshing store data');
          refreshStoreData();
          lastRefresh = now;
        }
      }
    };
    
    const handleWindowFocus = () => {
      const now = Date.now();
      if (now - lastRefresh > FOCUS_REFRESH_COOLDOWN) {
        console.log('[CLIENT FOCUS] Window focused, refreshing store data');
        refreshStoreData();
        lastRefresh = now;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Auto-refresh interval: Refresh every 5 minutes (reduced from 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[CLIENT INTERVAL] Auto-refreshing store data (5min interval)');
      refreshStoreData();
    }, 5 * 60 * 1000); // 5 minutes instead of 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Check for pending coupon code on component mount and page show
  const checkPendingCode = () => {
    console.log('[checkPendingCode] Function called');
    const pendingCode = localStorage.getItem("pendingCode");
    const wasRedirected = localStorage.getItem("wasRedirected");
    console.log(`[checkPendingCode] Found in localStorage: pendingCode=${pendingCode}, wasRedirected=${wasRedirected}`);

    if (pendingCode && wasRedirected === "true") {
      console.log('[checkPendingCode] Conditions met. Removing localStorage items and showing modal.');
      // CRITICAL CHANGE: Remove items immediately to prevent re-triggering.
      localStorage.removeItem("pendingCode");
      localStorage.removeItem("wasRedirected");
      
      setSelectedCode(pendingCode);
      setShowModal(true);
    } else {
      console.log('[checkPendingCode] Conditions not met. Modal will not be shown.');
    }
  };

  useEffect(() => {
    // Check on initial mount
    console.log('[MOUNT] Component mounted, checking for pending code');
    checkPendingCode();
    
    // Add multiple event listeners to handle different navigation scenarios
    const handlePageShow = (event: any) => {
      console.log(`[PAGESHOW] Event fired - persisted: ${event.persisted}, type: ${event.type}`);
      console.log('[PAGESHOW] Checking for pending code after pageshow');
      checkPendingCode();
    };
    
    const handleWindowFocus = () => {
      console.log('[FOCUS] Window focused, checking for pending code');
      checkPendingCode();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[VISIBILITY] Document became visible, checking for pending code');
        checkPendingCode();
      }
    };
    
    // Add all event listeners
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also add a slight delay check for back navigation
    const delayedCheck = setTimeout(() => {
      console.log('[DELAYED] Running delayed check for pending code');
      checkPendingCode();
    }, 100);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(delayedCheck);
    };
  }, []);

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

  const aboutText = store.long_description || store.short_description || 'Discover amazing offers from this store!';

  // UPDATED: UI is now exactly like your old code
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <CouponModal isOpen={showModal} onClose={handleCloseModal} code={selectedCode || ''} onContinue={handleContinueToStore} />

      <div className="flex justify-center items-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800">{store.name}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Coupons Section */}
        <main className="w-full lg:flex-1 space-y-6">
          {!store.coupons || store.coupons.length === 0 ? (
            <p className="text-gray-500 text-center py-10 text-lg">No coupons available at the moment.</p>
          ) : (
            store.coupons.filter(c => c.isValid).map((coupon) => (
              <div key={coupon._id} className="bg-gray-200 rounded-xl shadow-lg p-6 md:p-10 flex flex-col md:flex-row gap-6 items-center">
                
                {/* Logo Image (Repeated for each coupon like old UI) */}
                <div className="bg-white rounded-lg w-[100px] h-[100px] flex-shrink-0 flex items-center justify-center shadow-sm">
                  <SafeImage 
                    src={store.image?.url || '/placeholder-store.png'} 
                    alt={store.image?.alt || store.name} 
                    width={100} 
                    height={100} 
                    className="object-contain p-2"
                    fallbackSrc="/placeholder-store.png"
                  />
                </div>

                {/* Coupon Info */}
                <div className="flex-1 space-y-3 text-center md:text-left w-full">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">{decodeHTML(coupon.offerDetails)}</h3>
                  
                  {/* Button + Code (Old UI Style) */}
                  <div className="relative w-full h-12 mt-2">
                    <button onClick={() => handleGetDeal(coupon)} className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-black to-blue-800 text-white font-bold uppercase tracking-wide rounded-md transition-all duration-200 active:scale-95 hover:opacity-90 flex items-center justify-center text-sm">
                      {coupon.active ? 'GET DEAL' : 'GET CODE'}
                    </button>
                    {coupon.code && !coupon.active && (
                      <div className="absolute right-0 top-0 h-full w-[80px] bg-white border-dashed border-2 border-gray-400 rounded-tr-md rounded-br-md flex items-center justify-center text-xs font-bold text-black shadow-sm font-mono">
                        •••{coupon.code.slice(-3)}
                      </div>
                    )}
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