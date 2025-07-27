export interface Store {
  _id: string;
  name: string;
  trackingUrl?: string;
  image?: {
    url: string;
    alt: string;
  };
  heading?: string;
  language?: string;
  isTopStore?: boolean;
  isEditorsChoice?: boolean;
  coupons?: Coupon[];
}

export interface Coupon {
  _id: string;
  offerDetails: string;
  code: string;
  active: boolean;
  isValid: boolean;
}

export interface StoreFormData {
  name: string;
  trackingUrl: string;
  imageUrl: string;
  imageAlt: string;
  heading: string;
  language: string;
  isTopStore: boolean;
  isEditorsChoice: boolean;
} 