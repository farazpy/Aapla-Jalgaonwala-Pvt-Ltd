export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline?: string;
  image?: string;
  productCount?: number;
  product_count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id?: string;
  weight: string; // e.g. "100g", "250g", "500g", "1kg"
  price: number;
  mrp: number;
  stock?: number;
}

export interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  customerName: string;
  customerEmail?: string;
  userId?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerified?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  adminRepliedAt?: string;
  likes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  unitPrice: number;
  totalPrice: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category?: string;
  imageUrl: string;
  caption?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
  duration?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string; // slug
  categoryId?: string;
  categoryName?: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  mrp: number;
  profit?: number;
  discount?: number;
  netQuantity?: string;
  flavour?: string;
  tags?: string[];
  images?: ProductImage[];
  image?: string; // primary image fallback
  imageUrl?: string;
  variants?: ProductVariant[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
  stock: number;
  rating?: number;
  reviewsCount?: number;
  reviews?: ProductReview[];
  ingredients?: string[];
  shelfLife?: string;
  storageInstructions?: string;
  nutritionFacts?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  comboImages?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  createdAt?: string;
}

export type PermissionKey =
  | 'dashboard'
  | 'products'
  | 'add_product'
  | 'categories'
  | 'shravan'
  | 'orders'
  | 'customers'
  | 'partners'
  | 'settlements'
  | 'reviews'
  | 'coupons'
  | 'cod_settings'
  | 'seo'
  | 'branding'
  | 'favicons'
  | 'owners'
  | 'media'
  | 'configs'
  | 'database'
  | 'schema'
  | 'cache'
  | 'roles_management';

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  isSystem?: boolean;
  color?: string;
  assignedStaffCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google' | 'guest';
  googleId?: string;
  role?: string; // 'customer' | 'admin' | 'super_admin' | 'sub_admin' | custom role id
  isStaff?: boolean;
  customPermissions?: PermissionKey[];
  status?: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  addresses?: UserAddress[];
  createdAt?: string;
}

export interface AdminStaffUser extends User {
  roleName?: string;
  roleColor?: string;
  permissions?: PermissionKey[];
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  profit?: number;
  variantInfo?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  couponCode?: string;
  referralPartnerCode?: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  paymentStatus: 'Pending' | 'Paid' | 'Partial Paid' | 'Failed' | 'Refunded';
  paymentMethod: string;
  codAdvanceFeePaid?: number;
  codRemainingBalance?: number;
  paymentDetails?: any;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  discountType?: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  discountValue?: number;
  minimumOrder: number;
  minOrderAmount?: number;
  maximumDiscount?: number;
  maxDiscount?: number;
  isStoreWide: boolean;
  applicableCategories?: string[];
  applicableProductIds?: string[];
  applicableProducts?: string[];
  usageLimit?: number;
  usageCount?: number;
  usedCount?: number;
  usageLimitPerUser?: number;
  firstTimeUserOnly?: boolean;
  paymentMethodRestriction?: 'all' | 'online' | 'cod';
  minItemQuantity?: number;
  startsAt?: string;
  expiresAt?: string;
  startDate?: string;
  expiryDate?: string;
  isActive: boolean;
  isAutoApply?: boolean;
  autoApplyTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSettings {
  storeName: string;
  brandName?: string;
  storeLegalNamePvt?: string;
  storeLegalNameEnt?: string;
  tagline?: string;
  appLogo?: string;
  logoType?: string;
  faviconUrl?: string;
  faviconSvgUrl?: string;
  faviconIcoUrl?: string;
  appleTouchIconUrl?: string;
  siteWebmanifestUrl?: string;
  mobileWebAppTitle?: string;
  defaultUserAvatar?: string;
  storeAddress?: string;
  storeHours?: string;
  contactPhone?: string;
  contactEmail?: string;
  adminNotificationEmail?: string;
  whatsappNumber?: string;
  supportPhone?: string;
  supportEmail?: string;
  supportHours?: string;
  headquartersAddress?: string;
  announcementText?: string;
  announcementTextMarathi?: string;
  announcementEnabled?: boolean;
  isAnnouncementActive?: boolean;
  freeShippingThresholdState?: number;
  freeShippingThresholdNational?: number;
  stateShippingFee?: number;
  nationalShippingFee?: number;
  // SMTP Settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  enableEmailAlerts?: boolean;

  // Telegram Alert Settings
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegramAlerts?: boolean;

  // Razorpay
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;

  // Google API Keys
  googleMapsApiKey?: string;

  // Product Reviews & Moderation Settings
  reviewsEnabled?: boolean;
  reviewSubmissionPermission?: 'all' | 'customers_only' | 'verified_buyers_only' | 'disabled';
  reviewAutoApprove?: boolean;
  requireReviewComment?: boolean;

  codAdvanceFeeEnabled?: boolean;
  codAdvanceFeeType?: 'fixed' | 'percentage';
  codAdvanceFeeAmount?: number;
  codAdvanceFeeTitle?: string;
  codAdvanceFeeDescription?: string;

  womenPartnerFee?: number;
  womenPartnerAutoApprove?: boolean;

  // Our Story Page Toggles & Content
  ourStoryHeroImageUrl?: string;
  ourStoryHeroTitle?: string;
  ourStoryHeroSubtitle?: string;
  showStoryHeroSection?: boolean;
  showStoryFoundersSection?: boolean;
  showStoryMediaGallery?: boolean;
  showStoryVideoSection?: boolean;
  showStoryPressSection?: boolean;
  showStoryPillarsSection?: boolean;
  showStoryStoreLocationSection?: boolean;
  shippingZones?: Array<{
    id: string;
    name: string;
    pincodes: string[];
    rate: number;
    freeDeliveryAbove: number;
  }>;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
  };
  socials?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
  };
  heroEyebrow?: string;
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroSubtitle?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaLink?: string;
  heroCardImage?: string;
  heroCardBadge?: string;
  heroCardTitle?: string;
  heroCardSubtitle?: string;
  heroPillTitle?: string;
  heroPillSubtitle?: string;
  heroPillEnabled?: boolean;

  // Cloudinary Settings
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type: 'contact' | 'franchise' | 'bulk';
  createdAt: string;
}

