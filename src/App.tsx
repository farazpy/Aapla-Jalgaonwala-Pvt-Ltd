import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/context/LanguageContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { LayoutShell } from '@/components/navigation/LayoutShell';
import { TopProgressLoader } from '@/components/navigation/TopProgressLoader';
import { ScrollToTop } from '@/components/navigation/ScrollToTop';
import { AuthModal } from '@/components/auth/AuthModal';
import { AnalyticsTrackerProvider } from '@/components/analytics/AnalyticsTrackerProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Pages
import HomePage from '@/pages/HomePage';
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const UpwasSpecialPage = lazy(() => import('@/pages/UpwasSpecialPage'));
const OurStoryPage = lazy(() => import('@/pages/OurStoryPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FranchisePage = lazy(() => import('@/pages/FranchisePage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const InstagramPage = lazy(() => import('@/pages/InstagramPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const WomenBusinessPartnerPage = lazy(() => import('@/pages/WomenBusinessPartnerPage'));
const PartnerAnalyticsPage = lazy(() => import('@/pages/PartnerAnalyticsPage'));
const ReferralLandingPage = lazy(() => import('@/pages/ReferralLandingPage'));
const DiwaliComboPage = lazy(() => import('@/pages/DiwaliComboPage'));
const IframeOrderTrackingPage = lazy(() => import('@/pages/IframeOrderTrackingPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('../app/admin/page'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminAddProductPage = lazy(() => import('../app/admin/products/add/page'));
const AdminEditProductPage = lazy(() => import('@/pages/admin/AdminEditProductPage'));
const AdminOrdersPage = lazy(() => import('../app/admin/orders/page'));
const AdminDatabasePage = lazy(() => import('../app/admin/database/page'));
const AdminCategoriesPage = lazy(() => import('../app/admin/categories/page'));
const AdminMediaPage = lazy(() => import('../app/admin/media/page'));
const AdminBrandingPage = lazy(() => import('../app/admin/branding/page'));
const AdminFaviconsPage = lazy(() => import('../app/admin/favicons/page'));
const AdminOwnersPage = lazy(() => import('../app/admin/owners/page'));
const AdminSeoPage = lazy(() => import('../app/admin/seo/page'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })));
const AdminCodSettingsPage = lazy(() => import('@/pages/admin/AdminCodSettingsPage'));
const AdminShravanPage = lazy(() => import('@/pages/admin/AdminShravanPage'));
const AdminSchemaPage = lazy(() => import('@/pages/admin/AdminSchemaPage'));
const AdminCachePage = lazy(() => import('@/pages/admin/AdminCachePage'));
const AdminConfigsPage = lazy(() => import('@/pages/admin/AdminConfigsPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));
const AdminPartnersPage = lazy(() => import('@/pages/admin/AdminPartnersPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminWomanGraphicsPage = lazy(() => import('@/pages/admin/AdminWomanGraphicsPage'));
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage').then(m => ({ default: m.AdminRolesPage })));
const AdminSnackMitraPage = lazy(() => import('@/pages/admin/AdminSnackMitraPage'));

export function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AnalyticsTrackerProvider>
                <ScrollToTop />
                <TopProgressLoader />
                <ErrorBoundary moduleName="AuthModal">
                  <AuthModal />
                </ErrorBoundary>
                <LayoutShell>
                  <ErrorBoundary moduleName="AppRoutes">
                    <Suspense
                      fallback={
                        <div className="py-20 bg-stone-50 min-h-[60vh] flex items-center justify-center">
                          <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
                        </div>
                      }
                    >
                      <Routes>
                  {/* Storefront Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/category/:category" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order/:id" element={<OrderSuccessPage />} />
                  <Route path="/upwas-special" element={<UpwasSpecialPage />} />
                  <Route path="/diwali-special" element={<DiwaliComboPage />} />
                  <Route path="/diwali-combo" element={<DiwaliComboPage />} />
                  <Route path="/our-story" element={<OurStoryPage />} />
                  <Route path="/about" element={<OurStoryPage />} />
                  <Route path="/about-us" element={<OurStoryPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/franchise" element={<FranchisePage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/instagram" element={<InstagramPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/women-business-partner" element={<WomenBusinessPartnerPage />} />
                  <Route path="/partner-program" element={<WomenBusinessPartnerPage />} />
                  <Route path="/partner-analytics" element={<PartnerAnalyticsPage />} />
                  <Route path="/woman-partner-login" element={<PartnerAnalyticsPage />} />
                  <Route path="/women-partner-login" element={<PartnerAnalyticsPage />} />
                  <Route path="/ref/:code" element={<ReferralLandingPage />} />
                  <Route path="/welcome/:code" element={<ReferralLandingPage />} />
                  <Route path="/p/:code" element={<ReferralLandingPage />} />
                  <Route path="/partner/:code" element={<ReferralLandingPage />} />
                  <Route path="/referral/:code" element={<ReferralLandingPage />} />
                  <Route path="/iframe/tracking/:orderId" element={<IframeOrderTrackingPage />} />
                  <Route path="/iframe/tracking" element={<IframeOrderTrackingPage />} />
                  <Route path="/tracking/:orderId" element={<IframeOrderTrackingPage />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/customers" element={<AdminCustomersPage />} />
                  <Route path="/admin/partners" element={<AdminPartnersPage />} />
                  <Route path="/admin/woman-graphics" element={<AdminWomanGraphicsPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/admin/products/add" element={<AdminAddProductPage />} />
                  <Route path="/admin/products/:id" element={<AdminEditProductPage />} />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                  <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                  <Route path="/admin/database" element={<AdminDatabasePage />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/media" element={<AdminMediaPage />} />
                  <Route path="/admin/branding" element={<AdminBrandingPage />} />
                  <Route path="/admin/favicons" element={<AdminFaviconsPage />} />
                  <Route path="/admin/owners" element={<AdminOwnersPage />} />
                  <Route path="/admin/coupons" element={<AdminCouponsPage />} />
                  <Route path="/admin/cod-settings" element={<AdminCodSettingsPage />} />
                  <Route path="/admin/shravan" element={<AdminShravanPage />} />
                  <Route path="/admin/schema" element={<AdminSchemaPage />} />
                  <Route path="/admin/seo" element={<AdminSeoPage />} />
                  <Route path="/admin/cache" element={<AdminCachePage />} />
                  <Route path="/admin/configs" element={<AdminConfigsPage />} />
                  <Route path="/admin/roles" element={<AdminRolesPage />} />
                  <Route path="/admin/staff" element={<AdminRolesPage />} />
                  <Route path="/admin/snack-mitra" element={<AdminSnackMitraPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </LayoutShell>
          </AnalyticsTrackerProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </SettingsProvider>
</LanguageProvider>
  );
}

export default App;
