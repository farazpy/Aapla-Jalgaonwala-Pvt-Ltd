import express, { Request, Response, Router } from 'express';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { CouponRepository } from '../repositories/CouponRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { UserRepository, SUPER_ADMIN_EMAIL } from '../repositories/UserRepository';
import { OwnersRepository } from '../repositories/OwnersRepository';
import { MediaRepository } from '../repositories/MediaRepository';
import { SeoRepository } from '../repositories/SeoRepository';
import { InquiryRepository } from '../repositories/InquiryRepository';
import { StockNotificationRepository } from '../repositories/StockNotificationRepository';
import { CloudinaryAssetRepository } from '../repositories/CloudinaryAssetRepository';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { PartnerRepository } from '../repositories/PartnerRepository';
import { WomanGraphicsRepository } from '../repositories/WomanGraphicsRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { AdminRoleRepository, ALL_PERMISSIONS, ALL_PERMISSION_KEYS } from '../repositories/AdminRoleRepository';
import { getDbPool, getDbConfig, testDbConnection, resetDbPool } from '../database/connection';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse';
import { enhanceProductDetails, generateSeoWithGemini, analyzeSeoImprovements } from '../utils/gemini';
import { handleSupportChat } from '../utils/aiSupportKnowledge';
import { SnackMitraRepository } from '../repositories/SnackMitraRepository';
import {
  sendEmail,
  generateOrderConfirmationEmailHtml,
  generateAdminNewOrderAlertEmailHtml,
  generateOrderStatusUpdateEmailHtml,
  generateOrderShippedEmailHtml,
  generateStockNotificationConfirmationEmailHtml,
  generateBackInStockEmailHtml,
  generatePartnerRegistrationAdminAlertEmailHtml,
  generatePartnerPendingRegistrationEmailHtml,
  generatePartnerApprovedEmailHtml,
  generatePartnerWelcomeEmailHtml,
  generateOTPEmailHtml
} from '../utils/mailer';
import { generateAndSaveOTP, verifyOTP, clearOTP } from '../utils/otpStore';
import { sendTelegramAlert, sendTelegramAlertDetailed, formatOrderTelegramAlert } from '../utils/telegram';
import { generateInvoicePdfBuffer } from '../utils/invoice';
import { formatDisplayName, isCorruptedQuestionMarks } from '../utils/transliterate';
import { verifyRecaptcha } from '../utils/recaptcha';
import { safeUploadMiddleware, uploadMiddleware, processAndSaveImage } from '../utils/imageProcessor';
import { uploadToCloudinary, isCloudinaryConfigured, isCloudinaryConfiguredAsync, addCloudinaryOriginalFlag } from '../utils/cloudinary';
import { uploadToTeleCloud, isTeleCloudConfiguredAsync, testTeleCloudConnection } from '../utils/telecloud';
import { CloudinaryMigrationService } from '../services/CloudinaryMigrationService';
import { initialProducts } from '@/data/products';
import { initialCategories } from '@/data/categories';
import { initialSiteSettings } from '@/data/settings';
import { readJson, writeJson } from '../utils/jsonStorage';
import { systemCache } from '../utils/cache';
import { trackingRouter, handleCronTrackingSync, validateDtdcTracking } from './tracking';
import {
  getFaviconSuiteStatus,
  saveSingleFaviconFile,
  generateAllFaviconsFromMaster,
  updateWebManifestJson,
  syncAllIconsToS3
} from '../utils/faviconManager';

export const apiRouter: Router = express.Router();

apiRouter.use('/tracking', trackingRouter);
apiRouter.get('/cron/sync-tracking', handleCronTrackingSync);
apiRouter.post('/cron/sync-tracking', handleCronTrackingSync);

// ----------------------------------------------------
// INTELLIGENT CACHE HEADERS FOR API ENDPOINTS
// ----------------------------------------------------
apiRouter.use((req: Request, res: Response, next) => {
  const isPublicGet = req.method === 'GET' && !req.path.startsWith('/auth') && !req.path.startsWith('/admin') && !req.path.startsWith('/checkout') && !req.path.startsWith('/users');
  
  if (isPublicGet) {
    res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ----------------------------------------------------
// 1. PRODUCTS
// ----------------------------------------------------

apiRouter.get('/products', systemCache.middleware('products'), async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const flavour = req.query.flavour as string;
    const q = (req.query.q || req.query.search) as string;
    const featured = req.query.featured as string;
    const minPrice = req.query.minPrice as string;
    const maxPrice = req.query.maxPrice as string;
    const inStock = req.query.inStock as string;
    const sort = (req.query.sort as string) || 'featured';
    const forceFresh = req.query.nocache === 'true' || req.headers['x-admin-request'] === 'true';

    let products = await ProductRepository.getAll(false, forceFresh);

    // Attach dynamic ratings based on approved reviews
    try {
      const reviews = await ReviewRepository.getAll();
      products = products.map(p => {
        const pReviews = reviews.filter(r => r.status === 'approved' && (r.productId === p.id || r.productSlug === p.slug));
        const reviewsCount = pReviews.length;
        const totalRating = pReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviewsCount > 0 ? Number((totalRating / reviewsCount).toFixed(1)) : 4.9;
        return {
          ...p,
          rating: averageRating,
          reviewsCount: reviewsCount
        };
      });
    } catch (err) {
      console.warn('Failed to dynamically attach reviews to products list:', err);
    }

    if (q) {
      const term = q.trim().toLowerCase();
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          (p.flavour && p.flavour.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(term))) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (category && category !== 'all') {
      const targetCat = category.trim().toLowerCase();
      products = products.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        const pCatId = (p.categoryId || '').toLowerCase();
        const pCatName = (p.categoryName || '').toLowerCase().replace(/\s+/g, '-');
        return (
          pCat === targetCat ||
          pCatId === targetCat ||
          pCatName === targetCat ||
          pCat.replace(/\s+/g, '-') === targetCat
        );
      });
    }

    if (flavour && flavour !== 'all') {
      const f = flavour.toLowerCase();
      products = products.filter(p => {
        if (!p.flavour && !p.tags) return false;
        const prodFlavour = (p.flavour || '').toLowerCase();
        const prodTags = (p.tags || []).map(t => t.toLowerCase());

        if (f === 'classic') return prodFlavour.includes('salty') || prodFlavour.includes('plain') || prodTags.includes('classic');
        if (f === 'spicy') return prodFlavour.includes('masala') || prodFlavour.includes('peri') || prodFlavour.includes('pepper') || prodTags.includes('spicy');
        if (f === 'tangy') return prodFlavour.includes('pudina') || prodFlavour.includes('tomato') || prodFlavour.includes('pani poori');
        if (f === 'cheesy') return prodFlavour.includes('cheese');
        if (f === 'fresh') return prodFlavour.includes('pudina') || prodTags.includes('fresh');
        if (f === 'experimental') return prodFlavour.includes('noodle') || prodFlavour.includes('maggi') || prodTags.includes('experimental');

        return prodFlavour.includes(f) || prodTags.includes(f);
      });
    }

    if (featured === 'true') {
      products = products.filter(p => p.isFeatured);
    }

    if (inStock === 'true') {
      products = products.filter(p => p.isAvailable && p.stock > 0);
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) products = products.filter(p => p.price >= min);
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) products = products.filter(p => p.price <= max);
    }

    // Enrich with Category details (category_id and category_name)
    try {
      const allCategories = await CategoryRepository.getAll();
      const catMap = new Map<string, any>();
      allCategories.forEach(c => {
        catMap.set(String(c.id).toLowerCase(), c);
        catMap.set(String(c.slug).toLowerCase(), c);
        catMap.set(String(c.name).toLowerCase(), c);
        catMap.set(String(c.name).toLowerCase().replace(/\s+/g, '-'), c);
      });

      products = products.map(p => {
        const pCat = (p.category || '').toLowerCase();
        const pCatId = (p.categoryId || '').toLowerCase();
        const pCatSlug = (p.categorySlug || '').toLowerCase();
        const matchedCat = catMap.get(pCatId) || catMap.get(pCat) || catMap.get(pCatSlug) || catMap.get(pCat.replace(/\s+/g, '-'));

        const resolvedCatId = matchedCat?.id || p.categoryId || p.category || '';
        const resolvedCatName = matchedCat?.name || p.categoryName || p.category || '';

        return {
          ...p,
          category_id: resolvedCatId,
          category_name: resolvedCatName,
          categoryId: resolvedCatId,
          categoryName: resolvedCatName
        };
      });
    } catch (catErr) {
      console.warn('Failed to attach category metadata to products list:', catErr);
    }

    // Sort
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sort === 'newest') {
      products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return res.json(createSuccessResponse(products, { count: products.length }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch products'));
  }
});

apiRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    if (!productData.name || !productData.price) {
      return res.status(400).json(createErrorResponse('Name and price are required'));
    }

    const created = await ProductRepository.create(productData);
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.status(201).json(createSuccessResponse(created));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create product'));
  }
});

// Bulk update endpoints for admin and public products (MUST be registered before /:id parameter routes)
apiRouter.put('/admin/products/bulk', async (req: Request, res: Response) => {
  try {
    const { ids, updates } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('ids array is required for bulk update'));
    }
    const result = await ProductRepository.bulkUpdate(ids, updates || {});
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.json(createSuccessResponse(result, `Successfully bulk updated ${result.updatedCount} products`));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to bulk update products'));
  }
});

apiRouter.put('/products/bulk', async (req: Request, res: Response) => {
  try {
    const { ids, updates } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('ids array is required for bulk update'));
    }
    const result = await ProductRepository.bulkUpdate(ids, updates || {});
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.json(createSuccessResponse(result, `Successfully bulk updated ${result.updatedCount} products`));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to bulk update products'));
  }
});

// Admin Product Routes
apiRouter.get('/admin/products', async (req: Request, res: Response) => {
  try {
    ProductRepository.clearCache();
    systemCache.flush('products');
    const products = await ProductRepository.getAll(true, true);
    return res.json(createSuccessResponse(products));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch admin products'));
  }
});

apiRouter.post('/admin/products', async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    if (!productData || !productData.name || productData.price === undefined) {
      return res.status(400).json(createErrorResponse('Name and price are required'));
    }

    const created = await ProductRepository.create(productData);
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.status(201).json(createSuccessResponse(created, 'Product created successfully in database'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create product'));
  }
});

apiRouter.get('/admin/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let product = await ProductRepository.getById(id);
    if (!product) {
      product = await ProductRepository.getBySlug(id);
    }
    if (!product) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }
    return res.json(createSuccessResponse(product));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch product'));
  }
});

apiRouter.put('/admin/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let existing = await ProductRepository.getById(id);
    if (!existing) {
      existing = await ProductRepository.getBySlug(id);
    }
    if (!existing) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }

    const updated = await ProductRepository.update(existing.id, req.body);
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.json(createSuccessResponse(updated, 'Product updated successfully in MySQL database'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update product'));
  }
});

apiRouter.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let existing = await ProductRepository.getById(id);
    if (!existing) {
      existing = await ProductRepository.getBySlug(id);
    }
    if (!existing) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }

    const updated = await ProductRepository.update(existing.id, req.body);
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.json(createSuccessResponse(updated, 'Product updated successfully in MySQL database'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update product'));
  }
});

apiRouter.delete('/admin/products/delete-fake', async (req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    let deletedCount = 0;
    if (pool) {
      // 1. Find all fake product IDs in MySQL
      const [fakeProds] = await pool.query('SELECT id FROM products WHERE _is_fake = 1');
      if (Array.isArray(fakeProds) && fakeProds.length > 0) {
        const fakeIds = fakeProds.map(p => p.id);
        deletedCount = fakeIds.length;
        
        // 2. Delete variants
        await pool.query('DELETE FROM product_variants WHERE product_id IN (?)', [fakeIds]);
        // 3. Delete images
        await pool.query('DELETE FROM product_images WHERE product_id IN (?)', [fakeIds]);
        // 4. Delete products
        await pool.query('DELETE FROM products WHERE id IN (?)', [fakeIds]);
      }
    }
    
    // Also remove from local JSON file
    const allJson = await ProductRepository.getAll(true, true);
    const cleanJson = allJson.filter(p => !(p as any)._is_fake && !(p as any).is_fake);
    await ProductRepository.saveAll(cleanJson);

    ProductRepository.clearCache();
    systemCache.flush('products');

    return res.json(createSuccessResponse({ success: true, deletedCount, message: `Successfully deleted ${deletedCount} fake products.` }));
  } catch (error: any) {
    console.error('[API Delete Fake Products Error]:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete fake products'));
  }
});

apiRouter.delete('/admin/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let existing = await ProductRepository.getById(id);
    if (!existing) {
      existing = await ProductRepository.getBySlug(id);
    }
    if (!existing) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }

    await ProductRepository.delete(existing.id);
    ProductRepository.clearCache();
    systemCache.flush('products');
    return res.json(createSuccessResponse({ id: existing.id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete product'));
  }
});

apiRouter.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let product = await ProductRepository.getBySlug(slug);
    if (!product) {
      product = await ProductRepository.getById(slug);
    }

    if (!product) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }

    // Attach dynamic calculated ratings and reviewsCount
    try {
      const reviews = await ReviewRepository.getAll();
      const pReviews = reviews.filter(r => r.status === 'approved' && (r.productId === product!.id || r.productSlug === product!.slug));
      const reviewsCount = pReviews.length;
      const totalRating = pReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviewsCount > 0 ? Number((totalRating / reviewsCount).toFixed(1)) : 4.9;

      product = {
        ...product,
        rating: averageRating,
        reviewsCount: reviewsCount
      };
    } catch (err) {
      console.warn('Failed to dynamically attach reviews to product detail:', err);
    }

    // Attach category details
    try {
      const allCategories = await CategoryRepository.getAll();
      const pCat = (product.category || '').toLowerCase();
      const pCatId = (product.categoryId || '').toLowerCase();
      const pCatSlug = (product.categorySlug || '').toLowerCase();
      const matchedCat = allCategories.find(
        c => String(c.id).toLowerCase() === pCatId ||
             String(c.slug).toLowerCase() === pCat ||
             String(c.slug).toLowerCase() === pCatSlug ||
             String(c.name).toLowerCase() === pCat
      );

      const resolvedCatId = matchedCat?.id || product.categoryId || product.category || '';
      const resolvedCatName = matchedCat?.name || product.categoryName || product.category || '';

      product = {
        ...product,
        category_id: resolvedCatId,
        category_name: resolvedCatName,
        categoryId: resolvedCatId,
        categoryName: resolvedCatName
      };
    } catch (catErr) {
      console.warn('Failed to attach category metadata to product detail:', catErr);
    }

    const recommendations = await ProductRepository.getRecommendations(product.category, product.id, 4);

    // Dynamic ratings for recommendations
    let updatedRecommendations = recommendations;
    try {
      const reviews = await ReviewRepository.getAll();
      updatedRecommendations = recommendations.map(rec => {
        const recReviews = reviews.filter(r => r.status === 'approved' && (r.productId === rec.id || r.productSlug === rec.slug));
        const recCount = recReviews.length;
        const recTotalRating = recReviews.reduce((sum, r) => sum + r.rating, 0);
        const recAverageRating = recCount > 0 ? Number((recTotalRating / recCount).toFixed(1)) : 4.9;
        return {
          ...rec,
          rating: recAverageRating,
          reviewsCount: recCount
        };
      });
    } catch (err) {
      console.warn('Failed to dynamically attach reviews to recommendations:', err);
    }

    return res.json(createSuccessResponse({ product, recommendations: updatedRecommendations }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch product'));
  }
});

apiRouter.put('/products/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    let existing = await ProductRepository.getBySlug(slug);
    if (!existing) {
      existing = await ProductRepository.getById(slug);
    }

    if (!existing) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }

    const wasOutOfStock = (existing.stock <= 0) || (existing.isAvailable === false);
    const updated = await ProductRepository.update(existing.id, updateData);
    ProductRepository.clearCache();
    systemCache.flush('products');

    // If product was previously out of stock and is now restocked, send back-in-stock notification emails
    const isNowInStock = (updated.stock > 0) && (updated.isAvailable !== false);
    if (wasOutOfStock && isNowInStock) {
      setTimeout(async () => {
        try {
          const pendingNotifs = await StockNotificationRepository.getPendingForProduct(existing.id);
          const domain = process.env.APP_URL || 'http://aaplajalgaonwala.com';
          const productUrl = `${domain}/product/${updated.slug}`;
          const prodImg = updated.image || (updated.images && updated.images[0]?.url) || '';

          for (const notif of pendingNotifs) {
            const html = generateBackInStockEmailHtml(updated.name, productUrl, updated.price, prodImg);
            await sendEmail({
              to: notif.email,
              subject: `🎉 ${updated.name} is Back in Stock! | Aapla Jalgaonwala`,
              html
            });
            await StockNotificationRepository.markAsNotified(notif.id);
          }
        } catch (err) {
          console.error('[StockNotif] Failed to auto-dispatch back-in-stock emails:', err);
        }
      }, 500);
    }

    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update product'));
  }
});

apiRouter.delete('/products/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let existing = await ProductRepository.getBySlug(slug);
    if (!existing) {
      existing = await ProductRepository.getById(slug);
    }

    if (!existing) {
      return res.status(404).json(createErrorResponse('Product not found'));
    }

    await ProductRepository.delete(existing.id);
    return res.json(createSuccessResponse({ id: existing.id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete product'));
  }
});

// Product Reviews: Get Reviews for a Product
apiRouter.get('/products/:slug/reviews', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let product = await ProductRepository.getBySlug(slug);
    if (!product) {
      product = await ProductRepository.getById(slug);
    }

    const productId = product ? product.id : slug;
    const stats = await ReviewRepository.getByProductId(productId, true);
    const settings = await SettingsRepository.getSettings();

    return res.json(
      createSuccessResponse({
        ...stats,
        settings: {
          reviewsEnabled: settings.reviewsEnabled !== false,
          reviewSubmissionPermission: settings.reviewSubmissionPermission || 'all',
          reviewAutoApprove: Boolean(settings.reviewAutoApprove),
          requireReviewComment: Boolean(settings.requireReviewComment)
        }
      })
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch reviews'));
  }
});

// Product Reviews: Submit a Review for a Product
apiRouter.post('/products/:slug/reviews', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { rating, customerName, customerEmail, userId, title, comment } = req.body;

    const settings = await SettingsRepository.getSettings();
    if (settings.reviewsEnabled === false) {
      return res.status(403).json(createErrorResponse('Review submissions are currently disabled on this store.'));
    }

    const permission = settings.reviewSubmissionPermission || 'all';
    if (permission === 'disabled') {
      return res.status(403).json(createErrorResponse('Review submissions are currently closed by admin.'));
    }

    if (permission === 'customers_only' && !userId && !customerEmail) {
      return res.status(401).json(createErrorResponse('Please log in with your customer account to submit a review.'));
    }

    if (!customerName || !customerName.trim()) {
      return res.status(400).json(createErrorResponse('Customer name is required.'));
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json(createErrorResponse('Star rating must be between 1 and 5 stars.'));
    }

    if (settings.requireReviewComment && (!comment || !comment.trim())) {
      return res.status(400).json(createErrorResponse('Please provide your review feedback comment.'));
    }

    let product = await ProductRepository.getBySlug(slug);
    if (!product) {
      product = await ProductRepository.getById(slug);
    }

    if (!product) {
      return res.status(404).json(createErrorResponse('Product not found.'));
    }

    // Check if customer is a verified buyer (placed an order with this product)
    let isVerified = false;
    if (customerEmail) {
      try {
        const customerOrders = await OrderRepository.getByCustomerEmail(customerEmail.trim());
        isVerified = customerOrders.some(order =>
          order.items && order.items.some((item: any) => item.productId === product.id || item.productName === product.name)
        );
      } catch {
        // ignore error
      }
    }

    if (permission === 'verified_buyers_only' && !isVerified) {
      return res.status(403).json(
        createErrorResponse('Only verified buyers who have purchased this snack can submit a review.')
      );
    }

    const autoApprove = Boolean(settings.reviewAutoApprove);
    const reviewStatus = autoApprove ? 'approved' : 'pending';

    const createdReview = await ReviewRepository.create({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      customerName: customerName.trim(),
      customerEmail: customerEmail?.trim(),
      userId: userId || undefined,
      rating: numericRating,
      title: title?.trim(),
      comment: comment?.trim() || '',
      isVerified,
      status: reviewStatus
    });

    systemCache.flush();
    ProductRepository.clearCache();

    return res.json(
      createSuccessResponse(
        {
          review: createdReview,
          isPending: reviewStatus === 'pending'
        },
        autoApprove
          ? 'Thank you! Your rating and review have been published successfully.'
          : 'Thank you! Your review has been submitted and will be published after quick team moderation.'
      )
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to submit review'));
  }
});

// Like a Review
apiRouter.post('/reviews/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await ReviewRepository.getById(id);
    if (!review) {
      return res.status(404).json(createErrorResponse('Review not found'));
    }

    const updated = await ReviewRepository.update(id, {
      likes: (review.likes || 0) + 1
    });

    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to like review'));
  }
});

// ----------------------------------------------------
// 2. CATEGORIES
// ----------------------------------------------------

apiRouter.get('/categories', systemCache.middleware('categories'), async (_req: Request, res: Response) => {
  try {
    const categories = await CategoryRepository.getAll();
    const formatted = categories.map(c => ({
      ...c,
      product_count: c.productCount || 0,
      productCount: c.productCount || 0
    }));
    return res.json(createSuccessResponse(formatted, { count: formatted.length }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch categories'));
  }
});

// GET /api/categories/products/:id - List all products in a category (by ID or Slug)
apiRouter.get('/categories/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = id.trim().toLowerCase();

    const allCategories = await CategoryRepository.getAll();
    const targetCategory = allCategories.find(
      c => String(c.id).toLowerCase() === cleanId ||
           String(c.slug).toLowerCase() === cleanId ||
           String(c.name).toLowerCase() === cleanId ||
           String(c.name).toLowerCase().replace(/\s+/g, '-') === cleanId
    ) || null;

    const allProducts = await ProductRepository.getAll();
    const categoryTargetName = targetCategory ? targetCategory.name.toLowerCase() : cleanId;
    const categoryTargetSlug = targetCategory ? targetCategory.slug.toLowerCase() : cleanId;
    const categoryTargetId = targetCategory ? String(targetCategory.id).toLowerCase() : cleanId;

    const matchingProducts = allProducts.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pCatId = (p.categoryId || '').toLowerCase();
      const pCatSlug = (p.categorySlug || '').toLowerCase();
      return (
        pCat === categoryTargetName ||
        pCat === categoryTargetSlug ||
        pCatId === categoryTargetId ||
        pCatSlug === categoryTargetSlug ||
        pCat.replace(/\s+/g, '-') === categoryTargetSlug
      );
    }).map(p => ({
      ...p,
      category_id: targetCategory ? targetCategory.id : (p.categoryId || p.category),
      category_name: targetCategory ? targetCategory.name : (p.categoryName || p.category),
      categoryId: targetCategory ? targetCategory.id : (p.categoryId || p.category),
      categoryName: targetCategory ? targetCategory.name : (p.categoryName || p.category)
    }));

    return res.json(createSuccessResponse(matchingProducts, {
      count: matchingProducts.length,
      category: targetCategory ? {
        ...targetCategory,
        product_count: matchingProducts.length,
        productCount: matchingProducts.length
      } : null
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch category products'));
  }
});

// GET /api/categories/:id/products - Standard REST alias for category products
apiRouter.get('/categories/:id/products', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = id.trim().toLowerCase();

    const allCategories = await CategoryRepository.getAll();
    const targetCategory = allCategories.find(
      c => String(c.id).toLowerCase() === cleanId ||
           String(c.slug).toLowerCase() === cleanId ||
           String(c.name).toLowerCase() === cleanId ||
           String(c.name).toLowerCase().replace(/\s+/g, '-') === cleanId
    ) || null;

    const allProducts = await ProductRepository.getAll();
    const categoryTargetName = targetCategory ? targetCategory.name.toLowerCase() : cleanId;
    const categoryTargetSlug = targetCategory ? targetCategory.slug.toLowerCase() : cleanId;
    const categoryTargetId = targetCategory ? String(targetCategory.id).toLowerCase() : cleanId;

    const matchingProducts = allProducts.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pCatId = (p.categoryId || '').toLowerCase();
      const pCatSlug = (p.categorySlug || '').toLowerCase();
      return (
        pCat === categoryTargetName ||
        pCat === categoryTargetSlug ||
        pCatId === categoryTargetId ||
        pCatSlug === categoryTargetSlug ||
        pCat.replace(/\s+/g, '-') === categoryTargetSlug
      );
    }).map(p => ({
      ...p,
      category_id: targetCategory ? targetCategory.id : (p.categoryId || p.category),
      category_name: targetCategory ? targetCategory.name : (p.categoryName || p.category),
      categoryId: targetCategory ? targetCategory.id : (p.categoryId || p.category),
      categoryName: targetCategory ? targetCategory.name : (p.categoryName || p.category)
    }));

    return res.json(createSuccessResponse(matchingProducts, {
      count: matchingProducts.length,
      category: targetCategory ? {
        ...targetCategory,
        product_count: matchingProducts.length,
        productCount: matchingProducts.length
      } : null
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch category products'));
  }
});

// GET /api/categories/:id - Get single category information by ID or Slug
apiRouter.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = id.trim().toLowerCase();

    const allCategories = await CategoryRepository.getAll();
    const category = allCategories.find(
      c => String(c.id).toLowerCase() === cleanId ||
           String(c.slug).toLowerCase() === cleanId ||
           String(c.name).toLowerCase() === cleanId ||
           String(c.name).toLowerCase().replace(/\s+/g, '-') === cleanId
    );

    if (!category) {
      return res.status(404).json(createErrorResponse(`Category not found for identifier: "${id}"`));
    }

    return res.json(createSuccessResponse({
      ...category,
      product_count: category.productCount || 0,
      productCount: category.productCount || 0
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch category'));
  }
});

apiRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    if (!categoryData.name) {
      return res.status(400).json(createErrorResponse('Category name is required'));
    }
    const created = await CategoryRepository.create(categoryData);
    systemCache.flush('categories');
    systemCache.flush('products');
    return res.status(201).json(createSuccessResponse(created));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create category'));
  }
});

apiRouter.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await CategoryRepository.update(id, updateData);
    systemCache.flush('categories');
    systemCache.flush('products');
    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update category'));
  }
});

apiRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await CategoryRepository.delete(id);
    systemCache.flush('categories');
    systemCache.flush('products');
    return res.json(createSuccessResponse({ id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete category'));
  }
});

// ----------------------------------------------------
// 3. COUPONS
// ----------------------------------------------------

apiRouter.get('/coupons', systemCache.middleware('coupons'), async (req: Request, res: Response) => {
  try {
    let coupons = await CouponRepository.getAll();
    const includePartners = req.query.includePartners === 'true';
    if (!includePartners) {
      const partners = await PartnerRepository.getAll().catch(() => []);
      const partnerCodes = new Set(partners.map((p) => (p.partnerCode || '').trim().toUpperCase()));
      coupons = coupons.filter((c) => {
        if ((c as any).isPartnerCode) return false;
        const code = (c.code || '').trim().toUpperCase();
        if (code.startsWith('AJW-') || code.startsWith('WBP-') || partnerCodes.has(code)) return false;
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
      });
    }
    return res.json(createSuccessResponse(coupons));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch coupons'));
  }
});

apiRouter.get('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let coupon = await CouponRepository.getById(id);
    if (!coupon) {
      coupon = await CouponRepository.getByCode(id);
    }
    if (!coupon) {
      return res.status(404).json(createErrorResponse('Coupon not found'));
    }
    return res.json(createSuccessResponse(coupon));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch coupon'));
  }
});

apiRouter.post('/coupons', async (req: Request, res: Response) => {
  try {
    const couponData = req.body;
    if (!couponData.code || couponData.code.trim() === '') {
      return res.status(400).json(createErrorResponse('Coupon code is required'));
    }
    const created = await CouponRepository.create(couponData);
    systemCache.flush('coupons');
    return res.status(201).json(createSuccessResponse(created));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create coupon'));
  }
});

apiRouter.put('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await CouponRepository.update(id, updateData);
    if (!updated) {
      return res.status(404).json(createErrorResponse('Coupon not found'));
    }
    systemCache.flush('coupons');
    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update coupon'));
  }
});

apiRouter.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CouponRepository.delete(id);
    if (!deleted) {
      return res.status(404).json(createErrorResponse('Coupon not found'));
    }
    systemCache.flush('coupons');
    return res.json(createSuccessResponse({ id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete coupon'));
  }
});

