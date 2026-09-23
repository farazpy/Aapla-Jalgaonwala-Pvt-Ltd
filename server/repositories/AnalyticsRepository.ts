import { getDbPool } from '../database/connection';
import { readJson, writeJson } from '../utils/jsonStorage';
import { OrderRepository } from './OrderRepository';
import { ProductRepository } from './ProductRepository';

export interface SiteSession {
  id: string;
  sessionId: string;
  visitorId: string;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
  referrer?: string;
  referrerDomain?: string;
  landingPage: string;
  exitPage?: string;
  pageViewsCount: number;
  eventsCount: number;
  durationSeconds: number;
  isBounce: boolean;
  hasCartAdd: boolean;
  hasCheckout: boolean;
  hasConverted: boolean;
  orderId?: string;
  orderAmount?: number;
  startedAt: string;
  lastActiveAt: string;
}

export interface SitePageview {
  id: string;
  sessionId: string;
  visitorId: string;
  path: string;
  title?: string;
  referrer?: string;
  durationSeconds?: number;
  createdAt: string;
}

export interface SiteEvent {
  id: string;
  sessionId: string;
  visitorId: string;
  eventName: string;
  eventCategory: string;
  path: string;
  targetId?: string;
  targetName?: string;
  value?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AnalyticsDashboardData {
  timeRange: string;
  generatedAt: string;
  realtime: {
    activeNow: number;
    activePages: { path: string; count: number }[];
    deviceBreakdown: { mobile: number; desktop: number; tablet: number };
    recentActiveVisitors: {
      visitorId: string;
      sessionId: string;
      deviceType: string;
      currentPath: string;
      lastActiveSecondsAgo: number;
      city?: string;
    }[];
  };
  kpis: {
    totalPageviews: number;
    uniqueVisitors: number;
    totalSessions: number;
    returningVisitorsCount: number;
    returningVisitorsPercent: number;
    bounceRatePercent: number;
    avgSessionDurationSeconds: number;
    avgSessionDurationFormatted: string;
    cartAdditionsCount: number;
    checkoutInitiationsCount: number;
    completedCheckoutsCount: number;
    abandonedCheckoutsCount: number;
    cartToCheckoutPercent: number;
    checkoutConversionPercent: number;
    overallConversionPercent: number;
    totalRevenue: number;
    totalProfit: number;
  };
  timeSeries: {
    date: string;
    label: string;
    pageviews: number;
    visitors: number;
    sessions: number;
    checkouts: number;
    orders: number;
    revenue: number;
  }[];
  funnel: {
    stepIndex: number;
    name: string;
    description: string;
    count: number;
    conversionFromPreviousPercent: number;
    dropoffFromPreviousPercent: number;
    overallFunnelPercent: number;
  }[];
  topPages: {
    path: string;
    title: string;
    views: number;
    uniqueVisitors: number;
    avgTimeOnPageSeconds: number;
    bounceRatePercent: number;
    exitRatePercent: number;
  }[];
  recentActivity: {
    id: string;
    sessionId: string;
    visitorId: string;
    eventName: string;
    eventCategory: string;
    path: string;
    targetName?: string;
    value?: number;
    deviceType: string;
    city?: string;
    createdAt: string;
    timeAgo: string;
  }[];
  topEvents: {
    eventName: string;
    eventCategory: string;
    totalCount: number;
    uniqueUsers: number;
    percentageOfSessions: number;
  }[];
  trafficSources: {
    source: string;
    count: number;
    percent: number;
  }[];
  deviceStats: {
    device: string;
    count: number;
    percent: number;
  }[];
  topBrowsers: {
    browser: string;
    count: number;
    percent: number;
  }[];
}

const SESSIONS_FILE = 'analytics_sessions.json';
const PAGEVIEWS_FILE = 'analytics_pageviews.json';
const EVENTS_FILE = 'analytics_events.json';

// High-speed In-Memory Ring Buffer Cache for Instant Real-Time Serving
const MAX_MEMORY_EVENTS = 5000;
const MAX_MEMORY_PAGEVIEWS = 5000;
const MAX_MEMORY_SESSIONS = 2000;

let memorySessions: SiteSession[] = [];
let memoryPageviews: SitePageview[] = [];
let memoryEvents: SiteEvent[] = [];
let isLoadedFromDisk = false;

// Active visitor heartbeats tracking map (visitorId -> { lastActive: timestamp, sessionId, path, device, city })
const activeHeartbeats = new Map<
  string,
  { lastActive: number; sessionId: string; path: string; device: 'mobile' | 'desktop' | 'tablet'; city?: string }
>();

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const diffMs = now - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function parseDeviceFromUserAgent(ua?: string): 'mobile' | 'desktop' | 'tablet' {
  if (!ua) return 'desktop';
  const cleanUa = ua.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(cleanUa)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle|opera mini|silk/i.test(cleanUa)) return 'mobile';
  return 'desktop';
}

