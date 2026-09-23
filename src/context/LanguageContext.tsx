import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  isMarathi: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & General
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.categories': 'Categories',
    'nav.upwas': 'Upwas Special',
    'nav.explore': 'Explore',
    'nav.contact': 'Contact Us',
    'nav.partner': 'Women Business Partner',
    'nav.partner_short': 'Women Partner',
    'nav.franchise': 'Franchise',
    'nav.our_story': 'Our Story',
    'nav.faq': 'FAQ',
    'nav.instagram': 'Instagram',
    'nav.account': 'My Account',
    'nav.orders': 'My Orders',
    'nav.cart': 'Cart',
    'nav.wishlist': 'Wishlist',
    'nav.search': 'Search',
    'nav.search_placeholder': 'Search snacks, banana chips, masalas...',
    'nav.login': 'Login',
    'nav.logout': 'Sign Out',
    'nav.fast': 'Fast',
    'nav.earn_12': 'Earn 12%',
    'nav.language': 'Language',
    'nav.marathi': 'मराठी',
    'nav.english': 'English',

    // Store & Taglines
    'store.name': 'Aapla Jalgaonwala',
    'store.tagline': 'Khandeshi Swaad • 100% Pure',
    'announcement.text': '🔥 Authentic Jalgaon Banana Chips & Namkeen • Free Delivery on orders over ₹399!',

    // Common Ecommerce
    'btn.add_to_cart': 'Add to Cart',
    'btn.buy_now': 'Buy Now',
    'btn.view_product': 'View Details',
    'btn.checkout': 'Proceed to Checkout',
    'btn.continue_shopping': 'Continue Shopping',
    'btn.view_all': 'View All',
    'btn.apply': 'Apply',
    'btn.remove': 'Remove',

    // Product & Trust
    'product.pure_sendha_namak': '100% Sendha Namak Compliant',
    'product.freshness_guarantee': 'Fresh Batch Quality Guaranteed',
    'product.in_stock': 'In Stock',
    'product.out_of_stock': 'Out of Stock',
    'product.reviews': 'Reviews',
    'product.rating': 'Rating',
    'product.free_delivery': 'Free Shipping Available',

    // Categories
    'cat.banana_chips': 'Banana Chips',
    'cat.khandeshi_farsaan': 'Khandeshi Farsaan',
    'cat.kitchen_masalas': 'Kitchen Masalas',
    'cat.potato_chips': 'Potato Chips',
    'cat.upwas_special': 'Upwas Special',
    'cat.combos': 'Combo Packs',

    // Partner
    'partner.title': 'Women Business Partner Program',
    'partner.tagline': 'Earn 12% direct commission promoting Jalgaon snacks from home',
    'partner.register': 'Register as Partner',
    'partner.calculator': 'Earnings Calculator',

    // Footer
    'footer.about_title': 'Authentic Taste of Jalgaon',
    'footer.quick_links': 'Quick Links',
    'footer.customer_care': 'Customer Care',
    'footer.legal': 'Legal & Policies',
    'footer.rights': 'All rights reserved.'
  },
  mr: {
    // Nav & General
    'nav.home': 'मुख्यपृष्ठ',
    'nav.shop': 'खरेदी करा',
    'nav.categories': 'कॅटेगरी',
    'nav.upwas': 'उपवास विशेष',
    'nav.explore': 'अधिक माहिती',
    'nav.contact': 'संपर्क साधा',
    'nav.partner': 'महिला व्यवसाय भागीदार',
    'nav.partner_short': 'महिला भागीदार',
    'nav.franchise': 'फ्रँचायझी संधी',
    'nav.our_story': 'आमची गोष्ट',
    'nav.faq': 'प्रश्न व उत्तरे',
    'nav.instagram': 'इन्स्टाग्राम',
    'nav.account': 'माझे खाते',
    'nav.orders': 'माझ्या ऑर्डर्स',
    'nav.cart': 'कार्ट',
    'nav.wishlist': 'माझी आवड',
    'nav.search': 'शोधा',
    'nav.search_placeholder': 'वेफर्स, शेव, मसाले शोधा...',
    'nav.login': 'लॉगिन',
    'nav.logout': 'बाहेर पडा',
    'nav.fast': 'उपवास',
    'nav.earn_12': '१२% कमवा',
    'nav.language': 'भाषा',
    'nav.marathi': 'मराठी',
    'nav.english': 'English',

    // Store & Taglines
    'store.name': 'आपला जळगाववाला',
    'store.tagline': 'अस्सल खान्देशी स्वाद • १००% शुद्ध',
    'announcement.text': '🔥 अस्सल जळगाव केळी वेफर्स व नमकीन • ₹३९९ वरील ऑर्डर्सवर मोफत डिलिव्हरी!',

    // Common Ecommerce
    'btn.add_to_cart': 'कार्टमध्ये जोडा',
    'btn.buy_now': 'आता खरेदी करा',
    'btn.view_product': 'तपशील पहा',
    'btn.checkout': 'चेकआउट करा',
    'btn.continue_shopping': 'आणखी खरेदी करा',
    'btn.view_all': 'सर्व पहा',
    'btn.apply': 'लागू करा',
    'btn.remove': 'काढून टाका',

    // Product & Trust
    'product.pure_sendha_namak': '१००% सैंधव मीठ उपवास योग्य',
    'product.freshness_guarantee': '१००% ताज्या उत्पादनाची हमी',
    'product.in_stock': 'उपलब्ध आहे',
    'product.out_of_stock': 'स्टॉक संपला',
    'product.reviews': 'अभिप्राय',
    'product.rating': 'रेटिंग',
    'product.free_delivery': 'मोफत डिलिव्हरी उपलब्ध',

    // Categories
    'cat.banana_chips': 'केळी वेफर्स',
    'cat.khandeshi_farsaan': 'खान्देशी फरसाण',
    'cat.kitchen_masalas': 'घरगुती मसाले',
    'cat.potato_chips': 'बटाटा वेफर्स',
    'cat.upwas_special': 'उपवास विशेष',
    'cat.combos': 'कॉम्बो पॅक',

    // Partner
    'partner.title': 'महिला व्यवसाय भागीदार योजना',
    'partner.tagline': 'घरी बसून जळगाव स्नॅक्स प्रमोट करून १२% थेट कमिशन कमवा',
    'partner.register': 'भागीदार म्हणून नोंदणी करा',
    'partner.calculator': 'कमाई कॅल्क्युलेटर',

    // Footer
    'footer.about_title': 'जळगावची अस्सल चव आणि परंपरा',
    'footer.quick_links': 'महत्त्वाच्या लिंक्स',
    'footer.customer_care': 'ग्राहक सेवा',
    'footer.legal': 'नियम व अटी',
    'footer.rights': 'सर्व हक्क राखीव.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      // Only use 'mr' if user explicitly saved 'mr' before, otherwise always default to 'en'
      if (saved === 'mr') return 'mr';
      return 'en';
    } catch {
      return 'en';
    }
  });

  const purgeSpinners = () => {
    if (typeof document === 'undefined') return;
    try {
      const spinners = document.querySelectorAll(
        '[class*="VIpgJd"], [class*="goog-te-spinner"], [class*="goog-te-processing"], .goog-te-spinner-pos, .goog-te-spinner, .goog-te-spinner-animation, iframe.goog-te-banner-frame, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame'
      );
      spinners.forEach((el) => {
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          } else {
            el.remove();
          }
        } catch {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
          (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
          (el as HTMLElement).style.setProperty('opacity', '0', 'important');
        }
      });

      if (document.body && document.body.style && document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
    } catch {}
  };

  const applyPageTranslation = (lang: Language) => {
    try {
      // Purge any lingering spinner immediately
      purgeSpinners();

      // Admin panel must NEVER be translated into any language - strictly English
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.documentElement.lang = 'en';
        document.documentElement.classList.add('notranslate');
        document.documentElement.setAttribute('translate', 'no');
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (select && select.value && select.value !== 'en') {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
        }
        purgeSpinners();
        return;
      }

      const targetCode = lang === 'mr' ? 'mr' : 'en';
      const rootDomain = window.location.hostname.includes('.')
        ? '.' + window.location.hostname.split('.').slice(-2).join('.')
        : '';

      if (lang === 'mr') {
        const cookieValue = `/en/mr`;
        document.cookie = `googtrans=${cookieValue}; path=/;`;
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;
        if (rootDomain) {
          document.cookie = `googtrans=${cookieValue}; path=/; domain=${rootDomain};`;
        }
      } else {
        // Clear all translate cookies when in English mode
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        if (rootDomain) {
          document.cookie = `googtrans=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        }
      }

      // Try triggering the google translate dropdown element if loaded
      const triggerSelect = () => {
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (select) {
          select.value = targetCode;
          select.dispatchEvent(new Event('change'));
          purgeSpinners();
          return true;
        }
        return false;
      };

      if (!triggerSelect()) {
        const intervals = [100, 300, 700, 1500, 3000];
        intervals.forEach((delay) => {
          setTimeout(() => {
            triggerSelect();
            purgeSpinners();
          }, delay);
        });
      }

      // Proactively purge spinner during and after translate execution
      [50, 150, 300, 600, 1200, 2000, 3500].forEach((delay) => {
        setTimeout(purgeSpinners, delay);
      });
    } catch (err) {
      console.warn('Page translation trigger failed', err);
    }
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('app_language', newLang);
      document.documentElement.lang = newLang === 'mr' ? 'mr' : 'en';
      applyPageTranslation(newLang);
    } catch (e) {
      console.warn('Could not save language to storage', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'mr' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string, defaultText?: string): string => {
    // Admin routes must always remain strictly in English
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      const enDict = translations['en'];
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return defaultText || key;
    }

    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const fallbackDict = translations['en'];
    if (fallbackDict && fallbackDict[key]) {
      return fallbackDict[key];
    }
    return defaultText || key;
  };

  useEffect(() => {
    document.documentElement.lang = language === 'mr' ? 'mr' : 'en';
    applyPageTranslation(language);
  }, [language]);

  // Continuously observe and eliminate any Google Translate spinner or overlay
  useEffect(() => {
    if (typeof window === 'undefined') return;

    purgeSpinners();

    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        purgeSpinners();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    } catch {}

    const interval = setInterval(purgeSpinners, 400);

    return () => {
      if (observer) observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isMarathi: language === 'mr'
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