export interface OwnerProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl?: string;
  location?: string;
  quote?: string;
  role?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface CloudinaryAsset {
  id: string;
  url: string;
  publicId?: string;
  name?: string;
  bytes?: number;
  format?: string;
  createdAt: string;
}

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string;
  email: string;
  status: 'pending' | 'notified';
  createdAt?: string;
  notifiedAt?: string;
}

export interface BusinessPartner {
  id: string;
  partnerCode: string; // e.g. "WBP-PRIYA482"
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  socialPlatform?: string; // 'Instagram' | 'Facebook' | 'WhatsApp' | 'YouTube' | 'Other'
  socialHandle?: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId?: string;
  aadhaarPanNumber?: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';
  commissionRate: number; // default 12
  customerDiscountRate: number; // default 4
  totalOrdersCount: number;
  totalSalesAmount: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  onHoldCommission?: number;
  deliveredOrdersCount?: number;
  referredByPartnerCode?: string;
  referralBonusEarned?: number;
  paymentStatus?: 'paid' | 'free' | 'unpaid' | 'bypassed' | string;
  paymentRef?: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentAmount?: number;
  paymentDate?: string;
  notes?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PartnerOrderReferral {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName?: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerCity?: string;
  orderTotal: number;
  customerDiscount: number; // 4%
  partnerCommission: number; // 12%
  status: 'pending' | 'eligible' | 'settled' | 'cancelled' | 'on_hold';
  settlementId?: string;
  createdAt: string;
  orderStatus?: string;
  isDelivered?: boolean;
  commissionStatus?: 'delivered' | 'on_hold' | 'settled' | 'cancelled';
  holdReason?: string;
}

export interface PartnerSettlement {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  settlementDate: string;
  settlementWeek: string; // e.g. "Sunday, Aug 16, 2026"
  amount: number;
  paymentMethod: 'Bank Transfer' | 'UPI' | 'NEFT/RTGS';
  accountOrUpi: string;
  transactionReference: string;
  ordersCount: number;
  notes?: string;
  status: 'Completed' | 'Processing' | 'Pending';
  createdAt: string;
}

export interface PartnerDashboardStats {
  totalPartners: number;
  activePartners: number;
  pendingApplications: number;
  totalReferredOrders: number;
  totalReferredSales: number;
  totalSalesThroughPartners?: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  totalPaidCommissions?: number;
  totalPendingPayout: number;
  totalOnHoldCommission?: number;
  pendingSundayPayouts?: number;
}

export interface QuickSuggestionItem {
  label: string;
  query: string;
}

export interface SnackMitraConfig {
  enabled: boolean;
  botName: string;
  botTagline: string;
  welcomeMessage: string;
  quickSuggestions: QuickSuggestionItem[];
  characterMin: number;
  characterMax: number;
  systemTone: 'warm' | 'professional' | 'traditional' | 'concise';
  whatsappNumber: string;
  allowOrderTracking: boolean;
  specialAnnouncements?: string;
  temperature?: number;
  maxOutputTokens?: number;
  updatedAt?: string;
}

export interface SnackMitraLogEntry {
  id: string;
  timestamp: string;
  customerQuery: string;
  botReply: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  replyCharCount: number;
  orderFound?: boolean;
  orderNumber?: string | null;
  status: 'success' | 'fallback' | 'error' | 'instant_match' | 'cached';
  responseTimeMs?: number;
  clientIp?: string;
}

export interface SnackMitraStats {
  totalInquiries: number;
  totalTokens: number;
  promptTokens: number;
  responseTokens: number;
  averageResponseTimeMs: number;
  averageReplyChars: number;
  ordersTracked: number;
  todayInquiries: number;
  todayTokens: number;
  dailyUsage: Array<{
    date: string;
    inquiries: number;
    tokens: number;
    promptTokens: number;
    responseTokens: number;
  }>;
}


