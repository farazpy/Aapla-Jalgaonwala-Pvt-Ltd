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
  faviconUrl: '/favicons/favicon-96x96.png',
  faviconSvgUrl: '/favicons/favicon.svg',
  faviconIcoUrl: '/favicons/favicon.ico',
  appleTouchIconUrl: '/favicons/apple-touch-icon.png',
  siteWebmanifestUrl: '/favicons/site.webmanifest',
  mobileWebAppTitle: 'AJW',
  enableRazorpay: true,
  enableCod: true,
  razorpayKeyId: 'rzp_test_ajwKey123',
  razorpayKeySecret: 'ajwSecretKey9890',
  enableGoogleAuth: true,
  googleClientId: '',
  googleClientSecret: '',
  googleMapsApiKey: '',

  // Navratri Offer defaults
  navratriHeroImageUrl: 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80',
  navratriPrice: 599,
  navratriMrp: 899,
  navratriDescription: 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos! Made 100% Satvik with Sendha Namak (Rock Salt) in separate dedicated frying lines.',
  navratriProduct1Name: 'Sendha Namak Rock Salt Banana Chips (५०० ग्रॅम)',
  navratriProduct1Desc: 'Melt-in-your-mouth wafer thin raw banana wafers salted with pure Himalayan Sendha Namak (Rock Salt).',
  navratriProduct1Image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
  navratriProduct2Name: 'Spicy Masala Fasting Banana Chips (५०० ग्रॅम)',
  navratriProduct2Desc: 'Crispy raw banana wafers tossed with fast-compliant spicy red chilli powder and rock salt.',
  navratriProduct2Image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
  navratriProduct3Name: 'Meetha Farali Potato Batata Chivda (५०० ग्रॅम)',
  navratriProduct3Desc: 'Crisp hand-grated Jalgaon potato salli blended with premium cashew nuts, sweet raisins, and roasted peanuts.',
  navratriProduct3Image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
  navratriProduct4Name: 'Teekha Farali Potato Batata Chivda (५०० ग्रॅम)',
  navratriProduct4Desc: 'Thin golden matchstick potato salli seasoned with a spicy Navratri spice mix and crunchy rock salt.',
  navratriProduct4Image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
  navratriProduct5Name: 'Rajgira Amaranth Sweet Ladoo (राजगिरा लाडू)',
  navratriProduct5Desc: 'Mouthwatering, soft, nutrient-packed amaranth puffed seeds balls sweetened with jaggery/pure sugar.',
  navratriProduct5Image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
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
  teleCloudEndpoint: 'https://s3.htknetwork.in/api/v1/upload',
  teleCloudApiKey: '',
  teleCloudWorkspaceId: '',
  teleCloudCaption: 'Uploaded via Aapla Jalgaonwala Admin',
  storageProvider: 'telecloud',
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: ''
};