function parseBrowserFromUserAgent(ua?: string): string {
  if (!ua) return 'Unknown';
  const cleanUa = ua.toLowerCase();
  if (cleanUa.includes('edg/')) return 'Edge';
  if (cleanUa.includes('chrome/')) return 'Chrome';
  if (cleanUa.includes('safari/') && !cleanUa.includes('chrome')) return 'Safari';
  if (cleanUa.includes('firefox/')) return 'Firefox';
  if (cleanUa.includes('opera') || cleanUa.includes('opr/')) return 'Opera';
  return 'Other Browser';
}

function classifyTrafficSource(referrer?: string, landingPage?: string): string {
  if (!referrer || referrer === '' || referrer === 'direct') {
    if (landingPage && landingPage.includes('ref=')) return 'Partner Referral';
    return 'Direct';
  }
  const ref = referrer.toLowerCase();
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('facebook') || ref.includes('fb.com')) return 'Facebook';
  if (ref.includes('google')) return 'Google Search';
  if (ref.includes('bing') || ref.includes('yahoo') || ref.includes('duckduckgo')) return 'Other Search';
  if (ref.includes('youtube')) return 'YouTube';
  if (ref.includes('twitter') || ref.includes('x.com')) return 'X / Twitter';
  if (ref.includes('aaplajalgaonwala.com') || ref.includes('localhost') || ref.includes('127.0.0.1')) return 'Direct';
  return 'External Referral';
}

export class AnalyticsRepository {
  private static async ensureLoaded() {
    if (isLoadedFromDisk) return;
    try {
      const [diskSessions, diskPageviews, diskEvents] = await Promise.all([
        readJson<SiteSession[]>(SESSIONS_FILE, []),
        readJson<SitePageview[]>(PAGEVIEWS_FILE, []),
        readJson<SiteEvent[]>(EVENTS_FILE, [])
      ]);
      memorySessions = Array.isArray(diskSessions) ? diskSessions : [];
      memoryPageviews = Array.isArray(diskPageviews) ? diskPageviews : [];
      memoryEvents = Array.isArray(diskEvents) ? diskEvents : [];
      isLoadedFromDisk = true;
    } catch {
      isLoadedFromDisk = true;
    }
  }

  private static async persistToDisk() {
    try {
      await Promise.allSettled([
        writeJson(SESSIONS_FILE, memorySessions.slice(-MAX_MEMORY_SESSIONS)),
        writeJson(PAGEVIEWS_FILE, memoryPageviews.slice(-MAX_MEMORY_PAGEVIEWS)),
        writeJson(EVENTS_FILE, memoryEvents.slice(-MAX_MEMORY_EVENTS))
      ]);
    } catch (_) {}
  }

  /**
   * Heartbeat ping to register / refresh active user in real-time
   */
  static async recordHeartbeat(data: {
    visitorId: string;
    sessionId: string;
    path: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    city?: string;
  }) {
    if (!data.visitorId || !data.sessionId) return;
    const now = Date.now();
    activeHeartbeats.set(data.visitorId, {
      lastActive: now,
      sessionId: data.sessionId,
      path: data.path || '/',
      device: data.deviceType || 'desktop',
      city: data.city
    });

    // Update memory session last active
    await this.ensureLoaded();
    const session = memorySessions.find((s) => s.sessionId === data.sessionId);
    if (session) {
      const started = new Date(session.startedAt).getTime();
      session.lastActiveAt = new Date(now).toISOString();
      session.durationSeconds = Math.max(0, Math.floor((now - started) / 1000));
      if (data.path) session.exitPage = data.path;
    }
  }

  /**
   * Track Page View Event
   */
  static async trackPageview(data: {
    sessionId: string;
    visitorId: string;
    path: string;
    title?: string;
    referrer?: string;
    userAgent?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    city?: string;
    country?: string;
    userId?: string;
    durationSeconds?: number;
  }): Promise<SitePageview> {
    await this.ensureLoaded();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const deviceType = data.deviceType || parseDeviceFromUserAgent(data.userAgent);
    const browser = parseBrowserFromUserAgent(data.userAgent);

    // 1. Maintain / Update Session
    let session = memorySessions.find((s) => s.sessionId === data.sessionId);
    if (!session) {
      session = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        userId: data.userId,
        userAgent: data.userAgent,
        deviceType,
        browser,
        city: data.city || 'Maharashtra',
        country: data.country || 'India',
        referrer: data.referrer,
        referrerDomain: data.referrer ? classifyTrafficSource(data.referrer, data.path) : 'Direct',
        landingPage: data.path || '/',
        exitPage: data.path || '/',
        pageViewsCount: 1,
        eventsCount: 0,
        durationSeconds: 0,
        isBounce: true,
        hasCartAdd: false,
        hasCheckout: false,
        hasConverted: false,
        startedAt: nowIso,
        lastActiveAt: nowIso
      };
      memorySessions.push(session);
      if (memorySessions.length > MAX_MEMORY_SESSIONS) {
        memorySessions.shift();
      }
    } else {
      session.pageViewsCount += 1;
      session.exitPage = data.path || session.exitPage;
      session.lastActiveAt = nowIso;
      if (session.pageViewsCount > 1) {
        session.isBounce = false;
      }
      const started = new Date(session.startedAt).getTime();
      session.durationSeconds = Math.max(0, Math.floor((nowMs - started) / 1000));
    }

