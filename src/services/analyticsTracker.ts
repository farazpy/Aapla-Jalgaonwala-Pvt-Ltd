/**
 * Production Real-Time Analytics Client Tracker
 * Lightweight, non-blocking telemetry engine for live visitor tracking,
 * pageviews, custom actions, and conversion funnel milestones.
 */

// Generate UUID v4 format
function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let vid = localStorage.getItem('ajw_analytics_vid');
    if (!vid) {
      vid = generateId('vid');
      localStorage.setItem('ajw_analytics_vid', vid);
    }
    return vid;
  } catch {
    return 'anon_vid';
  }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = sessionStorage.getItem('ajw_analytics_sid');
    if (!sid) {
      sid = generateId('sid');
      sessionStorage.setItem('ajw_analytics_sid', sid);
    }
    return sid;
  } catch {
    return 'anon_sid';
  }
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (width >= 768 && width <= 1024)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle|opera mini|silk/i.test(ua) || width < 768) return 'mobile';
  return 'desktop';
}

interface TrackEventOptions {
  category?: string;
  targetId?: string;
  targetName?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// Queue for batching events if rapid
let eventQueue: any[] = [];
let queueTimeout: any = null;

function flushQueue() {
  if (eventQueue.length === 0) return;
  const payload = [...eventQueue];
  eventQueue = [];

  const body = JSON.stringify(payload);
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const success = navigator.sendBeacon('/api/analytics/track', blob);
    if (!success) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    }
  } else {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }
}

function scheduleFlush() {
  if (queueTimeout) clearTimeout(queueTimeout);
  queueTimeout = setTimeout(flushQueue, 300);
}

export class Analytics {
  private static lastPath: string = '';
  private static pageEnteredTime: number = Date.now();
  private static heartbeatInterval: any = null;

  /**
   * Track a Page View
   */
  static page(path?: string, title?: string) {
    if (typeof window === 'undefined') return;
    const currentPath = path || window.location.pathname + window.location.search;
    const currentTitle = title || document.title;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const referrer = document.referrer;
    const now = Date.now();

    // Calculate duration on previous page
    const durationSeconds = this.lastPath ? Math.max(1, Math.round((now - this.pageEnteredTime) / 1000)) : 0;
    this.lastPath = currentPath;
    this.pageEnteredTime = now;

    eventQueue.push({
      type: 'pageview',
      sessionId,
      visitorId,
      path: currentPath,
      title: currentTitle,
      referrer,
      deviceType: getDeviceType(),
      durationSeconds
    });

    scheduleFlush();
  }

  /**
   * Track Custom Action or Defined Event
   */
  static track(eventName: string, options: TrackEventOptions = {}) {
    if (typeof window === 'undefined') return;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const currentPath = window.location.pathname + window.location.search;

    eventQueue.push({
      type: 'event',
      sessionId,
      visitorId,
      eventName,
      eventCategory: options.category || 'engagement',
      path: currentPath,
      targetId: options.targetId,
      targetName: options.targetName,
      value: options.value,
      metadata: options.metadata,
      deviceType: getDeviceType()
    });

    scheduleFlush();
  }

  /**
   * Send heartbeat to keep real-time visitor online in server
   */
  static heartbeat() {
    if (typeof window === 'undefined') return;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const currentPath = window.location.pathname + window.location.search;

    fetch('/api/analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        path: currentPath,
        deviceType: getDeviceType()
      }),
      keepalive: true
    }).catch(() => {});
  }

  /**
   * Start automated background heartbeat (every 15 seconds)
   */
  static startHeartbeat(intervalMs = 15000) {
    if (typeof window === 'undefined') return;
    this.heartbeat();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.heartbeat();
      }
    }, intervalMs);

    // Heartbeat on visibility gain
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.heartbeat();
      }
    });

    // Flush any pending events on unload
    window.addEventListener('beforeunload', () => {
      flushQueue();
    });
  }

  // --- E-Commerce Conversion Funnel Helper Methods ---

  static trackViewItem(product: { id: string; name: string; price: number; category?: string }) {
    this.track('view_item', {
      category: 'ecommerce',
      targetId: product.id,
      targetName: product.name,
      value: product.price,
      metadata: { category: product.category }
    });
  }

  static trackAddToCart(product: { id: string; name: string; price: number; quantity?: number }) {
    this.track('add_to_cart', {
      category: 'ecommerce',
      targetId: product.id,
      targetName: product.name,
      value: (product.price || 0) * (product.quantity || 1),
      metadata: { quantity: product.quantity || 1 }
    });
  }

  static trackRemoveFromCart(product: { id: string; name: string; price?: number }) {
    this.track('remove_from_cart', {
      category: 'ecommerce',
      targetId: product.id,
      targetName: product.name,
      value: product.price
    });
  }

  static trackInitiateCheckout(cartTotal: number, itemCount: number) {
    this.track('initiate_checkout', {
      category: 'ecommerce',
      targetName: 'Shopping Cart Checkout',
      value: cartTotal,
      metadata: { itemCount }
    });
  }

  static trackPurchaseComplete(order: {
    orderId: string;
    totalAmount: number;
    paymentMethod?: string;
    itemsCount?: number;
    referralCode?: string;
  }) {
    this.track('purchase_complete', {
      category: 'ecommerce',
      targetId: order.orderId,
      targetName: `Order #${order.orderId}`,
      value: order.totalAmount,
      metadata: {
        paymentMethod: order.paymentMethod,
        itemsCount: order.itemsCount,
        referralCode: order.referralCode
      }
    });
  }

  static trackSearch(query: string, resultsCount?: number) {
    this.track('search', {
      category: 'search',
      targetName: query,
      value: resultsCount,
      metadata: { query, resultsCount }
    });
  }

  static trackCouponApply(code: string, success: boolean, discountAmount?: number) {
    this.track('apply_coupon', {
      category: 'promotions',
      targetName: code,
      value: discountAmount,
      metadata: { code, success }
    });
  }

  static trackPartnerReferralVisit(partnerCode: string) {
    this.track('partner_referral_visit', {
      category: 'partners',
      targetName: partnerCode,
      metadata: { partnerCode }
    });
  }

  static trackClick(buttonLabel: string, category = 'user_action') {
    this.track('click_action', {
      category,
      targetName: buttonLabel
    });
  }
}
