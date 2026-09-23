export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  weight: string; // e.g., "50g", "100g", "200g"
  price: number;
  mrp: number;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string; // e.g., 'banana-chips', 'farsaan', 'masalas', 'chutneys', 'potato-chips', 'combos' (slug)
  categoryId?: string; // Foreign key id referencing categories.id
  categoryName?: string; // Display name of category
  description: string;
  shortDescription: string;
  price: number;
  mrp: number;
  discount?: number;
  images: ProductImage[];
  ingredients?: string[];
  netQuantity: string;
  flavour?: string;
  tags?: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  isAvailable: boolean;
  stock: number;
  variants?: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount?: number;
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
}

export interface CustomerAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: CustomerAddress;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  variantInfo?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  shippingAddress: CustomerAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  couponCode?: string;
  referralPartnerCode?: string;
  referralPartnerName?: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod: string;
  codAdvanceFeePaid?: number;
  codRemainingBalance?: number;
  paymentDetails?: any;
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumOrder?: number;
  maximumDiscount?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  description?: string;
}

export interface ProductFilters {
  category?: string;
  flavour?: string;
  search?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'newest' | 'popular' | 'name-az';
}

export interface SiteSettings {
  announcementText: string;
  announcementEnabled: boolean;
  storeName: string;
  storeLegalNamePvt: string;
  storeLegalNameEnt: string;
  tagline?: string;
  appLogo?: string;
  logoType?: 'image' | 'badge' | 'custom';
  storeAddress: string;
  storeHours: string;
  contactPhone: string;
  contactEmail: string;
  supportHours: string;
  whatsappNumber: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  // Hero section customizable fields
  heroEyebrow?: string;
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroSubtitle?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaLink?: string;
  // Hero showcase card (Right side visual)
  heroCardImage?: string;
  heroCardBadge?: string;
  heroCardTitle?: string;
  heroCardSubtitle?: string;
  // Hero floating pill badge (Highlight bottom-left badge)
  heroPillTitle?: string;
  heroPillSubtitle?: string;
  heroPillEnabled?: boolean;
  // Dynamic admin configurations
  faviconUrl?: string;
  faviconSvgUrl?: string;
  faviconIcoUrl?: string;
  appleTouchIconUrl?: string;
  siteWebmanifestUrl?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  // Telegram Bot Alert Configurations
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegramAlerts?: boolean;
  shippingZones?: Array<{
    id: string;
    name: string;
    pincodes: string[]; // List of pincodes or pattern (like "425*")
    rate: number;
    freeDeliveryAbove?: number;
  }>;
}

export interface OwnerProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  location?: string;
  quote?: string;
  role?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  categoryLabel?: string;
  imgUrl: string;
  caption: string;
  date?: string;
  location?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
  category: string;
  speaker: string;
}

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  database: string;
  ssl?: boolean;
}

export interface Inquiry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type?: 'general' | 'franchise' | 'bulk' | 'feedback';
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  permissions: string[];
}

export interface PageSeoItem {
  id: string;
  pageKey: string;
  pageName: string;
  seoTitle: string;
  seoDescription: string;
  keywords?: string;
  ogImage?: string;
  updatedAt?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface AppLog {
  id: string;
  level: LogLevel;
  errorType: string;
  message: string;
  module?: string;
  functionName?: string;
  statusCode?: number;
  requestMethod?: string;
  requestPath?: string;
  requestIp?: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  createdAt: string;
}

export interface LogFilters {
  level?: LogLevel | 'all';
  module?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

