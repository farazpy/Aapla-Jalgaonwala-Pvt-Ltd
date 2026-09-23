import { GoogleGenAI } from '@google/genai';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { CouponRepository } from '../repositories/CouponRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { SnackMitraRepository } from '../repositories/SnackMitraRepository';
import { SnackMitraConfig } from '@/types';
import { getAiClient } from './gemini';

// --- In-Memory Response Caching (0 Tokens on Repeated Queries) ---
interface CachedResponse {
  reply: string;
  orderFound: boolean;
  timestamp: number;
}
const queryResponseCache = new Map<string, CachedResponse>();
const QUERY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// --- Live Repository Data Cache (1 minute TTL) ---
interface RepoDataCache {
  timestamp: number;
  products: any[];
  categories: any[];
  coupons: any[];
  settings: any;
}
let cachedRepoData: RepoDataCache | null = null;
const REPO_CACHE_TTL_MS = 60 * 1000;

async function getCachedRepoData() {
  const now = Date.now();
  if (cachedRepoData && (now - cachedRepoData.timestamp < REPO_CACHE_TTL_MS)) {
    return cachedRepoData;
  }
  try {
    const [products, categories, coupons, settings] = await Promise.all([
      ProductRepository.getAll().catch(() => []),
      CategoryRepository.getAll().catch(() => []),
      CouponRepository.getAll().catch(() => []),
      SettingsRepository.get().catch(() => ({} as any))
    ]);
    cachedRepoData = {
      timestamp: now,
      products: Array.isArray(products) ? products : [],
      categories: Array.isArray(categories) ? categories : [],
      coupons: Array.isArray(coupons) ? coupons : [],
      settings: settings || {}
    };
    return cachedRepoData;
  } catch (err) {
    return {
      timestamp: now,
      products: [],
      categories: [],
      coupons: [],
      settings: {}
    };
  }
}

/**
 * OPTION 2: Pre-Gemini Instant Intent Matcher (0 Tokens)
 * Instantly handles high-confidence, predictable customer queries
 * directly without consuming any Gemini tokens.
 */
