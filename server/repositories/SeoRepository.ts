import { PageSeoItem } from '@/types';
import { readJson, writeJson } from '../utils/jsonStorage';
import { getDbPool } from '../database/connection';

const FILE_NAME = 'seo_metadata.json';

let seoMemoryCache: { data: PageSeoItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000;

const DEFAULT_PAGES: PageSeoItem[] = [
  {
    id: 'page-home',
    pageKey: 'home',
    pageName: 'Home Page (/)',
    seoTitle: 'Aapla Jalgaonwala | Authentic Jalgaon Banana Chips & Snacks',
    seoDescription: 'Order authentic Jalgaon banana chips in 10 unique flavours, farsaan, kitchen masalas & dry chutneys online. Directly sourced from Jalgaon farmers.',
    keywords: 'Jalgaon Banana Chips, Farsan, Khandeshi Masala, Chutneys, Indian Snacks, Jalgaonwala',
    ogImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-shop',
    pageKey: 'shop',
    pageName: 'Shop Page (/shop)',
    seoTitle: 'Buy Fresh Jalgaon Banana Chips & Farsaan Online | Jalgaonwala',
    seoDescription: 'Explore our complete range of crispy Jalgaon banana chips, farsaan, authentic masalas, and dry chutneys. Fresh farmgate sourcing & fast delivery across India.',
    keywords: 'Buy Banana Chips Online, Order Farsan, Jalgaon Snacks Delivery, Khandeshi Snacks',
    ogImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-categories',
    pageKey: 'categories',
    pageName: 'Categories (/categories)',
    seoTitle: 'Explore Snack Collections & Categories | Aapla Jalgaonwala',
    seoDescription: 'Browse our signature snack collections including Jalgaon Banana Chips, Namkeen & Farsan, Khandeshi Kitchen Masalas, and Upwas Fasting Specials.',
    keywords: 'Snack Categories, Banana Chips Collection, Namkeen, Khandeshi Spices',
    ogImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-upwas-special',
    pageKey: 'upwas-special',
    pageName: 'Upwas Special (/upwas-special)',
    seoTitle: 'Buy Authentic Fasting Snacks & Farali Chips | Jalgaonwala',
    seoDescription: 'Pure farali upwas snacks crafted with rock salt and cold-pressed peanut oil. Fresh Rajgira chivda, sabudana namkeen, and fasting banana chips.',
    keywords: 'Upwas Farali Chips, Sabudana Chivda, Fasting Snacks, Rock Salt Chips',
    ogImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-our-story',
    pageKey: 'our-story',
    pageName: 'Our Story (/our-story)',
    seoTitle: 'Our Story & Founder Journey | Aapla Jalgaonwala Brand',
    seoDescription: 'Discover the story of Aapla Jalgaonwala, founded by Saurabh Patil and Jayesh Patil to bring authentic Jalgaon banana chips and Khandeshi heritage directly to you.',
    keywords: 'Jalgaonwala Story, Jalgaon Farmers, Saurabh Patil, Jayesh Patil, Khandesh Heritage',
    ogImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-franchise',
    pageKey: 'franchise',
    pageName: 'Franchise Partner (/franchise)',
    seoTitle: 'Own a Jalgaonwala Snack Store Franchise | High ROI Business',
    seoDescription: 'Partner with Aapla Jalgaonwala for high-profit store franchise opportunities across Maharashtra & India. Zero royalty fees and complete marketing support.',
    keywords: 'Snack Store Franchise, Jalgaonwala Franchise, High Profit Retail Business',
    ogImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-contact',
    pageKey: 'contact',
    pageName: 'Contact Us (/contact)',
    seoTitle: 'Contact Us & Store Location Pune | Aapla Jalgaonwala',
    seoDescription: 'Get in touch with Aapla Jalgaonwala. Visit our flagship store in Yelwadi, Dehu, Pune, or contact us for franchise, bulk orders, and support.',
    keywords: 'Aapla Jalgaonwala Contact, Jalgaonwala Store Pune, Yelwadi Store, Bulk Snack Order',
    ogImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-faq',
    pageKey: 'faq',
    pageName: 'FAQs (/faq)',
    seoTitle: 'Frequently Asked Questions | Aapla Jalgaonwala Orders',
    seoDescription: 'Find answers about nationwide delivery, payment methods, bulk ordering, shelf-life, and authentic ingredients for Aapla Jalgaonwala snacks.',
    keywords: 'Jalgaonwala FAQs, Snack Delivery Time, Shipping Policy, Ingredients',
    ogImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-instagram',
    pageKey: 'instagram',
    pageName: 'Instagram Highlights (/instagram)',
    seoTitle: 'Social Media & Customer Reviews | Aapla Jalgaonwala',
    seoDescription: 'Watch viral customer unboxing videos, chef reviews, and behind-the-scenes moments from our Jalgaon banana orchards and frying kitchens.',
    keywords: 'Jalgaonwala Instagram, Customer Reviews, Video Reviews, Viral Snacks',
    ogImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-women-partners',
    pageKey: 'women-business-partners',
    pageName: 'Women Partners (/women-business-partners)',
    seoTitle: 'Women Entrepreneur Partnership Program | Jalgaonwala',
    seoDescription: 'Empowering women entrepreneurs across India to launch zero-investment home-based snack distribution & retail partnerships with Aapla Jalgaonwala.',
    keywords: 'Women Entrepreneurship, Home Business Partnership, Earn Money From Home',
    ogImage: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-referral',
    pageKey: 'referral',
    pageName: 'Referral Program (/referral)',
    seoTitle: 'Refer Friends & Earn Free Jalgaon Snacks | Jalgaonwala',
    seoDescription: 'Share authentic Jalgaon taste with your friends. Give ₹50 off on their first snack order and earn instant wallet cashback rewards.',
    keywords: 'Referral Program, Earn Free Snacks, Jalgaonwala Coupon Code',
    ogImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'page-cart',
    pageKey: 'cart',
    pageName: 'Cart (/cart)',
    seoTitle: 'Your Shopping Cart | Aapla Jalgaonwala Online Store',
    seoDescription: 'Review your selected Jalgaon banana chips, farsaan, and authentic masalas in your shopping cart before heading to quick checkout.',
    keywords: 'Shopping Cart, Jalgaonwala Cart, Buy Snacks Online',
    ogImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1200&q=80'
  }
];

export class SeoRepository {
  static clearCache() {
    seoMemoryCache = null;
  }

  static async getAll(): Promise<PageSeoItem[]> {
    return this.getAllPages();
  }

  static async upsert(data: any): Promise<PageSeoItem | null> {
    const pageKey = data.pageKey || data.id;
    const pages = await this.getAllPages();
    let existing = pages.find(p => p.id === data.id || p.pageKey === pageKey);

    if (!existing) {
      existing = {
        id: data.id || `page-${pageKey}`,
        pageKey: pageKey,
        pageName: data.pageName || pageKey,
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        keywords: data.keywords || ''
      };
    }

    return this.updatePage(existing.id, data);
  }

  private static mapRowToPageSeo(row: any): PageSeoItem {
    return {
      id: row.id,
      pageKey: row.page_key || row.pageKey,
      pageName: row.page_name || row.pageName,
      seoTitle: row.seo_title || row.seoTitle,
      seoDescription: row.seo_description || row.seoDescription,
      keywords: row.keywords || '',
      ogImage: row.og_image || row.ogImage || '',
      updatedAt: row.updated_at
    };
  }

  static async getAllPages(): Promise<PageSeoItem[]> {
    if (seoMemoryCache && (Date.now() - seoMemoryCache.timestamp < CACHE_TTL_MS)) {
      return seoMemoryCache.data;
    }

    const pool = getDbPool();
    let pages: PageSeoItem[] = [];

    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM seo_metadata ORDER BY page_name ASC');
        if (Array.isArray(rows) && rows.length > 0) {
          pages = (rows as any[]).map(r => this.mapRowToPageSeo(r));
          seoMemoryCache = { data: pages, timestamp: Date.now() };
          return pages;
        } else if (Array.isArray(rows) && rows.length === 0) {
          console.info('[SeoRepo] seo_metadata is empty in MySQL. Auto-seeding default pages...');
          for (const dp of DEFAULT_PAGES) {
            await pool.query(
              `INSERT IGNORE INTO seo_metadata (id, page_key, page_name, seo_title, seo_description, keywords, og_image)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [dp.id, dp.pageKey, dp.pageName, dp.seoTitle, dp.seoDescription, dp.keywords || null, dp.ogImage || null]
            );
          }
          const [seededRows] = await pool.query('SELECT * FROM seo_metadata ORDER BY page_name ASC');
          if (Array.isArray(seededRows) && seededRows.length > 0) {
            pages = (seededRows as any[]).map(r => this.mapRowToPageSeo(r));
            seoMemoryCache = { data: pages, timestamp: Date.now() };
            return pages;
          }
        }
      } catch (err: any) {
        if (err?.code !== 'ER_NO_SUCH_TABLE') {
          console.info('[SeoRepo] MySQL query unavailable, using fallback:', err?.message || err);
        }
      }
    }

    pages = await readJson<PageSeoItem[]>(FILE_NAME, DEFAULT_PAGES);
    if (!pages || pages.length === 0) {
      pages = DEFAULT_PAGES;
      await writeJson(FILE_NAME, DEFAULT_PAGES);
    }
    seoMemoryCache = { data: pages, timestamp: Date.now() };
    return pages;
  }

  static async getPageByKey(pageKey: string): Promise<PageSeoItem | null> {
    const pages = await this.getAllPages();
    return pages.find(p => p.pageKey === pageKey || p.pageKey === pageKey.replace(/^\//, '')) || null;
  }

  static async updatePage(id: string, data: Partial<PageSeoItem>): Promise<PageSeoItem | null> {
    this.clearCache();
    const pages = await this.getAllPages();
    const existing = pages.find(p => p.id === id || p.pageKey === id);
    if (!existing) return null;

    const updated: PageSeoItem = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO seo_metadata (id, page_key, page_name, seo_title, seo_description, keywords, og_image)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             page_name = VALUES(page_name),
             seo_title = VALUES(seo_title),
             seo_description = VALUES(seo_description),
             keywords = VALUES(keywords),
             og_image = VALUES(og_image),
             updated_at = NOW()`,
          [
            updated.id,
            updated.pageKey,
            updated.pageName,
            updated.seoTitle,
            updated.seoDescription,
            updated.keywords || null,
            updated.ogImage || null
          ]
        );
      } catch (err: any) {
        console.warn('[SeoRepo] MySQL upsert failed, updating JSON storage fallback:', err?.message || err);
      }
    }

    // Save to JSON storage fallback
    const allPages = await readJson<PageSeoItem[]>(FILE_NAME, DEFAULT_PAGES);
    const index = allPages.findIndex(p => p.id === updated.id);
    if (index >= 0) {
      allPages[index] = updated;
    } else {
      allPages.push(updated);
    }
    await writeJson(FILE_NAME, allPages);

    return updated;
  }
}