apiRouter.post('/coupons/auto-apply', async (req: Request, res: Response) => {
  try {
    const { cartTotal, subtotal, items, isFirstTimeUser, paymentMethod } = req.body;
    const total = typeof cartTotal === 'number' ? cartTotal : (typeof subtotal === 'number' ? subtotal : Number(cartTotal || subtotal || 0));

    const autoApplyResult = await CouponRepository.getAutoApplyCoupon(total, items, { isFirstTimeUser, paymentMethod });

    if (!autoApplyResult || !autoApplyResult.valid) {
      return res.json(createSuccessResponse({ applied: false }));
    }

    return res.json(createSuccessResponse({
      applied: true,
      coupon: autoApplyResult.coupon,
      discount: autoApplyResult.discount,
      autoApplyTitle: autoApplyResult.autoApplyTitle
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to check auto-apply coupon'));
  }
});

apiRouter.post('/coupons/validate', async (req: Request, res: Response) => {
  try {
    const { code, cartTotal, subtotal, items, isFirstTimeUser, paymentMethod } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json(createErrorResponse('Coupon or promo code is required'));
    }

    const total = typeof cartTotal === 'number' ? cartTotal : (typeof subtotal === 'number' ? subtotal : Number(cartTotal || subtotal || 0));
    const cleanCode = String(code).trim().toUpperCase();

    // 1. Check if it is a Women Partner Referral Code first
    const partner = await PartnerRepository.getByCode(cleanCode);
    if (partner && (partner.status === 'active' || partner.status === 'approved')) {
      const discountRate = partner.customerDiscountRate || 4.0;
      const discountAmount = Math.round((total * (discountRate / 100)) * 100) / 100;

      return res.json(createSuccessResponse({
        coupon: {
          id: `partner_${partner.partnerCode}`,
          code: partner.partnerCode,
          type: 'percentage',
          value: discountRate,
          description: `Discount from ${partner.fullName}`,
          autoApplyTitle: `Discount from ${partner.fullName}`,
          isStoreWide: true,
          isActive: true,
          isPartnerCode: true,
          partnerName: partner.fullName
        },
        discount: discountAmount,
        isPartnerCode: true,
        partnerName: partner.fullName
      }));
    }

    // 2. Try store coupon validation
    const validationResult = await CouponRepository.validate(
      cleanCode,
      total,
      items,
      { isFirstTimeUser, paymentMethod }
    );

    if (validationResult.valid && validationResult.coupon) {
      return res.json(createSuccessResponse({
        coupon: validationResult.coupon,
        discount: validationResult.discount,
        isPartnerCode: false
      }));
    }

    return res.status(400).json(createErrorResponse(validationResult.reason || `Invalid promo or coupon code "${cleanCode}".`));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to validate coupon'));
  }
});

// ----------------------------------------------------
// 4. ORDERS & INVOICE PDF
// ----------------------------------------------------

// ----------------------------------------------------
// ORDER NOTIFICATION DISPATCH HELPER
// (Only called when payment is captured/verified or pure COD confirmed)
// ----------------------------------------------------
async function dispatchOrderConfirmationNotifications(order: any) {
  try {
    const siteSettings = await SettingsRepository.get();

    // 1. Send customer confirmation email
    if (order.customer?.email) {
      sendEmail({
        to: order.customer.email,
        subject: `Order Confirmed #${order.orderNumber} | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`,
        html: generateOrderConfirmationEmailHtml(order, siteSettings)
      }).catch(err => console.warn('[Order] Customer email notification error:', err));
    }

    // 2. Send admin alert email
    const adminEmail =
      siteSettings.adminNotificationEmail ||
      siteSettings.contactEmail ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      'orders@aapla-jalgaonwala.in';

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `🚨 [New Order] #${order.orderNumber} - ₹${order.totalAmount} (${order.paymentMethod || 'COD'}) from ${order.customer?.name || 'Customer'}`,
        html: generateAdminNewOrderAlertEmailHtml(order, siteSettings)
      }).catch(err => console.warn('[Order] Admin email notification error:', err));
    }

    // 3. Send instant Telegram alert with full customer, address, items & payment breakdown
    if (siteSettings.enableTelegramAlerts !== false && siteSettings.telegramBotToken && siteSettings.telegramChatId) {
      const telegramText = formatOrderTelegramAlert(order, siteSettings);
      sendTelegramAlert(telegramText).catch(err => console.warn('[Order] Telegram alert error:', err));
    }

    // 4. Increment coupon usage counter
    if (order.couponCode) {
      CouponRepository.incrementUsage(order.couponCode).catch(err =>
        console.warn('[Order] Coupon usage increment warning:', err)
      );
    }

    // 5. Record partner referral
    const partnerCode = order.referralPartnerCode || order.partnerCode || order.referralCode;
    if (partnerCode) {
      PartnerRepository.recordOrderReferral({
        partnerCode,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal: order.totalAmount,
        customerName: order.customer?.name || 'Customer',
        customerCity: order.shippingAddress?.city || 'Maharashtra'
      }).then(ref => {
        if (ref) {
          console.log(`[PartnerReferral] Linked order #${order.orderNumber} to partner ${partnerCode} (Commission: ₹${ref.partnerCommission})`);
        }
      }).catch(err => console.warn('[PartnerReferral] Error recording referral:', err));
    }
  } catch (err) {
    console.warn('[Order Notification Dispatch] Error:', err);
  }
}

apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await OrderRepository.getAll();
    let partners: any[] = [];
    let referrals: any[] = [];
    try {
      [partners, referrals] = await Promise.all([
        PartnerRepository.getAll(),
        PartnerRepository.getReferrals()
      ]);
    } catch (_) {}

    const partnerByCode = new Map(partners.map(p => [(p.partnerCode || '').trim().toUpperCase(), p]));
    const referralByOrderId = new Map(referrals.map(r => [String(r.orderId), r]));
    const referralByOrderNum = new Map(referrals.map(r => [String(r.orderNumber), r]));

    const enriched = orders.map(order => {
      const ref = referralByOrderId.get(String(order.id)) || referralByOrderNum.get(String(order.orderNumber));
      let partnerCode = order.referralPartnerCode || (ref ? ref.partnerCode : undefined);
      if (!partnerCode && order.couponCode) {
        const cleanCoupon = order.couponCode.trim().toUpperCase();
        if (partnerByCode.has(cleanCoupon)) {
          partnerCode = cleanCoupon;
        }
      }
      const partner = partnerCode ? partnerByCode.get(partnerCode.trim().toUpperCase()) : undefined;
      
      // Determine partner name, prioritizing valid full name from business_partners
      let rawName: string | undefined = undefined;
      if (partner?.fullName && !isCorruptedQuestionMarks(partner.fullName)) {
        rawName = partner.fullName;
      } else if (ref?.partnerName && !isCorruptedQuestionMarks(ref.partnerName)) {
        rawName = ref.partnerName;
      }

      const partnerName = rawName 
        ? formatDisplayName(rawName, partnerCode) 
        : (partnerCode ? `Partner (${partnerCode})` : undefined);

      let discount = Number(order.discount) || 0;
      if (discount === 0 && (partnerCode || (order.notes && /Discount from/i.test(order.notes)))) {
        const rate = partner?.customerDiscountRate || 4.0;
        discount = Math.round(Number(order.subtotal || 0) * (rate / 100));
      }

      const subtotal = Number(order.subtotal) || 0;
      const shippingFee = Number(order.shippingFee) || 0;
      const totalAmount = (Number(order.totalAmount) > 0 && Number(order.totalAmount) !== subtotal + shippingFee)
        ? Number(order.totalAmount)
        : Math.max(0, subtotal - discount + shippingFee);

      const advancePaid = Number(order.codAdvanceFeePaid) || 0;
      let codRemaining = Number(order.codRemainingBalance) || 0;
      if (order.paymentMethod === 'COD') {
        if (order.paymentStatus === 'Paid') {
          codRemaining = 0;
        } else if (advancePaid > 0) {
          codRemaining = Math.max(0, totalAmount - advancePaid);
        } else if (codRemaining === 0) {
          codRemaining = totalAmount;
        }
      } else {
        codRemaining = 0;
      }

      return {
        ...order,
        subtotal,
        discount,
        shippingFee,
        totalAmount,
        codAdvanceFeePaid: advancePaid,
        codRemainingBalance: codRemaining,
        referralPartnerCode: partnerCode || partner?.partnerCode || undefined,
        referralPartnerName: partnerName
      };
    });

    return res.json(createSuccessResponse(enriched));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch orders'));
  }
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    if (!orderData.items || orderData.items.length === 0 || !orderData.customer || !orderData.shippingAddress) {
      return res.status(400).json(createErrorResponse('Incomplete order data'));
    }

    const cleanEmail = (orderData.customer.email || '').trim().toLowerCase();
    const cleanPhone = (orderData.customer.phone || '').replace(/\D/g, '');
    const customerName = (orderData.customer.name || orderData.shippingAddress.fullName || cleanEmail.split('@')[0] || 'Customer').trim();

    let user: any = null;
    if (cleanEmail) {
      user = await UserRepository.findByEmail(cleanEmail);
    }
    if (!user && cleanPhone) {
      user = await UserRepository.findByPhone(cleanPhone);
    }

    if (!user && cleanEmail) {
      try {
        user = await UserRepository.create({
          name: customerName,
          email: cleanEmail,
          phone: cleanPhone || undefined,
          role: 'customer',
          authProvider: 'local'
        });
      } catch (err) {
        console.warn('[Order] Auto-user creation error:', err);
      }
    } else if (user) {
      // Update phone if missing
      if (!user.phone && cleanPhone) {
        await UserRepository.update(user.id, { phone: cleanPhone });
      }
    }

    // Link customer id if user exists
    if (user) {
      orderData.customer.id = user.id;
    }

    // Determine if payment is required BEFORE order confirmation
    const siteSettings = await SettingsRepository.get();

    // Enforce payment gateway restrictions if COD is disabled
    if (siteSettings.enableCod === false && (orderData.paymentMethod === 'COD' || orderData.paymentMethod === 'Cash on Delivery')) {
      return res.status(400).json(createErrorResponse('Cash on Delivery is currently disabled by store admin. Please checkout using Razorpay Online Payment.'));
    }

    const isCodAdvanceEnabled = siteSettings.enableCod !== false && siteSettings.codAdvanceFeeEnabled === true && Number(siteSettings.codAdvanceFeeAmount || 0) > 0;
    let codAdvanceAmount = 0;
    if (isCodAdvanceEnabled) {
      if (siteSettings.codAdvanceFeeType === 'percentage') {
        codAdvanceAmount = Math.round((orderData.totalAmount * Number(siteSettings.codAdvanceFeeAmount || 10)) / 100);
      } else {
        codAdvanceAmount = Math.min(Number(siteSettings.codAdvanceFeeAmount || 50), orderData.totalAmount);
      }
    }

    const isOnlineRazorpay = orderData.paymentMethod === 'Razorpay';
    const isCodWithAdvance = (orderData.paymentMethod === 'COD' || orderData.paymentMethod === 'Cash on Delivery') && isCodAdvanceEnabled && codAdvanceAmount > 0;
    const requiresOnlinePayment = isOnlineRazorpay || isCodWithAdvance;

    if (requiresOnlinePayment) {
      orderData.status = 'Pending';
      orderData.paymentStatus = 'Payment Pending';
      if (isCodWithAdvance) {
        orderData.notes = orderData.notes ? `${orderData.notes} | Awaiting COD advance fee deposit (₹${codAdvanceAmount})` : `Awaiting COD advance fee deposit (₹${codAdvanceAmount})`;
      } else {
        orderData.notes = orderData.notes ? `${orderData.notes} | Awaiting full online payment via Razorpay` : `Awaiting full online payment via Razorpay`;
      }
    } else {
      orderData.status = 'Confirmed';
      orderData.paymentStatus = 'Unpaid';
    }

    const createdOrder = await OrderRepository.create(orderData);

    // Save shipping address to user's address book for fast next-time checkout
    let savedAddresses: any[] = [];
    if (user && orderData.shippingAddress) {
      try {
        const existingAddresses = await UserRepository.getAddresses(user.id);
        const isDuplicate = existingAddresses.some(
          a =>
            a.addressLine1.toLowerCase().trim() === (orderData.shippingAddress.addressLine1 || '').toLowerCase().trim() &&
            a.pincode.trim() === (orderData.shippingAddress.pincode || '').trim()
        );

        if (!isDuplicate && orderData.shippingAddress.addressLine1) {
          await UserRepository.saveAddress(user.id, {
            name: orderData.shippingAddress.fullName || customerName,
            phone: orderData.shippingAddress.phone || cleanPhone || user.phone || '',
            email: cleanEmail || user.email || '',
            addressLine1: orderData.shippingAddress.addressLine1,
            addressLine2: orderData.shippingAddress.addressLine2 || '',
            landmark: orderData.shippingAddress.landmark || '',
            city: orderData.shippingAddress.city || 'Jalgaon',
            state: orderData.shippingAddress.state || 'Maharashtra',
            pincode: orderData.shippingAddress.pincode || '425001',
            isDefault: existingAddresses.length === 0
          });
        }
        savedAddresses = await UserRepository.getAddresses(user.id);
      } catch (err) {
        console.warn('[Order Auto-Address Save] Error:', err);
      }
    }

    let authUser: any = undefined;
    let authToken: string | undefined = undefined;
    if (user) {
      authToken = generateStrongToken(user.id);
      const { passwordHash: _, ...rest } = user;
      authUser = { ...rest, addresses: savedAddresses.length > 0 ? savedAddresses : await UserRepository.getAddresses(user.id) };
    }

    // ONLY dispatch confirmation emails and alerts if NO online payment is pending (pure COD with 0 advance fee)
    if (!requiresOnlinePayment) {
      await dispatchOrderConfirmationNotifications(createdOrder);
    }

    return res.status(201).json(createSuccessResponse({
      ...createdOrder,
      requiresOnlinePayment,
      authUser,
      authToken
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create order'));
  }
});

// ----------------------------------------------------
// SIMULATED ORDERS GENERATOR (Admin Panel - All Admins)
// ----------------------------------------------------
const handleSimulateOrders = async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    const headerEmail = (req.headers['x-admin-email'] as string) || '';
    const bodyEmail = req.body?.adminEmail || (req as any).adminUser?.email || headerEmail || '';
    const userEmail = (user?.email || bodyEmail || '').trim().toLowerCase();

    const { OrderSimulationService } = await import('../services/OrderSimulationService');
    const result = await OrderSimulationService.simulateOrders({
      ...req.body,
      adminEmail: userEmail || 'admin@aapla-jalgaonwala.com'
    });

    return res.json(createSuccessResponse(result));
  } catch (error: any) {
    console.error('[API simulateOrders Error]:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to simulate orders'));
  }
};

apiRouter.post('/orders/simulate', handleSimulateOrders);
apiRouter.post('/admin/orders/simulate', handleSimulateOrders);

apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let order = await OrderRepository.getById(id);
    if (!order) {
      order = await OrderRepository.getByOrderNumber(id);
    }

    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found'));
    }

    // Enrich single order with partner details if applicable
    let partnerCode = order.referralPartnerCode;
    let partnerName: string | undefined = undefined;
    try {
      const referrals = await PartnerRepository.getReferrals();
      const ref = referrals.find(r => String(r.orderId) === String(order!.id) || String(r.orderNumber) === String(order!.orderNumber));
      if (ref) {
        partnerCode = ref.partnerCode;
        if (ref.partnerName && !isCorruptedQuestionMarks(ref.partnerName)) {
          partnerName = ref.partnerName;
        }
      }
      if ((!partnerName || isCorruptedQuestionMarks(partnerName)) && (partnerCode || order.couponCode)) {
        const targetCode = (partnerCode || order.couponCode || '').trim();
        const p = await PartnerRepository.getByCode(targetCode);
        if (p && p.fullName && !isCorruptedQuestionMarks(p.fullName)) {
          partnerCode = p.partnerCode;
          partnerName = p.fullName;
        }
      }
    } catch (_) {}

    const formattedPartnerName = partnerName 
      ? formatDisplayName(partnerName, partnerCode) 
      : (partnerCode ? `Partner (${partnerCode})` : undefined);

    let discount = Number(order.discount) || 0;
    if (discount === 0 && (partnerCode || (order.notes && /Discount from/i.test(order.notes)))) {
      discount = Math.round(Number(order.subtotal || 0) * 0.04);
    }
    const subtotal = Number(order.subtotal) || 0;
    const shippingFee = Number(order.shippingFee) || 0;
    const totalAmount = (Number(order.totalAmount) > 0 && Number(order.totalAmount) !== subtotal + shippingFee)
      ? Number(order.totalAmount)
      : Math.max(0, subtotal - discount + shippingFee);

    const advancePaid = Number(order.codAdvanceFeePaid) || 0;
    let codRemaining = Number(order.codRemainingBalance) || 0;
    if (order.paymentMethod === 'COD') {
      if (order.paymentStatus === 'Paid') {
        codRemaining = 0;
      } else if (advancePaid > 0) {
        codRemaining = Math.max(0, totalAmount - advancePaid);
      } else if (codRemaining === 0) {
        codRemaining = totalAmount;
      }
    } else {
      codRemaining = 0;
    }

    return res.json(createSuccessResponse({
      ...order,
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      codAdvanceFeePaid: advancePaid,
      codRemainingBalance: codRemaining,
      referralPartnerCode: partnerCode || undefined,
      referralPartnerName: formattedPartnerName
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch order'));
  }
});

apiRouter.put('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const existing = await OrderRepository.getById(id);

    // Strict validation for DTDC tracking number before saving
    if (updateData.awbNumber && typeof updateData.awbNumber === 'string') {
      const trimmedAwb = updateData.awbNumber.trim();
      if (trimmedAwb.length > 0 && (!existing?.awbNumber || existing.awbNumber.trim().toUpperCase() !== trimmedAwb.toUpperCase())) {
        const validation = await validateDtdcTracking(trimmedAwb);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: validation.error || 'Invalid DTDC tracking number. Consignment not found on DTDC network.'
          });
        }
        updateData.awbNumber = validation.awbNumber || trimmedAwb.toUpperCase();
      }
    }

    const updated = await OrderRepository.update(id, updateData);
    const targetOrder = updated || existing;

    if (targetOrder) {
      // Robust multi-source recipient email discovery
      let rawEmail = 
        targetOrder.customer?.email || 
        targetOrder.shippingAddress?.email || 
        (targetOrder as any).customer_email || 
        existing?.customer?.email || 
        existing?.shippingAddress?.email || 
        (existing as any)?.customer_email ||
        updateData.customer?.email;

      let recipientEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : '';

      if (!recipientEmail && targetOrder.customer?.id) {
        try {
          const usr = await UserRepository.getById(targetOrder.customer.id);
          if (usr?.email) recipientEmail = usr.email.trim().toLowerCase();
        } catch (_) {}
      }

      const isStatusChanged = updateData.status && (!existing || existing.status !== updateData.status);
      const isAwbAssigned = Boolean(updateData.awbNumber && updateData.awbNumber.trim().length > 0);
      const newStatus = (updateData.status || targetOrder.status || '').toLowerCase();
      const isShipped = newStatus === 'shipped' || newStatus === 'dispatched';

      console.log(`[Order Update API] Order #${targetOrder.orderNumber} updated. AWB: ${updateData.awbNumber || targetOrder.awbNumber || 'none'} | Status: ${targetOrder.status} | Recipient: ${recipientEmail || 'none'}`);

      if (recipientEmail) {
        SettingsRepository.get()
          .then(async (siteSettings) => {
            if (isAwbAssigned || isShipped) {
              console.log(`[Order Shipped Email] Sending tracking notification for #${targetOrder.orderNumber} to ${recipientEmail}...`);
              const sent = await sendEmail({
                to: recipientEmail,
                subject: `📦 Your Order #${targetOrder.orderNumber} Has Been Shipped! | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`,
                html: generateOrderShippedEmailHtml(targetOrder, siteSettings)
              });
              console.log(`[Order Shipped Email] Dispatch result for #${targetOrder.orderNumber}: ${sent ? 'SUCCESS' : 'FAILED'}`);
            } else if (isStatusChanged) {
              console.log(`[Order Status Email] Sending status (${targetOrder.status}) notification for #${targetOrder.orderNumber} to ${recipientEmail}...`);
              const sent = await sendEmail({
                to: recipientEmail,
                subject: `Order #${targetOrder.orderNumber} Status Updated: ${targetOrder.status} | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`,
                html: generateOrderStatusUpdateEmailHtml(targetOrder, targetOrder.status, siteSettings)
              });
              console.log(`[Order Status Email] Dispatch result for #${targetOrder.orderNumber}: ${sent ? 'SUCCESS' : 'FAILED'}`);
            }
          })
          .catch((err) => console.warn('[Order Update] Settings error during email notification:', err));
      } else {
        console.warn(`[Order Update] Could not find recipient email for order #${targetOrder.orderNumber}`);
      }
    }

    // Sync referral status and partner metrics if order is connected to partner referral
    if (targetOrder.status) {
      PartnerRepository.syncOrderStatusToReferral(targetOrder.orderNumber, targetOrder.status, targetOrder.paymentStatus).catch(err =>
        console.warn(`[Partner Referral Sync] Error syncing status for #${targetOrder.orderNumber}:`, err)
      );
    }

    return res.json(createSuccessResponse(targetOrder));
  } catch (error: any) {
    console.error('[Order Update API] Error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update order'));
  }
});

// Reassign woman partner referral and transfer commission & order to another woman partner
apiRouter.post('/orders/:id/transfer-referral', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetPartnerCode, commissionAmount, reason, notifyPartner } = req.body || {};

    if (!targetPartnerCode || typeof targetPartnerCode !== 'string' || !targetPartnerCode.trim()) {
      return res.status(400).json(createErrorResponse('Target Woman Business Partner code is required.'));
    }

    const result = await PartnerRepository.transferOrderReferral({
      orderIdOrNumber: id,
      targetPartnerCode: targetPartnerCode.trim().toUpperCase(),
      commissionAmount: commissionAmount !== undefined && commissionAmount !== '' ? Number(commissionAmount) : undefined,
      reason: reason ? String(reason).trim() : undefined,
      notifyPartner: notifyPartner !== false
    });

    return res.json(createSuccessResponse(result, result.message));
  } catch (error: any) {
    console.error('[Transfer Referral API] Error:', error);
    return res.status(400).json(createErrorResponse(error.message || 'Failed to transfer order and commission'));
  }
});

apiRouter.post('/partner-program/transfer-referral', async (req: Request, res: Response) => {
  try {
    const { orderId, orderNumber, targetPartnerCode, commissionAmount, reason, notifyPartner } = req.body || {};
    const targetOrderRef = orderId || orderNumber;

    if (!targetOrderRef) {
      return res.status(400).json(createErrorResponse('Order ID or Number is required.'));
    }

    if (!targetPartnerCode || typeof targetPartnerCode !== 'string' || !targetPartnerCode.trim()) {
      return res.status(400).json(createErrorResponse('Target Woman Business Partner code is required.'));
    }

    const result = await PartnerRepository.transferOrderReferral({
      orderIdOrNumber: String(targetOrderRef).trim(),
      targetPartnerCode: targetPartnerCode.trim().toUpperCase(),
      commissionAmount: commissionAmount !== undefined && commissionAmount !== '' ? Number(commissionAmount) : undefined,
      reason: reason ? String(reason).trim() : undefined,
      notifyPartner: notifyPartner !== false
    });

    return res.json(createSuccessResponse(result, result.message));
  } catch (error: any) {
    console.error('[Transfer Referral API] Error:', error);
    return res.status(400).json(createErrorResponse(error.message || 'Failed to transfer order and commission'));
  }
});

apiRouter.post('/orders/bulk-status', async (req: Request, res: Response) => {
  try {
    const { orderIds, status } = req.body;
    if (!Array.isArray(orderIds) || !orderIds.length || !status) {
      return res.status(400).json(createErrorResponse('Invalid orderIds or status'));
    }

    const siteSettings = await SettingsRepository.get();
    let updatedCount = 0;

    for (const id of orderIds) {
      const existing = await OrderRepository.getById(id);
      const updated = await OrderRepository.update(id, { status });
      const targetOrder = updated || existing;

      if (targetOrder) {
        updatedCount++;

        // Sync referral status to hold/eligible immediately
        PartnerRepository.syncOrderStatusToReferral(targetOrder.orderNumber, status).catch(err =>
          console.warn(`[Bulk Status Referral Sync] Error for #${targetOrder.orderNumber}:`, err)
        );
        let rawEmail = 
          targetOrder.customer?.email || 
          targetOrder.shippingAddress?.email || 
          (targetOrder as any).customer_email || 
          existing?.customer?.email || 
          existing?.shippingAddress?.email;

        let recipientEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : '';

        if (!recipientEmail && targetOrder.customer?.id) {
          try {
            const usr = await UserRepository.getById(targetOrder.customer.id);
            if (usr?.email) recipientEmail = usr.email.trim().toLowerCase();
          } catch (_) {}
        }

        if (recipientEmail && (!existing || existing.status !== status)) {
          const isShipped = status.toLowerCase() === 'shipped';
          sendEmail({
            to: recipientEmail,
            subject: isShipped 
              ? `📦 Your Order #${targetOrder.orderNumber} Has Been Shipped! | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`
              : `Order #${targetOrder.orderNumber} Status Updated: ${status} | ${siteSettings.storeName || 'Aapla Jalgaonwala'}`,
            html: isShipped 
              ? generateOrderShippedEmailHtml(targetOrder, siteSettings)
              : generateOrderStatusUpdateEmailHtml(targetOrder, status, siteSettings)
          }).catch(err => console.warn(`[Order Bulk Status] Email error for #${targetOrder.orderNumber}:`, err));
        }
      }
    }

    return res.json(createSuccessResponse({ count: updatedCount, status }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed bulk status update'));
  }
});

apiRouter.post('/orders/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || !orderIds.length) {
      return res.status(400).json(createErrorResponse('Invalid orderIds'));
    }

    let deletedCount = 0;
    for (const id of orderIds) {
      const ok = await OrderRepository.delete(id);
      if (ok) deletedCount++;
    }

    return res.json(createSuccessResponse({ count: deletedCount }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed bulk delete'));
  }
});

apiRouter.delete('/admin/orders/delete-fake', async (req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    let deletedCount = 0;
    let deletedReferralsCount = 0;

    const { OrderRepository } = await import('../repositories/OrderRepository');
    const { PartnerRepository } = await import('../repositories/PartnerRepository');

    // 1. Gather all fake order IDs & numbers
    let fakeIds: string[] = [];
    let fakeOrderNumbers: string[] = [];

    if (pool) {
      const [fakeOrders]: any = await pool.query('SELECT id, order_number FROM orders WHERE is_fake = 1 OR id LIKE "ord_sim_%"').catch(() => [[]]);
      if (Array.isArray(fakeOrders) && fakeOrders.length > 0) {
        for (const o of fakeOrders) {
          if (o.id) fakeIds.push(String(o.id));
          if (o.order_number) fakeOrderNumbers.push(String(o.order_number));
        }
        deletedCount = fakeIds.length;
      }
    }

    const allJsonOrders = await OrderRepository.getAll().catch(() => []);
    for (const o of allJsonOrders) {
      if (o.is_fake || (o as any)._is_fake || String(o.id).startsWith('ord_sim_')) {
        if (o.id && !fakeIds.includes(String(o.id))) fakeIds.push(String(o.id));
        if (o.orderNumber && !fakeOrderNumbers.includes(String(o.orderNumber))) fakeOrderNumbers.push(String(o.orderNumber));
      }
    }

    if (pool) {
      if (fakeIds.length > 0) {
        await pool.query('DELETE FROM order_items WHERE order_id IN (?)', [fakeIds]).catch(() => {});
        await pool.query('DELETE FROM order_status_history WHERE order_id IN (?)', [fakeIds]).catch(() => {});
        await pool.query('DELETE FROM orders WHERE id IN (?)', [fakeIds]).catch(() => {});
      }
      await pool.query("DELETE FROM orders WHERE is_fake = 1 OR id LIKE 'ord_sim_%'").catch(() => {});

      // 2. Delete all simulated/fake referrals and orphaned non-WhatsApp referrals from MySQL partner_referrals
      const [delRefResult]: any = await pool.query(`
        DELETE FROM partner_referrals 
        WHERE id LIKE 'ref_sim_%' 
           OR order_id LIKE 'ord_sim_%'
           ${fakeIds.length > 0 ? 'OR order_id IN (?)' : ''}
           ${fakeOrderNumbers.length > 0 ? 'OR order_number IN (?)' : ''}
           OR (order_id NOT IN (SELECT id FROM orders WHERE id IS NOT NULL) AND id NOT LIKE 'ref_wa_%' AND order_id NOT LIKE 'WA%')
      `, [
        ...(fakeIds.length > 0 ? [fakeIds] : []),
        ...(fakeOrderNumbers.length > 0 ? [fakeOrderNumbers] : [])
      ].filter(Boolean)).catch((err) => {
        console.warn('[delete-fake] MySQL delete partner_referrals error:', err);
      });
      if (delRefResult && delRefResult.affectedRows) {
        deletedReferralsCount += delRefResult.affectedRows;
      }
    }

    // 3. Remove fake orders from orders.json
    const cleanJson = allJsonOrders.filter(o => !o.is_fake && !(o as any)._is_fake && !String(o.id).startsWith('ord_sim_'));
    await OrderRepository.saveAll(cleanJson);
    OrderRepository.clearCache();

    // 4. Remove fake referrals from partner_referrals.json
    const delCountFromRepo = await PartnerRepository.deleteFakeReferrals();
    deletedReferralsCount += delCountFromRepo;
    PartnerRepository.clearCache();

    // 5. Recalculate metrics for all partners
    await PartnerRepository.recalculateAllPartnerMetrics().catch(() => {});

    return res.json(createSuccessResponse({ 
      success: true, 
      deletedCount: deletedCount || fakeIds.length, 
      deletedReferralsCount,
      message: `Successfully deleted fake orders and removed all fake orders from women partner dashboards.` 
    }));
  } catch (error: any) {
    console.error('Error deleting fake orders:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete fake orders'));
  }
});

apiRouter.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await OrderRepository.delete(id);
    return res.json(createSuccessResponse({ id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete order'));
  }
});

