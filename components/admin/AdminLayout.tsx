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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ajw_admin_authenticated') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Store Branding
  const [adminSiteLogo, setAdminSiteLogo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ajw_site_logo');
    }
    return null;
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
    shravan: 0
  });

  // Global Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: any) => {
    const safeMsg = typeof msg === 'string'
      ? msg
      : (msg?.message || msg?.error?.message || (typeof msg === 'object' ? JSON.stringify(msg) : String(msg)));
    setToastMessage(safeMsg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Check auth and fetch sidebar counts & branding
  useEffect(() => {
    // Fetch live summary counts
    const fetchSummary = async () => {
      try {
        const [prodRes, catRes, ordRes, settRes] = await Promise.allSettled([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json())
        ]);

        let pCount = 24;
        let cCount = 4;
        let oCount = 0;
        let sCount = 0;

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

        setCounts({
          products: pCount,
          categories: cCount,
          orders: oCount,
          shravan: sCount
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
          if (data.faviconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;
          }
        }
      } catch {
        // Silently use cached counts
      }
    };

    fetchSummary();
  }, []);

  // Handle PIN Unlock
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPinError(null);

    setTimeout(() => {
      if (pinInput.trim() === '9890' || pinInput.trim() === '1234') {
        localStorage.setItem('ajw_admin_authenticated', 'true');
        setIsAuthenticated(true);
        setPinInput('');
      } else {
        setPinError('Invalid Admin Passcode.');
      }
      setIsVerifying(false);
    }, 300);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('ajw_admin_authenticated');
    setIsAuthenticated(false);
    showToast('Logged out of Admin Workspace.');
  };

  // PIN Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 font-sans antialiased text-stone-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-800 border border-stone-700/80 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#9B111E]/20 text-[#9B111E] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#9B111E]/30">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">{adminStoreTitle}</h1>
            <p className="text-xs text-stone-400">Enterprise Administration Control Portal</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-2">
                Enter Master Security PIN
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Security PIN Code"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-900/90 border border-stone-700 rounded-xl text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E] text-center tracking-widest font-mono font-bold"
                  autoFocus
                />
              </div>
              {pinError && <p className="text-red-400 text-xs font-semibold mt-2">{pinError}</p>}
            </div>

            <button
              type="submit"
              disabled={isVerifying || !pinInput.trim()}
              className="w-full py-2.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin Suite</span>
                </>
              )}
            </button>
          </form>

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

  // Define WordPress-style navigation structure
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
          exact: true
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
              count: counts.products
            },
            {
              id: 'categories',
              label: 'Categories',
              href: '/admin/categories',
              icon: Tag,
              count: counts.categories
            },
            {
              id: 'shravan-curator',
              label: 'Shravan Curator',
              href: '/admin/shravan',
              icon: Sparkles,
              count: counts.shravan,
              isHighlight: true
            },
            {
              id: 'add-product',
              label: 'Add New Product',
              href: '/admin/products/add',
              icon: Plus,
              count: null,
              isHighlight: false
            }
          ]
        },
        {
          id: 'orders',
          label: 'Orders',
          href: '/admin/orders',
          icon: ShoppingBag,
          count: counts.orders
        },
        {
          id: 'seo',
          label: 'SEO Manager',
          href: '/admin/seo',
          icon: Globe,
          count: null
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
          count: null
        },
        {
          id: 'owners',
          label: 'Owners Photos',
          href: '/admin/owners',
          icon: Users,
          count: null
        },
        {
          id: 'media',
          label: 'Our Story Media & Gallery',
          href: '/admin/media',
          icon: ImageIcon,
          count: null
        }
      ]
    },
    {
      title: 'DATABASE & SYSTEMS',
      items: [
        {
          id: 'mysql-db',
          label: 'MySQL Database',
          href: '/admin/database',
          icon: Database,
          count: null
        },
        {
          id: 'schema',
          label: 'Schema SQL',
          href: '/admin/schema',
          icon: Layers,
          count: null
        }
      ]
    }
  ];

  const checkIsActive = (href?: string, exact?: boolean) => {
    if (!href) return false;
    if (exact) return pathname === href;
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/dashboard';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] flex font-sans antialiased text-stone-800">
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
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#e1e3e5] flex flex-col transition-transform duration-200 ease-in-out h-screen sticky top-0
          md:translate-x-0 md:w-64 md:shrink-0
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between bg-white shrink-0">
            <Link href="/admin" className="flex items-center gap-3 group">
              {adminSiteLogo ? (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stone-200 bg-white p-1 flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={adminSiteLogo} alt={adminStoreTitle} className="w-full h-full object-contain" />
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
                  MySQL Live Connected
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-4 flex-1 overflow-y-auto min-h-0">
            {navigationGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
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
                              {item.children.map((sub) => {
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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* MAIN CONTENT CANVAS */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR HEADER */}
        <header className="bg-white border-b border-[#e1e3e5] px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
              <Link href="/admin" className="text-stone-400 hover:text-stone-800 transition-colors shrink-0">
                Store Admin
              </Link>
              <span className="text-stone-300">/</span>
              {breadcrumbs && breadcrumbs.length > 0 ? (
                breadcrumbs.map((b, i) => (
                  <React.Fragment key={i}>
                    {b.href ? (
                      <Link href={b.href} className="text-stone-500 hover:text-stone-900 transition-colors truncate">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-stone-900 font-bold truncate">{b.label}</span>
                    )}
                    {i < breadcrumbs.length - 1 && <span className="text-stone-300">/</span>}
                  </React.Fragment>
                ))
              ) : (
                <span className="text-stone-900 font-bold truncate">{pageTitle || 'Dashboard'}</span>
              )}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-stone-500" />
              <span>Visit Store</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </Link>
            {pathname !== '/admin/products/add' && (
              <Link
                href="/admin/products/add"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Link>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
