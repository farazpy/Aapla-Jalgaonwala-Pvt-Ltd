import { SiteSettings } from '@/types';

export const DEFAULT_HEADER_LOGO = 'https://res.cloudinary.com/db7nvcm4i/image/upload/fl_original/v1789546237/branding/1789546235891_wqs7e2wxhhj4chie8bun__1_.png';
export const DEFAULT_HERO_IMAGE = 'https://res.cloudinary.com/db7nvcm4i/image/upload/v1789546373/hero/1789546371699_file_0000000071f082088902c2dd7b7807f7__1_.jpg';

export const initialSiteSettings: SiteSettings = {
  announcementText: "Women’s Program officially starts from 1st May.",
  announcementTextMarathi: "महिलांचा कार्यक्रम अधिकृतपणे १ मेपासून सुरू होत आहे.",
  announcementEnabled: true,
  storeName: 'Aapla Jalgaonwala',
  storeLegalNamePvt: 'Aapla Jalgaonwala Pvt. Ltd.',
  storeLegalNameEnt: 'Aapla Jalgaonwala Enterprises',
  tagline: 'Authentic Khandeshi Taste',
  appLogo: DEFAULT_HEADER_LOGO,
  logoType: 'badge',
  defaultUserAvatar: 'https://res.cloudinary.com/xbtfj9zf/image/upload/v1786888364/ChatGPT_Image_Aug_16_2026_07_22_26_PM.png',
  storeAddress: 'Aapla JalgaonWala Enterprises, Dehu - Yelwadi Rd, near by yelwadi, kaman, Dehu, Yelwadi, Maharashtra 412109',
  storeHours: 'Monday - Sunday: 8:00 AM - 11:00 PM',
  contactPhone: '+91 70574 46409',
  contactEmail: 'aaplajalgaonwala@gmail.com',
  adminNotificationEmail: 'aaplajalgaonwala@gmail.com',
  supportHours: 'Monday - Saturday: 10:00 AM - 8:00 PM',
  whatsappNumber: '917057446409',
  socialLinks: {
    instagram: 'https://instagram.com/aaplajalgaonwala',
    facebook: 'https://facebook.com/aaplajalgaonwala',
    youtube: 'https://youtube.com/@aaplajalgaonwala'
  },
  // Product Review System Defaults
  reviewsEnabled: true,
  reviewSubmissionPermission: 'all', // 'all' (guests & customers) | 'customers_only' | 'verified_buyers_only' | 'disabled'
  reviewAutoApprove: false, // true = auto publish, false = hold for moderation
  requireReviewComment: false, // optional textarea

  // Hero Section Defaults
  heroEyebrow: 'Rooted in Tradition. Crafted for Modern Taste.',
  heroTitle: 'A Taste of Homemade Aroma',
  heroTitleHighlight: 'Homemade Aroma',
  heroSubtitle: "Authentic banana chips, farsaan, masalas and regional flavours crafted for today's generation. Directly sourced from Jalgaon farms and freshly packed for pure crunch.",
  heroPrimaryCtaText: 'Shop Now',
  heroPrimaryCtaLink: '/shop',
  heroSecondaryCtaText: 'Woman Partner Registration',
  heroSecondaryCtaLink: '/partner-program',
  heroCardImage: DEFAULT_HERO_IMAGE,
  heroCardBadge: 'Hero Special',
  heroCardTitle: 'A Taste of Homemade Aroma',
  heroCardSubtitle: 'Thin, crispy, and tossed in authentic regional spices',
  heroPillTitle: 'Women’s Program Launching 1st May',
  heroPillSubtitle: 'Creating new opportunities.',
  heroPillEnabled: true,
  showStoryMediaGallery: false,
  showStoryVideoSection: true,
  faviconUrl: 'https://res.cloudinary.com/xbtfj9zf/image/upload/v1787679532/branding/1787679531968_favicon.png',
  faviconSvgUrl: 'https://res.cloudinary.com/xbtfj9zf/image/upload/v1787387578/favicons/1787387578471_favicon.svg',
  faviconIcoUrl: 'https://res.cloudinary.com/xbtfj9zf/image/upload/v1787387577/favicons/1787387576691_favicon.png',
  appleTouchIconUrl: 'https://res.cloudinary.com/xbtfj9zf/image/upload/v1787387575/favicons/1787387574651_apple-touch-icon.png',
  siteWebmanifestUrl: 'https://res.cloudinary.com/xbtfj9zf/raw/upload/v1787387582/favicons/1787387581998_site',
  mobileWebAppTitle: 'AJW',
  razorpayKeyId: 'rzp_test_ajwKey123',
  razorpayKeySecret: 'ajwSecretKey9890',
  womenPartnerFee: 699,
  womenPartnerAutoApprove: true,
  shippingZones: [
    {
      id: 'local-zone',
      name: 'Local Maharashtra Zone',
      pincodes: ['425001', '425002', '425003', '425201', '425*'],
      rate: 40,
      freeDeliveryAbove: 399
    },
    {
      id: 'india-zone',
      name: 'Rest of India',
      pincodes: ['*'],
      rate: 70,
      freeDeliveryAbove: 799
    }
  ],
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: ''
};