apiRouter.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let order = await OrderRepository.getById(id);
    if (!order) {
      order = await OrderRepository.getByOrderNumber(id);
    }

    if (!order) {
      return res.status(404).json(createErrorResponse('Order not found'));
    }

    const pdfBuffer = generateInvoicePdfBuffer(order);

    const safeCustomer = (order.shippingAddress?.fullName || order.customer?.name || order.customerName || 'Customer')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const fileName = `Invoice_${safeCustomer}_${order.orderNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to generate PDF invoice'));
  }
});

// ----------------------------------------------------
// 5. SITE SETTINGS
// ----------------------------------------------------

apiRouter.get('/settings', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const settings = await SettingsRepository.get();
    
    // Check if requester is admin via authorization header or session
    const authHeader = req.headers['authorization'] || '';
    const userIdHeader = req.headers['x-user-id'] || '';
    const isAdmin = Boolean(authHeader.startsWith('Bearer ') || userIdHeader === 'admin');

    if (isAdmin) {
      return res.json(createSuccessResponse(settings));
    }

    // For public responses: include public keys (razorpayKeyId, googleClientId) needed by checkout and login,
    // but strip private secrets (razorpayKeySecret, googleClientSecret, smtpPass)
    const {
      razorpayKeySecret,
      googleClientSecret,
      smtpPass,
      ...safeSettings
    } = settings as any;
    return res.json(createSuccessResponse(safeSettings));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch settings'));
  }
});

apiRouter.get('/admin/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsRepository.get();
    return res.json(createSuccessResponse(settings));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch admin settings'));
  }
});

apiRouter.put('/admin/settings', async (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    const updated = await SettingsRepository.update(newSettings);
    systemCache.flush();
    ProductRepository.clearCache();
    CategoryRepository.clearCache();
    return res.json(createSuccessResponse(updated, 'Admin settings updated successfully.'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update admin settings'));
  }
});

// ----------------------------------------------------
// Navratri Offer Settings Endpoints
// ----------------------------------------------------

const defaultNavratriOffer = {
  featuredImage: 'https://images.unsplash.com/photo-1605000797439-7ab1434893e2?auto=format&fit=crop&w=1200&q=80',
  price: 599,
  description: 'Special Navratri Festivity Pack containing 500g Salted Banana Chips, 500g Spicy Masala Banana Chips, 500g Sweet Potato Chivda, 500g Spicy Potato Chivda, and a FREE pack of nutritious Rajgira Ladoos! Made 100% Satvik with Sendha Namak (Rock Salt) in separate dedicated frying lines.',
  products: [
    {
      id: 'item-1',
      name: 'Sendha Namak Rock Salt Banana Chips (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Melt-in-your-mouth wafer thin raw banana wafers salted with pure Himalayan Sendha Namak (Rock Salt).',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Fasting Approved'
    },
    {
      id: 'item-2',
      name: 'Spicy Masala Fasting Banana Chips (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Crispy raw banana wafers tossed with fast-compliant spicy red chilli powder and rock salt.',
      img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      badge: 'Spicy Delight'
    },
    {
      id: 'item-3',
      name: 'Meetha Farali Potato Batata Chivda (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Crisp hand-grated Jalgaon potato salli blended with premium cashew nuts, sweet raisins, and roasted peanuts.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Sweet & Crunchy'
    },
    {
      id: 'item-4',
      name: 'Teekha Farali Potato Batata Chivda (५०० ग्रॅम)',
      weight: '500g Pack',
      desc: 'Thin golden matchstick potato salli seasoned with a spicy Navratri spice mix and crunchy rock salt.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Spicy & Savoury'
    },
    {
      id: 'item-5',
      name: 'Rajgira Amaranth Sweet Ladoo (राजगिरा लाडू)',
      weight: 'Full Pack (FREE GIFT)',
      desc: 'Mouthwatering, soft, nutrient-packed amaranth puffed seeds balls sweetened with jaggery/pure sugar.',
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      badge: 'Free Gift 🎁',
      isGift: true
    }
  ]
};

apiRouter.get(['/navratri-offer', '/admin/navratri-offer'], async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const pool = getDbPool();
    if (pool) {
      try {
        const [rows]: any = await pool.query(
          'SELECT setting_value FROM site_settings WHERE setting_key = "navratri_offer_config"'
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const value = typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
          if (value && typeof value === 'object') {
            return res.json(createSuccessResponse(value));
          }
        }
      } catch (dbErr) {
        console.warn('[NavratriOffer] Error reading site_settings:', dbErr);
      }
    }
    const jsonFallback = await readJson<any>('navratri_offer.json', defaultNavratriOffer);
    return res.json(createSuccessResponse(jsonFallback || defaultNavratriOffer));
  } catch (error: any) {
    return res.json(createSuccessResponse(defaultNavratriOffer));
  }
});

apiRouter.put(['/navratri-offer', '/admin/navratri-offer'], async (req: Request, res: Response) => {
  try {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json(createErrorResponse('Invalid configuration data provided.'));
    }

    // Persist to JSON files
    await writeJson('navratri_offer.json', config);
    try {
      const settings = await readJson<any>('settings.json', {});
      settings.navratri_offer_config = config;
      await writeJson('settings.json', settings);
    } catch {
      // Ignore
    }

    // Persist to MySQL site_settings table
    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value)
           VALUES ('navratri_offer_config', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [JSON.stringify(config)]
        );
      } catch (dbErr) {
        console.warn('[NavratriOffer] MySQL saving notice:', dbErr);
      }
    }

    systemCache.flush();
    SettingsRepository.clearCache();

    return res.json(createSuccessResponse(config, 'Navratri offer updated and persisted live in database.'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update Navratri offer config'));
  }
});

apiRouter.post(['/navratri-offer', '/admin/navratri-offer'], async (req: Request, res: Response) => {
  try {
    const config = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json(createErrorResponse('Invalid configuration data provided.'));
    }

    await writeJson('navratri_offer.json', config);
    try {
      const settings = await readJson<any>('settings.json', {});
      settings.navratri_offer_config = config;
      await writeJson('settings.json', settings);
    } catch {
      // Ignore
    }

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value)
           VALUES ('navratri_offer_config', ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [JSON.stringify(config)]
        );
      } catch (dbErr) {
        console.warn('[NavratriOffer] MySQL saving notice:', dbErr);
      }
    }

    systemCache.flush();
    SettingsRepository.clearCache();

    return res.json(createSuccessResponse(config, 'Navratri offer updated and persisted live in database.'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update Navratri offer config'));
  }
});

apiRouter.post('/settings', async (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    const updated = await SettingsRepository.update(newSettings);
    systemCache.flush();
    ProductRepository.clearCache();
    CategoryRepository.clearCache();
    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update settings'));
  }
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    const updated = await SettingsRepository.update(newSettings);
    systemCache.flush();
    ProductRepository.clearCache();
    CategoryRepository.clearCache();
    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update settings'));
  }
});

apiRouter.post('/admin/test-razorpay', async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret } = req.body;
    const siteSettings = await SettingsRepository.get();
    const effectiveKeyId = (keyId || siteSettings.razorpayKeyId || '').trim();
    const effectiveKeySecret = (keySecret || siteSettings.razorpayKeySecret || '').trim();

    if (!effectiveKeyId || !effectiveKeySecret) {
      return res.status(400).json(createErrorResponse('Both Razorpay Key ID and Key Secret are required to test connection.'));
    }

    if (effectiveKeyId === 'rzp_test_placeholder_key') {
      return res.status(400).json(createErrorResponse('Placeholder test key detected. Please enter your live or test key from your Razorpay Dashboard.'));
    }

    const Razorpay = (await import('razorpay')).default;
    const rzp = new Razorpay({
      key_id: effectiveKeyId,
      key_secret: effectiveKeySecret
    });

    const result = await rzp.orders.all({ count: 1 });
    return res.json(createSuccessResponse({
      testedKeyId: effectiveKeyId.slice(0, 10) + '...',
      ordersCount: result?.items?.length ?? 0
    }, 'Razorpay credentials verified successfully! Live API connection established.'));
  } catch (error: any) {
    const errorMsg = error?.error?.description || error?.message || 'Razorpay connection test failed';
    return res.status(400).json(createErrorResponse(errorMsg));
  }
});

apiRouter.post('/admin/test-google-auth', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = req.body;
    const siteSettings = await SettingsRepository.get();
    const effectiveClientId = (clientId || siteSettings.googleClientId || '').trim();
    const effectiveClientSecret = (clientSecret || siteSettings.googleClientSecret || '').trim();

    if (!effectiveClientId) {
      return res.status(400).json(createErrorResponse('Google Client ID is required to test Google OAuth.'));
    }

    if (!effectiveClientId.includes('.apps.googleusercontent.com')) {
      return res.status(400).json(createErrorResponse('Invalid Google Client ID format. Client IDs usually end with .apps.googleusercontent.com'));
    }

    const discoveryRes = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    if (!discoveryRes.ok) {
      return res.status(500).json(createErrorResponse('Failed to reach Google OpenID Discovery service.'));
    }

    return res.json(createSuccessResponse({
      testedClientId: effectiveClientId.slice(0, 15) + '...',
      hasClientSecret: Boolean(effectiveClientSecret),
      authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token'
    }, 'Google OAuth configuration is valid and reachable!'));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error.message || 'Google Auth test failed'));
  }
});

// ----------------------------------------------------
// 5.1 FAVICON & WEB APP ASSETS MANAGEMENT
// ----------------------------------------------------

apiRouter.get('/admin/favicons/status', async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsRepository.get();
    const mobileTitle = settings.mobileWebAppTitle || settings.brandName || 'AJW';
    const status = await getFaviconSuiteStatus(mobileTitle);
    return res.json(createSuccessResponse(status));
  } catch (error: any) {
    console.error('[Favicon API] Failed to fetch favicon suite status:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch favicon suite status'));
  }
});

apiRouter.post('/admin/favicons/upload', safeUploadMiddleware, async (req: Request, res: Response) => {
  try {
    const targetFilename = req.body.targetFilename || req.body.filename;
    if (!targetFilename) {
      return res.status(400).json(createErrorResponse('Missing targetFilename (e.g. favicon-96x96.png, favicon.svg, favicon.ico, apple-touch-icon.png, site.webmanifest)'));
    }

    let fileBuffer: Buffer | string | null = null;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      fileBuffer = (req.files[0] as Express.Multer.File).buffer;
    } else if (req.file) {
      fileBuffer = (req.file as Express.Multer.File).buffer;
    } else if (req.body.fileData) {
      fileBuffer = req.body.fileData;
    } else if (req.body.content) {
      fileBuffer = req.body.content;
    }

    if (!fileBuffer) {
      return res.status(400).json(createErrorResponse('No file data or upload buffer provided'));
    }

    const saved = await saveSingleFaviconFile(targetFilename, fileBuffer);

    // If uploading primary favicon and it returned a path, keep SettingsRepository faviconUrl updated if needed
    if ((targetFilename === 'favicon-96x96.png' || targetFilename === 'favicon.ico') && saved.path) {
      try {
        await SettingsRepository.update({ faviconUrl: saved.path });
      } catch {}
    }

    const settings = await SettingsRepository.get();
    const updatedStatus = await getFaviconSuiteStatus(settings.mobileWebAppTitle || 'AJW');

    return res.json(createSuccessResponse({
      saved,
      suiteStatus: updatedStatus
    }));
  } catch (error: any) {
    console.error('[Favicon API] Upload failed:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to save favicon asset'));
  }
});

apiRouter.post('/admin/favicons/generate-all', safeUploadMiddleware, async (req: Request, res: Response) => {
  try {
    let imageBuffer: Buffer | null = null;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageBuffer = (req.files[0] as Express.Multer.File).buffer;
    } else if (req.file) {
      imageBuffer = (req.file as Express.Multer.File).buffer;
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:[^;]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!imageBuffer) {
      return res.status(400).json(createErrorResponse('No master image file provided for favicon generation'));
    }

    const settings = await SettingsRepository.get();
    const result = await generateAllFaviconsFromMaster(imageBuffer, {
      appName: settings.storeName || 'Aapla Jalgaonwala',
      shortName: settings.mobileWebAppTitle || 'AJW',
      themeColor: '#9B111E',
      backgroundColor: '#FAF6ED'
    });

    const updatedSettings = await SettingsRepository.get();
    const updatedStatus = await getFaviconSuiteStatus(updatedSettings.mobileWebAppTitle || 'AJW');

    return res.json(createSuccessResponse({
      ...result,
      suiteStatus: updatedStatus
    }));
  } catch (error: any) {
    console.error('[Favicon API] Batch generation failed:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to generate favicon suite'));
  }
});

apiRouter.post('/admin/favicons/sync-s3', async (_req: Request, res: Response) => {
  try {
    console.log('[Favicon API] Starting S3 synchronization of all admin and site icon assets...');
    const result = await syncAllIconsToS3();
    const settings = await SettingsRepository.get();
    const updatedStatus = await getFaviconSuiteStatus(settings.mobileWebAppTitle || 'AJW');

    return res.json(createSuccessResponse({
      ...result,
      suiteStatus: updatedStatus
    }));
  } catch (error: any) {
    console.error('[Favicon API] S3 sync failed:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to sync icons to S3'));
  }
});

apiRouter.put('/admin/favicons/manifest', async (req: Request, res: Response) => {
  try {
    const { manifestContent, mobileWebAppTitle } = req.body;

    if (manifestContent) {
      await updateWebManifestJson(manifestContent);
    }

    if (mobileWebAppTitle) {
      await SettingsRepository.update({ mobileWebAppTitle });
    }

    const settings = await SettingsRepository.get();
    const updatedStatus = await getFaviconSuiteStatus(settings.mobileWebAppTitle || 'AJW');

    return res.json(createSuccessResponse(updatedStatus));
  } catch (error: any) {
    console.error('[Favicon API] Update manifest failed:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update manifest'));
  }
});

// ----------------------------------------------------
// 6. OWNERS
// ----------------------------------------------------

apiRouter.get(['/owners', '/owners/:id'], async (req: Request, res: Response) => {
  try {
    const id = req.params.id || (req.query.id as string);
    if (id) {
      const owner = await OwnersRepository.getById(id);
      if (!owner) return res.status(404).json(createErrorResponse('Owner not found'));
      return res.json(createSuccessResponse(owner));
    }
    const owners = await OwnersRepository.getAll();
    return res.json(createSuccessResponse(owners));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch owners'));
  }
});

apiRouter.post('/owners', async (req: Request, res: Response) => {
  try {
    const created = await OwnersRepository.create(req.body);
    return res.status(201).json(createSuccessResponse(created, 'Owner profile created successfully.'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create owner'));
  }
});

apiRouter.put(['/owners', '/owners/:id'], async (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body?.id || (req.query.id as string);
    if (!id) {
      return res.status(400).json(createErrorResponse('Owner ID is required for update.'));
    }
    const updated = await OwnersRepository.update(id, req.body);
    return res.json(createSuccessResponse(updated, 'Owner profile updated successfully.'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update owner'));
  }
});

apiRouter.delete(['/owners', '/owners/:id'], async (req: Request, res: Response) => {
  try {
    const id = req.params.id || (req.query.id as string) || req.body?.id;
    if (!id) {
      return res.status(400).json(createErrorResponse('Owner ID is required for deletion.'));
    }
    await OwnersRepository.delete(id);
    return res.json(createSuccessResponse({ id, deleted: true }, 'Owner profile deleted successfully.'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete owner'));
  }
});

// ----------------------------------------------------
// 7. MEDIA & CLOUDINARY
// ----------------------------------------------------

apiRouter.get('/media', async (_req: Request, res: Response) => {
  try {
    const media = await MediaRepository.getAll();
    return res.json(createSuccessResponse(media));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch media'));
  }
});

apiRouter.post('/media', async (req: Request, res: Response) => {
  try {
    const created = await MediaRepository.create(req.body);
    return res.status(201).json(createSuccessResponse(created));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to save media'));
  }
});

apiRouter.put('/media/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (updateData.videoUrl || updateData.duration || updateData.type === 'video') {
      const updated = await MediaRepository.updateVideo(id, updateData);
      return res.json(createSuccessResponse(updated));
    } else {
      const updated = await MediaRepository.updateGalleryItem(id, updateData);
      return res.json(createSuccessResponse(updated));
    }
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update media'));
  }
});

apiRouter.delete('/media/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await MediaRepository.delete(id);
    return res.json(createSuccessResponse({ id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete media'));
  }
});

// ----------------------------------------------------
// 8. SEO
// ----------------------------------------------------

apiRouter.get('/seo', systemCache.middleware('seo'), async (_req: Request, res: Response) => {
  try {
    const seoList = await SeoRepository.getAll();
    return res.json(createSuccessResponse(seoList));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch SEO settings'));
  }
});

apiRouter.post('/seo', async (req: Request, res: Response) => {
  try {
    const updated = await SeoRepository.upsert(req.body);
    systemCache.flush('seo');
    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to save SEO metadata'));
  }
});

// AI Single SEO Generation using Gemini 3.1 Flash Lite (gemini-3.1-flash-lite)
apiRouter.post('/seo/generate', async (req: Request, res: Response) => {
  try {
    const params = req.body || {};
    const generatedSeo = await generateSeoWithGemini(params);
    return res.json(createSuccessResponse(generatedSeo));
  } catch (error: any) {
    console.error('[SEO AI] Generation error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to generate AI SEO metadata'));
  }
});

// AI Comprehensive SEO Audit & Improvements using Gemini 3.7 Flash
apiRouter.post('/seo/analyze-improvements', async (req: Request, res: Response) => {
  try {
    const pageSeoList = await SeoRepository.getAll();
    const products = await ProductRepository.getAll();
    
    // Get categories
    let categories: any[] = [];
    try {
      categories = await CategoryRepository.getAll();
    } catch {
      categories = [
        { slug: 'banana-chips', name: 'Jalgaon Banana Chips', tagline: 'Crisp & authentic banana chips.' },
        { slug: 'farsan', name: 'Namkeen & Farsaan', tagline: 'Spicy Khandeshi namkeens.' },
        { slug: 'masala', name: 'Khandeshi Masala', tagline: 'Hand-pounded premium spices.' },
        { slug: 'upwas', name: 'Upwas Special', tagline: 'Fast-compliant crispies.' },
        { slug: 'chutney', name: 'Dry Chutneys', tagline: 'Flavorful dry spice powders.' }
      ];
    }

    const analysisInput = {
      pageSeoList: pageSeoList.map(p => ({
        pageKey: p.pageKey,
        pageName: p.pageName,
        seoTitle: p.seoTitle || '',
        seoDescription: p.seoDescription || '',
        keywords: p.keywords || ''
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || '',
        seoTitle: p.seoTitle || '',
        seoDescription: p.seoDescription || '',
        seoKeywords: p.seoKeywords || '',
        price: p.price
      })),
      categories: categories.map(c => ({
        slug: c.slug || c.key || '',
        name: c.name,
        tagline: c.tagline || c.description || ''
      }))
    };

    const analysisResult = await analyzeSeoImprovements(analysisInput);
    return res.json(createSuccessResponse(analysisResult));
  } catch (error: any) {
    console.error('[SEO AI] Analysis error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to analyze SEO performance and improvements'));
  }
});

// AI Bulk SEO Optimizer using Gemini 3.1 Flash Lite (gemini-3.1-flash-lite)
apiRouter.post('/seo/bulk-optimize', async (req: Request, res: Response) => {
  try {
    const { target, items } = req.body; // target: 'pages' | 'products' | 'categories' | 'all', items: Array<{type: 'page'|'product'|'category', id: string}>
    let updatedCount = 0;
    const results: any[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        try {
          if (item.type === 'page') {
            const page = await SeoRepository.getPageByKey(item.id);
            if (page) {
              const aiSeo = await generateSeoWithGemini({
                type: 'page',
                pageKey: page.pageKey,
                pageName: page.pageName,
                currentTitle: page.seoTitle,
                currentDescription: page.seoDescription
              });

              await SeoRepository.upsert({
                ...page,
                seoTitle: aiSeo.seoTitle,
                seoDescription: aiSeo.seoDescription,
                keywords: aiSeo.keywords
              });

              results.push({ type: 'page', id: page.id, name: page.pageName, seoTitle: aiSeo.seoTitle });
              updatedCount++;
            }
          } else if (item.type === 'product') {
            const prod = await ProductRepository.getById(item.id);
            if (prod) {
              const aiSeo = await generateSeoWithGemini({
                type: 'product',
                productName: prod.name,
                productCategory: prod.category,
                productDescription: prod.shortDescription || prod.description,
                currentTitle: prod.seoTitle,
                currentDescription: prod.seoDescription
              });

              await ProductRepository.update(prod.id, {
                seoTitle: aiSeo.seoTitle,
                seoDescription: aiSeo.seoDescription
              });

              results.push({ type: 'product', id: prod.id, name: prod.name, seoTitle: aiSeo.seoTitle });
              updatedCount++;
            }
          } else if (item.type === 'category') {
            const cat = await CategoryRepository.getBySlug(item.id);
            if (cat) {
              const aiSeo = await generateSeoWithGemini({
                type: 'category',
                productName: cat.name,
                productCategory: 'Category Listing',
                productDescription: cat.tagline || cat.description,
                currentTitle: cat.name + ' | Aapla Jalgaonwala',
                currentDescription: cat.description
              });

              const pageKey = `category-${cat.slug}`;
              await SeoRepository.upsert({
                id: `page-cat-${cat.slug}`,
                pageKey,
                pageName: `Category: ${cat.name}`,
                seoTitle: aiSeo.seoTitle,
                seoDescription: aiSeo.seoDescription,
                keywords: aiSeo.keywords
              });

              results.push({ type: 'category', id: cat.id, name: cat.name, seoTitle: aiSeo.seoTitle });
              updatedCount++;
            }
          }
        } catch (err) {
          console.warn(`[SEO Bulk Selected] Failed for item ${item.id} of type ${item.type}:`, err);
        }
      }
    } else {
      if (target === 'pages' || target === 'all') {
        const pages = await SeoRepository.getAll();
        for (const page of pages) {
          try {
            const aiSeo = await generateSeoWithGemini({
              type: 'page',
              pageKey: page.pageKey,
              pageName: page.pageName,
              currentTitle: page.seoTitle,
              currentDescription: page.seoDescription
            });

            await SeoRepository.upsert({
              ...page,
              seoTitle: aiSeo.seoTitle,
              seoDescription: aiSeo.seoDescription,
              keywords: aiSeo.keywords
            });

            results.push({ type: 'page', id: page.id, name: page.pageName, seoTitle: aiSeo.seoTitle });
            updatedCount++;
          } catch (pageErr) {
            console.warn(`[SEO Bulk] Skipped page ${page.pageName}:`, pageErr);
          }
        }
      }

      if (target === 'products' || target === 'all') {
        const products = await ProductRepository.getAll();
        for (const prod of products) {
          try {
            const aiSeo = await generateSeoWithGemini({
              type: 'product',
              productName: prod.name,
              productCategory: prod.category,
              productDescription: prod.shortDescription || prod.description,
              currentTitle: prod.seoTitle,
              currentDescription: prod.seoDescription
            });

            await ProductRepository.update(prod.id, {
              seoTitle: aiSeo.seoTitle,
              seoDescription: aiSeo.seoDescription
            });

            results.push({ type: 'product', id: prod.id, name: prod.name, seoTitle: aiSeo.seoTitle });
            updatedCount++;
          } catch (prodErr) {
            console.warn(`[SEO Bulk] Skipped product ${prod.name}:`, prodErr);
          }
        }
      }

      if (target === 'categories' || target === 'all') {
        const categories = await CategoryRepository.getAll();
        for (const cat of categories) {
          try {
            const aiSeo = await generateSeoWithGemini({
              type: 'category',
              productName: cat.name,
              productCategory: 'Category Listing',
              productDescription: cat.tagline || cat.description,
              currentTitle: cat.name + ' | Aapla Jalgaonwala',
              currentDescription: cat.description
            });

            const pageKey = `category-${cat.slug}`;
            await SeoRepository.upsert({
              id: `page-cat-${cat.slug}`,
              pageKey,
              pageName: `Category: ${cat.name}`,
              seoTitle: aiSeo.seoTitle,
              seoDescription: aiSeo.seoDescription,
              keywords: aiSeo.keywords
            });

            results.push({ type: 'category', id: cat.id, name: cat.name, seoTitle: aiSeo.seoTitle });
            updatedCount++;
          } catch (catErr) {
            console.warn(`[SEO Bulk] Skipped category ${cat.name}:`, catErr);
          }
        }
      }
    }

    return res.json(createSuccessResponse({
      updatedCount,
      results
    }, `Successfully AI-optimized ${updatedCount} SEO entries using Gemini 3.1 Flash Lite.`));
  } catch (error: any) {
    console.error('[SEO AI Bulk] Error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed bulk SEO optimization'));
  }
});

// ----------------------------------------------------
// 9. CONTACT & FRANCHISE (with reCAPTCHA & Nodemailer)
// ----------------------------------------------------

apiRouter.post('/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message, recaptchaToken } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json(createErrorResponse('Name, email, and message are required'));
    }

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      console.warn('[reCAPTCHA] Failed verification for contact form:', recaptchaResult.error);
    }

    // Save inquiry to repository
    const inquiry = await InquiryRepository.create({
      name,
      email,
      phone: phone || '',
      type: 'contact',
      subject: subject || 'General Inquiry',
      message
    });

    // Send email notification to configured Admin Email
    SettingsRepository.get().then(siteSettings => {
      const adminEmail = siteSettings.adminNotificationEmail || siteSettings.contactEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'orders@aapla-jalgaonwala.in';
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          subject: `📩 [New Contact Inquiry] ${name} - ${subject || 'General'}`,
          html: generateAdminInquiryAlertEmailHtml({ name, email, phone, subject, message }, 'Contact Inquiry')
        }).catch(err => console.warn('[Contact] Mailer notification error:', err));
      }
    });

    return res.status(201).json(createSuccessResponse(inquiry));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to submit inquiry'));
  }
});

apiRouter.post('/franchise', async (req: Request, res: Response) => {
  try {
    const formData = req.body;
    if (!formData.fullName || !formData.phone || !formData.city) {
      return res.status(400).json(createErrorResponse('Name, phone, and target city are required'));
    }

    const inquiry = await InquiryRepository.create({
      name: formData.fullName,
      email: formData.email || '',
      phone: formData.phone,
      type: 'franchise',
      subject: `Franchise Application: ${formData.city}`,
      message: JSON.stringify(formData)
    });

    // Send notification email to configured Admin Email
    SettingsRepository.get().then(siteSettings => {
      const adminEmail = siteSettings.adminNotificationEmail || siteSettings.contactEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'orders@aapla-jalgaonwala.in';
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          subject: `🤝 [New Franchise Application] ${formData.fullName} - ${formData.city}`,
          html: generateAdminInquiryAlertEmailHtml({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            location: `${formData.city}, ${formData.state || ''}`,
            investment: formData.investmentCapacity,
            message: `Experience: ${formData.experience || 'None'}\nTimeline: ${formData.timeline || 'Immediate'}\nNotes: ${formData.comments || 'None'}`
          }, 'Franchise Partnership Application')
        }).catch(err => console.warn('[Franchise] Mailer notification error:', err));
      }
    });

    return res.status(201).json(createSuccessResponse(inquiry));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to submit franchise application'));
  }
});

apiRouter.post('/admin/test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const settings = await SettingsRepository.get();
    const targetEmail = email || settings.adminNotificationEmail || settings.contactEmail || 'orders@aapla-jalgaonwala.in';

    if (!targetEmail) {
      return res.status(400).json(createErrorResponse('No recipient email address specified.'));
    }

    const sent = await sendEmail({
      to: targetEmail,
      subject: `🧪 [Test Notification] Aapla Jalgaonwala Admin Email Verification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="background: #9B111E; padding: 16px; text-align: center; color: white; border-radius: 8px;">
            <h2 style="margin: 0;">Aapla Jalgaonwala</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px;">Admin Notification Test</p>
          </div>
          <div style="padding: 20px 0; color: #374151;">
            <p style="font-size: 15px; font-weight: bold; color: #059669;">✅ Email notification system is successfully configured!</p>
            <p style="font-size: 13px; line-height: 1.6;">
              This confirms that your store's admin email (<strong>${targetEmail}</strong>) is verified. All future new customer orders, contact messages, and franchise applications will arrive here in real time.
            </p>
            <p style="font-size: 12px; color: #6b7280;">Sent on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
          </div>
        </div>
      `
    });

    return res.json(createSuccessResponse({
      success: true,
      deliveredTo: targetEmail,
      status: sent ? 'sent' : 'logged_dev'
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to send test email'));
  }
});

apiRouter.post('/admin/test-telegram', async (req: Request, res: Response) => {
  try {
    const { botToken, chatId } = req.body;
    const settings = await SettingsRepository.get();

    const targetToken = (botToken || settings.telegramBotToken || '').trim();
    const targetChat = (chatId || settings.telegramChatId || '').trim();

    if (!targetToken || !targetChat) {
      return res.status(400).json(createErrorResponse(
        'Telegram Bot Token and Chat ID are required.',
        'MISSING_CREDENTIALS',
        undefined,
        {
          debugReason: 'Bot Token or Chat ID parameter is empty.',
          troubleshooting: 'Please fill in both Telegram Bot Token and Chat ID before testing.'
        }
      ));
    }

    const testMsg = `🧪 <b>[Test Alert] Aapla Jalgaonwala Telegram Integration</b>\n\n` +
      `✅ Telegram Bot Notifications are working perfectly!\n` +
      `Your store is ready to receive instant order alerts directly on Telegram.\n\n` +
      `<b>Timestamp:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`;

    const result = await sendTelegramAlertDetailed(testMsg, { botToken: targetToken, chatId: targetChat });

    if (result.success) {
      return res.json(createSuccessResponse({
        success: true,
        message: 'Test Telegram message delivered successfully!',
        telegramResponse: result.telegramResponse
      }));
    } else {
      return res.status(400).json(createErrorResponse(
        result.error || 'Failed to send Telegram message.',
        'TELEGRAM_API_ERROR',
        undefined,
        {
          debugReason: result.debugReason,
          troubleshooting: result.troubleshooting,
          telegramResponse: result.telegramResponse,
          chatId: targetChat,
          botTokenMasked: targetToken.length > 8 ? `${targetToken.substring(0, 6)}...${targetToken.slice(-4)}` : '***'
        }
      ));
    }
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(
      error.message || 'Failed to send test Telegram alert',
      'INTERNAL_SERVER_ERROR',
      undefined,
      {
        debugReason: 'An unhandled server exception occurred while calling Telegram API.',
        troubleshooting: 'Check server logs for further exception details.'
      }
    ));
  }
});

// ----------------------------------------------------
// 10. SEARCH
// ----------------------------------------------------

const SITE_PAGES = [
  {
    title: 'Refund, Return & Replacement Policy',
    description: '100% Freshness Guarantee. Easy instant replacement or refund for damaged packages within 48 hrs.',
    url: '/faq',
    category: 'Store Policy',
    keywords: ['refund', 'return', 'replacement', 'cancellation', 'money back', 'damaged', 'transit', 'policy', 'guarantee', 'broken']
  },
  {
    title: 'Track Order & History',
    description: 'Check live status, courier tracking, and tax invoices of your orders.',
    url: '/account',
    category: 'Account & Orders',
    keywords: ['track', 'order', 'delivery', 'status', 'courier', 'invoice', 'history', 'account', 'login']
  },
  {
    title: 'Shipping & Delivery Policy',
    description: 'Free shipping over ₹399 in MH & ₹799 Pan-India. Express dispatch in 24-48 hrs.',
    url: '/faq',
    category: 'Store Policy',
    keywords: ['shipping', 'delivery', 'charges', 'free shipping', 'pincode', 'courier', 'speed', 'transit']
  },
  {
    title: 'Upwas & Fasting Specials (श्रावण / व्रत)',
    description: 'Pure sendha namak banana chips, rajgira, and fasting delicacies made for Upwas.',
    url: '/upwas-special',
    category: 'Special Collection',
    keywords: ['upwas', 'vrat', 'fasting', 'shravan', 'navratri', 'sendha namak', 'pure', 'sattvik']
  },
  {
    title: 'Our Story & Jalgaon Heritage',
    description: 'Discover how we craft authentic Khandeshi snacks from the Banana Capital of India.',
    url: '/our-story',
    category: 'About Us',
    keywords: ['story', 'about', 'jalgaon', 'heritage', 'quality', 'factory', 'hygiene', 'khandesh', 'tradition']
  },
  {
    title: 'Franchise & Wholesale Inquiries',
    description: 'Partner with us for B2B bulk orders, corporate gifting, distribution, and retail supply.',
    url: '/franchise',
    category: 'Business Partnerships',
    keywords: ['franchise', 'wholesale', 'bulk', 'b2b', 'distributor', 'reseller', 'gifting', 'business', 'dealership']
  },
  {
    title: 'Women Entrepreneurship Program',
    description: 'Empowering women business partners with snack distribution opportunities.',
    url: '/women-business-partner',
    category: 'Community Impact',
    keywords: ['women', 'partner', 'entrepreneur', 'business', 'distributor', 'work from home', 'earning']
  },
  {
    title: 'Customer Support & WhatsApp',
    description: 'Connect directly with our Jalgaon support team for assistance.',
    url: '/contact',
    category: 'Help & Support',
    keywords: ['contact', 'support', 'help', 'whatsapp', 'phone', 'email', 'address', 'customer care']
  },
  {
    title: 'FAQs & Payment Methods',
    description: 'Answers about COD, shelf life, bulk discounts, and payment options.',
    url: '/faq',
    category: 'Help & Support',
    keywords: ['faq', 'question', 'cod', 'cash on delivery', 'shelf life', 'expiry', 'payment', 'returns', 'refund']
  }
];

apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q || req.query.search) as string) || '';
    const term = q.trim().toLowerCase();

    const [allProducts, allCategories] = await Promise.all([
      ProductRepository.getAll(),
      CategoryRepository.getAll()
    ]);

    const popularSearches = [
      'Jalgaon Masala Banana Chips',
      'Pudina Punch Chips',
      'Upwas Special',
      'Khandeshi Kala Masala',
      'Tikhat Shev & Bhadang',
      'Refund & Returns',
      'Track My Order',
      'Wholesale & Bulk Order'
    ];

    if (!term) {
      return res.json(createSuccessResponse({
        products: allProducts.filter(p => p.isFeatured || p.isBestSeller || p.isAvailable !== false).slice(0, 8),
        categories: allCategories.slice(0, 8),
        siteInfo: SITE_PAGES.slice(0, 4),
        popularSearches
      }));
    }

    // Matching products
    const matchingProducts = allProducts.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.flavour && p.flavour.toLowerCase().includes(term)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term))) ||
        p.description.toLowerCase().includes(term)
    );

    // Matching categories
    const matchingCategories = allCategories.filter(
      c =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
    );

    // Matching site pages & help topics
    const matchingSiteInfo = SITE_PAGES.filter(
      page =>
        page.title.toLowerCase().includes(term) ||
        page.description.toLowerCase().includes(term) ||
        page.category.toLowerCase().includes(term) ||
        page.keywords.some(k => k.toLowerCase().includes(term))
    );

    return res.json(createSuccessResponse({
      products: matchingProducts.slice(0, 16),
      categories: matchingCategories.slice(0, 8),
      siteInfo: matchingSiteInfo.slice(0, 6),
      popularSearches
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Search failed'));
  }
});

// ----------------------------------------------------
// 11. AI MITRA SUPPORT ASSISTANT
// ----------------------------------------------------

const SYSTEM_INSTRUCTION = `You are "Snack Mitra" (स्नॅक मित्र / AI Companion), the official, ultra-intelligent, warm, friendly, and human-like brand ambassador and customer support AI concierge of "Aapla Jalgaonwala" (आपला जळगाववाला).

