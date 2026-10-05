'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Lock,
  Key,
  Package,
  ShoppingBag,
  Database,
  CheckCircle2,
  List,
  Globe,
  Users,
  Image as ImageIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Plus,
  Tag,
  Layers,
  Store,
  ExternalLink,
  SlidersHorizontal,
  Home,
  Check,
  Sparkles,
  TicketPercent,
  Banknote,
  Zap,
  Star,
  Smartphone,
  ShieldCheck,
  UserCheck,
  Shield,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { PermissionKey } from '@/types';
import { DEFAULT_HEADER_LOGO } from '@/data/settings';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function AdminLayout({
  children,
  pageTitle,
  breadcrumbs,
  actions
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, openAuthModal, logout: authLogout, isLoading: isAuthLoading } = useAuth();
  
  const isSuperAdmin = Boolean(user && (user.email?.toLowerCase() === 'operationalhtklabs@gmail.com' || user.role === 'super_admin'));
  const isStaffUser = Boolean(
    user && (
      isSuperAdmin ||
      user.isStaff ||
      user.role === 'admin' ||
      user.role === 'sub_admin' ||
      (user.role && user.role !== 'customer') ||
      (user.permissions && user.permissions.length > 0) ||
      (user.customPermissions && user.customPermissions.length > 0)
    )
  );
  const isAdminUser = Boolean(user && (isSuperAdmin || isStaffUser));

  const hasPermission = (permissionKey?: PermissionKey | string) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (!permissionKey) return true;
    if (user.role === 'admin' || user.role === 'super_admin') return true;
    
    // Always permit dashboard overview so admin layout can render
    if (permissionKey === 'dashboard') return true;

    const userPerms = (user.permissions || user.customPermissions || []) as (PermissionKey | string)[];
    // If no explicit restricted perms array on staff user, default allow
    if (userPerms.length === 0 && (user.isStaff || user.role === 'sub_admin' || (user.role && user.role !== 'customer'))) {
      return true;
    }
    return userPerms.includes(permissionKey);
  };

  // Store Branding
  const [adminSiteLogo, setAdminSiteLogo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ajw_site_logo') || DEFAULT_HEADER_LOGO;
    }
    return DEFAULT_HEADER_LOGO;
  });
  const [adminStoreTitle, setAdminStoreTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ajw_store_title') || 'Aapla Jalgaonwala';
    }
    return 'Aapla Jalgaonwala';
  });

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Products Submenu expansion state (auto-expanded if current path is a product/category path)
  const isProductRoute = pathname?.startsWith('/admin/products') || pathname?.startsWith('/admin/categories') || pathname?.startsWith('/admin/shravan');
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(true);

  // Dynamic Counts
  const [counts, setCounts] = useState({
    products: 24,
    categories: 4,
    orders: 0,
    customers: 0,
    shravan: 0,
    coupons: 0,
    reviews: 0
  });

  // Global Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Enforce English language & disable automatic translation for entire Admin Panel
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
      document.documentElement.classList.add('notranslate');
      document.documentElement.setAttribute('translate', 'no');

      // Clear any Google Translate cookies
      const clearCookie = (name: string) => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        const rootDomain = window.location.hostname.includes('.') 
          ? '.' + window.location.hostname.split('.').slice(-2).join('.') 
          : '';
        if (rootDomain) {
          document.cookie = `${name}=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        }
      };
      clearCookie('googtrans');

      // If google translate combo exists, reset it to English
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select && select.value && select.value !== 'en') {
        select.value = 'en';
        select.dispatchEvent(new Event('change'));
      }

      // Add meta notranslate if not already present
      let meta = document.querySelector('meta[name="google"][content="notranslate"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'google');
        meta.setAttribute('content', 'notranslate');
        document.head.appendChild(meta);
      }
    }
  }, [pathname]);

  // Check auth and fetch sidebar counts & branding
  useEffect(() => {
    // Fetch live summary counts
    const fetchSummary = async () => {
      try {
        const authToken = localStorage.getItem('ajw_auth_token') || localStorage.getItem('token') || '';
        const authHeaders: Record<string, string> = {};
        if (authToken) {
          authHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        const [prodRes, catRes, ordRes, userRes, coupRes, revRes, settRes] = await Promise.allSettled([
          fetch('/api/admin/products').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/orders').then((r) => r.json()),
          authToken ? fetch('/api/admin/users', { headers: authHeaders }).then((r) => r.json()) : Promise.resolve({ success: false }),
          fetch('/api/coupons').then((r) => r.json()),
          authToken ? fetch('/api/admin/reviews', { headers: authHeaders }).then((r) => r.json()) : fetch('/api/reviews').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json())
        ]);

        let pCount = 24;
        let cCount = 4;
        let oCount = 0;
        let uCount = 0;
        let sCount = 0;
        let coupCount = 0;
        let rCount = 0;

        if (prodRes.status === 'fulfilled' && prodRes.value.success && Array.isArray(prodRes.value.data)) {
          pCount = prodRes.value.data.length;
          sCount = prodRes.value.data.filter(
            (p: any) =>
              p.category === 'shravan-special' ||
              p.category === 'shravan' ||
              p.category === 'upwas-special' ||
              p.categoryId === 'shravan-special' ||
              p.categoryId === 'shravan' ||
              (p.tags && p.tags.some((t: string) => /shravan|upwas|farali|sendha/i.test(t))) ||
              /shravan|upwas|farali|sendha/i.test(p.name)
          ).length;
        }
        if (catRes.status === 'fulfilled' && catRes.value.success && Array.isArray(catRes.value.data)) {
          cCount = catRes.value.data.length;
        }
        if (ordRes.status === 'fulfilled' && ordRes.value.success && Array.isArray(ordRes.value.data)) {
          oCount = ordRes.value.data.length;
        }
        if (userRes.status === 'fulfilled' && userRes.value.success && Array.isArray(userRes.value.data)) {
          uCount = userRes.value.data.length;
        }
        if (coupRes.status === 'fulfilled' && coupRes.value.success && Array.isArray(coupRes.value.data)) {
          coupCount = coupRes.value.data.filter((c: any) => {
            if (c.isPartnerCode) return false;
            const code = (c.code || '').trim().toUpperCase();
            if (code.startsWith('AJW-') || code.startsWith('WBP-')) return false;
            const desc = (c.description || '').toLowerCase();
            if (
              desc.includes('women business partner') ||
              desc.includes('woman business partner') ||
              desc.includes('women partner') ||
              desc.includes('woman partner') ||
              desc.includes('referral discount') ||
              desc.includes('referral code')
            ) {
              return false;
            }
            return true;
          }).length;
        }
        if (revRes.status === 'fulfilled' && revRes.value.success && revRes.value.data) {
          rCount = revRes.value.data.stats?.pending || (Array.isArray(revRes.value.data.reviews) ? revRes.value.data.reviews.length : 0);
        }

        setCounts({
          products: pCount,
          categories: cCount,
          orders: oCount,
          customers: uCount,
          shravan: sCount,
          coupons: coupCount,
          reviews: rCount
        });

        if (settRes.status === 'fulfilled' && settRes.value.success && settRes.value.data) {
          const data = settRes.value.data;
          if (data.appLogo) {
            setAdminSiteLogo(data.appLogo);
            localStorage.setItem('ajw_site_logo', data.appLogo);
          }
          if (data.storeName) {
            setAdminStoreTitle(data.storeName);
            localStorage.setItem('ajw_store_title', data.storeName);
          }
          
          const mobileTitle = data.mobileWebAppTitle || 'AJW';
          let metaTitle = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
          if (!metaTitle) {
            metaTitle = document.createElement('meta');
            metaTitle.name = 'apple-mobile-web-app-title';
            document.head.appendChild(metaTitle);
          }
          metaTitle.content = mobileTitle;

          let icon96 = document.querySelector<HTMLLinkElement>("link[rel='icon'][sizes='96x96']");
          if (!icon96) {
            icon96 = document.createElement('link');
            icon96.rel = 'icon';
            icon96.type = 'image/png';
            icon96.sizes = '96x96';
            document.head.appendChild(icon96);
          }
          icon96.href = data.faviconUrl || '/favicons/favicon-96x96.png';
        }
      } catch {
        // Silently use cached counts
      }
    };

    fetchSummary();
  }, []);

  // Handle Logout
  const handleLogout = () => {
    authLogout();
    showToast('Logged out of Admin Workspace.');
    router.push('/');
  };

  // Admin Authentication Check Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 font-sans antialiased text-stone-100">
        <div className="w-8 h-8 border-2 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 font-sans antialiased text-stone-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-800 border border-stone-700/80 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-red-950/40 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <Lock className="w-7 h-7 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">{adminStoreTitle}</h1>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Restricted Access</p>
          </div>

          <div className="bg-stone-900/50 border border-stone-700/40 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs text-stone-300 leading-relaxed">
              This panel is restricted to authorized store administrators and designated staff members.
            </p>
            <p className="text-[11px] font-mono font-bold text-amber-400 select-all">
              Please log in with your authorized admin / sub-admin staff credentials.
            </p>
          </div>

          <div className="space-y-3">
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="w-full py-2.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Log In to Admin Panel</span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-center text-stone-400">
                  Currently logged in as: <span className="text-stone-300 font-semibold">{user.email}</span>
                  <span className="block text-rose-400 font-bold mt-0.5">This account does not have staff privileges.</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    authLogout();
                    setTimeout(() => openAuthModal('login'), 200);
                  }}
                  className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Switch to Staff Account</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-center pt-2 border-t border-stone-700/60">
            <Link href="/" className="text-xs text-stone-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium">
              <Store className="w-3.5 h-3.5" />
              <span>Return to Public Storefront</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Define WordPress-style navigation structure with permissions
  const navigationGroups = [
    {
      title: 'SALES & CATALOG',
      items: [
        {
          id: 'dashboard',
          label: 'Home / Metrics',
          href: '/admin',
          icon: Home,
          count: null,
          exact: true,
          permission: 'dashboard'
        },
        {
          id: 'products-group',
          label: 'Products',
          isDropdown: true,
          icon: Package,
          count: counts.products,
          children: [
            {
              id: 'all-products',
              label: 'All Products',
              href: '/admin/products',
              icon: List,
              count: counts.products,
              permission: 'products'
            },
            {
              id: 'categories',
              label: 'Categories',
              href: '/admin/categories',
              icon: Tag,
              count: counts.categories,
              permission: 'categories'
            },
            {
              id: 'shravan-curator',
              label: 'Shravan Curator',
              href: '/admin/shravan',
              icon: Sparkles,
              count: counts.shravan,
              isHighlight: true,
              permission: 'shravan'
            },
            {
              id: 'add-product',
              label: 'Add New Product',
              href: '/admin/products/add',
              icon: Plus,
              count: null,
              isHighlight: false,
              permission: 'add_product'
            }
          ]
        },
        {
          id: 'orders',
          label: 'Orders',
          href: '/admin/orders',
          icon: ShoppingBag,
          count: counts.orders,
          permission: 'orders'
        },
        {
          id: 'customers',
          label: 'Customers Data',
          href: '/admin/customers',
          icon: Users,
          count: counts.customers,
          isHighlight: true,
          permission: 'customers'
        },
        {
          id: 'partners',
          label: 'Women Partners',
          href: '/admin/partners',
          icon: Users,
          count: null,
          isHighlight: false,
          permission: 'partners'
        },
        {
          id: 'woman-graphics',
          label: 'Woman Graphics',
          href: '/admin/woman-graphics',
          icon: ImageIcon,
          count: null,
          isHighlight: true,
          permission: 'partners'
        },
        {
          id: 'reviews',
          label: 'Product Reviews',
          href: '/admin/reviews',
          icon: Star,
          count: counts.reviews > 0 ? counts.reviews : null,
          isHighlight: counts.reviews > 0,
          permission: 'reviews'
        },
        {
          id: 'coupons',
          label: 'Coupons',
          href: '/admin/coupons',
          icon: TicketPercent,
          count: counts.coupons,
          permission: 'coupons'
        },
        {
          id: 'cod-settings',
          label: 'COD Advance Fee',
          href: '/admin/cod-settings',
          icon: Banknote,
          count: null,
          permission: 'cod_settings'
        },
        {
          id: 'seo',
          label: 'SEO Manager',
          href: '/admin/seo',
          icon: Globe,
          count: null,
          permission: 'seo'
        }
      ]
    },
    {
      title: 'ONLINE STORE',
      items: [
        {
          id: 'branding',
          label: 'App Logo & Branding',
          href: '/admin/branding',
          icon: SlidersHorizontal,
          count: null,
          permission: 'branding'
        },
        {
          id: 'favicons',
          label: 'Favicon & Web App Icons',
          href: '/admin/favicons',
          icon: Smartphone,
          count: null,
          permission: 'favicons'
        },
        {
          id: 'owners',
          label: 'Owners Photos',
          href: '/admin/owners',
          icon: Users,
          count: null,
          permission: 'owners'
        },
        {
          id: 'media',
          label: 'Our Story Media & Gallery',
          href: '/admin/media',
          icon: ImageIcon,
          count: null,
          permission: 'media'
        }
      ]
    },
    {
      title: 'DATABASE & SYSTEMS',
      items: [
        {
          id: 'snack-mitra',
          label: 'Snack Mitra AI Bot',
          href: '/admin/snack-mitra',
          icon: Bot,
          count: null,
          isHighlight: true,
          permission: 'snack_mitra'
        },
        {
          id: 'roles-management',
          label: 'Admin Roles & Staff',
          href: '/admin/roles',
          icon: ShieldCheck,
          count: null,
          isHighlight: true,
          permission: 'roles_management'
        },
        {
          id: 'configs',
          label: 'Website Configs & SMTP',
          href: '/admin/configs',
          icon: SlidersHorizontal,
          count: null,
          isHighlight: false,
          permission: 'configs'
        },
        {
          id: 'mysql-db',
          label: 'Database & Storage',
          href: '/admin/database',
          icon: Database,
          count: null,
          permission: 'database'
        },
        {
          id: 'schema',
          label: 'Schema SQL',
          href: '/admin/schema',
          icon: Layers,
          count: null,
          permission: 'schema'
        },
        {
          id: 'cache',
          label: 'Cache & Speed',
          href: '/admin/cache',
          icon: Zap,
          count: null,
          isHighlight: true,
          permission: 'cache'
        }
      ]
    }
  ];

  // Filter groups according to active staff member permissions
  const visibleNavigationGroups = navigationGroups
    .map((group) => {
      const visibleItems = group.items
        .map((item: any) => {
          if (item.isDropdown && item.children) {
            const visibleChildren = item.children.filter((child: any) => hasPermission(child.permission));
            return {
              ...item,
              children: visibleChildren,
              hidden: visibleChildren.length === 0
            };
          }
          return {
            ...item,
            hidden: !hasPermission(item.permission)
          };
        })
        .filter((item: any) => !item.hidden);

      return {
        ...group,
        items: visibleItems
      };
    })
    .filter((group) => group.items.length > 0);

  const checkIsActive = (href?: string, exact?: boolean) => {
    if (!href) return false;
    if (exact) return pathname === href;
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/dashboard';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-white flex font-sans antialiased text-stone-800 notranslate" translate="no" lang="en">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-stone-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WORDPRESS / SHOPIFY STYLE PERSISTENT LEFT SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-[#e1e3e5] flex flex-col transition-transform duration-300 ease-in-out h-full
          md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between bg-white shrink-0">
            <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 group">
              {adminSiteLogo ? (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stone-200 bg-white p-1 flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={adminSiteLogo}
                    alt={adminStoreTitle}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_HEADER_LOGO) {
                        target.src = DEFAULT_HEADER_LOGO;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#9B111E] text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                  AJ
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-stone-900 leading-tight truncate group-hover:text-[#9B111E] transition-colors">
                  {adminStoreTitle}
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Database Connected
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-4 flex-1 overflow-y-auto min-h-0">
            {visibleNavigationGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item: any) => {
                    const IconComponent = item.icon;

                    // Products Group with Submenu
                    if (item.isDropdown && item.children) {
                      const isAnyChildActive = isProductRoute;

                      return (
                        <div key={item.id} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                            className={`
                              w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer
                              ${
                                isAnyChildActive
                                  ? 'bg-stone-100 text-stone-950 font-bold border-l-2 border-[#9B111E] rounded-l-none pl-2.5'
                                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5">
                              <IconComponent className={`w-4 h-4 ${isAnyChildActive ? 'text-[#9B111E]' : 'text-stone-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.count !== null && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isAnyChildActive ? 'bg-stone-200 text-stone-900' : 'bg-stone-100 text-stone-500'
                                  }`}
                                >
                                  {item.count}
                                </span>
                              )}
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                                  isProductsDropdownOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </button>

                          {/* WordPress Style Submenu */}
                          {isProductsDropdownOpen && (
                            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-stone-200 ml-3.5 my-1">
                              {item.children.map((sub: any) => {
                                const SubIcon = sub.icon;
                                const isSubActive =
                                  sub.href === '/admin/products'
                                    ? pathname === '/admin/products'
                                    : pathname?.startsWith(sub.href);

                                return (
                                  <Link
                                    key={sub.id}
                                    href={sub.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                      w-full px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-all
                                      ${
                                        isSubActive
                                          ? 'bg-[#9B111E]/10 text-[#9B111E] font-bold'
                                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                                      }
                                    `}
                                  >
                                    <div className="flex items-center gap-2">
                                      <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-[#9B111E]' : sub.isHighlight ? 'text-[#9B111E]' : 'text-stone-400'}`} />
                                      <span className={sub.isHighlight ? 'font-bold text-[#9B111E]' : ''}>{sub.label}</span>
                                    </div>
                                    {sub.count !== null && sub.count !== undefined && (
                                      <span className="text-[10px] font-bold text-stone-400">{sub.count}</span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Standard Menu Item
                    const isActive = checkIsActive(item.href, item.exact);

                    return (
                      <Link
                        key={item.id}
                        href={item.href || '/admin'}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all
                          ${
                            isActive
                              ? 'bg-stone-100 text-stone-950 font-bold border-l-2 border-[#9B111E] rounded-l-none pl-2.5'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#9B111E]' : 'text-stone-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== null && item.count !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-stone-200 text-stone-900' : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile & Role Info in Sidebar */}
          {user && (
            <div className="p-3 bg-stone-100/80 border-t border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900 truncate leading-tight">{user.name || 'Admin'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 truncate capitalize">
                      {isSuperAdmin ? 'Super Admin' : (user.role || 'Staff')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Footer with Storefront Link and Logout */}
          <div className="p-3 border-t border-[#e1e3e5] bg-stone-50 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="w-full py-1.5 px-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-[#e1e3e5] rounded-lg text-xs font-bold flex items-center justify-between transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-stone-500" />
                <span>Visit Public Store</span>
              </div>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-1.5 px-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-[#e1e3e5] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* MAIN CONTENT CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-stone-50/30">
        {/* TOPBAR HEADER */}
        <header className="bg-white border-b border-[#e1e3e5] px-3 md:px-6 py-2.5 md:py-3 sticky top-0 z-20 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            {/* Left side: Hamburger button + Breadcrumbs + Current Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 active:bg-stone-200 border border-stone-200 shadow-sm shrink-0 flex items-center justify-center cursor-pointer transition-all"
                title="Open Admin Sidebar Menu"
                aria-label="Open Admin Menu"
              >
                <Menu className="w-5 h-5 text-[#9B111E]" />
              </button>

              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 md:gap-2 text-xs font-semibold min-w-0 flex-1 overflow-x-auto no-scrollbar whitespace-nowrap mask-edges-right">
                <Link href="/admin" className="text-stone-400 hover:text-stone-800 transition-colors shrink-0 flex items-center gap-1.5">
                  <span>Store Admin</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/80 leading-none shrink-0" title="Admin Version">
                    v1.7.4
                  </span>
                </Link>
                <span className="text-stone-300 shrink-0">/</span>
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  breadcrumbs.map((b, i) => (
                    <React.Fragment key={i}>
                      {b.href ? (
                        <Link href={b.href} className="text-stone-500 hover:text-stone-900 transition-colors truncate shrink-0 max-w-[120px] sm:max-w-none">
                          {b.label}
                        </Link>
                      ) : (
                        <span className="text-stone-900 font-bold truncate shrink-0">{b.label}</span>
                      )}
                      {i < breadcrumbs.length - 1 && <span className="text-stone-300 shrink-0">/</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-stone-900 font-bold truncate shrink-0">{pageTitle || 'Dashboard'}</span>
                )}
              </div>
            </div>

            {/* Quick Header Actions & Store Button */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1 sm:pb-0">
              {actions}
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold shadow-2xs transition-colors whitespace-nowrap shrink-0"
              >
                <Store className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden xs:inline">Visit Store</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </Link>
              {pathname !== '/admin/products/add' && hasPermission('add_product') && (
                <Link
                  href="/admin/products/add"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Add Product</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 w-full mx-auto space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
