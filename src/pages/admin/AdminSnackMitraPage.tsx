import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Sparkles,
  Cpu,
  Coins,
  MessageSquare,
  Clock,
  Power,
  Settings,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Send,
  Sliders,
  Database,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  Plus,
  X,
  Layers,
  ArrowUpRight,
  HelpCircle,
  ShieldCheck,
  MessageCircle,
  SlidersHorizontal
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { SnackMitraConfig, SnackMitraLogEntry, SnackMitraStats } from '@/types';

export default function AdminSnackMitraPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'config' | 'test'>('overview');

  // Config State
  const [config, setConfig] = useState<SnackMitraConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState<SnackMitraStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Logs State
  const [logs, setLogs] = useState<SnackMitraLogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(15);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState('');
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SnackMitraLogEntry | null>(null);
  const [isClearingLogs, setIsClearingLogs] = useState(false);

  // Interactive Live Tester State
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Fetch Config
  const fetchConfig = async () => {
    setIsConfigLoading(true);
    try {
      const res = await fetch('/api/admin/snack-mitra/config');
      const data = await res.json();
      if (data && data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to fetch Snack Mitra config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  // 2. Fetch Stats
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const res = await fetch('/api/admin/snack-mitra/stats');
      const data = await res.json();
      if (data && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch Snack Mitra stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 3. Fetch Logs
  const fetchLogs = async (page = logsPage, search = logsSearch, status = logsStatusFilter) => {
    setIsLogsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: logsLimit.toString(),
        search: search.trim(),
        status: status
      });
      const res = await fetch(`/api/admin/snack-mitra/logs?${queryParams.toString()}`);
      const data = await res.json();
      if (data && data.success) {
        setLogs(data.logs || []);
        setLogsTotal(data.total || 0);
        setLogsPage(data.page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch Snack Mitra logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchStats();
    fetchLogs(1, '', '');
  }, []);

  // Handle Master Bot Toggle
  const handleToggleBotEnabled = async () => {
    if (!config) return;
    const newEnabled = !config.enabled;
    const updated = { ...config, enabled: newEnabled };
    setConfig(updated);

    try {
      const res = await fetch('/api/admin/snack-mitra/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveSuccessMsg(`Snack Mitra ${newEnabled ? 'Enabled & Live' : 'Disabled & Hidden'} on production!`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle bot status:', err);
      // Revert on error
      setConfig({ ...config, enabled: !newEnabled });
    }
  };

  // Handle Full Config Save
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config) return;
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/admin/snack-mitra/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data && data.success) {
        setConfig(data.config);
        setSaveSuccessMsg('Configuration successfully updated! Changes are now live on storefront.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all message logs? Token usage statistics and configuration will remain safe.')) {
      return;
    }
    setIsClearingLogs(true);
    try {
      const res = await fetch('/api/admin/snack-mitra/logs', { method: 'DELETE' });
      const data = await res.json();
      if (data && data.success) {
        setLogs([]);
        setLogsTotal(0);
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsClearingLogs(false);
    }
  };

  // Handle Export Logs to JSON/CSV
  const handleExportLogs = () => {
    if (logs.length === 0) {
      alert('No logs available to export.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `snack_mitra_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Live Tester
  const handleRunTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim() || isTestLoading) return;
    setIsTestLoading(true);
    setTestResponse(null);

    const startTime = performance.now();
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: testQuery.trim() }],
          userQuery: testQuery.trim()
        })
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);

      setTestResponse({
        reply: data.reply || '',
        orderFound: data.orderFound || null,
        isOffline: data.isOffline || false,
        tokens: data.tokens || { prompt: 0, response: 0, total: 0 },
        responseTimeMs: data.responseTimeMs || elapsed,
        charCount: (data.reply || '').length
      });

      // Refresh logs & stats silently
      fetchLogs(1, '', '');
      fetchStats();
    } catch (err: any) {
      setTestResponse({
        reply: `Error testing bot: ${err?.message || 'Server error'}`,
        charCount: 0,
        tokens: { prompt: 0, response: 0, total: 0 },
        responseTimeMs: 0
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Quick suggestion helper
  const handleAddSuggestion = () => {
    if (!config) return;
    const newSug = { label: 'New Topic', query: 'Tell me about...' };
    setConfig({
      ...config,
      quickSuggestions: [...(config.quickSuggestions || []), newSug]
    });
  };

  const handleUpdateSuggestion = (index: number, key: 'label' | 'query', value: string) => {
    if (!config) return;
    const list = [...(config.quickSuggestions || [])];
    list[index] = { ...list[index], [key]: value };
    setConfig({ ...config, quickSuggestions: list });
  };

  const handleDeleteSuggestion = (index: number) => {
    if (!config) return;
    const list = [...(config.quickSuggestions || [])];
    list.splice(index, 1);
    setConfig({ ...config, quickSuggestions: list });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-16">
        {/* Top Sticky Bar / Header */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9B111E] border-2 border-amber-300/70 overflow-hidden shadow-md flex-shrink-0">
              <img
                src="https://res.cloudinary.com/uuid1vym/image/upload/v1789424200/snack_mitra_fxqqc8.png"
                alt="Snack Mitra"
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Snack Mitra
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-amber-50 text-amber-800 border-amber-200/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  AI Support Bot
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Manage live bot training, constraints, token usage history, and production chat logs.
              </p>
            </div>
          </div>

          {/* Right Action: Master Enable / Disable Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchConfig();
                fetchStats();
                fetchLogs();
              }}
              className="p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200 cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${isConfigLoading || isStatsLoading ? 'animate-spin' : ''}`} />
            </button>

            {config && (
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/80 p-2 sm:p-2.5 rounded-xl shadow-2xs">
                <div className="text-right">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block">
                    Storefront Bot Status
                  </span>
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${config.enabled ? 'text-emerald-700' : 'text-stone-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                    {config.enabled ? 'Live & Active' : 'Disabled (Hidden)'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-bot-status"
                  onClick={handleToggleBotEnabled}
                  className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.enabled ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
                  aria-label="Toggle Bot Enabled Status"
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      config.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Save Success Notification Banner */}
        <AnimatePresence>
          {saveSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 border border-emerald-300/80 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200/80 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Token Usage & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Customer Chat Logs</span>
            {logsTotal > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-stone-100 text-stone-700 font-bold">
                {logsTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Bot Configuration & Constraints</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'test'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Live Bot Simulator</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & TOKEN USAGE HISTORY */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total Tokens */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Tokens</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900">
                    {(stats?.totalTokens || 0).toLocaleString()}
                  </span>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                    <span className="text-emerald-700 font-semibold">
                      {(stats?.todayTokens || 0).toLocaleString()}
                    </span>
                    <span>used today</span>
                  </p>
                </div>
              </div>

              {/* Metric 2: Total Inquiries */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Inquiries</span>
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#9B111E] flex items-center justify-center border border-red-100">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900">
                    {(stats?.totalInquiries || 0).toLocaleString()}
                  </span>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                    <span className="text-stone-700 font-semibold">{stats?.todayInquiries || 0}</span>
                    <span>conversations today</span>
                  </p>
                </div>
              </div>

              {/* Metric 3: Avg Response Chars */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Avg Response Chars</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-stone-900">
                      {stats?.avgResponseChars || 248}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Target 200-300
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Enforcing token optimization constraint
                  </p>
                </div>
              </div>

              {/* Metric 4: Live Orders Handled */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Orders Tracked</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900">
                    {(stats?.ordersFoundCount || 0).toLocaleString()}
                  </span>
                  <p className="text-xs text-stone-500 mt-1">
                    Live MySQL order queries resolved
                  </p>
                </div>
              </div>
            </div>

            {/* Token Usage History Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Token Consumption Chart (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      Daily Token Usage History
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Prompt tokens vs Response tokens consumed over the past 14 days
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-stone-600">Prompt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#9B111E]" />
                      <span className="text-stone-600">Response</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full">
                  {stats?.dailyUsage && stats.dailyUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.dailyUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9B111E" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#9B111E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1c1917',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="promptTokens"
                          name="Prompt Tokens"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorPrompt)"
                        />
                        <Area
                          type="monotone"
                          dataKey="responseTokens"
                          name="Response Tokens"
                          stroke="#9B111E"
                          fillOpacity={1}
                          fill="url(#colorResponse)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                      <Coins className="w-8 h-8 text-stone-300 mb-2" />
                      <span>No token history recorded yet. Start a test chat to generate live logs.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inquiries Volume Breakdown (1 col) */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Daily Inquiry Volume
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Customer conversations processed per day
                  </p>

                  <div className="h-56 sm:h-64 w-full mt-4">
                    {stats?.dailyUsage && stats.dailyUsage.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dailyUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1c1917',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="inquiries" name="Inquiries" fill="#9B111E" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                        <MessageSquare className="w-8 h-8 text-stone-300 mb-2" />
                        <span>No conversation volume recorded yet.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Avg Latency: <strong className="text-stone-800">{stats?.avgResponseTimeMs || 410}ms</strong></span>
                  <span>Token Efficiency: <strong className="text-emerald-700">Optimal (~240c)</strong></span>
                </div>
              </div>
            </div>

            {/* Token Optimization & Guardrails Summary */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    Token Control & 200–300 Character Guardrails Active
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Snack Mitra is calibrated with dynamic system constraints to keep replies concise (200–300 characters), preventing token over-consumption while providing complete answers. All UX/technical model terminology (such as Gemini references) is strictly prohibited from user-facing responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER CHAT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Logs Filter & Action Bar */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1, logsSearch, logsStatusFilter)}
                    placeholder="Search queries, replies, or order IDs..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-800 placeholder-stone-400 rounded-xl border border-stone-200 focus:border-[#9B111E] outline-none transition-all"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={logsStatusFilter}
                  onChange={(e) => {
                    setLogsStatusFilter(e.target.value);
                    fetchLogs(1, logsSearch, e.target.value);
                  }}
                  className="px-3 py-2 text-xs bg-stone-50 hover:bg-stone-100/70 text-stone-700 rounded-xl border border-stone-200 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="success">AI Success</option>
                  <option value="instant_match">⚡ 0-Token Instant Match</option>
                  <option value="cached">⚡ Cached (0-Token)</option>
                  <option value="fallback">Intelligent Fallback</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchLogs(1, logsSearch, logsStatusFilter)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </div>

              {/* Action Buttons: Export & Clear */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleExportLogs}
                  disabled={logs.length === 0}
                  className="px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Export logs as JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLogs}
                  disabled={logs.length === 0 || isClearingLogs}
                  className="px-3 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-red-200/60"
                  title="Clear all conversation logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Time & Client</th>
                      <th className="py-3 px-4">Customer Query</th>
                      <th className="py-3 px-4">Bot Reply</th>
                      <th className="py-3 px-4 text-center">Chars</th>
                      <th className="py-3 px-4 text-center">Tokens</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {isLogsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          <div className="w-6 h-6 border-2 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span>Loading chat logs...</span>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                          <span>No conversation messages found matching the criteria.</span>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const rawQuery = (log as any).customerQuery || (log as any).userQuery || '';
                        const rawReply = (log as any).botReply || (log as any).botResponse || '';
                        const rawTime = (log as any).timestamp || (log as any).createdAt || new Date().toISOString();
                        const charCount = (log as any).replyCharCount || rawReply.length;
                        const isOptimalChars = charCount >= 200 && charCount <= 300;
                        const totalTokens = (log.totalTokens && log.totalTokens > 0)
                          ? log.totalTokens
                          : (log.promptTokens || 0) + (log.responseTokens || 0);
                        const orderTag = (log as any).orderNumber || (log as any).orderFound;

                        return (
                          <tr key={log.id} className="hover:bg-stone-50/70 transition-colors group">
                            {/* Time & Client IP */}
                            <td className="py-3 px-4 whitespace-nowrap text-stone-500">
                              <span className="font-semibold text-stone-800 block">
                                {new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {new Date(rawTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                              {log.clientIp && (
                                <span className="text-[9px] font-mono text-stone-400">
                                  {log.clientIp.slice(0, 15)}
                                </span>
                              )}
                            </td>

                            {/* Customer Query */}
                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-semibold text-stone-900 line-clamp-2 leading-snug">
                                {rawQuery}
                              </p>
                              {orderTag && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  Order #{orderTag}
                                </span>
                              )}
                            </td>

                            {/* Bot Reply Preview */}
                            <td className="py-3 px-4 max-w-sm">
                              <p className="text-stone-700 line-clamp-2 leading-relaxed text-[12px]">
                                {rawReply}
                              </p>
                            </td>

                            {/* Character Count */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                  isOptimalChars
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                                }`}
                                title={`${charCount} characters`}
                              >
                                {charCount} chars
                              </span>
                            </td>

                            {/* Tokens */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className="font-bold text-stone-800 block">
                                {totalTokens}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {log.promptTokens || 0}p / {log.responseTokens || 0}r
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {log.status === 'instant_match' ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px] border border-blue-200">
                                  ⚡ 0-Tok Match
                                </span>
                              ) : log.status === 'cached' ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold text-[10px] border border-purple-200">
                                  ⚡ Cached (0 Tok)
                                </span>
                              ) : log.status === 'fallback' ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px] border border-amber-200">
                                  Fallback
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                                  AI Live
                                </span>
                              )}
                            </td>

                            {/* Action: View Modal */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedLog(log)}
                                className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                                title="View full message details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {logsTotal > logsLimit && (
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Showing {((logsPage - 1) * logsLimit) + 1}–{Math.min(logsPage * logsLimit, logsTotal)} of {logsTotal} messages
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={logsPage <= 1 || isLogsLoading}
                      onClick={() => fetchLogs(logsPage - 1, logsSearch, logsStatusFilter)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-bold text-stone-800">Page {logsPage}</span>
                    <button
                      type="button"
                      disabled={logsPage * logsLimit >= logsTotal || isLogsLoading}
                      onClick={() => fetchLogs(logsPage + 1, logsSearch, logsStatusFilter)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal: View Full Log Details */}
            <AnimatePresence>
              {selectedLog && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Bot className="w-5 h-5 text-amber-300" />
                        <h3 className="font-bold text-sm">Conversation Log Details</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(null)}
                        className="text-stone-400 hover:text-white p-1 rounded cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-5 overflow-y-auto space-y-4 text-xs">
                      {(() => {
                        const selQuery = (selectedLog as any).customerQuery || (selectedLog as any).userQuery || '';
                        const selReply = (selectedLog as any).botReply || (selectedLog as any).botResponse || '';
                        const selTime = (selectedLog as any).timestamp || (selectedLog as any).createdAt || new Date().toISOString();
                        const selOrder = (selectedLog as any).orderNumber || (selectedLog as any).orderFound;
                        const selTotalTokens = (selectedLog.totalTokens && selectedLog.totalTokens > 0)
                          ? selectedLog.totalTokens
                          : (selectedLog.promptTokens || 0) + (selectedLog.responseTokens || 0);

                        return (
                          <>
                            <div>
                              <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                                Timestamp & Metadata
                              </span>
                              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-stone-700">
                                <div>Date: <strong>{new Date(selTime).toLocaleString()}</strong></div>
                                <div>Response Time: <strong>{selectedLog.responseTimeMs || 0} ms</strong></div>
                                <div>Status: <strong className="capitalize">{selectedLog.status}</strong></div>
                                <div>Tokens: <strong>{selectedLog.promptTokens || 0} prompt / {selectedLog.responseTokens || 0} response ({selTotalTokens} total)</strong></div>
                                {selOrder && (
                                  <div className="col-span-2 text-blue-700">
                                    Order Lookup: <strong>#{selOrder}</strong>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Customer Query */}
                            <div>
                              <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                                Customer Query
                              </span>
                              <div className="bg-stone-100 rounded-xl p-3 text-stone-900 font-medium whitespace-pre-wrap">
                                {selQuery}
                              </div>
                            </div>

                            {/* Bot Response */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400">
                                  Bot Response ({selReply.length} characters)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedLog.id, selReply)}
                                  className="text-stone-500 hover:text-stone-800 text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedId === selectedLog.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>Copy</span>
                                </button>
                              </div>
                              <div className="bg-[#FAF6ED] border border-amber-200/80 rounded-xl p-3.5 text-stone-800 whitespace-pre-wrap leading-relaxed font-sans">
                                {selReply}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(null)}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 3: CONFIGURATION & LIVE TUNING */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            {isConfigLoading || !config ? (
              <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
                <div className="w-8 h-8 border-2 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading configuration...</span>
              </div>
            ) : (
              <>
                {/* 1. Assistant Identity & Personality */}
                <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h2 className="text-base font-bold text-stone-900">
                      1. Assistant Identity & Brand Styling
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Configure how the bot introduces itself to customers across the storefront.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Bot Display Name
                      </label>
                      <input
                        type="text"
                        value={config.botName || 'Snack Mitra'}
                        onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                        placeholder="e.g. Snack Mitra"
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        value={config.botTagline || 'Aapla Jalgaonwala Support'}
                        onChange={(e) => setConfig({ ...config, botTagline: e.target.value })}
                        placeholder="e.g. Aapla Jalgaonwala Support"
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        WhatsApp Helpline
                      </label>
                      <input
                        type="text"
                        value={config.whatsappNumber || '+91 70574 46409'}
                        onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                        placeholder="e.g. +91 70574 46409"
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Welcome Greeting Message (Markdown supported)
                    </label>
                    <textarea
                      rows={5}
                      value={config.welcomeMessage || ''}
                      onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                      placeholder="Enter customer welcome greeting..."
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none font-mono"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Displayed immediately when customers open the floating chat launcher.
                    </p>
                  </div>
                </div>

                {/* 2. Response Length Constraints & Tone */}
                <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h2 className="text-base font-bold text-stone-900">
                      2. Response Length Bounds & Token Economizer
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Strict bounds enforced on every reply to conserve tokens and provide crisp, fast answers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Min Character Bound
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={400}
                        value={config.minChars || 200}
                        onChange={(e) => setConfig({ ...config, minChars: parseInt(e.target.value, 10) || 200 })}
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">Default: 200 characters</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Max Character Bound
                      </label>
                      <input
                        type="number"
                        min={200}
                        max={600}
                        value={config.maxChars || 300}
                        onChange={(e) => setConfig({ ...config, maxChars: parseInt(e.target.value, 10) || 300 })}
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">Default: 300 characters</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Response Tone
                      </label>
                      <select
                        value={config.tone || 'Warm & Hospitable'}
                        onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none cursor-pointer"
                      >
                        <option value="Warm & Hospitable">Warm & Hospitable (Traditional Khandeshi)</option>
                        <option value="Professional & Courteous">Professional & Courteous</option>
                        <option value="Crisp & Direct">Crisp & Direct</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Max Output Tokens
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={300}
                        value={config.maxOutputTokens || 110}
                        onChange={(e) => setConfig({ ...config, maxOutputTokens: parseInt(e.target.value, 10) || 110 })}
                        className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">Controls Gemini token limit</span>
                    </div>
                  </div>

                  {/* System Announcement Injected into Grounding */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Live Store Announcement / Festival Promo Notice
                    </label>
                    <input
                      type="text"
                      value={config.announcementNote || ''}
                      onChange={(e) => setConfig({ ...config, announcementNote: e.target.value })}
                      placeholder="e.g. Diwali festive discount code DIWALI10 is active for 10% off; Free delivery across MH above ₹399!"
                      className="w-full px-3.5 py-2 text-xs bg-stone-50 focus:bg-white text-stone-900 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Injected dynamically into bot grounding so it is always aware of today's specials and discounts.
                    </p>
                  </div>
                </div>

                {/* 3. Quick Suggestions Chips */}
                <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-stone-900">
                        3. Quick Suggestions Chips
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Chips rendered above the storefront input to guide customer inquiries in one click.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSuggestion}
                      className="px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Suggestion</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(config.quickSuggestions || []).map((sug, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80"
                      >
                        <div className="sm:w-1/3">
                          <input
                            type="text"
                            value={sug.label}
                            onChange={(e) => handleUpdateSuggestion(index, 'label', e.target.value)}
                            placeholder="Chip Label (e.g. 🍌 Banana Chips)"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none font-semibold text-stone-800"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={sug.query}
                            onChange={(e) => handleUpdateSuggestion(index, 'query', e.target.value)}
                            placeholder="Prompt query to trigger..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none text-stone-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSuggestion(index)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                          title="Delete suggestion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button Bar */}
                <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                  <div className="text-xs text-stone-500">
                    Changes take effect immediately on live production site.
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-6 py-2.5 bg-[#9B111E] hover:bg-[#800F1B] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Configuration...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Save & Apply Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* TAB 4: LIVE TESTER / SANDBOX */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="border-b border-stone-100 pb-3 mb-4">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#9B111E]" />
                  Interactive Snack Mitra Sandbox
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Test questions against live store knowledge, observe token counts, response latency, and check the 200–300 character constraint.
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleRunTest} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="e.g. Tell me about your store founders, or track order #1024, or give me Shev Bhaji recipe..."
                    disabled={isTestLoading}
                    className="w-full pl-4 pr-24 py-3 text-sm bg-stone-50 focus:bg-white text-stone-900 placeholder-stone-400 border border-stone-200 rounded-xl focus:border-[#9B111E] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!testQuery.trim() || isTestLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#9B111E] hover:bg-[#800F1B] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isTestLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Query</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Suggested Test Queries */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-stone-400 self-center mr-1">Try:</span>
                  {[
                    'What flavours of banana chips do you offer?',
                    'Tell me about Aapla Jalgaonwala story and founders.',
                    'Where is your physical store in Jalgaon?',
                    'What is the recipe for Khandeshi Shev Bhaji?',
                    'How does the 12% Women Business Partner program work?'
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setTestQuery(preset)}
                      className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </form>

              {/* Response Card */}
              {testResponse && (
                <div className="mt-6 pt-6 border-t border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Live Response Output
                    </span>

                    {/* Metrics Badges */}
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          testResponse.charCount >= 200 && testResponse.charCount <= 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {testResponse.charCount} characters (Target 200-300)
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium text-[11px]">
                        {testResponse.tokens?.total || 0} tokens ({testResponse.tokens?.prompt || 0}p / {testResponse.tokens?.response || 0}r)
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium text-[11px]">
                        {testResponse.responseTimeMs}ms
                      </span>
                    </div>
                  </div>

                  {/* Rendered Reply Bubble */}
                  <div className="bg-[#FAF6ED] border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {testResponse.reply}
                  </div>

                  {testResponse.orderFound && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span>Live Order Resolved: <strong>#{testResponse.orderFound}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