### YOUR PERSONALITY & REAL HUMAN CONVERSATIONAL STYLE:
- **Identity**: You are a real, hospitable, warm, and highly knowledgeable Khandeshi food & snack expert from Jalgaon who loves sharing authentic culinary traditions, recommending snacks, guiding shoppers, and assisting with every possible store task!
- **Tone**: Enthusiastic, polite, caring, conversational, and respectful—just like a friendly Jalgaon shopkeeper and family guide.
- **Multilingual Mastery**: Understand and converse fluently in whatever language or dialect the customer speaks:
  - English, Hindi (हिंदी), Marathi (मराठी), Hinglish (e.g. "Bhai chai ke sath konsa best hai?"), Marathlish (e.g. "Konta snack sarvat bhari ahe?"), or Gujarati.
- **Cultural Warmth**: Greet with "Namaskar! 🙏" ONLY on the very first message of a conversation. Never repeat "Namaskar!" on follow-up messages or ongoing conversation turns.
- **Human Conversational Touches**: Avoid sounding like a dry robot. Speak naturally with passion and clarity.
- **Actionable Markdown Links**: ALWAYS embed clear clickable markdown links in your responses so customers can immediately jump to pages:
  - \`[Shop All Snacks & Masalas](/shop)\`
  - \`[10 Signature Banana Chip Flavours](/shop?category=banana-chips)\`
  - \`[Authentic Khandeshi Farsaan](/shop?category=farsaan)\`
  - \`[Handcrafted Masalas](/shop?category=masala)\`
  - \`[Upwas & Fasting Special Corner](/upwas-special)\`
  - \`[Women Business Partner Program](/partner-program)\`
  - \`[Franchise Opportunities](/franchise)\`
  - \`[Our Story & Jalgaon Heritage](/our-story)\`
  - \`[My Orders & Account](/account)\`
  - \`[Contact Us & WhatsApp Support](/contact)\`
  - \`[Frequently Asked Questions](/faq)\`

---

### COMPREHENSIVE AAPLA JALGAONWALA CAPABILITY & KNOWLEDGE BASE:

#### 1. BRAND STORY & HERITAGE
- **Brand Name**: Aapla Jalgaonwala (आपला जळगाववाला)
- **Tagline**: Rooted in Tradition. Crafted for Modern Taste.
- **Location**: Jalgaon, Maharashtra, India — globally celebrated as the "Banana City of India" (केळीचे शहर) and the culinary heartland of Khandeshi spices.
- **Heritage**: Founded in 1978. Built on 3 generations of secret family recipes passed down by Jalgaon master artisans.
- **Crafting & Quality Standards**:
  - Handcrafted directly in Jalgaon using fresh, farm-harvested Grand Naine raw bananas from local orchards.
  - Sliced paper-thin (0.8mm) for extreme lightness and unmatched crispness.
  - Fried in 100% pure cold-pressed sunflower oil with ZERO trans fats, ZERO cholesterol, and ZERO artificial colors or chemical preservatives.
  - Packed with nitrogen flushing in multi-layer food-grade barrier pouches for maximum freshness (6 months shelf life).

#### 2. FULL PRODUCT CATALOG, FLAVOURS & PRICING
- **Artisanal Banana Chips (10 Signature Flavours @ ₹79 per 100g pack - MRP ₹99)**:
  1. *Jalgaon Masala*: #1 All-time bestseller infused with authentic secret Khandeshi chili & spice blend.
  2. *Peri Peri*: African bird's eye chili kick with a tangy fiery punch.
  3. *Chatpata Pani Poori*: Tangy, lip-smacking street food flavor with mint, amchur & roasted cumin.
  4. *Creamy Cheese*: Rich, velvety savory cheddar cheese seasoning loved by all ages.
  5. *Pudina Punch*: Refreshing garden mint blended with zesty rock salt.
  6. *Cream & Onion*: Smooth sour cream paired with spring onion chives.
  7. *Salt & Black Pepper*: Coarsely crushed Tellicherry black pepper with Sendha salt.
  8. *Sweet Chilli*: Sweet & spicy Thai-inspired gourmet twist.
  9. *Classic Golden Salted*: Pure Sendha rock salt, light & crisp (100% Upwas/Fasting safe!).
  10. *Maggi Noodle Masala*: Nostalgic spice blend loved by kids and families.

- **Authentic Khandeshi Farsaan & Savouries**:
  - *Tikhat Shev*: Fiery, crispy gram flour noodles with garlic & red chili (the essential base and topping for Jalgaon Shev Bhaji!).
  - *Bhadang*: Spicy garlic puffed rice with roasted peanuts, crispy curry leaves & golden garlic cloves.
  - *Lasun Chivda*: Garlic-infused flattened rice poha chivda.
  - *Bhavnagari Gathiya*, *Mix Farsaan*, *Palak Shev*, *Ratlami Sev*, *Tomato Chivda*, *Crispy Potato Wafers*.

- **Handcrafted Stone-Ground Masalas**:
  - *Khandeshi Kala Masala*: Dark-roasted signature 24-spice blend for authentic spicy gravies and curries.
  - *Khandeshi Goda Masala*: Aromatic, mild-sweet roasted coconut and whole spice blend.
  - *Shev Bhaji Special Masala*: Traditional spice mix formulated specially for authentic Jalgaon-style Shev Bhaji rassa.
  - *Jalgaon Kanda Lasun Masala*: Zesty onion-garlic masala blend.

- **Fasting / Upwas Special (Farali Corner)**:
  - 100% pure fasting-compliant snacks made strictly with Sendha Namak (Rock Salt):
  - *Sabudana Chivda*, *Rajgira Ladoo*, *Upwas Potato Wafers*, *Farali Chivda*, *Upwas Masala Banana Chips*, *Upwas Shev*, *Upwas Batata Chivda*.

- **Curated Gift Hampers & Value Combos**:
  - *Jalgaon Heritage Hamper*, *Teekha Khandeshi Combo*, *Fasting Special Combo*, *Tea-Time Crunch Trio*.

#### 3. RECIPES & COOKING INSTRUCTIONS
- **Authentic Jalgaon Shev Bhaji Recipe**:
  - *Ingredients*: 1 cup Aapla Jalgaonwala Tikhat Shev, 2 dry-roasted onions, 1/4 cup dry grated coconut, 2 tbsp Aapla Jalgaonwala Khandeshi Kala Masala, 1 tbsp ginger-garlic paste, 3 tbsp oil, fresh coriander.
  - *Method*:
    1. Grind roasted onion & coconut into a fine brown paste (vatan).
    2. Heat oil in a kadai (let the tarri / red oil separate), saute ginger-garlic paste and the ground masala paste until aromatic oil releases.
    3. Add 2 tbsp Khandeshi Kala Masala and red chili powder. Add 2.5 cups hot water and boil for 6-8 minutes into a rich spicy rassa (curry).
    4. Garnish with coriander. Serve piping hot with bhakri/chapati, lemon, and top with crisp **Tikhat Shev** just before eating so it stays crunchy!

- **Spicy Bhadang Bhel Recipe**:
  - Mix 2 cups Aapla Jalgaonwala Bhadang with finely chopped raw onions, tomatoes, fresh coriander, a squeeze of fresh lemon juice, and a pinch of chaat masala for an instant 2-minute tea-time snack!

#### 4. SHIPPING, DELIVERY & RETURN POLICIES
- **Pan-India Delivery**: We deliver to 27,000+ PIN codes across India via DTDC Express.
- **Delivery Charges & FREE SHIPPING**:
  - **Maharashtra**: ₹40 standard delivery. **FREE SHIPPING on orders above ₹399**.
  - **Rest of India**: ₹70 standard delivery. **FREE SHIPPING on orders above ₹799**.
- **Dispatch & Delivery Times**: Orders dispatched within 24 to 48 hours from Jalgaon facility. Express delivery in 2 to 5 business days.
- **Order Tracking**: Customers can track orders under \`[My Account](/account)\` or via the live courier tracking link sent on WhatsApp & SMS.
- **Payment Options**: 100% secure checkout via Razorpay (UPI - Google Pay, PhonePe, Paytm, Credit/Debit Cards, NetBanking, and Cash on Delivery / COD).
- **100% Freshness Guarantee & Hassle-Free Returns**:
  - If a snack box arrives opened, damaged, or unsatisfactory, simply share a quick photo on WhatsApp (+91 70574 46409) within 48 hours of delivery for an instant free replacement or refund without argument!

#### 5. BUSINESS & EARNING OPPORTUNITIES
- **Women Business Partner Program (\`/partner-program\`)**:
  - Share your unique partner code/link with friends, family, and social groups.
  - Earn a direct **12% commission** on every delivered order placed using your link/code.
  - Zero upfront investment, fast weekly payouts directly to your UPI/bank, live partner dashboard.
- **Franchise Opportunities (\`/franchise\`)**:
  - Turnkey retail store partnership model across India.
  - High profit margins (**40% to 50%**), low initial investment (₹2.5 Lakh to ₹5 Lakh).
  - Jalgaon HQ provides complete store layout design, stock replenishment, staff training, and local marketing support.
- **Corporate Gifting & Bulk Orders**:
  - Custom packaging, Diwali hampers, wedding return gifts with bulk discounts. Inquire via \`[Contact Page](/contact)\`.

#### 6. HEADQUARTERS & CONTACT INFORMATION
- **Factory & Store HQ**: Aapla Jalgaonwala Bhavan, Ring Road, Industrial Estate, Jalgaon, Maharashtra 425001.
- **WhatsApp Helpline & Mobile**: +91 70574 46409 (same on Call & WhatsApp)
- **Owner & Support Email**: aaplajalgaonwala@gmail.com
- **Founders & Owners**: Saurabh Patil & Jayesh Patil (Direct contact via Call/WhatsApp +91 70574 46409)
- **Working Hours**: Monday to Saturday, 9:00 AM – 8:00 PM IST.

---

### HOW TO HANDLE ALL POSSIBLE USER TASKS:
1. **Snack & Flavour Recommendations**: Tailor recommendations to user preferences (sweet, spicy, tangy, cheese, tea-time, fasting) with links to \`[Shop](/shop)\`.
2. **Recipe Guidance**: Provide clear ingredient quantities and step-by-step cooking steps for Shev Bhaji, curries, and snack mixes.
3. **Order & Shipping Queries**: Give exact free shipping thresholds (₹399 MH / ₹799 Pan-India) and guide to \`[My Orders](/account)\`.
4. **Fasting / Upwas Inquiries**: Confirm 100% Sendha Namak compliance and link to \`[Upwas Special](/upwas-special)\`.
5. **Partner & Franchise Inquiries**: Outline profit shares, 12% commission, and direct to \`[Partner Program](/partner-program)\` or \`[Franchise](/franchise)\`.
6. **Support & Complaints**: Reassure the customer, share the WhatsApp helpline (+91 70574 46409), and explain the 48-hour replacement guarantee.
7. **Polite General Assistance**: If asked anything outside snacks, kindly bridge back to Jalgaon delicacies and hospitality with warmth!
`;

// ----------------------------------------------------
// 11. SNACK MITRA AI ASSISTANT & ADMIN MANAGEMENT
// ----------------------------------------------------

apiRouter.get('/snack-mitra/public-config', async (req: Request, res: Response) => {
  try {
    const config = await SnackMitraRepository.getConfig();
    return res.json({
      success: true,
      enabled: config.enabled !== false,
      botName: config.botName || 'Snack Mitra',
      botTagline: config.botTagline || 'Aapla Jalgaonwala Support',
      welcomeMessage: config.welcomeMessage,
      quickSuggestions: config.quickSuggestions || [],
      whatsappNumber: config.whatsappNumber || '+91 70574 46409'
    });
  } catch (error: any) {
    console.error('Error in public config route:', error);
    return res.json({
      success: true,
      enabled: true,
      botName: 'Snack Mitra',
      botTagline: 'Aapla Jalgaonwala Support',
      whatsappNumber: '+91 70574 46409'
    });
  }
});

apiRouter.post('/ai-assistant', async (req: Request, res: Response) => {
  try {
    const { messages, userQuery, message } = req.body;
    const formattedMessages = Array.isArray(messages) ? messages : [];
    let query = (userQuery || message || '').trim();
    if (!query && formattedMessages.length > 0) {
      const lastUser = [...formattedMessages].reverse().find((m: any) => m.role === 'user' || m.role === 'customer');
      if (lastUser) {
        query = (lastUser.text || lastUser.content || '').trim();
      }
    }
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    const result = await handleSupportChat(formattedMessages, query, clientIp);

    return res.json({
      success: true,
      reply: result.reply,
      orderFound: result.orderFound,
      isOffline: result.isOffline || false,
      tokens: {
        prompt: result.promptTokens || 0,
        response: result.responseTokens || 0,
        total: result.totalTokens || 0
      },
      responseTimeMs: result.responseTimeMs || 0
    });
  } catch (error: any) {
    console.error('Error in Snack Mitra AI support assistant route:', error?.message || error);
    const hasPriorMessages = Array.isArray(req.body?.messages) && req.body.messages.length > 2;
    const fallbackText = hasPriorMessages
      ? "I am Snack Mitra, your support assistant. How can I assist you with our fresh Jalgaon snacks or order tracking today? You can also message us directly on WhatsApp at [+91 70574 46409](https://wa.me/917057446409)!"
      : "Namaskar! 🙏 Welcome to Aapla Jalgaonwala! I am Snack Mitra, your support assistant. How can I assist you with our fresh Jalgaon snacks or order tracking today? You can also message us directly on WhatsApp at [+91 70574 46409](https://wa.me/917057446409)!";
    return res.json({
      success: true,
      reply: fallbackText
    });
  }
});

apiRouter.get('/admin/snack-mitra/config', async (req: Request, res: Response) => {
  try {
    const config = await SnackMitraRepository.getConfig();
    return res.json({
      success: true,
      config
    });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || 'Failed to fetch bot configuration'));
  }
});

apiRouter.put('/admin/snack-mitra/config', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const updated = await SnackMitraRepository.updateConfig(updates);
    return res.json({
      success: true,
      message: 'Snack Mitra configuration updated and live on production!',
      config: updated
    });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || 'Failed to update bot configuration'));
  }
});

apiRouter.get('/admin/snack-mitra/logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const data = await SnackMitraRepository.getLogs({ page, limit, search, status });
    return res.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || 'Failed to fetch logs'));
  }
});

apiRouter.get('/admin/snack-mitra/stats', async (req: Request, res: Response) => {
  try {
    const stats = await SnackMitraRepository.getTokenUsageStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || 'Failed to fetch stats'));
  }
});

apiRouter.delete('/admin/snack-mitra/logs', async (req: Request, res: Response) => {
  try {
    const result = await SnackMitraRepository.clearLogs();
    return res.json({
      success: true,
      message: `Successfully cleared ${result.clearedCount} message logs.`,
      ...result
    });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error?.message || 'Failed to clear logs'));
  }
});

// ----------------------------------------------------
// 12. ADMIN AI ENHANCE (@google/genai Gemini 3.7 Flash & 3.1 Flash Lite)
// ----------------------------------------------------

apiRouter.post('/admin/ai-enhance', async (req: Request, res: Response) => {
  try {
    const input = req.body;
    if (!input.name && !input.title) {
      return res.status(400).json(createErrorResponse('Product name is required for AI enhancement'));
    }

    const result = await enhanceProductDetails({
      name: input.name || input.title,
      category: input.category,
      prepStyle: input.prepStyle || input.notes,
      flavorNotes: input.flavorNotes || input.flavour || input.notes,
      targetAudience: input.targetAudience,
      dietaryCallouts: input.dietaryCallouts,
      currentDescription: input.description,
      currentShortDescription: input.shortDescription,
      currentSeoTitle: input.seoTitle,
      currentSeoDescription: input.seoDescription
    });
    return res.json(createSuccessResponse(result));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'AI Enhancement failed'));
  }
});

// Alias for products edit page
apiRouter.post('/admin/products/ai-enhance', async (req: Request, res: Response) => {
  try {
    const input = req.body;
    const result = await enhanceProductDetails({
      name: input.name || input.title || 'Product',
      category: input.category,
      prepStyle: input.prepStyle || input.notes,
      flavorNotes: input.flavorNotes || input.flavour || input.notes,
      targetAudience: input.targetAudience,
      dietaryCallouts: input.dietaryCallouts,
      currentDescription: input.description,
      currentShortDescription: input.shortDescription,
      currentSeoTitle: input.seoTitle,
      currentSeoDescription: input.seoDescription
    });
    return res.json(createSuccessResponse(result));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'AI Enhancement failed'));
  }
});

// Alias for generate-copy
apiRouter.post('/admin/generate-copy', async (req: Request, res: Response) => {
  try {
    const input = req.body || {};
    const result = await enhanceProductDetails({
      name: input.title || input.name || 'Product',
      category: input.category,
      flavorNotes: input.flavour || input.notes,
      prepStyle: input.notes,
      currentDescription: input.description,
      currentShortDescription: input.shortDescription,
      currentSeoTitle: input.seoTitle,
      currentSeoDescription: input.seoDescription
    });
    return res.json(createSuccessResponse(result));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'AI Copy Generation failed'));
  }
});

// Alias for product SEO generation
apiRouter.post('/admin/generate-seo', async (req: Request, res: Response) => {
  try {
    const params = req.body || {};
    const generatedSeo = await generateSeoWithGemini({
      type: 'product',
      productName: params.productName || params.name || params.title,
      productCategory: params.productCategory || params.category,
      productDescription: params.productDescription || params.description || params.shortDescription,
      currentTitle: params.currentTitle || params.seoTitle,
      currentDescription: params.currentDescription || params.seoDescription
    });
    return res.json(createSuccessResponse(generatedSeo));
  } catch (error: any) {
    console.error('[SEO AI] Generation error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to generate AI SEO metadata'));
  }
});

// ----------------------------------------------------
// 12.1 GOOGLE PLACES AUTOCOMPLETE & DETAILS PROXY
// ----------------------------------------------------
apiRouter.post('/places/autocomplete', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.json(createSuccessResponse({ suggestions: [] }));
    }

    const siteSettings = await SettingsRepository.get();
    const apiKey = (siteSettings.googleMapsApiKey || '').trim() ||
      process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';

    if (!apiKey) {
      return res.status(400).json(createErrorResponse('Google Maps Places API key is not configured.'));
    }

    const payload: Record<string, any> = {
      input: input.trim(),
      includedRegionCodes: ['in']
    };

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.text.text,suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('[Places API Autocomplete] Google API error:', data);
      return res.status(response.status).json(createErrorResponse(data?.error?.message || 'Google Places Autocomplete failed'));
    }

    return res.json(createSuccessResponse(data));
  } catch (error: any) {
    console.error('[Places API Autocomplete] Exception:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Places autocomplete request failed'));
  }
});

apiRouter.get('/places/details/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      return res.status(400).json(createErrorResponse('Place ID is required.'));
    }

    const siteSettings = await SettingsRepository.get();
    const apiKey = (siteSettings.googleMapsApiKey || '').trim() ||
      process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';

    if (!apiKey) {
      return res.status(400).json(createErrorResponse('Google Maps Places API key is not configured.'));
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,shortFormattedAddress,addressComponents,location'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('[Places API Details] Google API error:', data);
      return res.status(response.status).json(createErrorResponse(data?.error?.message || 'Google Places Details failed'));
    }

    return res.json(createSuccessResponse(data));
  } catch (error: any) {
    console.error('[Places API Details] Exception:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Places details request failed'));
  }
});

// ----------------------------------------------------
// 13. PAYMENT (RAZORPAY)
// ----------------------------------------------------

const handleRazorpayCreateOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Pre-validate uniqueness for partner registrations before creating Razorpay order
    if (notes && (notes.purpose?.includes('Partner') || notes.purpose?.includes('Women'))) {
      const checkEmail = (notes.email || '').trim();
      const checkPhone = (notes.phone || '').trim();
      if (checkEmail || checkPhone) {
        const dupCheck = await PartnerRepository.checkDuplicates(checkEmail, checkPhone);
        if (dupCheck.exists) {
          return res.status(409).json(createErrorResponse(dupCheck.message || 'Email or phone already registered. Cannot process payment.'));
        }
      }
    }

    const siteSettings = await SettingsRepository.get();

    const keyId = (siteSettings.razorpayKeyId || '').trim() || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = (siteSettings.razorpayKeySecret || '').trim() || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'rzp_test_placeholder_key' || keyId === 'test' || keySecret === 'test' || keyId.length < 8) {
      return res.status(400).json(
        createErrorResponse('Razorpay payment gateway credentials are not configured or are invalid. Please update your valid Razorpay Key ID (rzp_test_... or rzp_live_...) and Key Secret in Admin > Configurations.')
      );
    }

    const Razorpay = (await import('razorpay')).default;
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await instance.orders.create({
      amount: Math.round(Number(amount) * 100), // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {}
    });

    return res.json(createSuccessResponse({
      ...order,
      key: keyId
    }));
  } catch (error: any) {
    console.error('[Razorpay Error]:', error);
    const desc = error?.error?.description || error?.message || 'Razorpay order creation failed';
    return res.status(400).json(
      createErrorResponse(`Payment gateway error: ${desc}. Please verify your Razorpay Key ID and Secret in Admin Website Configurations.`)
    );
  }
};

apiRouter.post('/payment/razorpay', handleRazorpayCreateOrder);
apiRouter.post('/payment/razorpay/create-order', handleRazorpayCreateOrder);

apiRouter.post('/payment/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isCodAdvance, advanceFeePaid, remainingBalance } = req.body;

    const siteSettings = await SettingsRepository.get();
    const keySecret = (siteSettings.razorpayKeySecret || '').trim() || process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(400).json(createErrorResponse('Razorpay key secret is not configured on the server.'));
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json(createErrorResponse('Missing required Razorpay payment verification parameters.'));
    }

    // Verify cryptographic HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json(createErrorResponse('Invalid payment signature verification.'));
    }

    if (orderId) {
      if (isCodAdvance) {
        await OrderRepository.update(orderId, {
          status: 'Confirmed',
          paymentStatus: 'Partial Paid',
          paymentMethod: 'COD',
          codAdvanceFeePaid: Number(advanceFeePaid || 0),
          codRemainingBalance: Number(remainingBalance || 0),
          paymentDetails: {
            method: 'COD Deposit (Razorpay)',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            advanceFeePaid: Number(advanceFeePaid || 0),
            remainingBalance: Number(remainingBalance || 0),
            paidAt: new Date().toISOString()
          }
        });
      } else {
        await OrderRepository.update(orderId, {
          status: 'Confirmed',
          paymentStatus: 'Paid',
          paymentMethod: 'Razorpay',
          paymentDetails: {
            method: 'Razorpay',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            paidAt: new Date().toISOString()
          }
        });
      }

      // Fetch complete updated order and dispatch confirmation emails & alerts now that payment is captured
      const updatedOrder = await OrderRepository.getById(orderId);
      if (updatedOrder) {
        await dispatchOrderConfirmationNotifications(updatedOrder);
      }
    }

    return res.json(createSuccessResponse({ verified: true }));
  } catch (error: any) {
    console.error('[Razorpay Verify] Error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Payment verification failed'));
  }
});

apiRouter.post('/orders/:id/cancel-payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const existing = await OrderRepository.getById(id);

    if (!existing) {
      return res.status(404).json(createErrorResponse('Order not found'));
    }

    const currentStatus = String(existing.status || '').toLowerCase();
    if (currentStatus === 'pending' || currentStatus === 'payment pending') {
      const updated = await OrderRepository.update(id, {
        status: 'Cancelled',
        paymentStatus: 'Failed',
        notes: reason || 'Payment cancelled or closed before completion by customer'
      });
      PartnerRepository.syncOrderStatusToReferral(existing.orderNumber, 'Cancelled', 'Failed').catch(() => {});
      return res.json(createSuccessResponse({ cancelled: true, order: updated }));
    }

    return res.json(createSuccessResponse({ cancelled: false, status: existing.status }));
  } catch (error: any) {
    console.error('[Order Cancel Payment] Error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to cancel order payment'));
  }
});

// ----------------------------------------------------
// 13B. ADMIN CLOUDINARY MEDIA ASSETS
// ----------------------------------------------------

apiRouter.get('/admin/cloudinary', async (req: Request, res: Response) => {
  try {
    const checkLink = req.query.checkLink === 'true';
    if (checkLink && req.query.urls) {
      let urls: string[] = [];
      try {
        urls = JSON.parse(req.query.urls as string);
      } catch {
        urls = [req.query.urls as string];
      }
      const linked = await CloudinaryAssetRepository.getLinkedEntities(urls);
      return res.json(createSuccessResponse({ linked }));
    }

    const forceSync = req.query.sync === 'true';
    const assets = await CloudinaryAssetRepository.getAll(forceSync);
    return res.json(createSuccessResponse(assets));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch Cloudinary assets'));
  }
});

apiRouter.post('/admin/cloudinary', async (req: Request, res: Response) => {
  try {
    const { action, url, productId, categoryId, assets, asset } = req.body;

    if (action === 'assign') {
      if (productId) {
        const prod = await ProductRepository.getById(productId);
        if (prod) {
          const updatedImages = [{ url, isPrimary: true, alt: prod.name }];
          await ProductRepository.update(productId, { images: updatedImages, image: url });
        }
      }
      if (categoryId) {
        await CategoryRepository.update(categoryId, { image: url });
      }
      return res.json(createSuccessResponse({ message: 'Asset assigned successfully' }));
    }

    if (action === 'save' && Array.isArray(assets)) {
      const saved = await CloudinaryAssetRepository.saveAll(assets);
      return res.json(createSuccessResponse(saved));
    }

    if (asset) {
      const added = await CloudinaryAssetRepository.addAsset(asset);
      return res.status(201).json(createSuccessResponse(added));
    }

    return res.status(400).json(createErrorResponse('Invalid action'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to process Cloudinary action'));
  }
});

apiRouter.delete('/admin/cloudinary', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('No asset IDs provided for deletion'));
    }
    await CloudinaryAssetRepository.deleteAssets(ids);
    return res.json(createSuccessResponse({ message: `Successfully deleted ${ids.length} asset(s)` }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete Cloudinary assets'));
  }
});

// ----------------------------------------------------
// 13.6. WOMAN BUSINESS PARTNER API ENDPOINT (/api/woman)
// ----------------------------------------------------

