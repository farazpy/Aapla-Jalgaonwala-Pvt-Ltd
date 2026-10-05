'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Activity,
  Users,
  Eye,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Share2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Tag,
  Package,
  Layers,
  MousePointer,
  Search,
  ExternalLink,
  Trash2,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface AnalyticsData {
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

const TIME_RANGES = [
  { id: 'today', label: 'Today (24h Live)' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' }
];

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [chartView, setChartView] = useState<'traffic' | 'funnel' | 'revenue'>('traffic');
  const [pageSearchQuery, setPageSearchQuery] = useState<string>('');
  const [isClearingLogs, setIsClearingLogs] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Fetch Analytics from server
  const fetchAnalytics = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      setIsRefreshing(true);

      try {
        let url = `/api/analytics/dashboard?timeRange=${timeRange}`;
        if (timeRange === 'custom' && customStartDate && customEndDate) {
          url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        if (isMountedRef.current && json.success && json.data) {
          setAnalytics(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics dashboard:', err);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [timeRange, customStartDate, customEndDate]
  );

  // Initial load and range change
  useEffect(() => {
    isMountedRef.current = true;
    fetchAnalytics(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAnalytics]);

  // Live Auto-Refresh (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  // Handle Clear Analytics History
  const handleClearAnalytics = async () => {
    setIsClearingLogs(true);
    try {
      const res = await fetch('/api/analytics/clear', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setClearSuccess('Analytics history reset successfully.');
        setShowClearConfirmModal(false);
        fetchAnalytics(true);
        setTimeout(() => setClearSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to clear analytics:', err);
    } finally {
      setIsClearingLogs(false);
    }
  };

  // Filter top pages
  const filteredPages = (analytics?.topPages || []).filter(
    (p) =>
      p.path.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(pageSearchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      pageTitle="Analytics & Performance"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Analytics' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Indicator Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>{analytics?.realtime?.activeNow || 0} Online Right Now</span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
              autoRefresh
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title="Toggle 15s live auto-refresh"
          >
            <Zap className={`w-3.5 h-3.5 ${autoRefresh ? 'text-amber-600 fill-amber-500' : 'text-stone-400'}`} />
            <span>{autoRefresh ? 'Live Auto-Sync (15s)' : 'Auto-Sync Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#9B111E]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Success Alert Banner */}
        {clearSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{clearSuccess}</span>
            </div>
            <button onClick={() => setClearSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {/* Top Control Bar: Time Range Selector */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Range:</span>
            </span>
            {TIME_RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setTimeRange(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === r.id
                    ? 'bg-[#9B111E] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-200/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Custom Date Filter Picker */}
          {timeRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 bg-stone-50 p-1.5 rounded-lg border border-stone-200 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-800 text-xs font-medium focus:ring-1 focus:ring-[#9B111E] outline-none"
              />
              <span className="text-stone-400 font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-800 text-xs font-medium focus:ring-1 focus:ring-[#9B111E] outline-none"
              />
              <button
                type="button"
                onClick={() => fetchAnalytics(true)}
                className="px-3 py-1 bg-[#9B111E] text-white rounded font-bold text-xs hover:bg-[#800d18] transition-colors"
              >
                Apply Range
              </button>
            </div>
          )}

          <div className="text-[11px] font-medium text-stone-400">
            Real-time Production Feed • {analytics?.generatedAt ? new Date(analytics.generatedAt).toLocaleTimeString() : 'Live'}
          </div>
        </div>

        {/* 1. Real-Time Live Activity & Visitors Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active Now Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Live Active Visitors</span>
              </div>
              <Badge variant="success" size="sm">
                Real-Time
              </Badge>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-4xl font-extrabold text-stone-900 tracking-tight">
                {analytics?.realtime?.activeNow || 0}
              </span>
              <span className="text-xs text-emerald-600 font-bold">browsing live on site</span>
            </div>

            {/* Device breakdown of current active visitors */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                <div className="flex items-center justify-center gap-1 text-stone-400 mb-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Mobile</span>
                </div>
                <div className="font-extrabold text-stone-900">{analytics?.realtime?.deviceBreakdown?.mobile || 0}</div>
              </div>

              <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                <div className="flex items-center justify-center gap-1 text-stone-400 mb-1">
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Desktop</span>
                </div>
                <div className="font-extrabold text-stone-900">{analytics?.realtime?.deviceBreakdown?.desktop || 0}</div>
              </div>

              <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                <div className="flex items-center justify-center gap-1 text-stone-400 mb-1">
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Tablet</span>
                </div>
                <div className="font-extrabold text-stone-900">{analytics?.realtime?.deviceBreakdown?.tablet || 0}</div>
              </div>
            </div>
          </div>

          {/* Active Pages Right Now */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#9B111E]" />
                <span>Active URLs Right Now</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-bold">Current live pages</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px] pr-1">
              {!analytics?.realtime?.activePages || analytics.realtime.activePages.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No active URL pings yet. Visitors browsing the storefront will appear here live.
                </div>
              ) : (
                analytics.realtime.activePages.map((page, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100 hover:bg-stone-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-mono font-bold text-stone-800 truncate">{page.path}</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#9B111E] bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shrink-0">
                      {page.count} {page.count === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Active Visitors Pulse */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Live Active Sessions</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-bold">Heartbeat within 3m</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px] pr-1">
              {!analytics?.realtime?.recentActiveVisitors || analytics.realtime.recentActiveVisitors.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Waiting for visitor heartbeats...
                </div>
              ) : (
                analytics.realtime.recentActiveVisitors.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {v.deviceType === 'mobile' ? (
                        <Smartphone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-stone-800 truncate">{v.currentPath}</div>
                        <div className="text-[10px] text-stone-400">{v.visitorId}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                      {v.lastActiveSecondsAgo}s ago
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2. Executive KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1: Page Views */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-[#9B111E]/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Total Page Views</p>
                <h3 className="text-2xl font-bold text-stone-900 mt-1">
                  {analytics?.kpis?.totalPageviews?.toLocaleString() || 0}
                </h3>
                <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-bold border border-stone-200 mt-1 inline-block">
                  {analytics?.kpis?.totalSessions
                    ? `${(analytics.kpis.totalPageviews / Math.max(1, analytics.kpis.totalSessions)).toFixed(1)} views / session`
                    : 'Live telemetry'}
                </span>
              </div>
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-[#9B111E]">
                <Eye className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* KPI 2: Unique Visitors */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-[#9B111E]/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Unique Visitors</p>
                <h3 className="text-2xl font-bold text-stone-900 mt-1">
                  {analytics?.kpis?.uniqueVisitors?.toLocaleString() || 0}
                </h3>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100 mt-1 inline-block">
                  {analytics?.kpis?.returningVisitorsPercent || 0}% returning users
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* KPI 3: Avg Session Duration & Bounces */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-[#9B111E]/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Avg Session Duration</p>
                <h3 className="text-2xl font-bold text-stone-900 mt-1">
                  {analytics?.kpis?.avgSessionDurationFormatted || '0s'}
                </h3>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100 mt-1 inline-block">
                  {analytics?.kpis?.bounceRatePercent || 0}% bounce rate
                </span>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* KPI 4: Gross Sales Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Total Revenue (Orders)</p>
                <h3 className="text-2xl font-bold text-stone-900 mt-1">
                  ₹{Number(analytics?.kpis?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100 mt-1 inline-block">
                  {analytics?.kpis?.completedCheckoutsCount || 0} completed orders
                </span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* KPI 5: Total Net Profit */}
          <div className="bg-emerald-950 p-5 rounded-2xl border border-emerald-800/80 shadow-md text-white hover:border-emerald-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">Total Net Profit</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
                  ₹{Number(analytics?.kpis?.totalProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-emerald-200 bg-emerald-900/80 px-2 py-0.5 rounded font-bold border border-emerald-700 mt-1 inline-block">
                  Calculated per product qty
                </span>
              </div>
              <div className="w-10 h-10 bg-emerald-800/60 rounded-xl flex items-center justify-center text-emerald-300 border border-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: E-Commerce Conversion Specifics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cart Additions */}
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-stone-400">Cart Additions</div>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {analytics?.kpis?.cartAdditionsCount || 0}
              </div>
              <div className="text-[10px] text-stone-500">Items added to bag</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#D9531E] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          {/* Checkout Initiations */}
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-stone-400">Checkouts Initiated</div>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {analytics?.kpis?.checkoutInitiationsCount || 0}
              </div>
              <div className="text-[10px] text-stone-500">
                {analytics?.kpis?.cartToCheckoutPercent || 0}% cart-to-checkout
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {/* Checkout Conversion Rate */}
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-stone-400">Checkout Conversion</div>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">
                {analytics?.kpis?.checkoutConversionPercent || 0}%
              </div>
              <div className="text-[10px] text-stone-500">
                {analytics?.kpis?.abandonedCheckoutsCount || 0} abandoned checkouts
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Overall Store Conversion Rate */}
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-stone-400">Overall Conversion Rate</div>
              <div className="text-xl font-bold text-[#9B111E] mt-0.5">
                {analytics?.kpis?.overallConversionPercent || 0}%
              </div>
              <div className="text-[10px] text-stone-500">Visitors to purchasers</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-[#9B111E] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. Interactive Trend Charts (Recharts) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#9B111E]" />
                <span>Performance & Traffic Trends</span>
              </h3>
              <p className="text-xs text-stone-400">
                Live timeline series for {timeRange === 'today' ? 'today (hourly)' : timeRange}
              </p>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs overflow-x-auto no-scrollbar w-full sm:w-auto mt-2 sm:mt-0 mask-edges-right pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setChartView('traffic')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
                  chartView === 'traffic' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Traffic (Views & Users)
              </button>
              <button
                type="button"
                onClick={() => setChartView('funnel')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
                  chartView === 'funnel' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Orders & Checkouts
              </button>
              <button
                type="button"
                onClick={() => setChartView('revenue')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
                  chartView === 'revenue' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Revenue (₹)
              </button>
            </div>
          </div>

          {/* Recharts Area / Bar Visualization */}
          <div className="h-[280px] w-full">
            {!analytics?.timeSeries || analytics.timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No telemetry points recorded in this timeframe yet.
              </div>
            ) : chartView === 'traffic' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9B111E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9B111E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    name="Page Views"
                    stroke="#9B111E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viewsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Unique Visitors"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#visitorsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : chartView === 'funnel' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="checkouts" name="Checkouts Initiated" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" name="Orders Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Gross Sales (₹)"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Complete 5-Step E-Commerce Conversion Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D9531E]" />
                <span>Conversion Funnel Analytics</span>
              </h3>
              <p className="text-xs text-stone-400">
                Step-by-step visitor progression from store entry to final paid order
              </p>
            </div>
            <div className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              Overall: <span className="text-[#9B111E]">{analytics?.kpis?.overallConversionPercent || 0}% converted</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {(analytics?.funnel || []).map((step, idx) => {
              const bgColors = [
                'bg-slate-50 border-slate-200',
                'bg-blue-50/60 border-blue-200',
                'bg-amber-50/60 border-amber-200',
                'bg-purple-50/60 border-purple-200',
                'bg-emerald-50/70 border-emerald-200'
              ];
              const textColors = [
                'text-slate-800',
                'text-blue-800',
                'text-amber-800',
                'text-purple-800',
                'text-emerald-800'
              ];

              return (
                <div
                  key={step.stepIndex}
                  className={`p-4 rounded-xl border ${bgColors[idx % bgColors.length]} relative flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-1 font-mono">
                      <span>Step 0{step.stepIndex}</span>
                      {step.stepIndex > 1 && (
                        <span className="text-[10px] font-bold text-stone-500">
                          {step.conversionFromPreviousPercent}% passed
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs font-extrabold ${textColors[idx % textColors.length]}`}>{step.name}</h4>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">{step.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{step.count.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-stone-500">{step.overallFunnelPercent}% total</span>
                  </div>

                  {/* Dropoff Indicator */}
                  {step.stepIndex > 1 && step.dropoffFromPreviousPercent > 0 && (
                    <div className="mt-1 text-[9px] font-bold text-rose-600">
                      ↓ {step.dropoffFromPreviousPercent}% drop-off
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Dual Grid: Page Performance & Actions / Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Top Pages Performance Table */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Page Performance</h3>
              </div>

              {/* Search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter URLs..."
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9B111E] w-36"
                />
              </div>
            </div>

            <div className="p-0 flex-1 overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[9px] tracking-wider border-b border-stone-100 sticky top-0">
                  <tr>
                    <th className="p-3">Path & Title</th>
                    <th className="p-3 text-right">Views</th>
                    <th className="p-3 text-right">Visitors</th>
                    <th className="p-3 text-right">Avg Time</th>
                    <th className="p-3 text-right">Bounce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400">
                        No pages recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((p, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                        <td className="p-3 max-w-[200px]">
                          <div className="font-bold text-stone-900 font-mono text-[11px] truncate">{p.path}</div>
                          <div className="text-[10px] text-stone-400 truncate">{p.title}</div>
                        </td>
                        <td className="p-3 text-right font-bold text-stone-900">{p.views.toLocaleString()}</td>
                        <td className="p-3 text-right text-stone-600">{p.uniqueVisitors.toLocaleString()}</td>
                        <td className="p-3 text-right text-stone-600">
                          {p.avgTimeOnPageSeconds > 0 ? `${p.avgTimeOnPageSeconds}s` : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.bounceRatePercent > 60
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {p.bounceRatePercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Actions & Defined Events Breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Actions & Defined Events
                </h3>
              </div>
              <span className="text-[10px] font-bold text-stone-400">User interactions</span>
            </div>

            <div className="p-0 flex-1 overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[9px] tracking-wider border-b border-stone-100 sticky top-0">
                  <tr>
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Total Count</th>
                    <th className="p-3 text-right">Unique Users</th>
                    <th className="p-3 text-right">% Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {!analytics?.topEvents || analytics.topEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400">
                        No defined interaction events triggered yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.topEvents.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                        <td className="p-3 font-bold text-stone-900 font-mono text-[11px]">{ev.eventName}</td>
                        <td className="p-3">
                          <Badge variant="stone" size="sm">
                            {ev.eventCategory}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-extrabold text-[#9B111E]">
                          {ev.totalCount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-stone-700">{ev.uniqueUsers.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-stone-500">{ev.percentageOfSessions}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. Traffic Acquisition, Devices & Live Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Channels */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Traffic Acquisition</span>
                </h3>
                <span className="text-[10px] text-stone-400 font-bold">Referrers & Sources</span>
              </div>

              <div className="space-y-3">
                {!analytics?.trafficSources || analytics.trafficSources.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400">No acquisition logs yet.</div>
                ) : (
                  analytics.trafficSources.map((src, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-stone-800">{src.source}</span>
                        <span className="text-stone-500">
                          {src.count} ({src.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, src.percent))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Browsers */}
            <div className="pt-4 mt-4 border-t border-stone-100">
              <div className="text-[10px] font-extrabold uppercase text-stone-400 mb-2">Top Browsers</div>
              <div className="flex flex-wrap gap-1.5">
                {(analytics?.topBrowsers || []).map((b, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold bg-stone-50 border border-stone-200 text-stone-700 px-2 py-1 rounded"
                  >
                    {b.browser}: {b.percent}%
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Device Distribution</span>
                </h3>
                <span className="text-[10px] text-stone-400 font-bold">Hardware split</span>
              </div>

              <div className="space-y-3">
                {!analytics?.deviceStats || analytics.deviceStats.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400">No device logs yet.</div>
                ) : (
                  analytics.deviceStats.map((dev, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-stone-800 flex items-center gap-1.5">
                          {dev.device.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-3.5 h-3.5 text-stone-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-stone-400" />
                          )}
                          {dev.device}
                        </span>
                        <span className="text-stone-500">
                          {dev.count} ({dev.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, dev.percent))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 mt-4 text-[11px] text-stone-500 leading-relaxed">
              Mobile optimization ensures responsive fast ordering for all Khandeshi snack shoppers.
            </div>
          </div>

          {/* Chronological Live Activity Stream */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#9B111E]" />
                <span>Live Activity Stream</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-bold">Latest user actions</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
              {!analytics?.recentActivity || analytics.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Real visitor actions will stream here live.
                </div>
              ) : (
                analytics.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-start justify-between gap-2 text-xs hover:bg-stone-100/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            act.eventName === 'purchase_complete'
                              ? 'bg-emerald-500'
                              : act.eventName === 'add_to_cart'
                              ? 'bg-amber-500'
                              : act.eventName === 'initiate_checkout'
                              ? 'bg-indigo-500'
                              : 'bg-sky-500'
                          }`}
                        />
                        <span className="font-bold text-stone-900 font-mono text-[11px]">{act.eventName}</span>
                        {act.value !== undefined && act.value > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded">
                            ₹{act.value}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate mt-0.5">
                        {act.targetName || act.path}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-stone-400 shrink-0 whitespace-nowrap">
                      {act.timeAgo}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 7. Quick Management Shortcuts & Maintenance */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products/add"
              className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 shadow-2xs flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Add Product</span>
            </Link>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 shadow-2xs flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#9B111E]" />
              <span>Orders Dispatch</span>
            </Link>
            <Link
              href="/admin/customers"
              className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 shadow-2xs flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Customers Data</span>
            </Link>
            <Link
              href="/admin/partners"
              className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 shadow-2xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D9531E]" />
              <span>Women Partners</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="text-[11px] font-bold text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset Analytics Logs</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal to Clear Analytics */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-stone-900">Reset Analytics History?</h3>
              <p className="text-xs text-stone-500 mt-1">
                This will clear site sessions and telemetry events. Your real orders and catalog data will not be affected.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAnalytics}
                disabled={isClearingLogs}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
              >
                {isClearingLogs ? 'Resetting...' : 'Yes, Reset History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