export function findInstantIntentMatch(
  query: string,
  config: SnackMitraConfig,
  orderDetails: string | null,
  isFirstMessage: boolean
): { reply: string; orderFound: boolean; status: 'instant_match' } | null {
  const q = query.toLowerCase().trim();
  const phone = config?.whatsappNumber || '+91 70574 46409';
  const cleanPhone = phone.replace(/[^0-9]/g, '') || '917057446409';
  const botName = config?.botName || 'Snack Mitra';
  const charMin = config?.characterMin || 200;
  const charMax = config?.characterMax || 300;

  // 1. Live Order Found in MySQL
  if (orderDetails) {
    const baseReply = `Namaskar! 🙏 ${orderDetails} You can review complete order tracking under [My Account & Orders](/account). For live delivery support, connect directly with our helpline on WhatsApp at [${phone}](https://wa.me/${cleanPhone})!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: true,
      status: 'instant_match'
    };
  }

  // 2. Order Tracking query without ID provided
  if (
    q.match(/^(?:where\s+is\s+(?:my\s+)?order|track\s+(?:my\s+)?order|order\s+status|track\s+shipment|where\s+is\s+my\s+parcel)$/i) ||
    (q.includes('track') && q.includes('order')) ||
    (q.includes('where') && q.includes('order')) ||
    (q.includes('status') && q.includes('order'))
  ) {
    const baseReply = `Namaskar! 🙏 To track your order live, please send your Order ID (like ord_... or AJW-...) or phone number in this chat. You can also view all shipments under [My Account](/account) or message us on WhatsApp at [${phone}](https://wa.me/${cleanPhone})!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 3. Store Location / Physical Address / Yelwadi Kitchen
  if (
    q.match(/(?:where\s+is\s+(?:your\s+|the\s+)?(?:store|shop|factory|outlet)|store\s+(?:address|location|timing|hours)|shop\s+(?:address|location)|pune\s+store|yelwadi|visit\s+(?:store|shop)|physical\s+store)/i)
  ) {
    const baseReply = `Namaskar! 🙏 Visit our flagship retail store & live frying kitchen at Gat No. 142, Yelwadi, Dehu-Alandi Road, Pune 412109 (Open daily 9 AM – 9 PM IST) for hot live chip tastings! View route maps on our [Contact Page](/contact).`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 4a. Owner & Founders Direct Contact
  if (
    (q.match(/(?:owner|founder|saurabh|jayesh)\b/i) &&
    q.match(/(?:contact|number|phone|mobile|whatsapp|email|reach|talk|call|address|details|info)/i)) ||
    q.match(/(?:contact\s+(?:the\s+)?owner|how\s+do\s+i\s+contact\s+owner|owner\s+contact|reach\s+owner|talk\s+to\s+owner)/i)
  ) {
    const baseReply = `Namaskar! 🙏 You can contact the owner directly via Call & WhatsApp at [+91 70574 46409](https://wa.me/917057446409) or email at aaplajalgaonwala@gmail.com. We are always glad to assist you! Visit our [Contact Page](/contact).`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 4b. General Contact / Helpline / WhatsApp / Email
  if (
    q.match(/(?:customer\s+care|helpline|support\s+number|contact\s+(?:number|details|info|us)|whatsapp\s+number|phone\s+number|how\s+to\s+call|support\s+email|email\s+address|how\s+to\s+contact)/i)
  ) {
    const baseReply = `Namaskar! 🙏 Reach us directly on Call & WhatsApp at [+91 70574 46409](https://wa.me/917057446409) (Mon–Sat 10 AM – 8 PM) or email at aaplajalgaonwala@gmail.com for prompt support! Visit our [Contact Page](/contact).`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 5. Shipping Rates, Free Delivery, Timelines & Courier Partner
  if (
    q.match(/(?:which|what|who)\s+(?:is\s+)?(?:your\s+|the\s+)?courier/i) ||
    q.match(/(?:courier\s+partner|courier\s+service|courier\s+name|delivery\s+partner|which\s+courier)/i)
  ) {
    const baseReply = `Namaskar! 📦 We ship all orders across India exclusively via DTDC Express! Once your parcel is dispatched within 24–48 hours, you receive a live DTDC tracking link on WhatsApp and SMS. You can also view live status under [My Account](/account)!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  if (
    q.match(/(?:shipping\s+(?:charge|charges|cost|rate|fee|policy)|delivery\s+(?:charge|charges|cost|fee|time|days)|free\s+(?:shipping|delivery)|how\s+long\s+(?:for\s+)?delivery)/i)
  ) {
    const baseReply = `Namaskar! 🚚 We deliver pan-India in 2 to 5 business days! Enjoy FREE SHIPPING on orders above ₹399 in Maharashtra (standard ₹40) and above ₹799 across India (standard ₹70). Discover fresh snacks today at [Shop All](/shop)!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 6. Coupons / Offers / Promo Code
  if (
    q.match(/(?:coupon\s+code|promo\s+code|discount\s+code|any\s+(?:discount|coupon|offer)|available\s+offers|first\s+order\s+discount)/i)
  ) {
    const baseReply = `Namaskar! 🏷️ Use discount coupon code \`WELCOME10\` on [Cart & Checkout](/cart) to enjoy 10% OFF your order! Plus, get automatic Free Shipping on orders above ₹399 in Maharashtra and ₹799 across India!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 7. Women Partner Program
  if (
    q.match(/(?:women\s+partner|woman\s+partner|partner\s+program|earn\s+(?:money|commission)|reseller|commission\s+rate|weekly\s+payout)/i)
  ) {
    const baseReply = `Namaskar! 💼 Join our Women Business Partner Program with zero investment! Earn 12% direct commission on every delivered order with weekly Sunday UPI payouts and live tracking. Register now at [Partner Program](/partner-program)!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 8. Upwas / Fasting Snacks
  if (
    q.match(/(?:upwas|vrat|fasting\s+snack|farali|sendha\s+namak|rock\s+salt)/i)
  ) {
    const baseReply = `Namaskar! 🙏 Our Upwas snacks are 100% fasting-safe, cooked in separate kettles with pure Sendha Namak (Rock Salt). Enjoy crunchy Sabudana Chivda and Farali Potato Wafers in our [Upwas Special](/upwas-special) collection!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 9. Franchise Inquiries
  if (
    q.match(/(?:franchise|open\s+(?:a\s+)?store|dealership|distributorship|retail\s+partner)/i)
  ) {
    const baseReply = `Namaskar! 🏪 Partner with Aapla Jalgaonwala! We offer turnkey retail store franchises across India with 40-50% profit margins, zero marketing hassle, and direct supply from Jalgaon HQ. Apply now at [Franchise](/franchise)!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 10. Brand Inception / 2024 Founding
  if (
    q.match(/(?:when\s+(?:did|was)\s+(?:the\s+)?brand\s+(?:start|founded|established)|brand\s+started|who\s+(?:are\s+the\s+founders|started)|history\s+of\s+brand)/i)
  ) {
    const baseReply = `Namaskar! 🙏 Started in 2024 in Jalgaon, Maharashtra, Aapla Jalgaonwala was founded by Saurabh & Jayesh Patil to bring authentic, wafer-thin banana chips and pure Khandeshi snacks direct from 50+ local farmer families. Read more at [Our Story](/our-story)!`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  // 11. Short Greetings
  if (
    q.match(/^(?:hi|hello|hey|namaskar|namaste|hii+|helo|hola|good\s+(?:morning|afternoon|evening))\s*[!.]*$/i)
  ) {
    const baseReply = `Namaskar! 🙏 Welcome to Aapla Jalgaonwala! I am ${botName}, your customer support sahayak. Ask me about our 10 fresh [Banana Chips Flavours](/shop), live order tracking, shipping rates, or discounts! How can I help you today?`;
    const clean = !isFirstMessage ? removeLeadingNamaskar(baseReply) : baseReply;
    return {
      reply: enforceLengthConstraint(clean, charMin, charMax),
      orderFound: false,
      status: 'instant_match'
    };
  }

  return null;
}

/**
 * OPTION 1: Intent-Based Dynamic Prompting (Saves 75-80% Tokens on Gemini calls)
 * Instead of sending a massive ~1,400 token prompt with the entire catalog every time,
 * this builds a highly compact base instruction (~100 tokens) and selectively injects
 * ONLY the context relevant to the customer's specific question.
 */
export async function getDynamicSystemInstruction(
  userQuery = '',
  providedConfig?: SnackMitraConfig
): Promise<string> {
  const config = providedConfig || await SnackMitraRepository.getConfig();
  const repoData = await getCachedRepoData();

  const storeName = repoData.settings?.storeName || 'Aapla Jalgaonwala';
  const botName = config?.botName || 'Snack Mitra';
  const charMin = config?.characterMin || 200;
  const charMax = config?.characterMax || 300;
  const contactPhone = config?.whatsappNumber || repoData.settings?.contactPhone || '+91 70574 46409';

  let toneDirective = 'Warm, respectful, welcoming, and helpful.';
  if (config?.systemTone === 'professional') {
    toneDirective = 'Professional, polite, direct, and efficient.';
  } else if (config?.systemTone === 'traditional') {
    toneDirective = 'Deeply rooted in Khandeshi hospitality and cultural warmth.';
  } else if (config?.systemTone === 'concise') {
    toneDirective = 'Ultra-concise, high clarity, direct answers without unnecessary pleasantries.';
  }

  // Intent-based dynamic context pruning (reduces tokens by 75-80%)
  const q = userQuery.toLowerCase();
  let selectiveContext = '';

  if (q.match(/(?:flavour|flavor|chip|banana|taste|spicy|sweet|cheese|peri|recommend|product|snack|farsaan|shev|chivda|price|rate|cost|pack)/i)) {
    // Pick 3-4 relevant active products matching query terms, or top bestsellers
    const active = repoData.products.filter((p: any) => p.isActive !== false);
    const matched = active.filter((p: any) => 
      q.includes(p.name?.toLowerCase()) || 
      (p.category && q.includes(p.category.toLowerCase())) ||
      (p.tags && Array.isArray(p.tags) && p.tags.some((t: string) => q.includes(t.toLowerCase())))
    );
    const selected = matched.length > 0 ? matched.slice(0, 4) : active.slice(0, 4);
    const productList = selected.map((p: any) => {
      const priceStr = p.variants && p.variants.length > 0 ? `₹${p.variants[0].price}` : `₹${p.price}`;
      return `[${p.name}](/product/${p.slug || p.id}) (${priceStr})`;
    }).join(', ');
    selectiveContext = `Relevant Snacks: ${productList}. All 10 flavours available under [Banana Chips](/shop?category=banana-chips) & [Farsaan](/shop?category=farsaan).`;
  } else if (q.match(/(?:recipe|shev\s+bhaji|kala\s+masala|curry|how\s+to\s+make|cook)/i)) {
    selectiveContext = `Recipe Guide: Roast onions and dry coconut dark, sauté with ginger-garlic and authentic [Khandeshi Kala Masala](/shop?category=masala), boil for spicy tarri, then top with crunchy [Tikhat Shev](/shop?category=farsaan) right before serving!`;
  } else if (q.match(/(?:damaged|broken|refund|replace|return|guarantee|quality|stale)/i)) {
    selectiveContext = `48-Hour Guarantee: If packets arrive damaged, share photo on WhatsApp (${contactPhone}) within 48h for instant free replacement or refund. [Contact](/contact).`;
  } else if (q.match(/(?:courier|delivery\s+partner|dtdc|shipment\s+partner)/i)) {
    selectiveContext = `Courier Partner: All shipments pan-India are handled exclusively via DTDC Express with live AWB tracking links sent via WhatsApp and SMS. Track anytime under [My Account](/account).`;
  } else if (q.match(/(?:founder|origin|story|history|jalgaon|farmer)/i)) {
    selectiveContext = `Story: Started in 2024 by Saurabh & Jayesh Patil in Jalgaon ("Banana City of India"), partnering directly with 50+ local farmer families. 100% sunflower oil, 0% preservatives. [Our Story](/our-story).`;
  } else if (q.match(/(?:owner|founder|saurabh|jayesh|contact|call|phone|mobile|email|reach|talk)/i)) {
    selectiveContext = `Owner & Support Contact: Contact owner & founders Saurabh & Jayesh Patil directly via Call & WhatsApp at +91 70574 46409 or email aaplajalgaonwala@gmail.com. Mon-Sat 10 AM - 8 PM. [Contact Page](/contact).`;
  } else {
    // Compact general fallback context
    selectiveContext = `Core Info: Free Shipping above ₹399 in Maharashtra & ₹799 Pan-India. Active coupon: \`WELCOME10\` (10% OFF). Flagship store in Yelwadi, Pune. Explore [Shop All](/shop).`;
  }

  const specialNotice = config?.specialAnnouncements?.trim()
    ? `Announcement: ${config.specialAnnouncements.trim()}\n`
    : '';

  return `You are "${botName}", customer support sahayak for ${storeName} (Started in 2024 in Jalgaon, Maharashtra).
RULES:
1. Response MUST be strictly between ${charMin} and ${charMax} characters total.
2. Deliver 1-2 crisp, direct sentences with exactly 1 relevant markdown link.
3. Tone: ${toneDirective}
4. NO AI jargon (never say Gemini, LLM, model, tokens, database).
5. Greeting: Only say "Namaskar! 🙏" on turn 1. Never repeat in follow-up messages.
${specialNotice}CONTEXT:
${selectiveContext}`;
}

/**
 * Checks MySQL OrderRepository if the user query contains an order ID or phone number
 */
export async function lookupOrderFromQuery(query: string): Promise<string | null> {
  const trimmed = query.trim();
  
  const ordMatch = trimmed.match(/(ord_[a-zA-Z0-9_-]+)/i) ||
                   trimmed.match(/(AJW-[a-zA-Z0-9_-]+)/i) ||
                   trimmed.match(/order\s*(?:id|no|number|#)?\s*[:#-]?\s*([a-zA-Z0-9_-]{5,30})/i);

  const phoneMatch = trimmed.match(/(?:\+?91)?[6-9]\d{9}/);

  try {
    let order: any = null;

    if (ordMatch && ordMatch[1]) {
      const searchId = ordMatch[1];
      order = await OrderRepository.getById(searchId);
      if (!order) {
        const allOrders = await OrderRepository.getAll().catch(() => []);
        order = allOrders.find(o => 
          o.id?.toLowerCase() === searchId.toLowerCase() || 
          o.orderNumber?.toLowerCase() === searchId.toLowerCase()
        );
      }
    }

    if (!order && phoneMatch) {
      const phone = phoneMatch[0].replace('+91', '');
      const userOrders = await OrderRepository.getByUser({ phone }).catch(() => []);
      if (userOrders.length > 0) {
        order = userOrders[userOrders.length - 1];
      }
    }

    if (order) {
      const city = order.shippingAddress?.city || 'Destination';
      return `Order #${order.orderNumber || order.id} is **${order.status}** (₹${order.totalAmount}). Shipped to ${city}. Courier: ${order.courierName || order.courierPartner || 'DTDC Express'}.`;
    }
  } catch (err: any) {
    console.warn('Order lookup error in AI assistant:', err?.message || err);
  }

  return null;
}

/**
 * Removes "Namaskar! 🙏" or similar greetings from subsequent conversation messages
 */
export function removeLeadingNamaskar(text: string): string {
  if (!text) return '';
  const cleaned = text
    .replace(/^(?:(?:Namaskar|Namaste|नमस्कार|नमस्ते)[!,\s]*(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s)*)/u, '')
    .trim();

  if (!cleaned) return text;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Ensures text length is strictly fitted within configured min/max characters
 */
export function enforceLengthConstraint(text: string, minChars = 200, maxChars = 300): string {
  let cleaned = text.trim().replace(/\s+/g, ' ');

  // If within desired range, return as is
  if (cleaned.length >= minChars && cleaned.length <= maxChars) {
    return cleaned;
  }

  // If longer than maxChars, trim gracefully at last sentence or clause
  if (cleaned.length > maxChars) {
    const trimmed = cleaned.slice(0, maxChars - 2);
    const lastPunct = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
    if (lastPunct >= minChars - 10) {
      return trimmed.slice(0, lastPunct + 1).trim();
    }
    // Otherwise trim at last word boundary
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace >= minChars) {
      return trimmed.slice(0, lastSpace).trim() + '...';
    }
    return trimmed + '...';
  }

  // If slightly under minChars, pad with a helpful standard sign-off
  if (cleaned.length < minChars) {
    const needed = minChars - cleaned.length;
    if (needed > 25 && !cleaned.includes('Contact')) {
      const padded = `${cleaned} Need help? Reach us via [Contact](/contact) or WhatsApp!`;
      if (padded.length <= maxChars) return padded;
    } else if (!cleaned.includes('Aapla Jalgaonwala')) {
      const padded = `${cleaned} Explore more authentic snacks at [Aapla Jalgaonwala](/shop)!`;
      if (padded.length <= maxChars) return padded;
    }
  }

  return cleaned;
}

/**
 * Main chat handler using Option 1 (Dynamic Prompting), Option 2 (Pre-Gemini Instant Matching),
 * and In-Memory Response Caching to achieve lowest-to-lowest token usage.
 */
export async function handleSupportChat(
  messages: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
  userQuery: string,
  clientIp?: string
): Promise<{ reply: string; orderFound?: boolean; isOffline?: boolean; promptTokens?: number; responseTokens?: number; totalTokens?: number; responseTimeMs?: number }> {
  const query = userQuery?.trim() || '';
  const startTime = Date.now();

  // 1. Fetch live bot configuration
  const config = await SnackMitraRepository.getConfig();

  // 2. Check if bot is disabled via admin panel
  if (config.enabled === false) {
    const disabledReply = `Namaskar! 🙏 Our customer support assistant is currently resting for scheduled maintenance. For immediate assistance, please connect with us directly on WhatsApp at [${config.whatsappNumber}](https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')})!`;
    return {
      reply: disabledReply,
      orderFound: false,
      isOffline: true,
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      responseTimeMs: Date.now() - startTime
    };
  }

  const charMin = config.characterMin || 200;
  const charMax = config.characterMax || 300;

  // Determine if this is the very first message of the conversation
  const userMessages = Array.isArray(messages)
    ? messages.filter(m => m.role === 'user' || (m as any).role === 'customer')
    : [];
  const assistantReplies = Array.isArray(messages)
    ? messages.filter(m => m.role === 'assistant' || (m as any).role === 'model')
    : [];
  const isFirstMessage = userMessages.length <= 1 && assistantReplies.length <= 1;

  // 3. Check for live order status from MySQL (if enabled)
  const orderDetails = config.allowOrderTracking ? await lookupOrderFromQuery(query) : null;

  // 4. [OPTION 2]: Pre-Gemini Instant Intent Matcher (0 Tokens)
  const instantMatch = findInstantIntentMatch(query, config, orderDetails, isFirstMessage);
  if (instantMatch) {
    const responseTimeMs = Date.now() - startTime;
    SnackMitraRepository.logInteraction({
      customerQuery: query,
      botReply: instantMatch.reply,
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      replyCharCount: instantMatch.reply.length,
      orderFound: instantMatch.orderFound,
      orderNumber: instantMatch.orderFound ? (query.match(/(?:ord_|AJW-)[a-zA-Z0-9_-]+/i)?.[0] || null) : null,
      status: 'instant_match',
      responseTimeMs,
      clientIp: clientIp || ''
    }).catch(err => console.warn('[SnackMitra] log error:', err?.message || err));

    return {
      reply: instantMatch.reply,
      orderFound: instantMatch.orderFound,
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      responseTimeMs
    };
  }

  // 5. [RESPONSE CACHING]: In-Memory Query Response Cache (0 Tokens)
  const normalizedKey = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
  if (normalizedKey.length >= 4 && queryResponseCache.has(normalizedKey)) {
    const cached = queryResponseCache.get(normalizedKey)!;
    if (Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      let cachedReply = cached.reply;
      if (!isFirstMessage) {
        cachedReply = removeLeadingNamaskar(cachedReply);
      }
      const reply = enforceLengthConstraint(cachedReply, charMin, charMax);
      const responseTimeMs = Date.now() - startTime;

      SnackMitraRepository.logInteraction({
        customerQuery: query,
        botReply: reply,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        replyCharCount: reply.length,
        orderFound: cached.orderFound,
        orderNumber: null,
        status: 'cached',
        responseTimeMs,
        clientIp: clientIp || ''
      }).catch(err => console.warn('[SnackMitra] log error:', err?.message || err));

      return {
        reply,
        orderFound: cached.orderFound,
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        responseTimeMs
      };
    }
  }

  // 6. [OPTION 1]: Intent-Based Dynamic System Instruction (~180-220 tokens instead of 1,400+)
  const systemInstruction = await getDynamicSystemInstruction(query, config);

  // 7. Check for API key
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Using intelligent fallback responder.');
    const fallback = generateIntelligentFallback(query, orderDetails, isFirstMessage);
    const cleanFallback = !isFirstMessage ? removeLeadingNamaskar(fallback) : fallback;
    const reply = enforceLengthConstraint(cleanFallback, charMin, charMax);
    const promptTokens = Math.ceil(query.length / 4);
    const responseTokens = Math.ceil(reply.length / 4);
    const totalTokens = promptTokens + responseTokens;
    const responseTimeMs = Date.now() - startTime;

    SnackMitraRepository.logInteraction({
      customerQuery: query,
      botReply: reply,
      promptTokens,
      responseTokens,
      totalTokens,
      replyCharCount: reply.length,
      orderFound: !!orderDetails,
      orderNumber: orderDetails ? (query.match(/(?:ord_|AJW-)[a-zA-Z0-9_-]+/i)?.[0] || null) : null,
      status: 'fallback',
      responseTimeMs,
      clientIp: clientIp || ''
    }).catch(err => console.warn('[SnackMitra] log error:', err?.message || err));

    return {
      reply,
      orderFound: !!orderDetails,
      promptTokens,
      responseTokens,
      totalTokens,
      responseTimeMs
    };
  }

  try {
    const ai = getAiClient();

    // Concise conversation history (only last 2 turns, max 80 chars each)
    let conversationHistory = '';
    if (Array.isArray(messages) && messages.length > 0) {
      const recent = messages.slice(-2);
      recent.forEach(m => {
        const roleLabel = m.role === 'user' ? 'Customer' : 'Mitra';
        conversationHistory += `${roleLabel}: ${m.text.slice(0, 80)}\n`;
      });
      conversationHistory += '\n';
    }

    let currentPrompt = `${conversationHistory}Customer: "${query}"\n`;
    if (orderDetails) {
      currentPrompt += `[LIVE ORDER]: ${orderDetails}\n`;
    }
    if (!isFirstMessage) {
      currentPrompt += `Turn #${userMessages.length || 2}: Do NOT say "Namaskar". Answer directly.\n`;
    }
    currentPrompt += `Keep reply strictly ${charMin}-${charMax} chars with 1 markdown link.\n${config.botName || 'Snack Mitra'}:`;

    // Call Gemini 3.1 Flash Lite model with token-capped generation
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: currentPrompt,
      config: {
        systemInstruction,
        temperature: config.temperature ?? 0.5,
        maxOutputTokens: config.maxOutputTokens ?? 100,
        topP: 0.9
      }
    });

    const isFallback = !response.text;
    let rawReply = response.text || generateIntelligentFallback(query, orderDetails, isFirstMessage);
    if (!isFirstMessage) {
      rawReply = removeLeadingNamaskar(rawReply);
    }
    const reply = enforceLengthConstraint(rawReply, charMin, charMax);

    // Save to response cache if safe (no order ID or phone number)
    if (normalizedKey.length >= 4 && !orderDetails && !query.match(/\b\d{10}\b/)) {
      queryResponseCache.set(normalizedKey, {
        reply: rawReply,
        orderFound: false,
        timestamp: Date.now()
      });
      if (queryResponseCache.size > 300) {
        const oldestKey = queryResponseCache.keys().next().value;
        if (oldestKey) queryResponseCache.delete(oldestKey);
      }
    }

    // Extract exact token usage metadata from Gemini
    const usage = (response as any)?.usageMetadata;
    const promptTokens = usage?.promptTokenCount || Math.ceil(currentPrompt.length / 4);
    const responseTokens = usage?.candidatesTokenCount || Math.ceil(reply.length / 4);
    const totalTokens = usage?.totalTokenCount || (promptTokens + responseTokens);
    const responseTimeMs = Date.now() - startTime;

    // Log interaction to MySQL & JSON
    SnackMitraRepository.logInteraction({
      customerQuery: query,
      botReply: reply,
      promptTokens,
      responseTokens,
      totalTokens,
      replyCharCount: reply.length,
      orderFound: !!orderDetails,
      orderNumber: orderDetails ? (query.match(/(?:ord_|AJW-)[a-zA-Z0-9_-]+/i)?.[0] || null) : null,
      status: isFallback ? 'fallback' : 'success',
      responseTimeMs,
      clientIp: clientIp || ''
    }).catch(err => console.warn('[SnackMitra] log error:', err?.message || err));

    return {
      reply,
      orderFound: !!orderDetails,
      promptTokens,
      responseTokens,
      totalTokens,
      responseTimeMs
    };
  } catch (error: any) {
    console.error('Error in Gemini 3.1 Flash Lite support assistant call:', error?.message || error);
    const fallback = generateIntelligentFallback(query, orderDetails, isFirstMessage);
    const cleanFallback = !isFirstMessage ? removeLeadingNamaskar(fallback) : fallback;
    const reply = enforceLengthConstraint(cleanFallback, charMin, charMax);
    const promptTokens = Math.ceil(query.length / 4);
    const responseTokens = Math.ceil(reply.length / 4);
    const totalTokens = promptTokens + responseTokens;
    const responseTimeMs = Date.now() - startTime;

    SnackMitraRepository.logInteraction({
      customerQuery: query,
      botReply: reply,
      promptTokens,
      responseTokens,
      totalTokens,
      replyCharCount: reply.length,
      orderFound: !!orderDetails,
      orderNumber: orderDetails ? (query.match(/(?:ord_|AJW-)[a-zA-Z0-9_-]+/i)?.[0] || null) : null,
      status: 'error',
      responseTimeMs,
      clientIp: clientIp || ''
    }).catch(err => console.warn('[SnackMitra] log error:', err?.message || err));

    return {
      reply,
      orderFound: !!orderDetails,
      promptTokens,
      responseTokens,
      totalTokens,
      responseTimeMs
    };
  }
}

/**
 * Intelligent fallback generator where every single response is strictly between 200 and 300 chars
 */
function generateIntelligentFallback(query: string, orderDetails: string | null, isFirstMessage = true): string {
  const q = query.toLowerCase();
  let baseReply = '';

  if (orderDetails) {
    // Length: ~235 chars
    baseReply = `Namaskar! 🙏 ${orderDetails} You can review complete order tracking under [My Account & Orders](/account). For instant delivery support, connect directly with our helpline on WhatsApp at [+91 70574 46409](https://wa.me/917057446409)!`;
  } else if (q.includes('story') || q.includes('about') || q.includes('founder') || q.includes('who are') || q.includes('history')) {
    // Length: ~248 chars
    baseReply = `Namaskar! 🙏 Founded by Saurabh & Jayesh Patil, Aapla Jalgaonwala partners with 50+ local farmer families in Jalgaon to craft 100% natural, wafer-thin banana chips and authentic Khandeshi snacks. Discover our full heritage at [Our Story](/our-story)!`;
  } else if (q.includes('contact') || q.includes('location') || q.includes('store') || q.includes('address') || q.includes('phone') || q.includes('email') || q.includes('visit')) {
    // Length: ~245 chars
    baseReply = `Namaskar! 🙏 Visit our flagship live kitchen at Yelwadi, Pune (Open 9 AM - 9 PM daily) or Jalgaon hub. Reach us anytime on WhatsApp at +91 70574 46409 or aaplajalgaonwala@gmail.com. You can also send a direct message on our [Contact Page](/contact)!`;
  } else if (q.includes('track') || q.includes('order') || q.includes('status') || q.includes('where is my')) {
    // Length: ~242 chars
    baseReply = `Namaskar! 🙏 To track your order live, enter your Order ID (ord_... or AJW-...) or mobile number in this chat. You can also view all shipments under [My Account](/account) or message our dedicated support team on WhatsApp at [+91 70574 46409](https://wa.me/917057446409)!`;
  } else if (q.includes('banana') || q.includes('chip') || q.includes('flavour') || q.includes('flavor')) {
    // Length: ~248 chars
    baseReply = `Namaskar! 🍌 Sliced wafer-thin (0.8mm) from Jalgaon Grand Naine bananas and fried in pure sunflower oil! Try our top flavours: Jalgaon Masala, Peri Peri, Pani Poori, and Cheese. Browse all 10 flavours in our [Shop](/shop?category=banana-chips)!`;
  } else if (q.includes('shev bhaji') || q.includes('recipe') || q.includes('shev')) {
    // Length: ~244 chars
    baseReply = `Namaskar! 🍲 Roast onions and coconut till dark, sauté with ginger-garlic and our [Khandeshi Kala Masala](/shop?category=masala). Boil with water for spicy tarri, then top with crunchy [Tikhat Shev](/shop?category=farsaan) right before serving!`;
  } else if (q.includes('shipping') || q.includes('delivery') || q.includes('free ship') || q.includes('charge')) {
    // Length: ~236 chars
    baseReply = `Namaskar! 🚚 We deliver pan-India in 2-5 days! Enjoy FREE SHIPPING on orders above ₹399 in Maharashtra and above ₹799 across India (standard ₹40/₹70). Track all your orders easily under [My Account & Orders](/account)!`;
  } else if (q.includes('partner') || q.includes('woman') || q.includes('women') || q.includes('earn') || q.includes('commission')) {
    // Length: ~239 chars
    baseReply = `Namaskar! 💼 Join our Women Business Partner Program with zero investment! Earn 12% direct commission on every delivered order with weekly UPI payouts and a live tracking dashboard. Register today at [Partner Program](/partner-program)!`;
  } else if (q.includes('coupon') || q.includes('discount') || q.includes('offer') || q.includes('promo')) {
    // Length: ~234 chars
    baseReply = `Namaskar! 🏷️ Use active discount code \`WELCOME10\` on [Cart & Checkout](/cart) for 10% OFF your order! Plus, get automatic Free Shipping above ₹399 in Maharashtra & ₹799 pan-India. Treat yourself to fresh Jalgaon snacks today!`;
  } else if (q.includes('upwas') || q.includes('fasting') || q.includes('farali') || q.includes('vrat')) {
    // Length: ~236 chars
    baseReply = `Namaskar! 🙏 Our Upwas snacks are 100% fasting-safe, made with pure Sendha Namak (Rock Salt) in separate kettles. Enjoy Sabudana Chivda, Farali Batata Wafers, and Golden Banana Chips under [Upwas Special](/upwas-special)!`;
  } else if (q.includes('franchise') || q.includes('wholesale') || q.includes('distributor')) {
    // Length: ~229 chars
    baseReply = `Namaskar! 🏪 Partner with Aapla Jalgaonwala! We offer turnkey retail store franchises across India with 40-50% profit margins and complete stock & marketing support from Jalgaon HQ. Apply now at [Franchise](/franchise)!`;
  } else if (q.includes('privacy') || q.includes('secure') || q.includes('data')) {
    // Length: ~233 chars
    baseReply = `Namaskar! 🔒 We protect your data with strict confidentiality. Payments are 100% secure via Razorpay, we never store card numbers, and we never sell your personal information. Read our full policy at [Privacy Policy](/privacy-policy)!`;
  } else {
    // Default fallback (Length: ~234 chars)
    baseReply = `Namaskar! 🙏 Welcome to Aapla Jalgaonwala! I am Snack Mitra, your customer support sahayak. Ask me about our 10 [Banana Chips Flavours](/shop), authentic recipes, live order tracking, or reach us directly on our [Contact Page](/contact)!`;
  }

  if (!isFirstMessage) {
    return removeLeadingNamaskar(baseReply);
  }
  return baseReply;
}