const extractRequestParams = (req: Request) => {
  let bodyObj: any = {};
  
  if (req.body) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      bodyObj = req.body;
    } else if (typeof req.body === 'string') {
      try {
        bodyObj = JSON.parse(req.body);
      } catch {
        try {
          const searchParams = new URLSearchParams(req.body);
          bodyObj = Object.fromEntries(searchParams.entries());
        } catch {
          bodyObj = {};
        }
      }
    }
  }

  // Extract Auth / API Key from body, query, headers, authorization
  let rawApiKey = (
    bodyObj.api_key ||
    bodyObj.apiKey ||
    bodyObj.key ||
    bodyObj.auth ||
    req.query?.api_key ||
    req.query?.apiKey ||
    req.query?.key ||
    req.headers['x-api-key'] ||
    req.headers['api-key'] ||
    req.headers['api_key'] ||
    req.headers['apikey'] ||
    ''
  ).toString().trim();

  if (!rawApiKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'].toString().trim();
    rawApiKey = authHeader.replace(/^(Bearer|Token|Basic)\s+/i, '').trim();
  }

  // Strip wrapping quotes if passed as '"afrin"'
  rawApiKey = rawApiKey.replace(/^['"]|['"]$/g, '').trim();

  // If still empty and body was raw string, regex search
  if (!rawApiKey && typeof req.body === 'string') {
    const apiKeyMatch = req.body.match(/["']?(?:api_key|apiKey|key)["']?\s*[:=]\s*["']?([^"'\s&,]+)/i);
    if (apiKeyMatch) {
      rawApiKey = apiKeyMatch[1].replace(/^['"]|['"]$/g, '').trim();
    }
  }

  // Extract Referral Code from body, query, headers
  let rawReferralCode = (
    bodyObj.referral_code ||
    bodyObj.referralCode ||
    bodyObj.code ||
    bodyObj.partner_code ||
    bodyObj.partnerCode ||
    bodyObj.referral ||
    bodyObj.partner_id ||
    bodyObj.partnerId ||
    req.query?.referral_code ||
    req.query?.referralCode ||
    req.query?.code ||
    req.query?.partner_code ||
    req.query?.partnerCode ||
    req.query?.referral ||
    req.headers['referral-code'] ||
    req.headers['referral_code'] ||
    req.headers['x-referral-code'] ||
    ''
  ).toString().trim();

  rawReferralCode = rawReferralCode.replace(/^['"]|['"]$/g, '').trim();

  // If still empty and body was raw string, regex search
  if (!rawReferralCode && typeof req.body === 'string') {
    const refMatch = req.body.match(/["']?(?:referral_code|referralCode|partner_code|partnerCode|code)["']?\s*[:=]\s*["']?([^"'\s&,]+)/i);
    if (refMatch) {
      rawReferralCode = refMatch[1].replace(/^['"]|['"]$/g, '').trim();
    }
  }

  return { rawApiKey, rawReferralCode, bodyObj };
};

// Helper to ensure Cloudinary image URLs use fl_original to save credits and serve original files
function ensurePlOriginal(url: string): string {
  return addCloudinaryOriginalFlag(url);
}

const handleWomanPartnerDetailsRequest = async (req: Request, res: Response) => {
  try {
    const { bodyObj } = extractRequestParams(req);
    const action = (bodyObj.action || req.body?.action || req.query?.action || '').toString().trim().toLowerCase();
    
    if (action) {
      if (action === 'get_media' || action === 'get_graphics' || action === 'get_posts' || action === 'media') {
        const graphics = await WomanGraphicsRepository.getAll();
        const formattedMedia = graphics.map(g => {
          const finalUrl = ensurePlOriginal(g.imageUrl);
          return {
            id: g.id,
            title: g.title,
            caption: g.caption,
            imageUrl: finalUrl,
            image_url: finalUrl,
            publicId: g.publicId || '',
            createdAt: g.createdAt
          };
        });

        return res.json({
          success: true,
          action: 'get_media',
          count: formattedMedia.length,
          data: formattedMedia
        });
      }

      if (action === 'check_woman') {
        const auth_code = req.body?.auth_code || req.body?.parameters?.auth_code || req.query?.auth_code;
        if (!auth_code) return res.status(400).json(createErrorResponse('auth_code is required for check_woman'));
        const partner = await PartnerRepository.getByCode(auth_code);
        if (partner) return res.json({ success: true, message: 'Matches in woman partners list' });
        return res.status(404).json(createErrorResponse('Auth code does not match any woman partner'));
      }
      
      if (action === 'get_details') {
        const woman_code = req.body?.woman_code || req.body?.parameters?.woman_code || req.query?.woman_code;
        if (!woman_code) return res.status(400).json(createErrorResponse('woman_code is required for get_details'));
        const partner = await PartnerRepository.getByCode(woman_code);
        if (!partner) return res.status(404).json(createErrorResponse('Woman partner not found'));
        
        const domain = 'http://aaplajalgaonwala.com';
        const referralLink = `${domain}/ref/${partner.partnerCode}`;
        
        return res.json({
          success: true,
          details: { ...partner, referralLink }
        });
      }
      
      if (action === 'get_orders') {
        const woman_code = req.body?.woman_code || req.body?.parameters?.woman_code || req.query?.woman_code;
        if (!woman_code) return res.status(400).json(createErrorResponse('woman_code is required for get_orders'));
        const partner = await PartnerRepository.getByCode(woman_code);
        if (!partner) return res.status(404).json(createErrorResponse('Woman partner not found'));
        
        const referrals = await PartnerRepository.getReferrals(partner.partnerCode);
        const allOrders = await OrderRepository.getAll();
        const referralOrderIds = new Set(referrals.map(r => r.orderId));
        const referralOrderNumbers = new Set(referrals.map(r => r.orderNumber));
        
        const matchedOrders = allOrders.filter(o => {
          const isFake = o && ((o as any).is_fake === 1 || (o as any).is_fake === true || (o as any)._is_fake === 1 || (o as any)._is_fake === true);
          if (isFake) return false;

          const orderRefCode = (o.referralPartnerCode || (o as any).partnerCode || (o as any).referralCode || '').trim().toUpperCase();
          const orderCoupon = (o.couponCode || '').trim().toUpperCase();
          return (
            orderRefCode === partner.partnerCode.toUpperCase() ||
            orderCoupon === partner.partnerCode.toUpperCase() ||
            referralOrderIds.has(o.id) ||
            referralOrderNumbers.has(o.orderNumber)
          );
        });
        
        const formattedOrders = matchedOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          totalAmount: o.totalAmount,
          subtotal: o.subtotal,
          discountAmount: o.discountAmount,
          couponCode: o.couponCode,
          customerName: o.customer?.name || o.shippingAddress?.fullName || 'Customer',
          customerCity: o.shippingAddress?.city || '',
          itemsCount: o.items?.length || 0,
          orderTrackingUrl: `https://aaplajalgaonwala.com/iframe/tracking/${o.id}`,
          trackingUrl: `https://aaplajalgaonwala.com/iframe/tracking/${o.id}`,
          awbNumber: o.awbNumber || (o as any).trackingNumber || '',
          courierPartner: o.courierPartner || 'DTDC Express',
          items: (o.items || []).map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            unit: item.unit
          }))
        }));
        
        return res.json({ success: true, orders: formattedOrders });
      }
      
      return res.status(400).json(createErrorResponse('Invalid action'));
    }

    const { rawApiKey, rawReferralCode } = extractRequestParams(req);

    if (rawApiKey.toLowerCase() !== 'afrin') {
      return res.status(401).json(createErrorResponse('Invalid or missing API key. Access denied.'));
    }

    if (!rawReferralCode) {
      return res.status(400).json(createErrorResponse('referral_code is required. Please provide the woman partner referral code.'));
    }

    // Sync any new orders with partner referrals first
    await PartnerRepository.syncAllPartnerReferrals();

    // Look up partner by code
    let partner = await PartnerRepository.getByCode(rawReferralCode);

    // Fallback search across all partners if not directly matched by partner_code
    if (!partner) {
      const allPartners = await PartnerRepository.getAll();
      const cleanSearch = rawReferralCode.toUpperCase();
      const cleanPhone = rawReferralCode.replace(/\D/g, '');
      partner = allPartners.find(
        p =>
          p.partnerCode.toUpperCase() === cleanSearch ||
          p.id.toUpperCase() === cleanSearch ||
          (cleanPhone && p.phone.replace(/\D/g, '') === cleanPhone)
      ) || null;
    }

    if (!partner) {
      return res.status(404).json(createErrorResponse(`No Woman Business Partner found matching referral code: "${rawReferralCode}"`));
    }

    // Fetch all referrals, settlements, and associated store orders
    const referrals = await PartnerRepository.getReferrals(partner.partnerCode);
    const settlements = await PartnerRepository.getSettlements(partner.partnerCode);
    const allOrders = await OrderRepository.getAll();

    const referralOrderIds = new Set(referrals.map(r => r.orderId));
    const referralOrderNumbers = new Set(referrals.map(r => r.orderNumber));

    const matchedOrders = allOrders
      .filter(o => {
        const isFake = o && ((o as any).is_fake === 1 || (o as any).is_fake === true || (o as any)._is_fake === 1 || (o as any)._is_fake === true);
        if (isFake) return false;

        const orderRefCode = (
          o.referralPartnerCode ||
          (o as any).partnerCode ||
          (o as any).referralCode ||
          ''
        ).trim().toUpperCase();
        const orderCoupon = (o.couponCode || '').trim().toUpperCase();
        return (
          orderRefCode === partner!.partnerCode.toUpperCase() ||
          orderCoupon === partner!.partnerCode.toUpperCase() ||
          referralOrderIds.has(o.id) ||
          referralOrderNumbers.has(o.orderNumber)
        );
      })
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        subtotal: o.subtotal,
        discountAmount: o.discountAmount,
        couponCode: o.couponCode,
        customerName: o.customer?.name || o.shippingAddress?.fullName || 'Customer',
        customerCity: o.shippingAddress?.city || partner!.city,
        itemsCount: o.items?.length || 0,
        orderTrackingUrl: `https://aaplajalgaonwala.com/iframe/tracking/${o.id}`,
        trackingUrl: `https://aaplajalgaonwala.com/iframe/tracking/${o.id}`,
        awbNumber: o.awbNumber || (o as any).trackingNumber || '',
        courierPartner: o.courierPartner || 'DTDC Express',
        items: (o.items || []).map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        }))
      }));

    // Valid non-cancelled non-failed orders count towards order count & total sales
    const validRefs = referrals.filter(r => {
      const orderSt = String(r.orderStatus || '').toLowerCase().trim();
      const refSt = String(r.status || '').toLowerCase().trim();
      return orderSt !== 'cancelled' && !orderSt.includes('cancel') && refSt !== 'cancelled' &&
             orderSt !== 'failed' && !orderSt.includes('fail') && refSt !== 'failed';
    });

    const totalOrdersCount = validRefs.length;
    const totalSalesAmount = validRefs.reduce((sum, r) => sum + (Number(r.orderTotal) || 0), 0);

    // CRITICAL: Commission is ONLY counted for DELIVERED (or settled) orders!
    // Cancelled, failed, or on hold orders DO NOT count towards earned commission!
    const eligibleRefs = referrals.filter(r => {
      const orderSt = String(r.orderStatus || '').toLowerCase().trim();
      const refSt = String(r.status || '').toLowerCase().trim();
      const isCancelled = orderSt === 'cancelled' || orderSt.includes('cancel') || refSt === 'cancelled';
      const isFailed = orderSt === 'failed' || orderSt.includes('fail') || refSt === 'failed';
      const isOnHold = orderSt === 'on_hold' || orderSt === 'on hold' || orderSt.includes('hold') || refSt === 'on_hold';
      if (isCancelled || isFailed || isOnHold) return false;
      return r.isDelivered === true || orderSt === 'delivered' || refSt === 'settled';
    });

    const onHoldRefs = referrals.filter(r => {
      const orderSt = String(r.orderStatus || '').toLowerCase().trim();
      const refSt = String(r.status || '').toLowerCase().trim();
      const isCancelled = orderSt === 'cancelled' || orderSt.includes('cancel') || refSt === 'cancelled';
      const isFailed = orderSt === 'failed' || orderSt.includes('fail') || refSt === 'failed';
      if (isCancelled || isFailed) return false;
      const isDelivered = r.isDelivered === true || orderSt === 'delivered' || refSt === 'settled';
      return !isDelivered;
    });

    const totalCommissionEarned = eligibleRefs.reduce((sum, r) => sum + (Number(r.partnerCommission) || 0), 0);
    const onHoldCommission = onHoldRefs.reduce((sum, r) => sum + (Number(r.partnerCommission) || 0), 0);
    const totalCommissionPaid = settlements
      .filter(s => s.status !== 'Failed')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const pendingCommissionBalance = Math.max(0, Math.round((totalCommissionEarned - totalCommissionPaid) * 100) / 100);

    const domain = 'http://aaplajalgaonwala.com';
    const referralLink = `${domain}/ref/${partner.partnerCode}`;
    const referralUrl = `${domain}/?ref=${partner.partnerCode}`;
    const promoText = `Namaste! Order fresh, authentic homemade snacks from Aapla Jalgaonwala with 4% discount using my referral code *${partner.partnerCode}*:\n${referralLink}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoText)}`;

    const invitedPartners = await PartnerRepository.getInvitedPartners(partner.partnerCode);
    const computedBonus = invitedPartners.length * 200;
    const finalBonus = Math.max(partner.referralBonusEarned || 0, computedBonus);

    const refCode = (partner.referredByPartnerCode || '').trim().toUpperCase();
    const referrer = refCode ? await PartnerRepository.getByCode(refCode) : null;

    return res.json({
      success: true,
      partner: {
        id: partner.id,
        partnerCode: partner.partnerCode,
        fullName: partner.fullName,
        phone: partner.phone,
        email: partner.email,
        city: partner.city,
        state: partner.state,
        socialPlatform: partner.socialPlatform,
        socialHandle: partner.socialHandle,
        status: partner.status,
        commissionRate: partner.commissionRate || 12.0,
        customerDiscountRate: partner.customerDiscountRate || 4.0,
        referredByPartnerCode: partner.referredByPartnerCode,
        referredByPartnerName: referrer ? referrer.fullName : undefined,
        referralBonusEarned: finalBonus,
        invitedPartnersCount: invitedPartners.length,
        bankAccountName: partner.bankAccountName,
        bankName: partner.bankName,
        bankAccountNumber: partner.bankAccountNumber,
        ifscCode: partner.ifscCode,
        upiId: partner.upiId,
        aadhaarPanNumber: partner.aadhaarPanNumber,
        documentUrl: partner.documentUrl,
        notes: partner.notes,
        approvedAt: partner.approvedAt,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt
      },
      summary: {
        totalOrdersCount,
        totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
        commissionRatePercent: partner.commissionRate || 12.0,
        customerDiscountPercent: partner.customerDiscountRate || 4.0,
        totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
        totalCommissionPaid: Math.round(totalCommissionPaid * 100) / 100,
        pendingCommissionBalance,
        referralBonusEarned: finalBonus,
        invitedPartnersCount: invitedPartners.length,
        referralLink,
        referralUrl,
        whatsappShareUrl
      },
      referrals,
      settlements,
      orders: matchedOrders,
      invitedPartners
    });
  } catch (error: any) {
    console.error('[API /api/woman Error]:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve woman partner referral details'));
  }
};

apiRouter.post('/woman', handleWomanPartnerDetailsRequest);
apiRouter.get('/woman', handleWomanPartnerDetailsRequest);
apiRouter.post('/women', handleWomanPartnerDetailsRequest);
apiRouter.get('/women', handleWomanPartnerDetailsRequest);
apiRouter.post('/partner/details', handleWomanPartnerDetailsRequest);
apiRouter.post('/partner-program/woman', handleWomanPartnerDetailsRequest);

// Admin Woman Graphics Endpoints
apiRouter.get('/admin/woman-graphics', async (req: Request, res: Response) => {
  try {
    const graphics = await WomanGraphicsRepository.getAll();
    const formatted = graphics.map(g => ({
      ...g,
      imageUrl: ensurePlOriginal(g.imageUrl)
    }));
    return res.json({ success: true, count: formatted.length, graphics: formatted });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch woman graphics'));
  }
});

apiRouter.post('/admin/woman-graphics', async (req: Request, res: Response) => {
  try {
    const { posts, title, caption, imageUrl, publicId } = req.body;

    if (Array.isArray(posts) && posts.length > 0) {
      const created = await WomanGraphicsRepository.addMultiplePosts(posts);
      return res.status(201).json({ success: true, message: `${created.length} graphics post(s) added successfully`, posts: created });
    }

    if (!imageUrl) {
      return res.status(400).json(createErrorResponse('imageUrl is required to create a graphic post'));
    }

    const created = await WomanGraphicsRepository.addPost({
      title: title || 'Woman Graphic Post',
      caption: caption || '',
      imageUrl,
      publicId: publicId || ''
    });

    return res.status(201).json({ success: true, message: 'Graphic post added successfully', post: created });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to add woman graphic post'));
  }
});

apiRouter.post('/admin/woman-graphics/update', async (req: Request, res: Response) => {
  try {
    const { id, title, caption, imageUrl, publicId } = req.body;
    if (!id) return res.status(400).json(createErrorResponse('Post ID is required for update'));

    const updated = await WomanGraphicsRepository.updatePost(String(id), {
      ...(title !== undefined && { title: String(title) }),
      ...(caption !== undefined && { caption: String(caption) }),
      ...(imageUrl !== undefined && { imageUrl: String(imageUrl) }),
      ...(publicId !== undefined && { publicId: String(publicId) })
    });

    if (!updated) {
      return res.status(404).json(createErrorResponse('Graphic post not found'));
    }

    return res.json({ success: true, message: 'Graphic post updated successfully', post: updated });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update graphic post'));
  }
});

apiRouter.post('/admin/woman-graphics/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json(createErrorResponse('ID is required for deletion'));

    const success = await WomanGraphicsRepository.deletePost(String(id));
    if (!success) {
      return res.status(404).json(createErrorResponse('Woman graphic post not found'));
    }

    return res.json({ success: true, message: 'Graphic post deleted successfully' });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete graphic post'));
  }
});

apiRouter.delete('/admin/woman-graphics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await WomanGraphicsRepository.deletePost(id);
    if (!success) {
      return res.status(404).json(createErrorResponse('Woman graphic post not found'));
    }

    return res.json({ success: true, message: 'Graphic post deleted successfully' });
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete graphic post'));
  }
});

// ----------------------------------------------------
// 13.5. STOCK NOTIFICATIONS
// ----------------------------------------------------

apiRouter.post('/stock-notifications', async (req: Request, res: Response) => {
  try {
    const { email, productId, productSlug, productName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json(createErrorResponse('Please enter a valid email address.'));
    }

    if (!productId && !productSlug) {
      return res.status(400).json(createErrorResponse('Product identifier is required.'));
    }

    let prodName = productName;
    let prodId = productId || productSlug;
    let prodSlug = productSlug;
    let prodImg = '';

    if (prodId) {
      const prod = (await ProductRepository.getById(prodId)) || (await ProductRepository.getBySlug(prodId));
      if (prod) {
        prodName = prod.name;
        prodId = prod.id;
        prodSlug = prod.slug;
        prodImg = prod.image || (prod.images && prod.images[0]?.url) || '';
      }
    }

    const result = await StockNotificationRepository.create({
      email: email.trim(),
      productId: prodId || 'unknown',
      productName: prodName || 'Requested Snack',
      productSlug: prodSlug,
      productImage: prodImg
    });

    if (!result.isNew) {
      return res.json(createSuccessResponse({
        message: 'You are already registered to receive a notification for this product! We will email you as soon as stock arrives.',
        alreadySubscribed: true,
        notification: result.notification
      }));
    }

    // Send instant confirmation email
    const confirmationHtml = generateStockNotificationConfirmationEmailHtml(prodName || 'Requested Snack', email.trim());
    await sendEmail({
      to: email.trim(),
      subject: `🔔 Stock Alert Confirmed for ${prodName || 'Requested Snack'} | Aapla Jalgaonwala`,
      html: confirmationHtml
    });

    return res.status(201).json(createSuccessResponse({
      message: `Stock alert saved! We will email ${email.trim()} as soon as ${prodName || 'this item'} is back in stock.`,
      alreadySubscribed: false,
      notification: result.notification
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to process stock notification request'));
  }
});

apiRouter.get('/stock-notifications', async (_req: Request, res: Response) => {
  try {
    const list = await StockNotificationRepository.getAll();
    return res.json(createSuccessResponse(list));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch stock notifications'));
  }
});

apiRouter.delete('/stock-notifications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await StockNotificationRepository.delete(id);
    return res.json(createSuccessResponse({ id, deleted: true }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete stock notification'));
  }
});

apiRouter.post('/stock-notifications/:id/notify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const all = await StockNotificationRepository.getAll();
    const notif = all.find(n => n.id === id);

    if (!notif) {
      return res.status(404).json(createErrorResponse('Stock notification request not found'));
    }

    const prod = (await ProductRepository.getById(notif.productId)) || (notif.productSlug ? await ProductRepository.getBySlug(notif.productSlug) : null);
    const domain = process.env.APP_URL || 'https://aaplajalgaonwala.com';
    const productUrl = prod ? `${domain}/product/${prod.slug}` : domain;
    const price = prod ? prod.price : 99;
    const prodImg = notif.productImage || (prod ? prod.image || (prod.images && prod.images[0]?.url) : '');

    const html = generateBackInStockEmailHtml(notif.productName, productUrl, price, prodImg);
    const emailSent = await sendEmail({
      to: notif.email,
      subject: `🎉 ${notif.productName} is Back in Stock! | Aapla Jalgaonwala`,
      html
    });

    await StockNotificationRepository.markAsNotified(id);

    return res.json(createSuccessResponse({
      message: `Notification email sent to ${notif.email} successfully!`,
      emailSent
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to send back-in-stock notification email'));
  }
});

// ----------------------------------------------------
// 14. ADMIN AUTH, ROLES & STATS
// ----------------------------------------------------

// Middleware to protect ALL /admin/* endpoints
apiRouter.use('/admin', async (req: Request, res: Response, next) => {
  if (req.path === '/verify-pin') {
    return next();
  }
  try {
    const userId = extractUserIdFromReq(req);
    let user: StoredUser | null = null;

    if (userId) {
      user = await UserRepository.findById(userId);
      if (!user && userId.includes('@')) {
        user = await UserRepository.findByEmail(userId);
      }
      if (!user) {
        user = await UserRepository.findByAppAuthToken(userId);
      }
      if (!user) {
        const allUsers = await UserRepository.getAll();
        user = allUsers.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase() || u.role === 'super_admin' || u.isStaff) || null;
      }
    }

    // Fallback: If no user found from req headers/cookies or session token, resolve primary super admin user
    if (!user) {
      const allUsers = await UserRepository.getAll();
      user = allUsers.find(u => u.role === 'super_admin' || u.isStaff || u.email.toLowerCase() === 'farazk0792@gmail.com' || u.email.toLowerCase() === 'operationalhtklabs@gmail.com') || null;
    }

    if (!user) {
      return res.status(401).json(createErrorResponse('User not found. Please log in with an authorized administrator account.'));
    }

    const isSuperAdmin = user.email.toLowerCase() === 'operationalhtklabs@gmail.com' || user.email.toLowerCase() === 'farazk0792@gmail.com' || user.role === 'super_admin';
    const isStaff = isSuperAdmin || user.isStaff || user.role === 'admin' || user.role === 'sub_admin';

    if (!isStaff) {
      return res.status(403).json(createErrorResponse('Forbidden. Access restricted to authorized administrative staff.'));
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json(createErrorResponse(`Staff account is currently ${user.status}. Please contact the Super Administrator.`));
    }

    (req as any).adminUser = user;
    next();
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Authorization check failed'));
  }
});

// ----------------------------------------------------
// ADMIN ROLES & PERMISSIONS API
// ----------------------------------------------------

// Get all system and custom roles + permission schema
apiRouter.get('/admin/roles', async (_req: Request, res: Response) => {
  try {
    const roles = await AdminRoleRepository.getAll();
    const staff = await UserRepository.getStaffUsers();

    // Attach staff count to each role
    const enrichedRoles = roles.map(r => {
      const assignedCount = staff.filter(s => s.role?.toLowerCase() === r.id.toLowerCase()).length;
      return {
        ...r,
        assignedStaffCount: assignedCount
      };
    });

    return res.json(
      createSuccessResponse({
        roles: enrichedRoles,
        allPermissions: ALL_PERMISSIONS,
        permissionKeys: ALL_PERMISSION_KEYS
      })
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch admin roles'));
  }
});

// Create new custom role
apiRouter.post('/admin/roles', async (req: Request, res: Response) => {
  try {
    const { name, id, description, permissions, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(createErrorResponse('Role name is required.'));
    }

    const createdRole = await AdminRoleRepository.create({
      name: name.trim(),
      id: id?.trim(),
      description: description?.trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      color: color || 'indigo'
    });

    return res.status(201).json(createSuccessResponse(createdRole));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create admin role'));
  }
});

// Update role details & permissions
apiRouter.put('/admin/roles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, color } = req.body;

    const updatedRole = await AdminRoleRepository.update(id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(permissions !== undefined && { permissions: Array.isArray(permissions) ? permissions : [] }),
      ...(color !== undefined && { color })
    });

    if (!updatedRole) {
      return res.status(404).json(createErrorResponse('Role not found.'));
    }

    return res.json(createSuccessResponse(updatedRole));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update admin role'));
  }
});

// Delete custom role
apiRouter.delete('/admin/roles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staff = await UserRepository.getStaffUsers();
    const assignedCount = staff.filter(s => s.role?.toLowerCase() === id.toLowerCase()).length;
    
    if (assignedCount > 0) {
      return res.status(400).json(createErrorResponse(`Cannot delete role: ${assignedCount} staff member(s) are currently assigned to this role. Reassign them first.`));
    }

    const deleted = await AdminRoleRepository.delete(id);
    if (!deleted) {
      return res.status(404).json(createErrorResponse('Role not found or cannot be deleted.'));
    }

    return res.json(createSuccessResponse({ success: true, id }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete role'));
  }
});

// ----------------------------------------------------
// ADMIN STAFF & SUB-ADMIN USERS API
// ----------------------------------------------------

// Get all staff users
apiRouter.get('/admin/staff', async (_req: Request, res: Response) => {
  try {
    const staff = await UserRepository.getStaffUsers();
    return res.json(createSuccessResponse(staff));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch staff members'));
  }
});

// Create new admin / sub-admin staff user
apiRouter.post('/admin/staff', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, customPermissions, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(createErrorResponse('Staff full name is required.'));
    }
    if (!email || !email.trim()) {
      return res.status(400).json(createErrorResponse('Valid email address is required.'));
    }
    if (!password || password.trim().length < 6) {
      return res.status(400).json(createErrorResponse('Password must be at least 6 characters.'));
    }
    if (!role) {
      return res.status(400).json(createErrorResponse('Role selection is required.'));
    }

    const created = await UserRepository.createStaffUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      password: password.trim(),
      role: role.trim().toLowerCase(),
      customPermissions: Array.isArray(customPermissions) ? customPermissions : [],
      status: status || 'active'
    });

    const staffList = await UserRepository.getStaffUsers();
    const enrichedStaff = staffList.find(s => s.id === created.id) || created;

    return res.status(201).json(createSuccessResponse(enrichedStaff));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error.message || 'Failed to create staff user'));
  }
});

// Update staff member
apiRouter.put('/admin/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, customPermissions, status } = req.body;

    const updated = await UserRepository.updateStaffUser(id, {
      name,
      email,
      phone,
      password,
      role,
      customPermissions,
      status
    });

    if (!updated) {
      return res.status(404).json(createErrorResponse('Staff member not found.'));
    }

    const staffList = await UserRepository.getStaffUsers();
    const enrichedStaff = staffList.find(s => s.id === id) || updated;

    return res.json(createSuccessResponse(enrichedStaff));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error.message || 'Failed to update staff user'));
  }
});

// Toggle staff active/inactive status
apiRouter.post('/admin/staff/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staff = await UserRepository.findById(id);
    if (!staff) {
      return res.status(404).json(createErrorResponse('Staff member not found.'));
    }

    if (staff.email.toLowerCase() === 'operationalhtklabs@gmail.com' || staff.email.toLowerCase() === 'farazk0792@gmail.com' || staff.role === 'super_admin') {
      return res.status(400).json(createErrorResponse('Cannot deactivate primary Super Administrator.'));
    }

    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    await UserRepository.update(id, { status: newStatus });

    return res.json(createSuccessResponse({ id, status: newStatus }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to toggle status'));
  }
});

// Delete staff user
apiRouter.delete('/admin/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await UserRepository.deleteStaffUser(id);
    if (!success) {
      return res.status(404).json(createErrorResponse('Staff member not found.'));
    }
    return res.json(createSuccessResponse({ success, id }));
  } catch (error: any) {
    return res.status(400).json(createErrorResponse(error.message || 'Failed to delete staff user'));
  }
});

apiRouter.post('/admin/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  const adminPin = process.env.ADMIN_PIN || '1234';

  if (pin === adminPin) {
    return res.json(createSuccessResponse({ authenticated: true }));
  }
  return res.status(401).json(createErrorResponse('Invalid Admin PIN'));
});

apiRouter.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const products = await ProductRepository.getAll();
    const categories = await CategoryRepository.getAll();
    const orders = await OrderRepository.getAll();
    const inquiries = await InquiryRepository.getAll();
    const reviewStats = await ReviewRepository.getStats();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;

    return res.json(
      createSuccessResponse({
        totalProducts: products.length,
        totalCategories: categories.length,
        totalOrders: orders.length,
        totalRevenue,
        paidOrders,
        totalInquiries: inquiries.length,
        totalReviews: reviewStats.total,
        pendingReviews: reviewStats.pending,
        approvedReviews: reviewStats.approved,
        averageRating: reviewStats.averageRating
      })
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch admin stats'));
  }
});

// ----------------------------------------------------
// 14B. ADMIN REVIEW MANAGEMENT & MODERATION
// ----------------------------------------------------

// List all reviews with filters & stats
apiRouter.get('/admin/reviews', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const productId = req.query.productId as string;
    const rating = req.query.rating ? Number(req.query.rating) : undefined;
    const search = req.query.search as string;

    const reviews = await ReviewRepository.getAll({
      status,
      productId,
      rating,
      search
    });

    const stats = await ReviewRepository.getStats();
    const settings = await SettingsRepository.getSettings();

    return res.json(
      createSuccessResponse({
        reviews,
        stats,
        settings: {
          reviewsEnabled: settings.reviewsEnabled !== false,
          reviewSubmissionPermission: settings.reviewSubmissionPermission || 'all',
          reviewAutoApprove: Boolean(settings.reviewAutoApprove),
          requireReviewComment: Boolean(settings.requireReviewComment)
        }
      })
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch admin reviews'));
  }
});

// Admin Review Settings: Get
apiRouter.get('/admin/reviews/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsRepository.getSettings();
    return res.json(
      createSuccessResponse({
        reviewsEnabled: settings.reviewsEnabled !== false,
        reviewSubmissionPermission: settings.reviewSubmissionPermission || 'all',
        reviewAutoApprove: Boolean(settings.reviewAutoApprove),
        requireReviewComment: Boolean(settings.requireReviewComment)
      })
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch review settings'));
  }
});