    // 2. Track Pageview Record
    const pageview: SitePageview = {
      id: `pv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      path: data.path || '/',
      title: data.title,
      referrer: data.referrer,
      durationSeconds: data.durationSeconds || 0,
      createdAt: nowIso
    };

    memoryPageviews.push(pageview);
    if (memoryPageviews.length > MAX_MEMORY_PAGEVIEWS) {
      memoryPageviews.shift();
    }

    // 3. Update Real-Time Active Heartbeat
    activeHeartbeats.set(data.visitorId, {
      lastActive: nowMs,
      sessionId: data.sessionId,
      path: data.path || '/',
      device: deviceType,
      city: data.city
    });

    // 4. Async MySQL insert if connected
    const pool = getDbPool();
    if (pool) {
      (async () => {
        try {
          // Upsert session in MySQL
          await pool.query(
            `INSERT INTO site_sessions (
              id, session_id, visitor_id, user_id, user_agent, device_type, browser,
              city, country, referrer, referrer_domain, landing_page, exit_page,
              page_views_count, events_count, duration_seconds, is_bounce, started_at, last_active_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              page_views_count = page_views_count + 1,
              exit_page = VALUES(exit_page),
              is_bounce = VALUES(is_bounce),
              duration_seconds = VALUES(duration_seconds),
              last_active_at = VALUES(last_active_at)`,
            [
              session!.id,
              session!.sessionId,
              session!.visitorId,
              session!.userId || null,
              session!.userAgent || null,
              session!.deviceType,
              session!.browser || null,
              session!.city || null,
              session!.country || null,
              session!.referrer || null,
              session!.referrerDomain || 'Direct',
              session!.landingPage,
              session!.exitPage,
              session!.pageViewsCount,
              session!.eventsCount,
              session!.durationSeconds,
              session!.isBounce ? 1 : 0,
              session!.startedAt,
              session!.lastActiveAt
            ]
          );

          // Insert pageview in MySQL
          await pool.query(
            `INSERT INTO site_pageviews (id, session_id, visitor_id, path, title, referrer, duration_seconds, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pageview.id,
              pageview.sessionId,
              pageview.visitorId,
              pageview.path,
              pageview.title || null,
              pageview.referrer || null,
              pageview.durationSeconds || 0,
              pageview.createdAt
            ]
          );
        } catch (_) {}
      })();
    }

    this.persistToDisk();
    return pageview;
  }

  /**
   * Track Custom Action or Defined Event
   */
  static async trackEvent(data: {
    sessionId: string;
    visitorId: string;
    eventName: string;
    eventCategory?: string;
    path: string;
    targetId?: string;
    targetName?: string;
    value?: number;
    metadata?: Record<string, any>;
    userAgent?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  }): Promise<SiteEvent> {
    await this.ensureLoaded();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const event: SiteEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      eventName: data.eventName,
      eventCategory: data.eventCategory || 'engagement',
      path: data.path || '/',
      targetId: data.targetId,
      targetName: data.targetName,
      value: data.value,
      metadata: data.metadata,
      createdAt: nowIso
    };

    memoryEvents.push(event);
    if (memoryEvents.length > MAX_MEMORY_EVENTS) {
      memoryEvents.shift();
    }

    // Update Session with Event specifics
    const session = memorySessions.find((s) => s.sessionId === data.sessionId);
    if (session) {
      session.eventsCount += 1;
      session.lastActiveAt = nowIso;
      session.isBounce = false;

      if (data.eventName === 'add_to_cart') {
        session.hasCartAdd = true;
      } else if (data.eventName === 'initiate_checkout' || data.eventName === 'begin_checkout') {
        session.hasCheckout = true;
      } else if (data.eventName === 'purchase_complete' || data.eventName === 'order_success') {
        session.hasConverted = true;
        if (data.targetId) session.orderId = data.targetId;
        if (data.value) session.orderAmount = data.value;
      }
    }

    // Refresh active heartbeat
    activeHeartbeats.set(data.visitorId, {
      lastActive: nowMs,
      sessionId: data.sessionId,
      path: data.path || '/',
      device: data.deviceType || (session?.deviceType || 'desktop')
    });

    // Async MySQL insert
    const pool = getDbPool();
    if (pool) {
      (async () => {
        try {
          await pool.query(
            `INSERT INTO site_events (id, session_id, visitor_id, event_name, event_category, path, target_id, target_name, value, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              event.id,
              event.sessionId,
              event.visitorId,
              event.eventName,
              event.eventCategory,
              event.path,
              event.targetId || null,
              event.targetName || null,
              event.value || 0,
              event.metadata ? JSON.stringify(event.metadata) : null,
              event.createdAt
            ]
          );

          if (session) {
            await pool.query(
              `UPDATE site_sessions SET
                events_count = events_count + 1,
                has_checkout = ?,
                has_converted = ?,
                order_id = ?,
                order_amount = ?,
                last_active_at = ?
              WHERE session_id = ?`,
              [
                session.hasCheckout ? 1 : 0,
                session.hasConverted ? 1 : 0,
                session.orderId || null,
                session.orderAmount || 0,
                session.lastActiveAt,
                session.sessionId
              ]
            );
          }
        } catch (_) {}
      })();
    }

    this.persistToDisk();
    return event;
  }

  /**
   * Helper to determine start and end timestamps from timeRange
   */
  private static parseTimeRangeBounds(timeRange: string, customStart?: string, customEnd?: string): { start: Date; end: Date; interval: 'hour' | 'day' } {
    const now = new Date();
    const end = new Date(now.getTime());

    if (timeRange === 'yesterday') {
      const yStart = new Date(now);
      yStart.setDate(yStart.getDate() - 1);
      yStart.setHours(0, 0, 0, 0);

      const yEnd = new Date(now);
      yEnd.setDate(yEnd.getDate() - 1);
      yEnd.setHours(23, 59, 59, 999);
      return { start: yStart, end: yEnd, interval: 'hour' };
    }

    if (timeRange === 'today') {
      const tStart = new Date(now);
      tStart.setHours(0, 0, 0, 0);
      return { start: tStart, end, interval: 'hour' };
    }

    if (timeRange === '7d' || timeRange === '7days') {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      s.setHours(0, 0, 0, 0);
      return { start: s, end, interval: 'day' };
    }

    if (timeRange === '30d' || timeRange === '30days' || timeRange === 'month') {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      s.setHours(0, 0, 0, 0);
      return { start: s, end, interval: 'day' };
    }

    if (timeRange === 'custom' && customStart) {
      const s = new Date(customStart);
      const e = customEnd ? new Date(customEnd) : new Date(now);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      const daysDiff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
      return { start: s, end: e, interval: daysDiff <= 2 ? 'hour' : 'day' };
    }

    // Default 7 days
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    s.setHours(0, 0, 0, 0);
    return { start: s, end, interval: 'day' };
  }

  /**
   * Unified Dashboard Query: aggregates all real production metrics without any fake or demo data
   */
  static async getDashboardAnalytics(params: {
    timeRange?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsDashboardData> {
    await this.ensureLoaded();
    const timeRange = params.timeRange || '7d';
    const { start, end, interval } = this.parseTimeRangeBounds(timeRange, params.startDate, params.endDate);
    const startTimeMs = start.getTime();
    const endTimeMs = end.getTime();

    // Fetch real production orders from OrderRepository to correlate true purchases & revenue
    let allOrders: any[] = [];
    try {
      allOrders = await OrderRepository.getAll();
    } catch (_) {
      allOrders = [];
    }

    // Filter real orders in time range
    const rangeOrders = allOrders.filter((o) => {
      const created = new Date(o.createdAt || o.created_at).getTime();
      return created >= startTimeMs && created <= endTimeMs;
    });

    // 1. Calculate Real-Time Active Users (Within last 3 minutes / 180 seconds)
    const nowMs = Date.now();
    const threeMinsAgo = nowMs - 3 * 60 * 1000;
    const activeVisitorsList: {
      visitorId: string;
      sessionId: string;
      deviceType: string;
      currentPath: string;
      lastActiveSecondsAgo: number;
      city?: string;
    }[] = [];

    const activePageCounts: Record<string, number> = {};
    const activeDeviceCounts = { mobile: 0, desktop: 0, tablet: 0 };

    activeHeartbeats.forEach((hb, visitorId) => {
      if (hb.lastActive >= threeMinsAgo) {
        const secAgo = Math.max(0, Math.floor((nowMs - hb.lastActive) / 1000));
        activeVisitorsList.push({
          visitorId: visitorId.substring(0, 12) + '...',
          sessionId: hb.sessionId,
          deviceType: hb.device,
          currentPath: hb.path,
          lastActiveSecondsAgo: secAgo,
          city: hb.city || 'Live Visitor'
        });
        activePageCounts[hb.path] = (activePageCounts[hb.path] || 0) + 1;
        if (hb.device === 'mobile') activeDeviceCounts.mobile += 1;
        else if (hb.device === 'tablet') activeDeviceCounts.tablet += 1;
        else activeDeviceCounts.desktop += 1;
      } else {
        // Clean up stale heartbeats older than 10 minutes
        if (hb.lastActive < nowMs - 10 * 60 * 1000) {
          activeHeartbeats.delete(visitorId);
        }
      }
    });

    // 2. Filter Filtered Data Collections
    const filteredSessions = memorySessions.filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return t >= startTimeMs && t <= endTimeMs;
    });

    const filteredPageviews = memoryPageviews.filter((p) => {
      const t = new Date(p.createdAt).getTime();
      return t >= startTimeMs && t <= endTimeMs;
    });

    const filteredEvents = memoryEvents.filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return t >= startTimeMs && t <= endTimeMs;
    });

    // 3. Compute KPI Summary
    const totalPageviews = filteredPageviews.length;
    const uniqueVisitorsSet = new Set<string>();
    filteredSessions.forEach((s) => uniqueVisitorsSet.add(s.visitorId));
    filteredPageviews.forEach((p) => uniqueVisitorsSet.add(p.visitorId));
    const uniqueVisitors = uniqueVisitorsSet.size;

    const totalSessions = filteredSessions.length;

    // Check returning visitors (visitorIds that appeared in more than 1 session ever)
    const visitorSessionCounts = new Map<string, number>();
    memorySessions.forEach((s) => {
      visitorSessionCounts.set(s.visitorId, (visitorSessionCounts.get(s.visitorId) || 0) + 1);
    });

    let returningCount = 0;
    uniqueVisitorsSet.forEach((vId) => {
      if ((visitorSessionCounts.get(vId) || 0) > 1) {
        returningCount += 1;
      }
    });
    const returningVisitorsPercent = uniqueVisitors > 0 ? Math.round((returningCount / uniqueVisitors) * 100) : 0;

    // Bounces
    const bounces = filteredSessions.filter((s) => s.isBounce || s.pageViewsCount <= 1).length;
    const bounceRatePercent = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;

    // Duration
    const totalDuration = filteredSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const avgSessionDurationSeconds = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const avgSessionDurationFormatted = formatDuration(avgSessionDurationSeconds);

    // E-commerce Events & Funnel Numbers
    const cartAddEvents = filteredEvents.filter((e) => e.eventName === 'add_to_cart');
    const checkoutInitEvents = filteredEvents.filter(
      (e) => e.eventName === 'initiate_checkout' || e.eventName === 'begin_checkout' || e.path === '/checkout'
    );
    const completedOrdersFromEvents = filteredEvents.filter(
      (e) => e.eventName === 'purchase_complete' || e.eventName === 'order_success'
    );

    const cartAdditionsCount = cartAddEvents.length;
    const checkoutInitiationsCount = Math.max(
      checkoutInitEvents.length,
      filteredSessions.filter((s) => s.hasCheckout || s.landingPage === '/checkout' || s.exitPage === '/checkout').length
    );

    const realOrdersCount = rangeOrders.length;
    const completedCheckoutsCount = Math.max(completedOrdersFromEvents.length, realOrdersCount);
    const abandonedCheckoutsCount = Math.max(0, checkoutInitiationsCount - completedCheckoutsCount);

    const cartToCheckoutPercent = cartAdditionsCount > 0 ? Math.round((checkoutInitiationsCount / cartAdditionsCount) * 100) : 0;
    const checkoutConversionPercent =
      checkoutInitiationsCount > 0 ? Math.min(100, Math.round((completedCheckoutsCount / checkoutInitiationsCount) * 100)) : 0;
    const overallConversionPercent =
      totalSessions > 0 ? Number(((completedCheckoutsCount / totalSessions) * 100).toFixed(1)) : 0;

    const totalRevenue = rangeOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total_amount) || 0), 0);

    const allProducts = await ProductRepository.getAll(true);
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    let totalProfit = 0;
    for (const order of rangeOrders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = Number(item.quantity) || 1;
          const itemProfit = item.profit !== undefined && item.profit !== null && Number(item.profit) > 0
            ? Number(item.profit)
            : Number(productMap.get(item.productId)?.profit || 0);
          totalProfit += (qty * itemProfit);
        }
      }
    }

    // 4. Build Time-Series Trend Charts
    const timeSeriesMap = new Map<
      string,
      { label: string; pageviews: number; visitors: Set<string>; sessions: number; checkouts: number; orders: number; revenue: number }
    >();

    if (interval === 'hour') {
      // 24 Hour Slots
      for (let h = 0; h < 24; h++) {
        const slotKey = `${String(h).padStart(2, '0')}:00`;
        timeSeriesMap.set(slotKey, {
          label: `${slotKey}`,
          pageviews: 0,
          visitors: new Set(),
          sessions: 0,
          checkouts: 0,
          orders: 0,
          revenue: 0
        });
      }

      filteredPageviews.forEach((p) => {
        const d = new Date(p.createdAt);
        const slotKey = `${String(d.getHours()).padStart(2, '0')}:00`;
        const slot = timeSeriesMap.get(slotKey);
        if (slot) {
          slot.pageviews += 1;
          slot.visitors.add(p.visitorId);
        }
      });

      filteredSessions.forEach((s) => {
        const d = new Date(s.startedAt);
        const slotKey = `${String(d.getHours()).padStart(2, '0')}:00`;
        const slot = timeSeriesMap.get(slotKey);
        if (slot) {
          slot.sessions += 1;
          slot.visitors.add(s.visitorId);
          if (s.hasCheckout) slot.checkouts += 1;
        }
      });

      rangeOrders.forEach((o) => {
        const d = new Date(o.createdAt || o.created_at);
        const slotKey = `${String(d.getHours()).padStart(2, '0')}:00`;
        const slot = timeSeriesMap.get(slotKey);
        if (slot) {
          slot.orders += 1;
          slot.revenue += Number(o.totalAmount || o.total_amount) || 0;
        }
      });
    } else {
      // Day by Day Slots
      const curr = new Date(start);
      while (curr.getTime() <= end.getTime()) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const day = String(curr.getDate()).padStart(2, '0');
        const slotKey = `${y}-${m}-${day}`;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const label = `${curr.getDate()} ${months[curr.getMonth()]}`;

        timeSeriesMap.set(slotKey, {
          label,
          pageviews: 0,
          visitors: new Set(),
          sessions: 0,
          checkouts: 0,
          orders: 0,
          revenue: 0
        });
        curr.setDate(curr.getDate() + 1);
      }

      filteredPageviews.forEach((p) => {
        const slotKey = p.createdAt.split('T')[0];
        const slot = timeSeriesMap.get(slotKey);
        if (slot) {
          slot.pageviews += 1;
          slot.visitors.add(p.visitorId);
        }
      });

      filteredSessions.forEach((s) => {
        const slotKey = s.startedAt.split('T')[0];
        const slot = timeSeriesMap.get(slotKey);
        if (slot) {
          slot.sessions += 1;
          slot.visitors.add(s.visitorId);
          if (s.hasCheckout) slot.checkouts += 1;
        }
      });

      rangeOrders.forEach((o) => {
        const rawDate = o.createdAt || o.created_at;
        const slotKey = new Date(rawDate).toISOString().split('T')[0];
        const slot = timeSeriesMap.get(slotKey);
        if (slot) {
          slot.orders += 1;
          slot.revenue += Number(o.totalAmount || o.total_amount) || 0;
        }
      });
    }

    const timeSeries = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
      date,
      label: data.label,
      pageviews: data.pageviews,
      visitors: data.visitors.size,
      sessions: data.sessions,
      checkouts: data.checkouts,
      orders: data.orders,
      revenue: Math.round(data.revenue)
    }));

    // 5. Conversion Funnel Calculation (100% Real Funnel Progression)
    // Step 1: All Visitors (unique sessions)
    const funnelStep1Count = Math.max(totalSessions, uniqueVisitors);

    // Step 2: Catalog / Product Engagement
    const productEngagedSessions = new Set<string>();
    filteredPageviews.forEach((p) => {
      if (p.path.startsWith('/product') || p.path.startsWith('/shop') || p.path.startsWith('/categories')) {
        productEngagedSessions.add(p.sessionId);
      }
    });
    filteredEvents.forEach((e) => {
      if (e.eventName === 'view_item' || e.eventName === 'search') {
        productEngagedSessions.add(e.sessionId);
      }
    });
    const funnelStep2Count = Math.min(funnelStep1Count, productEngagedSessions.size);

    // Step 3: Added to Cart
    const cartSessions = new Set<string>();
    filteredEvents.forEach((e) => {
      if (e.eventName === 'add_to_cart') cartSessions.add(e.sessionId);
    });
    filteredPageviews.forEach((p) => {
      if (p.path === '/cart') cartSessions.add(p.sessionId);
    });
    const funnelStep3Count = Math.min(Math.max(cartSessions.size, cartAdditionsCount), funnelStep1Count);

    // Step 4: Checkout Initiated
    const checkoutSessions = new Set<string>();
    filteredEvents.forEach((e) => {
      if (e.eventName === 'initiate_checkout' || e.eventName === 'begin_checkout') checkoutSessions.add(e.sessionId);
    });
    filteredPageviews.forEach((p) => {
      if (p.path === '/checkout') checkoutSessions.add(p.sessionId);
    });
    filteredSessions.forEach((s) => {
      if (s.hasCheckout) checkoutSessions.add(s.sessionId);
    });
    const funnelStep4Count = Math.min(Math.max(checkoutSessions.size, checkoutInitiationsCount), funnelStep1Count);

    // Step 5: Order Completed
    const funnelStep5Count = completedCheckoutsCount;

    const funnel = [
      {
        stepIndex: 1,
        name: 'Store Visitors',
        description: 'Landed on website and initiated session',
        count: funnelStep1Count,
        conversionFromPreviousPercent: 100,
        dropoffFromPreviousPercent: 0,
        overallFunnelPercent: 100
      },
      {
        stepIndex: 2,
        name: 'Product & Shop Views',
        description: 'Explored products, category lists or search',
        count: funnelStep2Count,
        conversionFromPreviousPercent: funnelStep1Count > 0 ? Math.round((funnelStep2Count / funnelStep1Count) * 100) : 0,
        dropoffFromPreviousPercent: funnelStep1Count > 0 ? Math.max(0, 100 - Math.round((funnelStep2Count / funnelStep1Count) * 100)) : 0,
        overallFunnelPercent: funnelStep1Count > 0 ? Math.round((funnelStep2Count / funnelStep1Count) * 100) : 0
      },
      {
        stepIndex: 3,
        name: 'Added to Cart',
        description: 'Added 1+ Khandeshi delicacies to shopping bag',
        count: funnelStep3Count,
        conversionFromPreviousPercent: funnelStep2Count > 0 ? Math.round((funnelStep3Count / funnelStep2Count) * 100) : 0,
        dropoffFromPreviousPercent: funnelStep2Count > 0 ? Math.max(0, 100 - Math.round((funnelStep3Count / funnelStep2Count) * 100)) : 0,
        overallFunnelPercent: funnelStep1Count > 0 ? Math.round((funnelStep3Count / funnelStep1Count) * 100) : 0
      },
      {
        stepIndex: 4,
        name: 'Checkout Initiated',
        description: 'Entered checkout address & payment flow',
        count: funnelStep4Count,
        conversionFromPreviousPercent: funnelStep3Count > 0 ? Math.round((funnelStep4Count / funnelStep3Count) * 100) : 0,
        dropoffFromPreviousPercent: funnelStep3Count > 0 ? Math.max(0, 100 - Math.round((funnelStep4Count / funnelStep3Count) * 100)) : 0,
        overallFunnelPercent: funnelStep1Count > 0 ? Math.round((funnelStep4Count / funnelStep1Count) * 100) : 0
      },
      {
        stepIndex: 5,
        name: 'Purchased / Converted',
        description: 'Completed order payment via COD or Online UPI',
        count: funnelStep5Count,
        conversionFromPreviousPercent: funnelStep4Count > 0 ? Math.min(100, Math.round((funnelStep5Count / funnelStep4Count) * 100)) : 0,
        dropoffFromPreviousPercent: funnelStep4Count > 0 ? Math.max(0, 100 - Math.min(100, Math.round((funnelStep5Count / funnelStep4Count) * 100))) : 0,
        overallFunnelPercent: funnelStep1Count > 0 ? Number(((funnelStep5Count / funnelStep1Count) * 100).toFixed(1)) : 0
      }
    ];

    // 6. Top Pages Breakdown
    const pageStatsMap = new Map<
      string,
      { title: string; views: number; visitors: Set<string>; durations: number[]; bounces: number; exits: number }
    >();

    filteredPageviews.forEach((p) => {
      let stat = pageStatsMap.get(p.path);
      if (!stat) {
        stat = {
          title: p.title || p.path,
          views: 0,
          visitors: new Set(),
          durations: [],
          bounces: 0,
          exits: 0
        };
        pageStatsMap.set(p.path, stat);
      }
      stat.views += 1;
      stat.visitors.add(p.visitorId);
      if (p.durationSeconds && p.durationSeconds > 0) {
        stat.durations.push(p.durationSeconds);
      }
    });

    filteredSessions.forEach((s) => {
      if (s.landingPage && s.isBounce) {
        const stat = pageStatsMap.get(s.landingPage);
        if (stat) stat.bounces += 1;
      }
      if (s.exitPage) {
        const stat = pageStatsMap.get(s.exitPage);
        if (stat) stat.exits += 1;
      }
    });

    const topPages = Array.from(pageStatsMap.entries())
      .map(([path, stat]) => {
        const avgTime =
          stat.durations.length > 0
            ? Math.round(stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length)
            : 0;
        const bounceRate = stat.views > 0 ? Math.round((stat.bounces / stat.views) * 100) : 0;
        const exitRate = stat.views > 0 ? Math.round((stat.exits / stat.views) * 100) : 0;

        return {
          path,
          title: stat.title,
          views: stat.views,
          uniqueVisitors: stat.visitors.size,
          avgTimeOnPageSeconds: avgTime,
          bounceRatePercent: Math.min(100, bounceRate),
          exitRatePercent: Math.min(100, exitRate)
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    // 7. Recent Visitor Activity Stream (Chronological 25 items)
    const recentActivityRaw: {
      id: string;
      sessionId: string;
      visitorId: string;
      eventName: string;
      eventCategory: string;
      path: string;
      targetName?: string;
      value?: number;
      deviceType: string;
      city?: string;
      createdAt: string;
    }[] = [];

    // Combine recent pageviews and events
    filteredEvents.slice(-20).forEach((e) => {
      const s = memorySessions.find((sess) => sess.sessionId === e.sessionId);
      recentActivityRaw.push({
        id: e.id,
        sessionId: e.sessionId,
        visitorId: e.visitorId.substring(0, 8) + '...',
        eventName: e.eventName,
        eventCategory: e.eventCategory,
        path: e.path,
        targetName: e.targetName,
        value: e.value,
        deviceType: s?.deviceType || 'desktop',
        city: s?.city || 'Maharashtra',
        createdAt: e.createdAt
      });
    });

    filteredPageviews.slice(-15).forEach((p) => {
      const s = memorySessions.find((sess) => sess.sessionId === p.sessionId);
      recentActivityRaw.push({
        id: p.id,
        sessionId: p.sessionId,
        visitorId: p.visitorId.substring(0, 8) + '...',
        eventName: 'view_page',
        eventCategory: 'navigation',
        path: p.path,
        targetName: p.title || p.path,
        value: undefined,
        deviceType: s?.deviceType || 'desktop',
        city: s?.city || 'Maharashtra',
        createdAt: p.createdAt
      });
    });

    const recentActivity = recentActivityRaw
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((item) => ({
        ...item,
        timeAgo: timeAgo(item.createdAt)
      }));

    // 8. Actions & Defined Events Aggregation
    const eventStatsMap = new Map<string, { category: string; count: number; users: Set<string> }>();
    filteredEvents.forEach((e) => {
      let stat = eventStatsMap.get(e.eventName);
      if (!stat) {
        stat = { category: e.eventCategory, count: 0, users: new Set() };
        eventStatsMap.set(e.eventName, stat);
      }
      stat.count += 1;
      stat.users.add(e.visitorId);
    });

    const topEvents = Array.from(eventStatsMap.entries())
      .map(([eventName, stat]) => ({
        eventName,
        eventCategory: stat.category,
        totalCount: stat.count,
        uniqueUsers: stat.users.size,
        percentageOfSessions: totalSessions > 0 ? Math.round((stat.users.size / totalSessions) * 100) : 0
      }))
      .sort((a, b) => b.totalCount - a.totalCount);

    // 9. Traffic Sources & Referrers Breakdown
    const sourcesMap = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const src = s.referrerDomain || classifyTrafficSource(s.referrer, s.landingPage);
      sourcesMap.set(src, (sourcesMap.get(src) || 0) + 1);
    });

    const totalSrcCount = filteredSessions.length || 1;
    const trafficSources = Array.from(sourcesMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percent: Math.round((count / totalSrcCount) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // 10. Device & Browser Breakdowns
    const deviceMap = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const dev = s.deviceType ? s.deviceType.charAt(0).toUpperCase() + s.deviceType.slice(1) : 'Desktop';
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
    });
    const deviceStats = Array.from(deviceMap.entries())
      .map(([device, count]) => ({
        device,
        count,
        percent: Math.round((count / totalSrcCount) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const browserMap = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const b = s.browser || 'Chrome';
      browserMap.set(b, (browserMap.get(b) || 0) + 1);
    });
    const topBrowsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({
        browser,
        count,
        percent: Math.round((count / totalSrcCount) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Format Active Pages
    const activePages = Object.entries(activePageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      timeRange,
      generatedAt: new Date().toISOString(),
      realtime: {
        activeNow: activeVisitorsList.length,
        activePages,
        deviceBreakdown: activeDeviceCounts,
        recentActiveVisitors: activeVisitorsList.slice(0, 8)
      },
      kpis: {
        totalPageviews,
        uniqueVisitors,
        totalSessions,
        returningVisitorsCount: returningCount,
        returningVisitorsPercent,
        bounceRatePercent,
        avgSessionDurationSeconds,
        avgSessionDurationFormatted,
        cartAdditionsCount,
        checkoutInitiationsCount,
        completedCheckoutsCount,
        abandonedCheckoutsCount,
        cartToCheckoutPercent,
        checkoutConversionPercent,
        overallConversionPercent,
        totalRevenue,
        totalProfit
      },
      timeSeries,
      funnel,
      topPages,
      recentActivity,
      topEvents,
      trafficSources,
      deviceStats,
      topBrowsers
    };
  }

  /**
   * Reset / Clear old analytics logs (Admin maintenance)
   */
  static async clearLogs() {
    memorySessions = [];
    memoryPageviews = [];
    memoryEvents = [];
    activeHeartbeats.clear();
    await this.persistToDisk();

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('TRUNCATE TABLE site_pageviews');
        await pool.query('TRUNCATE TABLE site_events');
        await pool.query('TRUNCATE TABLE site_sessions');
      } catch (_) {}
    }
  }
}
