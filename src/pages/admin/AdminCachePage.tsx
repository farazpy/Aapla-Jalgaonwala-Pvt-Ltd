import React, { useState, useEffect } from 'react';
import {
  Zap,
  RotateCcw,
  Gauge,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  ShieldCheck,
  Server,
  Settings,
  Trash2,
  RefreshCw,
  Sliders,
  Database,
  ArrowUpRight,
  Search,
  Activity
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface CacheStats {
  isDevMode: boolean;
  cacheVersion: number;
  totalKeys: number;
  hits: number;
  misses: number;
  bypasses: number;
  hitRatioPercent: number;
  estimatedMemoryBytes: number;
  categoryCounts: Record<string, number>;
  ttlsSeconds: Record<string, number>;
}

interface CacheKeyItem {
  key: string;
  category: string;
  ttlRemainingSec: number;
  sizeKb: number;
}

export function AdminCachePage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [activeKeys, setActiveKeys] = useState<CacheKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTtls, setEditingTtls] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCacheStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cache/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data.stats);
        setActiveKeys(json.data.activeKeys || []);
        if (json.data.stats?.ttlsSeconds) {
          setEditingTtls(json.data.stats.ttlsSeconds);
        }
      }
    } catch (err) {
      console.error('Failed to fetch cache stats:', err);
      showToast('Error loading cache stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    // Auto-refresh stats every 10 seconds
    const interval = setInterval(fetchCacheStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFlushCache = async (category = 'all') => {
    setActionLoading(`flush_${category}`);
    try {
      const res = await fetch('/api/admin/cache/flush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      const json = await res.json();
      if (json.success) {
        showToast(category === 'all' ? 'Entire server cache flushed successfully!' : `Category "${category}" cache cleared!`);
        fetchCacheStats();
      } else {
        showToast(json.message || 'Failed to flush cache');
      }
    } catch (err: any) {
      showToast(err.message || 'Error flushing cache');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDevMode = async (enabled: boolean) => {
    setActionLoading('dev_toggle');
    try {
      const res = await fetch('/api/admin/cache/toggle-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.data.message);
        fetchCacheStats();
      } else {
        showToast(json.message || 'Failed to toggle dev mode');
      }
    } catch (err: any) {
      showToast(err.message || 'Error toggling dev mode');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveTtls = async () => {
    setActionLoading('save_ttls');
    try {
      const res = await fetch('/api/admin/cache/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttls: editingTtls })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Cache TTL configuration updated successfully!');
        fetchCacheStats();
      } else {
        showToast(json.message || 'Failed to update TTL settings');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating TTLs');
    } finally {
      setActionLoading(null);
    }
  };

  const formatMemory = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredKeys = activeKeys.filter((k) => {
    const matchesSearch = k.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || k.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout activeTab="cache" title="Cache & Speed Optimization">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-stone-800 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold tracking-wider uppercase mb-1">
              <Zap className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>High-Performance Asset & Query Caching</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-stone-900">Cache & Speed Optimization</h1>
            <p className="text-xs text-stone-500 mt-1">
              Accelerate website load time, manage browser headers, clear stale cache, or toggle Development Mode.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCacheStats()}
              className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>

            <button
              onClick={() => handleFlushCache('all')}
              disabled={actionLoading === 'flush_all'}
              className="px-4 py-2.5 bg-[#9B111E] hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>{actionLoading === 'flush_all' ? 'Flushing All...' : 'Flush Entire Cache'}</span>
            </button>
          </div>
        </div>

        {/* Development Mode Alert & Toggle Banner */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
          stats?.isDevMode
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              stats?.isDevMode
                ? 'bg-amber-200/80 border-amber-300 text-amber-900'
                : 'bg-emerald-200/80 border-emerald-300 text-emerald-900'
            }`}>
              {stats?.isDevMode ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {stats?.isDevMode ? 'DEVELOPMENT MODE ACTIVE (Cache Bypassed)' : 'PRODUCTION STACK ACTIVE (Strong Caching Enabled)'}
                </span>
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                  stats?.isDevMode
                    ? 'bg-amber-200 border-amber-400 text-amber-900'
                    : 'bg-emerald-200 border-emerald-400 text-emerald-900'
                }`}>
                  {stats?.isDevMode ? 'BYPASS' : 'OPTIMIZED'}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                {stats?.isDevMode
                  ? 'Response caching is currently disabled. All changes are served live without caching. Switch back to Production Mode for maximum speed.'
                  : 'API endpoints, image assets, and database query results are being cached aggressively with stale-while-revalidate headers.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggleDevMode(!stats?.isDevMode)}
            disabled={actionLoading === 'dev_toggle'}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 border shadow-xs flex items-center gap-2 ${
              stats?.isDevMode
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                : 'bg-stone-800 hover:bg-stone-900 text-white border-stone-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{stats?.isDevMode ? 'Enable Production Caching' : 'Switch to Development Mode'}</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Cache Hit Ratio</span>
              <Gauge className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900 flex items-baseline gap-2">
              <span>{stats?.hitRatioPercent ?? 0}%</span>
              <span className="text-xs font-sans text-stone-400 font-normal">
                ({stats?.hits ?? 0} hits / {stats?.misses ?? 0} misses)
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.hitRatioPercent ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Active Cached Keys</span>
              <Database className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900">
              {stats?.totalKeys ?? 0} <span className="text-xs font-sans font-normal text-stone-500">entries</span>
            </div>
            <p className="text-[11px] text-stone-400">Memory footprint: {formatMemory(stats?.estimatedMemoryBytes || 0)}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Global Cache Version</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-mono font-bold text-stone-900 truncate">
              #{stats?.cacheVersion ?? Date.now()}
            </div>
            <p className="text-[11px] text-stone-400">Bumps on every flush to invalidate client browser cache</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
              <span>Dev Mode Bypasses</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900">
              {stats?.bypasses ?? 0} <span className="text-xs font-sans font-normal text-stone-500">requests</span>
            </div>
            <p className="text-[11px] text-stone-400">Direct database queries served when Dev Mode is ON</p>
          </div>
        </div>

        {/* Category Flush Cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Category Cache Invalidation</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'products', name: 'Products & Catalog', icon: '🛍️', desc: 'Product lists, details, variations, and recommendations' },
              { id: 'categories', name: 'Categories & Navigation', icon: '🏷️', desc: 'Store categories taxonomy and menu trees' },
              { id: 'coupons', name: 'Coupons & Promos', icon: '🎟️', desc: 'Active coupon validation rules and discount criteria' },
              { id: 'settings', name: 'Store Settings & Logos', icon: '⚙️', desc: 'Branding, store titles, owners, and contact configs' },
              { id: 'images', name: 'Images & Media Assets', icon: '🖼️', desc: 'Header static image caching headers and gallery assets' },
              { id: 'seo', name: 'SEO & Metadata', icon: '🌐', desc: 'Sitemap index, meta tags, and open graph configs' }
            ].map((cat) => {
              const count = stats?.categoryCounts[cat.id] || 0;
              const ttlSec = editingTtls[cat.id] || 3600;
              const isFlushing = actionLoading === `flush_${cat.id}`;

              return (
                <div key={cat.id} className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                        {count} cached
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-stone-900 mt-2">{cat.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">{cat.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">
                      TTL: {Math.round(ttlSec / 60)} mins
                    </span>

                    <button
                      onClick={() => handleFlushCache(cat.id)}
                      disabled={isFlushing}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-stone-200"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
                      <span>{isFlushing ? 'Clearing...' : 'Flush Cache'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TTL Configuration Panel */}
        <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-600" />
                <span>Custom Cache TTL Policies (Seconds)</span>
              </h3>
              <p className="text-xs text-stone-500">Configure how long responses stay valid before revalidating</p>
            </div>

            <button
              onClick={handleSaveTtls}
              disabled={actionLoading === 'save_ttls'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionLoading === 'save_ttls' ? 'Saving...' : 'Save TTL Config'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(editingTtls).map(([catKey, ttlVal]) => (
              <div key={catKey} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 capitalize">
                  {catKey} TTL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    value={ttlVal}
                    onChange={(e) =>
                      setEditingTtls({
                        ...editingTtls,
                        [catKey]: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-stone-400 shrink-0 font-medium">sec</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Cache Keys Inspector Table */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-600" />
                <span>Live Active Cache Inspector</span>
              </h3>
              <p className="text-xs text-stone-500">View and inspect active cached keys in server memory</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search cache keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="products">Products</option>
                <option value="categories">Categories</option>
                <option value="coupons">Coupons</option>
                <option value="settings">Settings</option>
                <option value="seo">SEO</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredKeys.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs font-medium">
                No active cached keys found matching criteria. (Either cache was flushed or in Dev Mode)
              </div>
            ) : (
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 uppercase text-[10px] font-bold text-stone-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Cache Key</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Remaining TTL</th>
                    <th className="px-5 py-3">Payload Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  {filteredKeys.map((item) => (
                    <tr key={item.key} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-stone-900 truncate max-w-xs">{item.key}</td>
                      <td className="px-5 py-3 font-sans">
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200 text-[10px] uppercase font-bold">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-sans text-stone-600">
                        {item.ttlRemainingSec}s
                      </td>
                      <td className="px-5 py-3 font-sans text-stone-500">
                        {item.sizeKb} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCachePage;