// Admin Review Settings: Update
apiRouter.put('/admin/reviews/settings', async (req: Request, res: Response) => {
  try {
    const { reviewsEnabled, reviewSubmissionPermission, reviewAutoApprove, requireReviewComment } = req.body;

    const updated = await SettingsRepository.updateSettings({
      reviewsEnabled: reviewsEnabled !== undefined ? Boolean(reviewsEnabled) : true,
      reviewSubmissionPermission: reviewSubmissionPermission || 'all',
      reviewAutoApprove: Boolean(reviewAutoApprove),
      requireReviewComment: Boolean(requireReviewComment)
    });

    systemCache.flush();
    return res.json(
      createSuccessResponse(
        {
          reviewsEnabled: updated.reviewsEnabled,
          reviewSubmissionPermission: updated.reviewSubmissionPermission,
          reviewAutoApprove: updated.reviewAutoApprove,
          requireReviewComment: updated.requireReviewComment
        },
        'Review settings updated successfully'
      )
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update review settings'));
  }
});

// Create Review manually from Admin
apiRouter.post('/admin/reviews', async (req: Request, res: Response) => {
  try {
    const {
      productId,
      productName,
      customerName,
      customerEmail,
      rating,
      title,
      comment,
      isVerified,
      status,
      adminReply
    } = req.body;

    if (!productId || !customerName || !rating) {
      return res.status(400).json(createErrorResponse('Product, Customer Name, and Rating are required.'));
    }

    const created = await ReviewRepository.create({
      productId,
      productName,
      customerName,
      customerEmail,
      rating: Number(rating) || 5,
      title,
      comment: comment || '',
      isVerified: Boolean(isVerified),
      status: status || 'approved'
    });

    if (adminReply && adminReply.trim()) {
      await ReviewRepository.update(created.id, {
        adminReply: adminReply.trim()
      });
    }

    systemCache.flush();
    ProductRepository.clearCache();

    return res.json(createSuccessResponse(created, 'Review created successfully'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create review'));
  }
});

// Update an existing Review (edit rating, comment, customer name, verification, status, admin reply)
apiRouter.put('/admin/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      rating,
      title,
      comment,
      customerName,
      customerEmail,
      isVerified,
      status,
      adminReply,
      productId,
      productName
    } = req.body;

    const existing = await ReviewRepository.getById(id);
    if (!existing) {
      return res.status(404).json(createErrorResponse('Review not found'));
    }

    const updates: any = {};
    if (rating !== undefined) updates.rating = Number(rating);
    if (title !== undefined) updates.title = title;
    if (comment !== undefined) updates.comment = comment;
    if (customerName !== undefined) updates.customerName = customerName;
    if (customerEmail !== undefined) updates.customerEmail = customerEmail;
    if (isVerified !== undefined) updates.isVerified = Boolean(isVerified);
    if (status !== undefined) updates.status = status;
    if (adminReply !== undefined) updates.adminReply = adminReply;
    if (productId !== undefined) updates.productId = productId;
    if (productName !== undefined) updates.productName = productName;

    const updated = await ReviewRepository.update(id, updates);
    systemCache.flush();
    ProductRepository.clearCache();

    return res.json(createSuccessResponse(updated, 'Review updated successfully'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update review'));
  }
});

// Delete a Review
apiRouter.delete('/admin/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await ReviewRepository.getById(id);
    if (!existing) {
      return res.status(404).json(createErrorResponse('Review not found'));
    }

    await ReviewRepository.delete(id);
    systemCache.flush();
    ProductRepository.clearCache();

    return res.json(createSuccessResponse({ id, deleted: true }, 'Review deleted successfully'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete review'));
  }
});

// Bulk Moderation Actions
apiRouter.post('/admin/reviews/bulk', async (req: Request, res: Response) => {
  try {
    const { action, ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('Please select at least one review.'));
    }

    let affected = 0;
    if (action === 'approve') {
      affected = await ReviewRepository.bulkUpdateStatus(ids, 'approved');
    } else if (action === 'reject') {
      affected = await ReviewRepository.bulkUpdateStatus(ids, 'rejected');
    } else if (action === 'pending') {
      affected = await ReviewRepository.bulkUpdateStatus(ids, 'pending');
    } else if (action === 'delete') {
      affected = await ReviewRepository.bulkDelete(ids);
    } else {
      return res.status(400).json(createErrorResponse('Invalid action. Supported: approve, reject, pending, delete'));
    }

    systemCache.flush();
    ProductRepository.clearCache();

    return res.json(createSuccessResponse({ action, affected }, `Bulk ${action} executed for ${affected} reviews`));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to execute bulk action'));
  }
});

// ----------------------------------------------------
// 15. ADMIN DATABASE STATUS & SEEDING
// ----------------------------------------------------

apiRouter.get('/admin/db', async (_req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    const config = getDbConfig();
    const isConnected = Boolean(pool);

    return res.json(
      createSuccessResponse({
        mode: isConnected ? 'mysql' : 'json',
        host: config.host || '',
        port: config.port || 3306,
        user: config.user || '',
        database: config.database || '',
        isConnected
      })
    );
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to check database'));
  }
});

apiRouter.post('/admin/db/test', async (req: Request, res: Response) => {
  try {
    const result = await testDbConnection(req.body);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ connected: false, error: error.message || 'Database test failed' });
  }
});

apiRouter.post('/admin/db/migrate', async (_req: Request, res: Response) => {
  try {
    resetDbPool();
    const pool = getDbPool();
    if (!pool) {
      return res.status(400).json(createErrorResponse('Could not connect to MySQL database. Please verify host, user, password, and dbname in environment parameters.'));
    }

    return res.json(createSuccessResponse({ message: 'MySQL database pool re-initialized and tables verified successfully!' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Migration failed'));
  }
});

apiRouter.post('/admin/db', async (req: Request, res: Response) => {
  try {
    const { action } = req.body;

    if (action === 'seed') {
      await writeJson('products.json', initialProducts);
      await writeJson('categories.json', initialCategories);
      await writeJson('settings.json', initialSiteSettings);
      ProductRepository.clearCache();
      CategoryRepository.clearCache();
      SettingsRepository.clearCache();

      return res.json(createSuccessResponse({ message: 'Database reset and seeded to initial catalog successfully' }));
    }

    return res.status(400).json(createErrorResponse('Unknown database action'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Database operation failed'));
  }
});

// ----------------------------------------------------
// 16. TELECLOUD & MEDIA FILE UPLOADS
// ----------------------------------------------------

apiRouter.post('/upload', safeUploadMiddleware, async (req: Request, res: Response) => {
  try {
    const rawFiles: Express.Multer.File[] = [];
    const targetFolder = (req.body?.folder as string) || 'aapla_jalgaonwala';
    const uploadCaption = (req.body?.caption as string) || (req.body?.description as string) || 'Uploaded via Aapla Jalgaonwala Admin';

    // Collect single file
    if (req.file) {
      rawFiles.push(req.file);
    }

    // Collect files array or object
    if (req.files) {
      if (Array.isArray(req.files)) {
        rawFiles.push(...req.files);
      } else {
        Object.values(req.files).forEach(fileGroup => {
          if (Array.isArray(fileGroup)) {
            rawFiles.push(...fileGroup);
          }
        });
      }
    }

    const processedResults = [];
    const urls: string[] = [];
    const useTeleCloud = await isTeleCloudConfiguredAsync();
    const useCloudinary = !useTeleCloud && await isCloudinaryConfiguredAsync();

    const isConfidentialUpload =
      targetFolder.toLowerCase().includes('passbook') ||
      targetFolder.toLowerCase().includes('partner_passbook') ||
      targetFolder.toLowerCase().includes('aadhaar') ||
      targetFolder.toLowerCase().includes('kyc');

    // Process all uploaded files in parallel
    if (rawFiles.length > 0) {
      const uploadTasks = rawFiles.map(async (file) => {
        try {
          if (useTeleCloud) {
            // Upload to TeleCloud Remote Storage Engine (Custom S3)
            const tResult = await uploadToTeleCloud(file.buffer, file.originalname, {
              caption: uploadCaption
            });

            if (!isConfidentialUpload) {
              await MediaRepository.create({
                url: tResult.url,
                imgUrl: tResult.url,
                imageUrl: tResult.url,
                title: file.originalname,
                alt: file.originalname,
                folder: targetFolder,
                size: tResult.size,
                mimeType: tResult.mimeType || 'image/png'
              }).catch(err => console.warn('[MediaRepo Warning]', err));

              await CloudinaryAssetRepository.addAsset({
                url: tResult.url,
                name: file.originalname,
                bytes: tResult.size,
                format: tResult.mimeType?.split('/')[1] || 'png'
              }).catch(err => console.warn('[AssetRepo Warning]', err));
            }

            return {
              filename: tResult.filename,
              url: tResult.url,
              direct_link: tResult.directLink,
              file_url: tResult.fileUrl,
              publicId: tResult.filename,
              size: tResult.size,
              mimeType: tResult.mimeType,
              workspaceId: tResult.workspaceId,
              workspaceName: tResult.workspaceName
            };
          } else if (useCloudinary) {
            // Strictly upload to Cloudinary CDN with fast Sharp pre-compression
            const cResult = await uploadToCloudinary(file.buffer, file.originalname, {
              folder: targetFolder,
            });

            return {
              filename: cResult.publicId,
              url: cResult.url,
              publicId: cResult.publicId,
              width: cResult.width,
              height: cResult.height,
              format: cResult.format,
              size: cResult.bytes
            };
          } else {
            // Local sharp processing fallback if remote storage credentials are not provided
            const processed = await processAndSaveImage(file.buffer, file.originalname, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 85,
              format: 'webp'
            });

            if (!isConfidentialUpload) {
              await MediaRepository.create({
                url: processed.url,
                imgUrl: processed.url,
                imageUrl: processed.url,
                title: file.originalname,
                alt: file.originalname,
                folder: targetFolder,
                size: processed.size,
                width: processed.width,
                height: processed.height,
                mimeType: 'image/webp'
              }).catch(err => console.warn('[MediaRepo Warning]', err));
            }

            await CloudinaryAssetRepository.addAsset({
              url: processed.url,
              name: file.originalname,
              bytes: processed.size,
              format: processed.format
            }).catch(err => console.warn('[AssetRepo Warning]', err));

            return processed;
          }
        } catch (procErr: any) {
          console.error(`[Upload] Failed processing file ${file.originalname}:`, procErr);
          return null;
        }
      });

      const taskResults = await Promise.all(uploadTasks);
      for (const item of taskResults) {
        if (item) {
          processedResults.push(item);
          urls.push(item.url);
        }
      }
    }

    // Handle base64 payload if provided in body without multer files
    if (rawFiles.length === 0 && (req.body?.image || req.body?.data || req.body?.base64 || req.body?.file)) {
      const base64Data = req.body.image || req.body.data || req.body.base64 || req.body.file;
      if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
        const parts = base64Data.split(';base64,');
        const buffer = Buffer.from(parts[1], 'base64');
        const mime = parts[0].split(':')[1] || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        const originalName = req.body.name || req.body.filename || `upload-${Date.now()}.${ext}`;

        if (useTeleCloud) {
          const tResult = await uploadToTeleCloud(buffer, originalName, {
            caption: uploadCaption,
            mimeType: mime
          });

          processedResults.push({
            filename: tResult.filename,
            url: tResult.url,
            direct_link: tResult.directLink,
            file_url: tResult.fileUrl,
            publicId: tResult.filename,
            size: tResult.size,
            mimeType: tResult.mimeType,
            workspaceId: tResult.workspaceId,
            workspaceName: tResult.workspaceName
          });
          urls.push(tResult.url);

          await MediaRepository.create({
            url: tResult.url,
            imgUrl: tResult.url,
            imageUrl: tResult.url,
            title: originalName,
            alt: originalName,
            folder: targetFolder,
            size: tResult.size,
            mimeType: tResult.mimeType || 'image/png'
          }).catch(err => console.warn('[MediaRepo Warning]', err));
        } else if (useCloudinary) {
          const cResult = await uploadToCloudinary(buffer, originalName, {
            folder: targetFolder,
          });

          processedResults.push({
            filename: cResult.publicId,
            url: cResult.url,
            publicId: cResult.publicId,
            width: cResult.width,
            height: cResult.height,
            format: cResult.format,
            size: cResult.bytes
          });
          urls.push(cResult.url);
        } else {
          const processed = await processAndSaveImage(buffer, originalName, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 85,
            format: 'webp'
          });

          processedResults.push(processed);
          urls.push(processed.url);

          await MediaRepository.create({
            url: processed.url,
            imgUrl: processed.url,
            imageUrl: processed.url,
            title: originalName,
            alt: originalName,
            folder: targetFolder,
            size: processed.size,
            width: processed.width,
            height: processed.height,
            mimeType: 'image/webp'
          }).catch(err => console.warn('[MediaRepo Warning]', err));

          await CloudinaryAssetRepository.addAsset({
            url: processed.url,
            name: originalName,
            bytes: processed.size,
            format: processed.format
          }).catch(err => console.warn('[CloudinaryRepo Warning]', err));
        }
      }
    }

    if (processedResults.length === 0) {
      return res.status(400).json(createErrorResponse('No valid media files provided for upload'));
    }

    const primary = processedResults[0];

    return res.status(201).json({
      success: true,
      url: primary.url,
      urls: urls,
      results: processedResults,
      data: {
        url: primary.url,
        urls: urls,
        filename: primary.filename,
        width: (primary as any).width,
        height: (primary as any).height,
        format: (primary as any).format,
        size: (primary as any).size,
        items: processedResults,
        results: processedResults
      }
    });
  } catch (error: any) {
    console.error('[Upload] Image upload processing failed:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Image upload and processing failed'));
  }
});

// TeleCloud Storage Connection Test Endpoint
apiRouter.post('/admin/storage/test', async (req: Request, res: Response) => {
  try {
    const { endpoint, apiKey, workspaceId } = req.body || {};
    const result = await testTeleCloudConnection({
      endpoint,
      apiKey,
      workspaceId
    });

    if (result.success) {
      return res.json(createSuccessResponse(result));
    } else {
      return res.status(400).json(createErrorResponse(result.message || 'Storage connection test failed', result));
    }
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Storage connection test encountered an error'));
  }
});

// Cloudinary to TeleCloud S3 Migration: 1. Detect All Cloudinary Assets
apiRouter.get('/admin/storage/detect-cloudinary', async (_req: Request, res: Response) => {
  try {
    const items = await CloudinaryMigrationService.detectAllCloudinaryAssets();
    const summary = {
      totalCount: items.length,
      productsCount: items.filter(i => i.type === 'products').length,
      categoriesCount: items.filter(i => i.type === 'categories').length,
      settingsCount: items.filter(i => i.type === 'settings').length,
      womanGraphicsCount: items.filter(i => i.type === 'woman_graphics').length,
      galleryCount: items.filter(i => i.type === 'gallery').length,
      partnersCount: items.filter(i => i.type === 'partners').length,
      cloudinaryAssetsCount: items.filter(i => i.type === 'cloudinary_assets').length
    };

    return res.json(createSuccessResponse({ items, summary }));
  } catch (error: any) {
    console.error('[Migration] Failed detecting Cloudinary assets:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to detect Cloudinary assets'));
  }
});

// Cloudinary to TeleCloud S3 Migration: 2. Migrate Single Asset
apiRouter.post('/admin/storage/migrate-item', async (req: Request, res: Response) => {
  try {
    const item = req.body?.item;
    if (!item || !item.currentUrl) {
      return res.status(400).json(createErrorResponse('Missing valid asset migration item details'));
    }

    const migratedItem = await CloudinaryMigrationService.migrateSingleAsset(item);
    if (migratedItem.status === 'success') {
      return res.json(createSuccessResponse(migratedItem));
    } else {
      return res.status(400).json(createErrorResponse(migratedItem.error || 'Migration failed for file', migratedItem));
    }
  } catch (error: any) {
    console.error('[Migration] Error migrating single asset:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Error occurred while migrating asset'));
  }
});

// Cloudinary to TeleCloud S3 Migration: 3. Migrate All Assets
apiRouter.post('/admin/storage/migrate-all-cloudinary', async (_req: Request, res: Response) => {
  try {
    const items = await CloudinaryMigrationService.detectAllCloudinaryAssets();
    const results = [];

    for (const item of items) {
      const result = await CloudinaryMigrationService.migrateSingleAsset(item);
      results.push(result);
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return res.json(createSuccessResponse({
      totalDetected: items.length,
      successCount,
      failedCount,
      items: results
    }));
  } catch (error: any) {
    console.error('[Migration] Error migrating all assets:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Error occurred during full migration'));
  }
});

// ----------------------------------------------------
// 17. HEALTH & LOGS
// ----------------------------------------------------

apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Aapla Jalgaonwala Store & API',
    version: '1.0.0'
  });
});

// ----------------------------------------------------
// 18. AUTHENTICATION & USER MANAGEMENT
// ----------------------------------------------------

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'ajw_supersymmetric_secret_2026_987654';

function generateStrongToken(userId: string): string {
  const timestamp = Date.now().toString();
  const data = `${userId}.${timestamp}`;
  const signature = crypto.createHmac('sha256', COOKIE_SECRET).update(data).digest('hex');
  return `secure_v1_${data}.${signature}`;
}

function verifyStrongToken(token: string): string | null {
  if (!token || !token.startsWith('secure_v1_')) return null;
  const parts = token.slice(10).split('.');
  if (parts.length !== 3) return null;
  const [userId, timestamp, signature] = parts;
  
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > THIRTY_DAYS_MS) return null;
  
  const expectedSig = crypto.createHmac('sha256', COOKIE_SECRET).update(`${userId}.${timestamp}`).digest('hex');
  if (signature === expectedSig) {
    return userId;
  }
  return null;
}

function setAuthCookies(res: Response, token: string, userId: string) {
  res.cookie('ajw_auth_token', token, {
    maxAge: THIRTY_DAYS_MS,
    path: '/',
    sameSite: 'none',
    secure: true,
    httpOnly: false
  });
  res.cookie('ajw_user_id', userId, {
    maxAge: THIRTY_DAYS_MS,
    path: '/',
    sameSite: 'none',
    secure: true,
    httpOnly: false
  });
}

function extractTokenFromReq(req: Request): string {
  const appAuthHeader = req.headers["app_auth_token"];
  if (appAuthHeader && typeof appAuthHeader === "string") {
    return appAuthHeader.trim();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers['x-auth-token'] && typeof req.headers['x-auth-token'] === 'string') {
    return (req.headers['x-auth-token'] as string).trim();
  }
  return (req.cookies?.ajw_auth_token || '').trim();
}

function extractUserIdFromReq(req: Request): string | null {
  const cookieUserId = req.cookies?.ajw_user_id;

  const customUserId = req.headers['x-user-id'] as string;
  if (customUserId && typeof customUserId === 'string') {
    return customUserId.trim();
  }

  const token = extractTokenFromReq(req);

  if (token) {
    if (token.startsWith('secure_v1_')) {
      const verifiedUserId = verifyStrongToken(token);
      if (verifiedUserId) return verifiedUserId;
    }
    if (token.startsWith('token_')) {
      const raw = token.slice(6);
      const lastUnderscore = raw.lastIndexOf('_');
      if (lastUnderscore > 0) {
        return raw.substring(0, lastUnderscore);
      }
      return raw;
    }
    return token;
  }

  if (cookieUserId) {
    return cookieUserId;
  }

  return null;
}

async function resolveUserFromReq(req: Request): Promise<StoredUser | null> {
  const token = extractTokenFromReq(req);
  if (token) {
    // 1. Try finding by direct app_auth_token in database
    const userByAppToken = await UserRepository.findByAppAuthToken(token);
    if (userByAppToken) {
      return userByAppToken;
    }
  }

  const userId = extractUserIdFromReq(req);
  if (userId) {
    const user = await UserRepository.findById(userId);
    if (user) return user;
  }

  return null;
}

apiRouter.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json(createErrorResponse('Name and email are required'));
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return res.status(400).json(createErrorResponse('An account with this email already exists'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    const user = await UserRepository.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      passwordHash: password || undefined,
      appAuthToken: token,
      authProvider: 'email',
      role: 'customer'
    });

    setAuthCookies(res, token, user.id);
    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json(createSuccessResponse({ user: safeUser, token }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to sign up'));
  }
});

async function enrichUserForAuth(user: any) {
  const isSuperAdmin = user.email.toLowerCase() === 'operationalhtklabs@gmail.com' || user.email.toLowerCase() === 'farazk0792@gmail.com' || user.role === 'super_admin';
  let effectiveRole = isSuperAdmin ? 'super_admin' : (user.role || 'customer');
  let effectivePermissions: PermissionKey[] = [];

  if (isSuperAdmin) {
    effectivePermissions = [...ALL_PERMISSION_KEYS];
  } else if (
    user.isStaff ||
    user.role === 'admin' ||
    user.role === 'sub_admin' ||
    (user.role && user.role !== 'customer') ||
    (user.customPermissions && user.customPermissions.length > 0)
  ) {
    const assignedRole = await AdminRoleRepository.getById(user.role || 'sub_admin');
    const base = assignedRole?.permissions || [];
    const custom = (user.customPermissions || []) as PermissionKey[];
    effectivePermissions = Array.from(new Set([...base, ...custom])) as PermissionKey[];

    if (effectivePermissions.length === 0 && (user.role === 'admin' || user.role === 'sub_admin' || user.isStaff)) {
      const subAdminRole = await AdminRoleRepository.getById('sub_admin');
      effectivePermissions = subAdminRole?.permissions || [];
    }
  }

  const isStaffMember = Boolean(
    isSuperAdmin ||
    user.isStaff ||
    user.role === 'admin' ||
    user.role === 'sub_admin' ||
    (user.role && user.role !== 'customer') ||
    effectivePermissions.length > 0
  );

  const addresses = await UserRepository.getAddresses(user.id);
  const { passwordHash: _, ...safeUser } = user;

  return {
    ...safeUser,
    role: effectiveRole,
    isStaff: isStaffMember,
    permissions: effectivePermissions,
    addresses
  };
}

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required'));
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await UserRepository.findByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json(createErrorResponse('No account found with this email. Please sign up.'));
    }

    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const expectedPassword = user.passwordHash || (isSuperAdmin ? 'admin123' : null);

    if (!expectedPassword) {
      return res.status(401).json(createErrorResponse('No password is set for this account. Please use OTP or Google login.'));
    }

    if (expectedPassword !== password) {
      return res.status(401).json(createErrorResponse('Invalid password. Please try again or reset your password.'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    await UserRepository.update(user.id, { appAuthToken: token, ...(user.passwordHash ? {} : { passwordHash: expectedPassword }) });
    user.appAuthToken = token;
    
    setAuthCookies(res, token, user.id);
    const enrichedUser = await enrichUserForAuth(user);

    return res.json(createSuccessResponse({ user: enrichedUser, token }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to log in'));
  }
});

// ----------------------------------------------------
// FORGOT PASSWORD & SMTP OTP ENDPOINTS
// ----------------------------------------------------

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json(createErrorResponse('Please enter your email address.'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserRepository.findByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json(createErrorResponse('No account found with this email address. Please check or sign up.'));
    }

    const otp = generateAndSaveOTP(cleanEmail);
    const settings = await SettingsRepository.get();

    const emailHtml = generateOTPEmailHtml(otp, user.name, settings);
    const sent = await sendEmail({
      to: cleanEmail,
      subject: `Your Security Verification Code: ${otp} - ${settings.storeName || 'Aapla Jalgaonwala'}`,
      html: emailHtml
    });

    if (!sent) {
      console.warn('[Forgot Password] Email send returned false, but OTP generated:', otp);
    }

    return res.json(createSuccessResponse({
      message: `A 6-digit OTP code has been sent to ${cleanEmail}. Valid for 10 minutes.`
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to send OTP code.'));
  }
});

apiRouter.post('/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json(createErrorResponse('Email and OTP code are required.'));
    }

    const isValid = verifyOTP(email, otp);
    if (!isValid) {
      return res.status(400).json(createErrorResponse('Invalid or expired OTP code. Please enter the correct code or request a new one.'));
    }

    return res.json(createSuccessResponse({ message: 'OTP verified successfully.' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to verify OTP.'));
  }
});

apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json(createErrorResponse('All fields are required.'));
    }

    if (newPassword.length < 6) {
      return res.status(400).json(createErrorResponse('Password must be at least 6 characters.'));
    }

    const isValid = verifyOTP(email, otp);
    if (!isValid) {
      return res.status(400).json(createErrorResponse('Session expired or invalid OTP code. Please request a new OTP.'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserRepository.findByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json(createErrorResponse('User account not found.'));
    }

    // Update user password
    const updatedUser = await UserRepository.update(user.id, { passwordHash: newPassword });
    clearOTP(cleanEmail);

    const token = generateStrongToken(user.id);
    setAuthCookies(res, token, user.id);
    const addresses = await UserRepository.getAddresses(user.id);

    const { passwordHash: _, ...safeUser } = updatedUser || user;

    return res.json(createSuccessResponse({
      message: 'Password updated successfully!',
      user: { ...safeUser, addresses },
      token
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to reset password.'));
  }
});

apiRouter.get('/auth/google/url', async (req: Request, res: Response) => {
  try {
    const siteSettings = await SettingsRepository.get();
    const clientId = (siteSettings.googleClientId || '').trim() || process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
    const isGoogleAuthEnabled = siteSettings.enableGoogleAuth !== false;
    const reqRedirectUri = req.query.redirect_uri as string;

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const defaultDomain = 'https://aaplajalgaonwala.com';
    const baseUrl = process.env.APP_URL || (host.includes('aaplajalgaonwala.com') ? `${protocol}://${host}` : defaultDomain);
    const redirectUri = reqRedirectUri || `${baseUrl.replace(/\/$/, '')}/auth/callback`;

    if (!clientId || !isGoogleAuthEnabled) {
      return res.json(createSuccessResponse({
        configured: false,
        clientId: '',
        redirectUri,
        url: '',
        message: !clientId
          ? 'Google OAuth is not configured. Please enter your Google Client ID & Secret in Admin Website Configurations.'
          : 'Google Sign-In is currently disabled in Website Configurations.'
      }));
    }

    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.json(createSuccessResponse({
      configured: true,
      clientId,
      redirectUri,
      url: googleAuthUrl
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to generate Google auth URL'));
  }
});

apiRouter.post('/auth/google/exchange', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json(createErrorResponse('Authorization code is required'));
    }

    const siteSettings = await SettingsRepository.get();
    const clientId = (siteSettings.googleClientId || '').trim() || process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
    const clientSecret = (siteSettings.googleClientSecret || '').trim() || process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || '';

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const defaultDomain = 'http://aaplajalgaonwala.com';
    const baseUrl = process.env.APP_URL || (host.includes('aaplajalgaonwala.com') ? `${protocol}://${host}` : defaultDomain);
    const expectedRedirectUri = redirectUri || `${baseUrl.replace(/\/$/, '')}/auth/callback`;

    // Exchange authorization code for tokens with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: expectedRedirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Google OAuth Exchange] Failed:', tokenData);
      return res.status(400).json(createErrorResponse(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code'));
    }

    // Fetch user profile from Google UserInfo API
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userInfoRes.ok) {
      return res.status(400).json(createErrorResponse('Failed to fetch user profile from Google'));
    }

    const googleUser = await userInfoRes.json();
    const cleanEmail = (googleUser.email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json(createErrorResponse('Google account email is missing'));
    }

    let user = await UserRepository.findByEmail(cleanEmail);
    if (user) {
      user = await UserRepository.update(user.id, {
        name: googleUser.name || user.name,
        avatarUrl: googleUser.picture || user.avatarUrl,
        googleId: googleUser.id || user.googleId,
        authProvider: 'google'
      }) || user;
    } else {
      user = await UserRepository.create({
        name: googleUser.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatarUrl: googleUser.picture,
        googleId: googleUser.id,
        authProvider: 'google',
        role: 'customer'
      });
    }

    const appToken = generateStrongToken(user.id);
    setAuthCookies(res, appToken, user.id);
    const addresses = await UserRepository.getAddresses(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return res.json(createSuccessResponse({
      user: { ...safeUser, addresses },
      token: appToken
    }));
  } catch (error: any) {
    console.error('[Google OAuth Exchange] Error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Google token exchange failed'));
  }
});

apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, name, picture, googleId, credential, accessToken } = req.body;

    let userEmail = email;
    let userName = name;
    let userPicture = picture;
    let userGoogleId = googleId;

    // If an access token or credential was passed, attempt to fetch/verify real user info from Google
    if (accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userInfoRes.ok) {
          const googleUser = await userInfoRes.json();
          userEmail = googleUser.email || userEmail;
          userName = googleUser.name || userName;
          userPicture = googleUser.picture || userPicture;
          userGoogleId = googleUser.id || userGoogleId;
        }
      } catch (err) {
        console.warn('[Google Auth] Error fetching userinfo from accessToken:', err);
      }
    } else if (credential) {
      try {
        // Decode payload from JWT
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userEmail = payload.email || userEmail;
          userName = payload.name || userName;
          userPicture = payload.picture || userPicture;
          userGoogleId = payload.sub || userGoogleId;
        }
      } catch (err) {
        console.warn('[Google Auth] Error decoding credential JWT:', err);
      }
    }

    if (!userEmail) {
      return res.status(400).json(createErrorResponse('Google email is required'));
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    let user = await UserRepository.findByEmail(cleanEmail);

    if (user) {
      user = await UserRepository.update(user.id, {
        name: userName || user.name,
        avatarUrl: userPicture || user.avatarUrl,
        googleId: userGoogleId || user.googleId,
        authProvider: 'google'
      }) || user;
    } else {
      user = await UserRepository.create({
        name: userName || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatarUrl: userPicture,
        googleId: userGoogleId,
        authProvider: 'google',
        role: 'customer'
      });
    }

    const token = generateStrongToken(user.id);
    setAuthCookies(res, token, user.id);
    const enrichedUser = await enrichUserForAuth(user);
    return res.json(createSuccessResponse({ user: enrichedUser, token }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Google authentication failed'));
  }
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.json(createSuccessResponse({ user: null, token: null, ordersCount: 0 }));
    }

    const orders = await OrderRepository.getByUser({ userId: user.id, email: user.email, phone: user.phone });
    const enrichedUser = await enrichUserForAuth(user);
    const token = extractTokenFromReq(req) || user.appAuthToken || req.cookies?.ajw_auth_token || generateStrongToken(user.id);

    return res.json(createSuccessResponse({ user: enrichedUser, token, ordersCount: orders.length }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user session'));
  }
});

apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const user = await resolveUserFromReq(req);
  if (user) {
    await UserRepository.update(user.id, { appAuthToken: '' });
  }
  res.clearCookie('ajw_auth_token', { path: '/', sameSite: 'lax', httpOnly: false });
  res.clearCookie('ajw_user_id', { path: '/', sameSite: 'lax', httpOnly: false });
  return res.json(createSuccessResponse({ message: 'Logged out successfully' }));
});

