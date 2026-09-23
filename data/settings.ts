import { SiteSettings } from '@/types';

export const initialSiteSettings: SiteSettings = {
  announcementText: '',
  announcementEnabled: false,
  storeName: 'Aapla Jalgaonwala',
  storeLegalNamePvt: '',
  storeLegalNameEnt: '',
  tagline: '',
  appLogo: '',
  logoType: 'badge',
  storeAddress: '',
  storeHours: '',
  contactPhone: '',
  contactEmail: '',
  supportHours: '',
  whatsappNumber: '',
  socialLinks: {},
  // Hero Section Defaults
  heroEyebrow: 'Rooted in Tradition. Crafted for Modern Taste.',
  heroTitle: 'A Taste of Jalgaon in Every Bite.',
  heroTitleHighlight: 'Jalgaon',
  heroSubtitle: "Authentic banana chips, farsaan, masalas and regional flavours crafted for today's generation. Directly sourced from Jalgaon farms and freshly packed for pure crunch.",
  heroPrimaryCtaText: 'Shop Now',
  heroPrimaryCtaLink: '/shop',
  heroSecondaryCtaText: 'Our Story',
  heroSecondaryCtaLink: '/our-story',
  heroCardImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1000&q=80',
  heroCardBadge: 'Hero Special',
  heroCardTitle: 'Khandeshi Masala Banana Chips',
  heroCardSubtitle: 'Thin, crispy, and tossed in authentic regional spices',
  heroPillTitle: '10 Unique Flavours',
  heroPillSubtitle: 'From Peri Peri to Pani Poori',
  heroPillEnabled: true,
  faviconUrl: '/favicon.ico',
  razorpayKeyId: 'rzp_test_ajwKey123',
  razorpayKeySecret: 'ajwSecretKey9890',
  telegramBotToken: '',
  telegramChatId: '',
  enableTelegramAlerts: true,
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