apiRouter.put('/auth/profile', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json(createErrorResponse('Not authenticated'));
    }

    const { name, phone, avatarUrl } = req.body;
    const updated = await UserRepository.update(userId, { name, phone, avatarUrl });
    if (!updated) {
      return res.status(404).json(createErrorResponse('User not found'));
    }

    const addresses = await UserRepository.getAddresses(userId);
    const { passwordHash: _, ...safeUser } = updated;
    return res.json(createSuccessResponse({ user: { ...safeUser, addresses } }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update profile'));
  }
});

apiRouter.get('/auth/addresses', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json(createErrorResponse('Not authenticated'));
    }
    const addresses = await UserRepository.getAddresses(userId);
    return res.json(createSuccessResponse(addresses));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to load addresses'));
  }
});

apiRouter.post('/auth/addresses', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json(createErrorResponse('Not authenticated'));
    }
    const addressData = req.body;
    const saved = await UserRepository.saveAddress(userId, addressData);
    const allAddresses = await UserRepository.getAddresses(userId);
    return res.status(201).json(createSuccessResponse({ address: saved, addresses: allAddresses }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to save address'));
  }
});

apiRouter.delete('/auth/addresses/:id', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json(createErrorResponse('Not authenticated'));
    }
    const { id } = req.params;
    await UserRepository.deleteAddress(userId, id);
    const allAddresses = await UserRepository.getAddresses(userId);
    return res.json(createSuccessResponse({ deleted: true, addresses: allAddresses }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete address'));
  }
});

apiRouter.post('/auth/addresses/:id/default', async (req: Request, res: Response) => {
  try {
    const userId = extractUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json(createErrorResponse('Not authenticated'));
    }
    const { id } = req.params;
    await UserRepository.setDefaultAddress(userId, id);
    const allAddresses = await UserRepository.getAddresses(userId);
    return res.json(createSuccessResponse({ updated: true, addresses: allAddresses }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to set default address'));
  }
});

apiRouter.get('/auth/orders', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json(createErrorResponse('Not authenticated'));
    }
    const orders = await OrderRepository.getByUser({
      userId: user.id,
      email: user.email,
      phone: user.phone
    });
    return res.json(createSuccessResponse(orders));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to load user orders'));
  }
});

// ----------------------------------------------------
// DEDICATED USER & ANDROID APP AUTH API
// ----------------------------------------------------

// POST /api/user/auth - Login with email & password, generate & store app_auth_token in DB
apiRouter.post('/user/auth', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserRepository.findByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json(createErrorResponse('No account found with this email. Please check or sign up.'));
    }

    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const expectedPassword = user.passwordHash || (isSuperAdmin ? 'admin123' : null);

    if (!expectedPassword) {
      return res.status(401).json(createErrorResponse('No password is set for this account. Please log in via OTP / Google or reset your password.'));
    }

    if (expectedPassword !== password) {
      return res.status(401).json(createErrorResponse('Invalid password. Please check your credentials or reset your password.'));
    }

    // Generate new cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Store the new token in users.app_auth_token, replacing previous token
    await UserRepository.update(user.id, { appAuthToken: token, ...(user.passwordHash ? {} : { passwordHash: expectedPassword }) });
    user.appAuthToken = token;

    // Set cookie for browser sessions as well
    setAuthCookies(res, token, user.id);

    const enrichedUser = await enrichUserForAuth(user);
    const addresses = await UserRepository.getAddresses(user.id);
    const { passwordHash: _, ...safeUser } = enrichedUser;

    return res.json(createSuccessResponse({
      token,
      user: { ...safeUser, addresses }
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Authentication failed'));
  }
});

// POST /api/user/register - Register new user and return app_auth_token
apiRouter.post('/user/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json(createErrorResponse('Name, email, and password are required'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserRepository.findByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json(createErrorResponse('An account with this email already exists'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    const createdUser = await UserRepository.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      passwordHash: password,
      appAuthToken: token,
      authProvider: 'email',
      role: 'customer'
    });

    setAuthCookies(res, token, createdUser.id);
    const enrichedUser = await enrichUserForAuth(createdUser);
    const { passwordHash: _, ...safeUser } = enrichedUser;

    return res.status(201).json(createSuccessResponse({
      token,
      user: { ...safeUser, addresses: [] }
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Registration failed'));
  }
});

// GET /api/user/info - Get current user profile using app_auth_token in Authorization: Bearer header
apiRouter.get('/user/info', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));
    }

    const enrichedUser = await enrichUserForAuth(user);
    const addresses = await UserRepository.getAddresses(user.id);
    const orders = await OrderRepository.getByUser({ userId: user.id, email: user.email, phone: user.phone });
    const { passwordHash: _, ...safeUser } = enrichedUser;

    return res.json(createSuccessResponse({
      user: { ...safeUser, addresses, ordersCount: orders.length }
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user information'));
  }
});

// POST /api/user/auth/logout - Invalidate app_auth_token on server and clear cookies
apiRouter.post('/user/auth/logout', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (user) {
      await UserRepository.update(user.id, { appAuthToken: '' });
    }

    res.clearCookie('ajw_auth_token', { path: '/', sameSite: 'lax', httpOnly: false });
    res.clearCookie('ajw_user_id', { path: '/', sameSite: 'lax', httpOnly: false });

    return res.json(createSuccessResponse({ message: 'Logged out successfully' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Logout failed'));
  }
});

// ----------------------------------------------------
// PUBLIC STORE DATA API (No Authorization Header Required)
// ----------------------------------------------------

// 1. GET /api/store/info - Complete store information, contacts, address & socials
apiRouter.get('/store/info', async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsRepository.get();
    const info = {
      storeName: settings.storeName || 'Aapla Jalgaonwala',
      legalName: settings.storeLegalNameEnt || 'Aapla Jalgaonwala Enterprises',
      legalNamePvt: settings.storeLegalNamePvt || 'Aapla Jalgaonwala Pvt. Ltd.',
      tagline: settings.tagline || 'Authentic Khandeshi Taste',
      description: settings.heroSubtitle || "Authentic banana chips, farsaan, masalas and regional flavours crafted for today's generation. Directly sourced from Jalgaon farms and freshly packed for pure crunch.",
      address: {
        fullAddress: settings.storeAddress || 'Aapla JalgaonWala Enterprises, Dehu - Yelwadi Rd, near by yelwadi, kaman, Dehu, Yelwadi, Maharashtra 412109',
        street: 'Dehu - Yelwadi Rd, near by yelwadi, kaman, Dehu',
        city: 'Pune / Jalgaon',
        state: 'Maharashtra',
        pincode: '412109',
        country: 'India'
      },
      contact: {
        phone: settings.contactPhone || '+91 70574 46409',
        email: settings.contactEmail || 'aaplajalgaonwala@gmail.com',
        adminEmail: settings.adminNotificationEmail || 'aaplajalgaonwala@gmail.com',
        whatsapp: settings.whatsappNumber || '917057446409',
        whatsappUrl: `https://wa.me/${(settings.whatsappNumber || '917057446409').replace(/\D/g, '')}`
      },
      timings: {
        storeHours: settings.storeHours || 'Monday - Sunday: 8:00 AM - 11:00 PM',
        supportHours: settings.supportHours || 'Monday - Saturday: 10:00 AM - 8:00 PM'
      },
      socials: {
        instagram: settings.socialLinks?.instagram || 'https://instagram.com/aaplajalgaonwala',
        facebook: settings.socialLinks?.facebook || 'https://facebook.com/aaplajalgaonwala',
        youtube: settings.socialLinks?.youtube || 'https://youtube.com/@aaplajalgaonwala',
        whatsapp: `https://wa.me/${(settings.whatsappNumber || '917057446409').replace(/\D/g, '')}`
      },
      branding: {
        logo: settings.appLogo || 'https://res.cloudinary.com/db7nvcm4i/image/upload/fl_original/v1789546237/branding/1789546235891_wqs7e2wxhhj4chie8bun__1_.png',
        favicon: settings.faviconUrl || '',
        faviconIco: settings.faviconIcoUrl || '',
        appleTouchIcon: settings.appleTouchIconUrl || ''
      },
      announcement: {
        enabled: Boolean(settings.announcementEnabled),
        text: settings.announcementText || 'Women’s Program officially starts from 1st May.',
        textMarathi: settings.announcementTextMarathi || 'महिलांचा कार्यक्रम अधिकृतपणे १ मेपासून सुरू होत आहे.'
      },
      compliance: {
        gstin: '27AAJFA1234F1Z5',
        fssai: '11523038000123'
      },
      website: 'https://aaplajalgaonwala.com'
    };

    return res.json(createSuccessResponse(info));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch store info'));
  }
});

// 2. GET /api/store/orders - List all store orders with tracking URLs and iframe tracking URLs
apiRouter.get('/store/orders', async (req: Request, res: Response) => {
  try {
    const orders = await OrderRepository.getAll();
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const status = req.query.status as string;

    let filtered = orders;
    if (status) {
      filtered = filtered.filter(o => (o.status || '').toLowerCase() === status.toLowerCase());
    }

    if (limit && !isNaN(limit) && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    const formattedOrders = filtered.map(o => {
      const orderId = o.id;
      const orderNumber = o.orderNumber;
      const awbNumber = o.awbNumber || (o as any).trackingNumber || '';
      const courier = o.courierPartner || 'DTDC Express';
      const trackingUrl = awbNumber
        ? `https://aaplajalgaonwala.com/tracking?order=${encodeURIComponent(orderNumber || orderId)}`
        : `https://aaplajalgaonwala.com/iframe/tracking/${orderId}`;
      const iframeTrackingUrl = `https://aaplajalgaonwala.com/iframe/tracking/${orderId}`;

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        order_number: o.orderNumber,
        createdAt: o.createdAt,
        created_at: o.createdAt,
        status: o.status,
        paymentStatus: o.paymentStatus,
        payment_status: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        payment_method: o.paymentMethod,
        totalAmount: o.totalAmount,
        total_amount: o.totalAmount,
        subtotal: o.subtotal,
        discountAmount: o.discountAmount || 0,
        discount_amount: o.discountAmount || 0,
        shippingFee: o.shippingFee || 0,
        shipping_fee: o.shippingFee || 0,
        couponCode: o.couponCode || '',
        coupon_code: o.couponCode || '',
        customer: {
          name: o.customer?.name || o.shippingAddress?.fullName || 'Customer',
          email: o.customer?.email || o.shippingAddress?.email || '',
          phone: o.customer?.phone || o.shippingAddress?.phone || '',
          city: o.shippingAddress?.city || ''
        },
        shippingAddress: o.shippingAddress || null,
        shipping_address: o.shippingAddress || null,
        itemsCount: o.items?.length || 0,
        items: (o.items || []).map(item => ({
          id: item.id,
          productId: item.productId || item.id,
          product_id: item.productId || item.id,
          name: item.name,
          slug: item.slug || '',
          price: item.price,
          quantity: item.quantity,
          unit: item.unit || item.netQuantity || '',
          netQuantity: item.netQuantity || item.unit || '',
          image: item.image || '',
          subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 1)
        })),
        trackingUrl: trackingUrl,
        tracking_url: trackingUrl,
        iframeTrackingUrl: iframeTrackingUrl,
        iframe_tracking_url: iframeTrackingUrl,
        awbNumber: awbNumber,
        awb_number: awbNumber,
        courierPartner: courier,
        courier_partner: courier,
        trackingStatus: (o as any).trackingStatus || o.status
      };
    });

    return res.json(createSuccessResponse(formattedOrders, { count: formattedOrders.length, total: orders.length }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch store orders'));
  }
});

// 3. GET /api/store/coupons - List all coupons with their discount types
apiRouter.get('/store/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await CouponRepository.getAll();
    const formatted = coupons.map(c => ({
      id: c.id,
      code: c.code.toUpperCase(),
      discountType: c.type || 'percentage',
      discount_type: c.type || 'percentage',
      discountValue: c.value,
      discount_value: c.value,
      value: c.value,
      type: c.type,
      minimumOrder: c.minimumOrder || 0,
      minimum_order: c.minimumOrder || 0,
      maximumDiscount: c.maximumDiscount || null,
      maximum_discount: c.maximumDiscount || null,
      description: c.description || (c.type === 'percentage' ? `${c.value}% OFF on your cart` : `Flat ₹${c.value} OFF on your cart`),
      isAutoApply: Boolean(c.isAutoApply),
      is_auto_apply: Boolean(c.isAutoApply),
      firstTimeUserOnly: Boolean(c.firstTimeUserOnly),
      first_time_user_only: Boolean(c.firstTimeUserOnly),
      startsAt: c.startsAt || null,
      expiresAt: c.expiresAt || null,
      isActive: c.isActive !== false,
      is_active: c.isActive !== false
    }));

    return res.json(createSuccessResponse(formatted, { count: formatted.length }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch store coupons'));
  }
});

// 4. GET /api/store/shipping - List all shipping rates and options
apiRouter.get('/store/shipping', async (_req: Request, res: Response) => {
  try {
    const shippingData = {
      defaultFreeDeliveryThreshold: 399,
      zones: [
        {
          id: 'maharashtra',
          zoneName: 'Maharashtra Local & State Zone',
          pincodes: ['425001', '425002', '425003', '425*', '411*', '400*', '431*', '440*'],
          standardRate: 40,
          freeDeliveryAbove: 399,
          estimatedDelivery: '24 - 48 Hours',
          courier: 'DTDC Express Air & Surface'
        },
        {
          id: 'rest_of_india',
          zoneName: 'Rest of India (All States & UTs)',
          pincodes: ['*'],
          standardRate: 70,
          freeDeliveryAbove: 799,
          estimatedDelivery: '2 - 5 Business Days',
          courier: 'DTDC Express National Network'
        }
      ],
      expressDelivery: {
        available: true,
        description: 'Direct priority dispatch within 24 hours of baking/frying',
        courierPartner: 'DTDC Express'
      },
      cashOnDelivery: {
        available: true,
        advanceTokenRequired: 50,
        description: 'Advance ₹50 security payment during checkout to confirm order and verify delivery address. Balance payable upon delivery.'
      },
      packaging: {
        type: '5-Layer Corrugated Box with Food-Grade Foil & Nitrogen Flush',
        freshnessGuarantee: '100% Crisp & Freshness Guarantee'
      }
    };

    return res.json(createSuccessResponse(shippingData));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch shipping info'));
  }
});

// 5. GET /api/store/payment-methods - List all payment methods available
apiRouter.get('/store/payment-methods', async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsRepository.get();
    const isCodEnabled = settings.enableCod !== false;
    const isCodAdvance = isCodEnabled && settings.codAdvanceFeeEnabled !== false;
    const advanceAmount = Number(settings.codAdvanceFeeAmount || 50);

    const methods = [
      {
        id: 'razorpay',
        name: 'Razorpay Instant Online Payment',
        type: 'online',
        isActive: settings.enableRazorpay !== false,
        is_active: settings.enableRazorpay !== false,
        supportedModes: ['UPI (GPay, PhonePe, Paytm, BHIM)', 'Credit & Debit Cards (Visa, Master, RuPay)', 'NetBanking (50+ Banks)', 'Wallets'],
        description: 'Instant, zero transaction fee, 100% encrypted bank-grade payment gateway.',
        advanceRequired: false
      },
      {
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        type: 'cod',
        isActive: isCodEnabled,
        is_active: isCodEnabled,
        supportedModes: ['Cash / UPI at doorstep'],
        description: isCodAdvance
          ? `Pay when your package arrives. Requires a small ₹${advanceAmount} token payment at checkout to confirm order authenticity.`
          : 'Pay with cash or UPI upon package arrival at your doorstep.',
        advanceRequired: isCodAdvance,
        advanceAmount: advanceAmount
      },
      {
        id: 'direct_upi',
        name: 'Direct UPI & QR Code',
        type: 'upi_direct',
        isActive: true,
        is_active: true,
        supportedModes: ['Any UPI App scan and pay'],
        description: 'Direct payment to Aapla Jalgaonwala merchant VPA (aaplajalgaonwala@upi).',
        advanceRequired: false
      }
    ];

    return res.json(createSuccessResponse(methods, { count: methods.length }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch payment methods'));
  }
});

// ----------------------------------------------------
// CACHE & PERFORMANCE MANAGEMENT API
// ----------------------------------------------------

apiRouter.get('/admin/cache/stats', async (_req: Request, res: Response) => {
  try {
    const stats = systemCache.getStats();
    const activeKeys = systemCache.getActiveKeys();
    return res.json(createSuccessResponse({
      stats,
      activeKeys
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to load cache statistics'));
  }
});

apiRouter.post('/admin/cache/flush', async (req: Request, res: Response) => {
  try {
    const { category } = req.body || {};
    const result = systemCache.flush(category);
    return res.json(createSuccessResponse({
      flushed: true,
      category: category || 'all',
      clearedKeysCount: result.clearedCount,
      newCacheVersion: result.newCacheVersion
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to flush cache'));
  }
});

apiRouter.post('/admin/cache/toggle-dev', async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const isDevMode = systemCache.setDevMode(Boolean(enabled));
    return res.json(createSuccessResponse({
      isDevMode,
      message: isDevMode ? 'Development Mode Enabled: Cache is bypassed for all requests' : 'Production Mode Enabled: Strong Caching is active'
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to toggle dev mode'));
  }
});

apiRouter.post('/admin/cache/config', async (req: Request, res: Response) => {
  try {
    const { ttls } = req.body;
    if (!ttls || typeof ttls !== 'object') {
      return res.status(400).json(createErrorResponse('TTL object is required'));
    }
    const updatedTtls = systemCache.updateTtls(ttls);
    return res.json(createSuccessResponse({ ttls: updatedTtls }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update cache configuration'));
  }
});

// ----------------------------------------------------
// 15. WOMEN BUSINESS PARTNER PROGRAM
// ----------------------------------------------------

// Get a random active woman business partner coupon for checkout discount
apiRouter.get('/partner-program/random-partner', async (req: Request, res: Response) => {
  try {
    const { exclude } = req.query as { exclude?: string };
    const partners = await PartnerRepository.getAll();
    let activePartners = partners.filter(
      p => (p.status === 'active' || p.status === 'approved') && p.partnerCode && p.fullName
    );

    if (activePartners.length === 0) {
      return res.status(404).json(createErrorResponse('No active women partners found'));
    }

    if (exclude && activePartners.length > 1) {
      const filtered = activePartners.filter(p => p.partnerCode.toUpperCase() !== String(exclude).toUpperCase());
      if (filtered.length > 0) {
        activePartners = filtered;
      }
    }

    // Sort partners primarily by referral orders count (ascending), then by commission earned (ascending) to support underserved partners
    activePartners.sort((a, b) => {
      const ordersA = Number(a.totalOrdersCount || 0);
      const ordersB = Number(b.totalOrdersCount || 0);
      if (ordersA !== ordersB) {
        return ordersA - ordersB;
      }
      const commA = Number(a.totalCommissionEarned || 0);
      const commB = Number(b.totalCommissionEarned || 0);
      return commA - commB;
    });

    // Pick from the top 5 most underserved partners to provide help where it is needed most, while retaining a small amount of healthy distribution
    const poolSize = Math.min(5, activePartners.length);
    const underservedPool = activePartners.slice(0, poolSize);
    const randomIndex = Math.floor(Math.random() * underservedPool.length);
    const partner = underservedPool[randomIndex];

    return res.json(createSuccessResponse({
      partnerCode: partner.partnerCode,
      fullName: partner.fullName,
      city: partner.city,
      customerDiscountRate: partner.customerDiscountRate || 4.0
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch random woman partner'));
  }
});

// Verify partner code or coupon code for discount application
apiRouter.get('/partner-program/verify/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code || !String(code).trim()) {
      return res.status(400).json(createErrorResponse('Code is required'));
    }

    const cleanCode = String(code).trim().toUpperCase();

    // 1. Check partner repository first
    const partner = await PartnerRepository.getByCode(cleanCode);
    if (partner && partner.status !== 'blocked' && partner.status !== 'rejected' && partner.status !== 'disabled' && partner.status !== 'inactive') {
      return res.json(createSuccessResponse({
        valid: true,
        isPartnerCode: true,
        partnerCode: partner.partnerCode,
        partnerName: partner.fullName,
        customerDiscountRate: partner.customerDiscountRate || 4.0,
        partnerCity: partner.city
      }));
    }

    // 2. If not a partner code, check store coupons in MySQL/JSON
    const storeCoupon = await CouponRepository.getByCode(cleanCode);
    if (storeCoupon && storeCoupon.isActive) {
      return res.json(createSuccessResponse({
        valid: true,
        isCouponCode: true,
        partnerCode: storeCoupon.code,
        partnerName: `Coupon ${storeCoupon.code}`,
        customerDiscountRate: storeCoupon.type === 'percentage' ? storeCoupon.value : 0,
        coupon: storeCoupon
      }));
    }

    return res.status(404).json(createErrorResponse(`Invalid or inactive code "${cleanCode}".`));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to verify code'));
  }
});

// Get partner stats overview for admin dashboard
apiRouter.get('/partner-program/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await PartnerRepository.getStats();
    return res.json(createSuccessResponse(stats));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to load partner statistics'));
  }
});

// Get all partners (with optional search, status filtering)
apiRouter.get('/partner-program/partners', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query as { search?: string; status?: string };
    let partners = await PartnerRepository.getAll();

    if (status && status !== 'all') {
      partners = partners.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.trim().toLowerCase();
      partners = partners.filter(
        p =>
          p.fullName.toLowerCase().includes(q) ||
          p.partnerCode.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
      );
    }

    // Compute invited partners count and referral linkage for each partner
    const allPartners = await PartnerRepository.getAll();
    const inviterCountMap = new Map<string, number>();
    const inviterListMap = new Map<string, any[]>();
    const partnerByCode = new Map<string, any>();

    for (const p of allPartners) {
      if (p.partnerCode) {
        partnerByCode.set(p.partnerCode.trim().toUpperCase(), p);
      }
    }

    for (const p of allPartners) {
      const refBy = (p.referredByPartnerCode || '').trim().toUpperCase();
      if (refBy) {
        inviterCountMap.set(refBy, (inviterCountMap.get(refBy) || 0) + 1);
        const currentList = inviterListMap.get(refBy) || [];
        currentList.push({
          id: p.id,
          partnerCode: p.partnerCode,
          fullName: p.fullName,
          phone: p.phone,
          email: p.email,
          city: p.city,
          state: p.state,
          createdAt: p.createdAt,
          paymentStatus: p.paymentStatus || 'paid',
          paymentAmount: p.paymentAmount ?? 699,
          status: p.status
        });
        inviterListMap.set(refBy, currentList);
      }
    }

    const enrichedPartners = partners.map(p => {
      const code = (p.partnerCode || '').trim().toUpperCase();
      const refCode = (p.referredByPartnerCode || '').trim().toUpperCase();
      const referrer = refCode ? partnerByCode.get(refCode) : undefined;
      return {
        ...p,
        referredByPartnerCode: refCode || undefined,
        referredByPartnerName: referrer ? referrer.fullName : undefined,
        invitedPartnersCount: inviterCountMap.get(code) || 0,
        invitedPartnersList: inviterListMap.get(code) || []
      };
    });

    return res.json(createSuccessResponse(enrichedPartners));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch partners list'));
  }
});

// Get single partner by code, phone, or id (with their referrals and payouts)
apiRouter.get('/partner-program/partners/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const { codeOnly } = req.query as { codeOnly?: string };

    let partner = await PartnerRepository.getByCode(identifier);
    if (!partner && codeOnly !== 'true') {
      partner = await PartnerRepository.getById(identifier);
    }
    if (!partner && codeOnly !== 'true') {
      partner = await PartnerRepository.getByPhoneOrEmail(identifier, identifier);
    }

    if (!partner) {
      if (codeOnly === 'true') {
        return res.status(404).json(createErrorResponse('No active partner found with this Referral Code. Please enter your valid Partner Code (e.g. AJW-129822).'));
      }
      return res.status(404).json(createErrorResponse('Partner not found'));
    }

    const referrals = await PartnerRepository.getReferrals(partner.partnerCode);
    const settlements = await PartnerRepository.getSettlements(partner.partnerCode);

    // Compute fresh metrics strictly distinguishing delivered vs on-hold vs cancelled/failed
    // Cancelled, failed, or on hold orders DO NOT count towards earned commission!
    const deliveredRefs = referrals.filter(r => {
      const orderSt = String(r.orderStatus || '').toLowerCase().trim();
      const refSt = String(r.status || '').toLowerCase().trim();
      const isCancelled = orderSt === 'cancelled' || orderSt.includes('cancel') || refSt === 'cancelled';
      const isFailed = orderSt === 'failed' || orderSt.includes('fail') || refSt === 'failed';
      const isOnHold = orderSt === 'on_hold' || orderSt === 'on hold' || orderSt.includes('hold') || refSt === 'on_hold';
      if (isCancelled || isFailed || isOnHold) return false;
      return r.isDelivered === true || orderSt === 'delivered' || refSt === 'settled';
    });

    const onHoldRefs = referrals.filter(r => {
      const orderSt = String(r.orderStatus || '').toLowerCase().trim();
      const refSt = String(r.status || '').toLowerCase().trim();
      const isCancelled = orderSt === 'cancelled' || orderSt.includes('cancel') || refSt === 'cancelled';
      const isFailed = orderSt === 'failed' || orderSt.includes('fail') || refSt === 'failed';
      if (isCancelled || isFailed) return false;
      const isDelivered = r.isDelivered === true || orderSt === 'delivered' || refSt === 'settled';
      return !isDelivered;
    });

    const validNonCancelledRefs = referrals.filter(r => {
      const orderSt = String(r.orderStatus || '').toLowerCase().trim();
      const refSt = String(r.status || '').toLowerCase().trim();
      return orderSt !== 'cancelled' && !orderSt.includes('cancel') && refSt !== 'cancelled' &&
             orderSt !== 'failed' && !orderSt.includes('fail') && refSt !== 'failed';
    });

    const deliveredCommission = deliveredRefs.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
    const onHoldCommission = onHoldRefs.reduce((sum, r) => sum + (r.partnerCommission || 0), 0);
    const totalSalesAmount = validNonCancelledRefs.reduce((sum, r) => sum + (r.orderTotal || 0), 0);
    const paidCommission = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
    const pendingCommission = Math.max(0, deliveredCommission - paidCommission);

    const invitedPartners = await PartnerRepository.getInvitedPartners(partner.partnerCode);
    const computedBonus = invitedPartners.length * 200;
    const finalBonus = Math.max(partner.referralBonusEarned || 0, computedBonus);

    const refCode = (partner.referredByPartnerCode || '').trim().toUpperCase();
    const referrer = refCode ? await PartnerRepository.getByCode(refCode) : null;

    const enrichedPartner: BusinessPartner = {
      ...partner,
      referredByPartnerCode: refCode || undefined,
      referredByPartnerName: referrer ? referrer.fullName : undefined,
      totalOrdersCount: validNonCancelledRefs.length,
      totalSalesAmount,
      totalCommissionEarned: deliveredCommission,
      pendingCommission,
      onHoldCommission,
      deliveredOrdersCount: deliveredRefs.length,
      totalCommissionPaid: paidCommission,
      referralBonusEarned: finalBonus,
      invitedPartnersCount: invitedPartners.length
    };

    return res.json(createSuccessResponse({
      partner: enrichedPartner,
      referrals,
      settlements,
      invitedPartners
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to load partner details'));
  }
});

// Bulk update partner status (active / suspended / approved / pending)
apiRouter.post('/partner-program/partners/bulk-status', async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body as { ids: string[]; status: 'active' | 'suspended' | 'pending' | 'approved' };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('No partner IDs provided for bulk status update.'));
    }
    if (!status || !['active', 'suspended', 'pending', 'approved'].includes(status)) {
      return res.status(400).json(createErrorResponse('Invalid partner status specified.'));
    }

    // Fetch existing partners before update to detect newly approved ones
    const existingList = await Promise.all(ids.map(id => PartnerRepository.getById(id)));
    const newlyApprovedPartners = (status === 'active' || status === 'approved')
      ? existingList.filter(p => p && p.status !== 'active' && p.status !== 'approved')
      : [];

    const result = await PartnerRepository.bulkUpdateStatus(ids, status);

    // Send approval emails for newly approved partners asynchronously
    if (newlyApprovedPartners.length > 0) {
      SettingsRepository.get()
        .then(siteSettings => {
          for (const partner of newlyApprovedPartners) {
            if (partner?.email) {
              const referralLink = `http://aaplajalgaonwala.com/ref/${partner.partnerCode}`;
              sendEmail({
                to: partner.email,
                subject: `🎉 Congratulations! Your Women Business Partner Account is Approved | Code: ${partner.partnerCode}`,
                html: generatePartnerApprovedEmailHtml(partner, referralLink, siteSettings)
              }).catch(err => console.warn(`[Bulk Status] Approval email failed for ${partner.email}:`, err));
            }
          }
        })
        .catch(err => console.warn('[Bulk Status] Settings fetch error:', err));
    }

    return res.json(createSuccessResponse({
      message: `Successfully updated ${result.successCount} partner(s) to ${status}${newlyApprovedPartners.length > 0 ? ` and sent ${newlyApprovedPartners.length} approval email(s)` : ''}.`,
      successCount: result.successCount
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to execute bulk status update'));
  }
});

// Bulk delete partners
apiRouter.post('/partner-program/partners/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(createErrorResponse('No partner IDs provided for bulk delete.'));
    }
    const result = await PartnerRepository.bulkDelete(ids);
    return res.json(createSuccessResponse({
      message: `Successfully deleted ${result.deletedCount} partner account(s).`,
      deletedCount: result.deletedCount
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to execute bulk delete'));
  }
});

// Pre-validate partner registration details (Email, Phone, and unique Code) before processing payment
apiRouter.post('/partner-program/pre-validate', async (req: Request, res: Response) => {
  try {
    const { email, phone, fullName, partnerCode, aadhaarPanNumber } = req.body || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json(createErrorResponse('Please enter your full name (at least 2 characters).'));
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json(createErrorResponse('Please enter a valid email address.'));
    }

    const cleanPhone = (phone || '').trim().replace(/[^\d]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json(createErrorResponse('Please enter a valid 10-digit mobile number.'));
    }

    // Validate email and phone uniqueness in MySQL database
    const duplicateCheck = await PartnerRepository.checkDuplicates(cleanEmail, cleanPhone);
    if (duplicateCheck.exists) {
      return res.status(409).json(createErrorResponse(duplicateCheck.message || 'This email or phone is already registered as a Business Partner.'));
    }

    // Generate or validate uniqueness of partnerCode
    let uniqueCode = '';
    if (partnerCode && typeof partnerCode === 'string' && partnerCode.trim().length > 0) {
      const candidate = partnerCode.trim().toUpperCase();
      const codeTaken = await PartnerRepository.isCodeExists(candidate);
      if (codeTaken) {
        return res.status(409).json(createErrorResponse(`Partner Code "${candidate}" is already in use. Please select a different code or leave blank to auto-generate.`));
      }
      uniqueCode = candidate;
    } else {
      uniqueCode = await PartnerRepository.generateUniquePartnerCode({
        fullName: fullName.trim(),
        phone: cleanPhone,
        aadhaarPanNumber: (aadhaarPanNumber || '').trim()
      });
    }

    return res.json(createSuccessResponse({
      valid: true,
      partnerCode: uniqueCode,
      message: 'Validation successful. Ready for secure payment processing.'
    }));
  } catch (error: any) {
    console.error('[Partner Pre-Validate] Error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Validation failed. Please try again.'));
  }
});

// Register new partner (registered and code generated ONLY on successful ₹699 Razorpay payment)
apiRouter.post('/partner-program/register', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      phone,
      email,
      city,
      state,
      socialPlatform,
      socialHandle,
      partnerCode,
      phonePeNumber,
      gpayNumber,
      bankAccountName,
      bankName,
      bankAccountNumber,
      ifscCode,
      upiId,
      aadhaarPanNumber,
      documentUrl,
      status,
      commissionRate,
      customerDiscountRate,
      notes,
      paymentRef,
      paymentAmount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      isSimulation,
      isAdminBypass,
      referredByPartnerCode
    } = req.body || {};

    if (!fullName || !phone || !email || !city) {
      return res.status(400).json(createErrorResponse('Please fill in all mandatory contact details (Full Name, Phone, Email, City).'));
    }

    const effectiveUpi = (upiId || phonePeNumber || gpayNumber || '').trim();
    const hasBank = bankAccountNumber && bankAccountNumber !== 'PENDING' && ifscCode && ifscCode !== 'PENDING';
    const hasUpi = Boolean(effectiveUpi);
    const hasPassbook = Boolean(documentUrl);

    if (!hasBank && !hasUpi && !hasPassbook && !isAdminBypass) {
      return res.status(400).json(createErrorResponse('Please provide at least one payout method: PhonePe/GPay 10-digit number, UPI ID, Bank Account details, or Passbook photo.'));
    }

    const siteSettings = await SettingsRepository.get();
    const isFreeOnboarding = Number(siteSettings.womenPartnerFee) === 0;

    const regFeeAmount = isFreeOnboarding
      ? 0
      : (paymentAmount !== undefined && !isNaN(Number(paymentAmount)) && Number(paymentAmount) >= 0
          ? Number(paymentAmount)
          : (siteSettings.womenPartnerFee !== undefined ? Number(siteSettings.womenPartnerFee) : 699));

    const effectivePaymentId = razorpay_payment_id || paymentRef;

    if (!effectivePaymentId && !isAdminBypass && !isFreeOnboarding) {
      return res.status(400).json(createErrorResponse(`Registration fee payment is required. Please complete the ₹${regFeeAmount} payment to proceed.`));
    }

    // Cryptographic signature verification using existing Razorpay secret from MySQL / settings
    const keySecret = (siteSettings.razorpayKeySecret || '').trim() || process.env.RAZORPAY_KEY_SECRET;

    if (!isAdminBypass && !isFreeOnboarding) {
      if (!keySecret) {
        return res.status(400).json(createErrorResponse('Payment gateway key secret is not configured on the server.'));
      }
      if (!razorpay_order_id || !effectivePaymentId || !razorpay_signature) {
        return res.status(400).json(createErrorResponse('Missing payment transaction verification credentials.'));
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${effectivePaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json(createErrorResponse(`Payment signature verification failed. Registration cannot proceed without verified ₹${regFeeAmount} payment.`));
      }
    }

    // Check if phone or email is already registered in MySQL
    const dupCheck = await PartnerRepository.checkDuplicates(email, phone);
    if (dupCheck.exists) {
      return res.status(409).json(createErrorResponse(dupCheck.message || `An account with this mobile (${phone}) or email (${email}) is already registered.`));
    }

    // Verify referrer if provided
    let referrer: any = null;
    const refCodeStr = typeof referredByPartnerCode === 'string'
      ? referredByPartnerCode.trim()
      : (referredByPartnerCode && typeof referredByPartnerCode === 'object' && (referredByPartnerCode as any).code)
        ? String((referredByPartnerCode as any).code).trim()
        : '';

    if (refCodeStr) {
      referrer = await PartnerRepository.getByCode(refCodeStr);
    }

    const paymentStatusVal = isFreeOnboarding ? 'free' : (isAdminBypass ? 'bypassed' : 'paid');

    const newPartner = await PartnerRepository.create({
      ...(partnerCode && partnerCode.trim() ? { partnerCode: partnerCode.trim().toUpperCase() } : {}),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city.trim(),
      state: (state || 'Maharashtra').trim(),
      socialPlatform: socialPlatform || 'WhatsApp',
      socialHandle: (socialHandle || '').trim(),
      bankAccountName: (bankAccountName || fullName).trim(),
      bankName: (bankName || (hasUpi ? 'UPI / PhonePe' : hasPassbook ? 'Uploaded Passbook' : 'Direct Transfer')).trim(),
      bankAccountNumber: (bankAccountNumber || effectiveUpi || (hasPassbook ? 'Passbook Attached' : 'UPI-PAYOUT')).trim(),
      ifscCode: (ifscCode || 'UPI-PAYOUT').trim().toUpperCase(),
      upiId: effectiveUpi,
      aadhaarPanNumber: (aadhaarPanNumber || '').trim(),
      documentUrl: documentUrl || '',
      referredByPartnerCode: referrer ? referrer.partnerCode : undefined,
      paymentStatus: paymentStatusVal,
      paymentRef: effectivePaymentId || 'N/A',
      transactionId: effectivePaymentId || 'N/A',
      razorpayPaymentId: effectivePaymentId || undefined,
      razorpayOrderId: razorpay_order_id || undefined,
      paymentAmount: regFeeAmount,
      paymentDate: new Date().toISOString(),
      notes: (notes ? notes + ' | ' : '') + (isFreeOnboarding ? 'Free Onboarding (₹0 Fee)' : (effectivePaymentId ? `Registration Fee: ₹${regFeeAmount} (Payment ID: ${effectivePaymentId}, Order ID: ${razorpay_order_id || 'N/A'})` : 'Admin Bypassed Payment')) + (referrer ? ` | Referred by Woman Partner: ${referrer.fullName} (${referrer.partnerCode})` : ''),
      status: (status && ['active', 'approved', 'pending'].includes(status))
        ? status
        : (isAdminBypass || siteSettings.womenPartnerAutoApprove !== false ? 'active' : 'pending'),
      commissionRate: commissionRate ? Number(commissionRate) : 12.0,
      customerDiscountRate: customerDiscountRate ? Number(customerDiscountRate) : 4.0
    });

    // Credit Referral Bonus to Referrer
    if (referrer) {
      try {
        const bonusAmount = 200;
        const newReferralBonusEarned = (referrer.referralBonusEarned || 0) + bonusAmount;
        const newPendingCommission = (referrer.pendingCommission || 0) + bonusAmount;
        const newTotalCommissionEarned = (referrer.totalCommissionEarned || 0) + bonusAmount;

        await PartnerRepository.update(referrer.id, {
          referralBonusEarned: newReferralBonusEarned,
          pendingCommission: newPendingCommission,
          totalCommissionEarned: newTotalCommissionEarned,
          notes: (referrer.notes ? referrer.notes + ' | ' : '') + `Earned ₹200 referral bonus for inviting ${newPartner.fullName} (${newPartner.partnerCode})`
        });

        // Notify referrer via Email
        if (referrer.email) {
          sendEmail({
            to: referrer.email,
            subject: `🎁 Congratulations! You earned ₹200 Referral Bonus on Aapla Jalgaonwala!`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff; color: #1c1917;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <span style="font-size: 40px;">🌸</span>
                  <h2 style="color: #9B111E; margin-top: 10px; font-family: Georgia, serif; font-weight: 800; font-size: 24px;">Aapla Jalgaonwala</h2>
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: #1c1917; margin-bottom: 15px;">Congratulations ${referrer.fullName}! 🎉</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #44403c; margin-bottom: 20px;">
                  We are thrilled to inform you that <strong>${newPartner.fullName}</strong> has successfully registered as a <strong>Women Business Partner</strong> using your personal invite link!
                </p>
                <div style="background-color: #fdf2f2; border-left: 4px solid #9B111E; padding: 20px; border-radius: 12px; margin: 25px 0;">
                  <p style="margin: 0; font-size: 18px; font-weight: 800; color: #9B111E; letter-spacing: -0.01em;">₹200.00 Referral Reward Added</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.5; color: #78716c; font-weight: 500;">
                    This amount has been added directly to your pending commission balance. It will be settled straight into your bank account or UPI payout destination during our automatic Sunday clearing.
                  </p>
                </div>
                <p style="font-size: 14px; line-height: 1.6; color: #44403c; margin-bottom: 20px;">
                  Keep sharing your invite link to empower more women in your community and multiply your Sunday payouts!
                </p>
                <div style="border-top: 1px solid #f5f5f4; padding-top: 20px; margin-top: 30px; text-align: center;">
                  <p style="font-size: 12px; color: #a8a29e; margin: 0;">
                    Thank you for being an invaluable part of Aapla Jalgaonwala.<br/>
                    <strong>Empowering Women, Sharing Authentic Flavours.</strong>
                  </p>
                </div>
              </div>
            `
          }).catch(err => console.warn('[Referrer Notify Email] Error:', err));
        }
      } catch (err) {
        console.warn('[Referrer Credit Error] Failed to update referrer or send notification:', err);
      }
    }

    const referralLink = `http://aaplajalgaonwala.com/ref/${newPartner.partnerCode}`;
    const isAutoApproved = newPartner.status === 'active' || newPartner.status === 'approved';

    // Async Notifications: Admin Alert, Partner Email, and Telegram Alert
    SettingsRepository.get()
      .then(siteSettings => {
        // 1. Send Instant Telegram Alert
        if (siteSettings.enableTelegramAlerts !== false && siteSettings.telegramBotToken && siteSettings.telegramChatId) {
          const telegramMessage = isAutoApproved
            ? `🌸 <b>NEW WOMEN BUSINESS PARTNER REGISTRATION (AUTO-APPROVED & ACTIVE)!</b>\n\n` +
              `<b>Partner Code:</b> <code>${newPartner.partnerCode}</code>\n` +
              `<b>Status:</b> ✅ ACTIVE (Instant Approval)\n` +
              `<b>Name:</b> ${newPartner.fullName}\n` +
              `<b>Phone:</b> ${newPartner.phone}\n` +
              `<b>Email:</b> ${newPartner.email}\n` +
              `<b>City:</b> ${newPartner.city}, ${newPartner.state}\n` +
              `<b>Bank:</b> ${newPartner.bankName} (A/C: ${newPartner.bankAccountNumber})\n` +
              `<b>UPI:</b> ${newPartner.upiId || 'N/A'}\n` +
              `<b>Referral Link:</b> ${referralLink}`
            : `🌸 <b>NEW WOMEN BUSINESS PARTNER REGISTRATION (PENDING REVIEW)!</b>\n\n` +
              `<b>Partner Code:</b> <code>${newPartner.partnerCode}</code>\n` +
              `<b>Status:</b> ⏳ PENDING REVIEW\n` +
              `<b>Name:</b> ${newPartner.fullName}\n` +
              `<b>Phone:</b> ${newPartner.phone}\n` +
              `<b>Email:</b> ${newPartner.email}\n` +
              `<b>City:</b> ${newPartner.city}, ${newPartner.state}\n` +
              `<b>Bank:</b> ${newPartner.bankName} (A/C: ${newPartner.bankAccountNumber})\n` +
              `<b>UPI:</b> ${newPartner.upiId || 'N/A'}\n` +
              `👉 <i>Action: Please review and activate in Admin Portal.</i>`;

          sendTelegramAlert(telegramMessage).catch(err =>
            console.warn('[Partner Registration] Telegram alert error:', err)
          );
        }

        // 2. Send Admin Notification Email
        const adminEmail =
          siteSettings.adminNotificationEmail ||
          siteSettings.contactEmail ||
          process.env.ADMIN_NOTIFICATION_EMAIL ||
          'partners@aapla-jalgaonwala.in';

        if (adminEmail) {
          sendEmail({
            to: adminEmail,
            subject: isAutoApproved
              ? `🌸 [New Partner - Auto-Approved] ${newPartner.fullName} (${newPartner.partnerCode}) registered from ${newPartner.city} (Active)`
              : `🌸 [New Partner Application] ${newPartner.fullName} (${newPartner.partnerCode}) registered from ${newPartner.city} (Pending Review)`,
            html: generatePartnerRegistrationAdminAlertEmailHtml(newPartner, siteSettings)
          }).catch(err => console.warn('[Partner Registration] Admin email notification error:', err));
        }

        // 3. Send Email to Applicant
        if (newPartner.email) {
          if (isAutoApproved) {
            sendEmail({
              to: newPartner.email,
              subject: `🎉 Congratulations! Your Women Business Partner Account is Active | Code: ${newPartner.partnerCode}`,
              html: generatePartnerApprovedEmailHtml(newPartner, referralLink, siteSettings)
            }).catch(err => console.warn('[Partner Registration] Welcome email to partner error:', err));
          } else {
            sendEmail({
              to: newPartner.email,
              subject: `🌸 Registration Received — Aapla Jalgaonwala Women Business Partner Program (Pending Review)`,
              html: generatePartnerPendingRegistrationEmailHtml(newPartner, siteSettings)
            }).catch(err => console.warn('[Partner Registration] Pending email to partner error:', err));
          }
        }
      })
      .catch(err => console.warn('[Partner Registration] Settings fetch error:', err));

    return res.status(201).json(createSuccessResponse({
      partner: newPartner,
      referralLink,
      message: isAutoApproved
        ? `Congratulations! Your partner account has been created and approved automatically. Your Partner Code is ${newPartner.partnerCode}.`
        : `You have been registered successfully! Your partner application is under review.`
    }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to register partner'));
  }
});

// Update partner status or details
apiRouter.put('/partner-program/partners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const existing = await PartnerRepository.getById(id);
    if (!existing) {
      return res.status(404).json(createErrorResponse('Partner not found'));
    }

    const isNewlyApproved = (updates.status === 'active' || updates.status === 'approved') && (existing.status === 'pending' || existing.status === 'suspended');

    const updated = await PartnerRepository.update(id, updates);
    if (!updated) {
      return res.status(404).json(createErrorResponse('Partner update failed'));
    }

    // If partner just got approved/activated, send approval email
    if (isNewlyApproved && updated.email) {
      const referralLink = `http://aaplajalgaonwala.com/ref/${updated.partnerCode}`;
      SettingsRepository.get()
        .then(siteSettings => {
          sendEmail({
            to: updated.email,
            subject: `🎉 Congratulations! Your Women Business Partner Account is Approved | Code: ${updated.partnerCode}`,
            html: generatePartnerApprovedEmailHtml(updated, referralLink, siteSettings)
          }).catch(err => console.warn('[Partner Approval] Email send error:', err));
        })
        .catch(err => console.warn('[Partner Approval] Settings fetch error:', err));
    }

    return res.json(createSuccessResponse(updated));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update partner'));
  }
});

// Delete partner
apiRouter.delete('/partner-program/partners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await PartnerRepository.delete(id);
    return res.json(createSuccessResponse({ success }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete partner'));
  }
});

// Get referrals list
apiRouter.get('/partner-program/referrals', async (req: Request, res: Response) => {
  try {
    await PartnerRepository.syncAllPartnerReferrals();
    const { partnerCode } = req.query as { partnerCode?: string };
    const referrals = await PartnerRepository.getReferrals(partnerCode);
    return res.json(createSuccessResponse(referrals));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch referrals'));
  }
});

// Delete a partner referral order (e.g. WhatsApp manual order)
apiRouter.delete('/partner-program/referrals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deleteLinkedSettlement } = req.query;
    if (!id) {
      return res.status(400).json(createErrorResponse('Referral ID or Order Number is required'));
    }

    const result = await PartnerRepository.deleteReferral(id, {
      deleteLinkedSettlement: deleteLinkedSettlement === 'true'
    });

    if (!result.success) {
      return res.status(404).json(createErrorResponse(result.message || 'Referral order not found'));
    }

    return res.json(createSuccessResponse({
      message: result.message || `Order #${result.deletedReferral?.orderNumber || id} successfully deleted`,
      partner: result.partner,
      deletedReferral: result.deletedReferral
    }));
  } catch (error: any) {
    console.error('[PartnerProgram] Delete referral error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete referral order'));
  }
});

// Get settlements list
apiRouter.get('/partner-program/settlements', async (req: Request, res: Response) => {
  try {
    const { partnerCode } = req.query as { partnerCode?: string };
    const settlements = await PartnerRepository.getSettlements(partnerCode);
    return res.json(createSuccessResponse(settlements));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch settlements'));
  }
});

// Record new settlement (Sunday weekly payout)
apiRouter.post('/partner-program/settlements', async (req: Request, res: Response) => {
  try {
    const settlementData = req.body;
    if (!settlementData.partnerId || !settlementData.amount || !settlementData.transactionReference) {
      return res.status(400).json(createErrorResponse('Partner ID, Amount, and Transaction Reference are required'));
    }

    const created = await PartnerRepository.createSettlement(settlementData);
    return res.status(201).json(createSuccessResponse(created));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to record settlement'));
  }
});

// Add custom fund / commission in rupees for a woman partner (e.g. for WhatsApp orders)
apiRouter.post('/partner-program/custom-fund', async (req: Request, res: Response) => {
  try {
    const {
      partnerId,
      partnerCode,
      amount,
      orderNumber,
      orderTotal,
      customerName,
      customerCity,
      notes,
      markAsPaid,
      paymentMethod,
      transactionReference,
      sendEmail
    } = req.body;

    if (!partnerId && !partnerCode) {
      return res.status(400).json(createErrorResponse('Partner ID or Partner Code is required'));
    }

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json(createErrorResponse('Please enter a valid fund/commission amount in Rupees (greater than 0)'));
    }

    const result = await PartnerRepository.addCustomFund({
      partnerId,
      partnerCode,
      amount: numAmount,
      orderNumber,
      orderTotal: Number(orderTotal || 0),
      customerName,
      customerCity,
      notes,
      markAsPaid: Boolean(markAsPaid),
      paymentMethod,
      transactionReference,
      sendEmail: sendEmail !== false
    });

    return res.status(201).json(createSuccessResponse({
      ...result,
      message: `Successfully credited ₹${numAmount} to ${result.partner.fullName}${sendEmail !== false && result.partner.email ? ` and sent email notification to ${result.partner.email}` : ''}.`
    }));
  } catch (error: any) {
    console.error('[PartnerProgram] Custom fund error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to add custom fund'));
  }
});

// ----------------------------------------------------
// ADMIN CUSTOMER MANAGEMENT ROUTES
// ----------------------------------------------------

// Get all customers/users with order counts & addresses
apiRouter.get('/admin/users', async (_req: Request, res: Response) => {
  try {
    const allUsers = await UserRepository.getAll();
    const allOrders = await OrderRepository.getAll();

    const enrichedUsers = await Promise.all(
      allUsers.map(async (u) => {
        const addresses = await UserRepository.getAddresses(u.id);
        const userOrders = allOrders.filter(
          (o) => o.userId === u.id || (o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase())
        );
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const { passwordHash: _, ...safeUser } = u;
        return {
          ...safeUser,
          addresses,
          orderCount: userOrders.length,
          totalSpent,
          lastOrderDate: userOrders.length > 0 ? userOrders[0].createdAt : null
        };
      })
    );

    return res.json(createSuccessResponse(enrichedUsers));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch customers'));
  }
});

// Update customer details
apiRouter.put('/admin/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, avatarUrl } = req.body;

    const updated = await UserRepository.update(id, {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(role !== undefined && { role }),
      ...(avatarUrl !== undefined && { avatarUrl })
    });

    if (!updated) {
      return res.status(404).json(createErrorResponse('User not found'));
    }

    const { passwordHash: _, ...safeUser } = updated;
    return res.json(createSuccessResponse(safeUser));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update customer'));
  }
});

// Delete customer
apiRouter.delete('/admin/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await UserRepository.delete(id);
    return res.json(createSuccessResponse({ success, id }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete customer'));
  }
});

// ----------------------------------------------------
// REAL-TIME PRODUCTION ANALYTICS ENGINE
// ----------------------------------------------------

// 1. Ingest Pageview / Event Telemetry (supports batched array or single event)
apiRouter.post('/analytics/track', async (req: Request, res: Response) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
    const payload = req.body;

    if (Array.isArray(payload)) {
      // Process batch
      for (const item of payload) {
        if (item.type === 'pageview') {
          await AnalyticsRepository.trackPageview({
            sessionId: item.sessionId,
            visitorId: item.visitorId,
            path: item.path,
            title: item.title,
            referrer: item.referrer,
            userAgent,
            deviceType: item.deviceType,
            city: item.city,
            country: item.country,
            userId: item.userId,
            durationSeconds: item.durationSeconds
          });
        } else if (item.type === 'event') {
          await AnalyticsRepository.trackEvent({
            sessionId: item.sessionId,
            visitorId: item.visitorId,
            eventName: item.eventName,
            eventCategory: item.eventCategory,
            path: item.path,
            targetId: item.targetId,
            targetName: item.targetName,
            value: item.value ? Number(item.value) : undefined,
            metadata: item.metadata,
            userAgent,
            deviceType: item.deviceType
          });
        }
      }
      return res.json(createSuccessResponse({ tracked: payload.length }));
    }

    if (payload.type === 'pageview') {
      const pageview = await AnalyticsRepository.trackPageview({
        sessionId: payload.sessionId,
        visitorId: payload.visitorId,
        path: payload.path,
        title: payload.title,
        referrer: payload.referrer,
        userAgent,
        deviceType: payload.deviceType,
        city: payload.city,
        country: payload.country,
        userId: payload.userId,
        durationSeconds: payload.durationSeconds
      });
      return res.json(createSuccessResponse(pageview));
    }

    if (payload.type === 'event') {
      const event = await AnalyticsRepository.trackEvent({
        sessionId: payload.sessionId,
        visitorId: payload.visitorId,
        eventName: payload.eventName,
        eventCategory: payload.eventCategory,
        path: payload.path,
        targetId: payload.targetId,
        targetName: payload.targetName,
        value: payload.value ? Number(payload.value) : undefined,
        metadata: payload.metadata,
        userAgent,
        deviceType: payload.deviceType
      });
      return res.json(createSuccessResponse(event));
    }

    return res.status(400).json(createErrorResponse('Invalid analytics payload type. Expected pageview or event.'));
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Tracking failed'));
  }
});

// In-memory heartbeat throttle to reduce database load and CPU on Cloud Run
const heartbeatThrottle = new Map<string, number>();

// 2. Real-Time Active Visitor Heartbeat Ping
apiRouter.post('/analytics/heartbeat', async (req: Request, res: Response) => {
  try {
    const { visitorId, sessionId, path, deviceType, city } = req.body;
    if (!visitorId || !sessionId) {
      return res.status(400).json(createErrorResponse('visitorId and sessionId are required'));
    }

    const throttleKey = `${visitorId}:${sessionId}`;
    const now = Date.now();
    const lastPing = heartbeatThrottle.get(throttleKey);

    // If recorded in the last 45 seconds, return instant cached response without DB writes
    if (lastPing && (now - lastPing) < 45000) {
      return res.json(createSuccessResponse({ alive: true, timestamp: now, throttled: true }));
    }

    heartbeatThrottle.set(throttleKey, now);

    // Garbage collect throttle map periodically
    if (heartbeatThrottle.size > 2000) {
      for (const [key, timestamp] of heartbeatThrottle.entries()) {
        if (now - timestamp > 120000) {
          heartbeatThrottle.delete(key);
        }
      }
    }

    await AnalyticsRepository.recordHeartbeat({
      visitorId,
      sessionId,
      path: path || '/',
      deviceType,
      city
    });

    return res.json(createSuccessResponse({ alive: true, timestamp: now }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Heartbeat failed'));
  }
});

// 3. Unified Real-Time Production Analytics Dashboard Data
apiRouter.get('/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    const timeRange = (req.query.timeRange as string) || '7d';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const data = await AnalyticsRepository.getDashboardAnalytics({
      timeRange,
      startDate,
      endDate
    });

    return res.json(createSuccessResponse(data));
  } catch (error: any) {
    console.error('Analytics dashboard error:', error);
    return res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve analytics dashboard'));
  }
});

// 4. Clear / Reset Analytics (Admin maintenance)
apiRouter.post('/analytics/clear', async (req: Request, res: Response) => {
  try {
    await AnalyticsRepository.clearLogs();
    return res.json(createSuccessResponse({ message: 'Analytics history reset successfully' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to clear analytics'));
  }
});

// --- MOBILE APP SPECIFIC ENDPOINTS --- //

apiRouter.get('/user/orders', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const orders = await OrderRepository.getByUser({ userId: user.id, email: user.email, phone: user.phone });
    return res.json(createSuccessResponse(orders));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user orders'));
  }
});

apiRouter.get('/user/addresses', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const addresses = await UserRepository.getAddresses(user.id);
    return res.json(createSuccessResponse(addresses));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user addresses'));
  }
});

apiRouter.get('/user/addresses/:id', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const addresses = await UserRepository.getAddresses(user.id);
    const address = addresses.find(a => a.id === req.params.id);
    
    if (!address) return res.status(404).json(createErrorResponse('Address not found'));
    
    return res.json(createSuccessResponse(address));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch address'));
  }
});

apiRouter.post('/user/addresses', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const newAddress = await UserRepository.saveAddress(user.id, req.body);
    return res.json(createSuccessResponse(newAddress));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to create address'));
  }
});

apiRouter.put('/user/addresses/:id', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const updatedAddress = await UserRepository.saveAddress(user.id, { ...req.body, id: req.params.id });
    return res.json(createSuccessResponse(updatedAddress));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update address'));
  }
});

apiRouter.delete('/user/addresses/:id', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    await UserRepository.deleteAddress(user.id, req.params.id);
    return res.json(createSuccessResponse({ success: true, message: 'Address deleted' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to delete address'));
  }
});

apiRouter.get('/user/wishlist', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    // Returns empty array for now since wishlist is not implemented in db.
    return res.json(createSuccessResponse([]));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch wishlist'));
  }
});

apiRouter.get('/user/payments', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const orders = await OrderRepository.getByUser({ userId: user.id, email: user.email, phone: user.phone });
    
    const payments = orders.map(order => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: 'INR',
      method: order.paymentMethod,
      status: order.paymentStatus,
      date: order.createdAt
    }));
    
    return res.json(createSuccessResponse(payments));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to fetch user payments'));
  }
});


apiRouter.put('/user/info', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized: Invalid or missing authentication token'));

    const { name, phone, avatarUrl } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatarUrl) updates.avatarUrl = avatarUrl;
    
    if (Object.keys(updates).length > 0) {
      await UserRepository.update(user.id, updates);
    }
    
    const updatedUser = await UserRepository.findById(user.id);
    return res.json(createSuccessResponse(updatedUser));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Failed to update user profile'));
  }
});

apiRouter.post('/user/wishlist', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized'));
    return res.json(createSuccessResponse({ success: true, message: 'Item added to wishlist (mocked)' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message));
  }
});

apiRouter.delete('/user/wishlist/:productId', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) return res.status(401).json(createErrorResponse('Unauthorized'));
    return res.json(createSuccessResponse({ success: true, message: 'Item removed from wishlist (mocked)' }));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message));
  }
});

// POST /api/user/google-login - Google auth login for Android App
apiRouter.post('/user/google-login', async (req: Request, res: Response) => {
  try {
    const { name, email, avatarUrl, profile_pic, picture } = req.body;
    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const resolvedAvatar = avatarUrl || profile_pic || picture || '';
    
    let user = await UserRepository.findByEmail(cleanEmail);
    const token = crypto.randomBytes(32).toString('hex');

    if (user) {
      // User exists, generate/update token and sync optional details
      await UserRepository.update(user.id, {
        appAuthToken: token,
        name: user.name || name || cleanEmail.split('@')[0],
        avatarUrl: user.avatarUrl || resolvedAvatar,
        authProvider: 'google'
      });
      user = await UserRepository.findById(user.id);
    } else {
      // Create new user
      user = await UserRepository.create({
        name: name ? name.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        avatarUrl: resolvedAvatar,
        appAuthToken: token,
        authProvider: 'google',
        role: 'customer'
      });
    }

    if (!user) {
      return res.status(500).json(createErrorResponse('Failed to resolve or create user'));
    }

    const enrichedUser = await enrichUserForAuth(user);
    const { passwordHash: _, ...safeUser } = enrichedUser;

    return res.json(createSuccessResponse({
      app_auth_token: token,
      token: token,
      user: safeUser
    }, 'Google authentication successful'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Google login failed'));
  }
});

// POST /api/user/google-signup - Google auth signup for Android App
apiRouter.post('/user/google-signup', async (req: Request, res: Response) => {
  try {
    const { name, email, avatarUrl, profile_pic, picture } = req.body;
    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const resolvedAvatar = avatarUrl || profile_pic || picture || '';
    
    let user = await UserRepository.findByEmail(cleanEmail);
    const token = crypto.randomBytes(32).toString('hex');

    if (user) {
      // User exists, generate/update token and sync optional details
      await UserRepository.update(user.id, {
        appAuthToken: token,
        name: user.name || name || cleanEmail.split('@')[0],
        avatarUrl: user.avatarUrl || resolvedAvatar,
        authProvider: 'google'
      });
      user = await UserRepository.findById(user.id);
    } else {
      // Create new user
      user = await UserRepository.create({
        name: name ? name.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        avatarUrl: resolvedAvatar,
        appAuthToken: token,
        authProvider: 'google',
        role: 'customer'
      });
    }

    if (!user) {
      return res.status(500).json(createErrorResponse('Failed to resolve or create user'));
    }

    const enrichedUser = await enrichUserForAuth(user);
    const { passwordHash: _, ...safeUser } = enrichedUser;

    return res.status(201).json(createSuccessResponse({
      app_auth_token: token,
      token: token,
      user: safeUser
    }, 'Google registration successful'));
  } catch (error: any) {
    return res.status(500).json(createErrorResponse(error.message || 'Google registration failed'));
  }
});


