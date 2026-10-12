import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  GitFork, 
  Network, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Edit3, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Layers, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BusinessPartner } from '@/types';

// Response Rating configuration with icons, colors, and descriptions
export type ResponseRatingType = 'poor' | 'average' | 'good' | 'excellent' | 'outstanding';

interface RatingConfig {
  id: ResponseRatingType;
  label: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  dotBg: string;
  emoji: string;
  desc: string;
}

const RESPONSE_RATINGS: Record<ResponseRatingType, RatingConfig> = {
  poor: {
    id: 'poor',
    label: 'Poor',
    badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    badgeText: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
    dotBg: 'bg-rose-500',
    emoji: '🔴',
    desc: 'Low engagement or zero active sales converted'
  },
  average: {
    id: 'average',
    label: 'Average',
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    badgeText: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
    dotBg: 'bg-amber-500',
    emoji: '🟠',
    desc: 'Moderate engagement & occasional referral orders'
  },
  good: {
    id: 'good',
    label: 'Good',
    badgeBg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800/60',
    dotBg: 'bg-yellow-500',
    emoji: '🟡',
    desc: 'Active promoter converting consistent customer orders'
  },
  excellent: {
    id: 'excellent',
    label: 'Excellent',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    dotBg: 'bg-emerald-500',
    emoji: '🟢',
    desc: 'High performer with active downline network'
  },
  outstanding: {
    id: 'outstanding',
    label: 'Outstanding',
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    badgeText: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
    dotBg: 'bg-purple-500',
    emoji: '💎',
    desc: 'Top leader, high sales volume & sub-partner network'
  }
};

// Helper to determine or get partner response rating
function getPartnerResponseRating(partner: BusinessPartner): ResponseRatingType {
  if (partner.responseStatus && RESPONSE_RATINGS[partner.responseStatus as ResponseRatingType]) {
    return partner.responseStatus as ResponseRatingType;
  }
  
  // Auto-calculate response rating from activity if not explicitly assigned
  const sales = partner.totalSalesAmount || 0;
  const orders = partner.totalOrdersCount || 0;
  const invited = partner.invitedPartnersCount || 0;

  if (sales >= 25000 || orders >= 20 || invited >= 5) return 'outstanding';
  if (sales >= 10000 || orders >= 8 || invited >= 2) return 'excellent';
  if (sales >= 3000 || orders >= 3) return 'good';
  if (sales >= 500 || orders >= 1) return 'average';
  return 'poor';
}

// Tree Node Interface
interface TreeNode {
  partner: BusinessPartner;
  children: TreeNode[];
  level: number;
  totalTreeSales: number;
  totalTreeCommission: number;
  totalTreeMembers: number;
}

export function AdminWomanTreePage() {
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'columns' | 'table'>('tree');
  
  // Collapsed Node IDs map (id -> boolean)
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Re-assign / Edit Partner Modal State
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [parentReferrerCode, setParentReferrerCode] = useState<string>('');
  const [newResponseStatus, setNewResponseStatus] = useState<ResponseRatingType>('good');
  const [newCommissionRate, setNewCommissionRate] = useState<number>(12);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Detail Slide-over / Modal
  const [selectedDetailPartner, setSelectedDetailPartner] = useState<BusinessPartner | null>(null);

  // Fetch partners
  const fetchPartners = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/partner-program/partners?_t=${Date.now()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPartners(json.data);
      } else {
        setError(json.message || 'Failed to load partners network.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching partner tree.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Format currency
  const formatINR = (amount: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Build Hierarchical Tree Structure
  const treeData = useMemo(() => {
    if (!partners || partners.length === 0) return [];

    // Map by partner code (case-insensitive clean code)
    const codeMap = new Map<string, BusinessPartner>();
    partners.forEach(p => {
      if (p.partnerCode) {
        codeMap.set(p.partnerCode.trim().toUpperCase(), p);
      }
    });

    // Parent to children mapping
    const childrenMap = new Map<string, BusinessPartner[]>();
    const roots: BusinessPartner[] = [];

    partners.forEach(p => {
      const refByCode = (p.referredByPartnerCode || '').trim().toUpperCase();
      if (refByCode && codeMap.has(refByCode) && refByCode !== p.partnerCode?.trim().toUpperCase()) {
        const existingList = childrenMap.get(refByCode) || [];
        existingList.push(p);
        childrenMap.set(refByCode, existingList);
      } else {
        roots.push(p);
      }
    });

    // Helper recursive function to construct TreeNode
    const buildNode = (p: BusinessPartner, level: number): TreeNode => {
      const code = (p.partnerCode || '').trim().toUpperCase();
      const rawChildren = childrenMap.get(code) || [];
      const childrenNodes = rawChildren.map(c => buildNode(c, level + 1));

      const totalTreeSales = (p.totalSalesAmount || 0) + childrenNodes.reduce((sum, c) => sum + c.totalTreeSales, 0);
      const totalTreeCommission = (p.totalCommissionEarned || 0) + childrenNodes.reduce((sum, c) => sum + c.totalTreeCommission, 0);
      const totalTreeMembers = 1 + childrenNodes.reduce((sum, c) => sum + c.totalTreeMembers, 0);

      return {
        partner: p,
        children: childrenNodes,
        level,
        totalTreeSales,
        totalTreeCommission,
        totalTreeMembers
      };
    };

    return roots.map(root => buildNode(root, 1));
  }, [partners]);

  // Overall Network Summary Statistics
  const stats = useMemo(() => {
    const totalCount = partners.length;
    let rootCount = 0;
    let referredCount = 0;
    let totalSales = 0;
    let totalCommission = 0;

    const ratingCounts: Record<ResponseRatingType, number> = {
      poor: 0,
      average: 0,
      good: 0,
      excellent: 0,
      outstanding: 0
    };

    partners.forEach(p => {
      totalSales += p.totalSalesAmount || 0;
      totalCommission += p.totalCommissionEarned || 0;

      if (p.referredByPartnerCode) {
        referredCount++;
      } else {
        rootCount++;
      }

      const rating = getPartnerResponseRating(p);
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });

    return {
      totalCount,
      rootCount,
      referredCount,
      totalSales,
      totalCommission,
      ratingCounts
    };
  }, [partners]);

  // Filter & Search Helper
  const matchesFilter = (p: BusinessPartner) => {
    if (selectedStatusFilter !== 'all' && p.status !== selectedStatusFilter) {
      return false;
    }

    const rating = getPartnerResponseRating(p);
    if (selectedRatingFilter !== 'all' && rating !== selectedRatingFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = p.fullName?.toLowerCase().includes(q);
      const codeMatch = p.partnerCode?.toLowerCase().includes(q);
      const phoneMatch = p.phone?.toLowerCase().includes(q);
      const cityMatch = p.city?.toLowerCase().includes(q);
      const stateMatch = p.state?.toLowerCase().includes(q);
      return Boolean(nameMatch || codeMatch || phoneMatch || cityMatch || stateMatch);
    }

    return true;
  };

  // Toggle Collapse
  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsedNodes({});
  const collapseAll = () => {
    const map: Record<string, boolean> = {};
    partners.forEach(p => {
      map[p.id] = true;
    });
    setCollapsedNodes(map);
  };

  // Open Edit Modal
  const openEditModal = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setParentReferrerCode(partner.referredByPartnerCode || '');
    setNewResponseStatus(getPartnerResponseRating(partner));
    setNewCommissionRate(partner.commissionRate || 12);
    setEditNotes(partner.notes || '');
    setSaveSuccessMsg(null);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    setIsSavingEdit(true);
    setSaveSuccessMsg(null);

    // Format updated notes to contain response tag if needed
    let cleanNotes = editNotes.replace(/\[Response:\s*[a-zA-Z]+\]/gi, '').trim();
    if (newResponseStatus) {
      cleanNotes = `[Response: ${newResponseStatus}] ${cleanNotes}`.trim();
    }

    const updates = {
      referredByPartnerCode: parentReferrerCode.trim().toUpperCase() || null,
      responseStatus: newResponseStatus,
      commissionRate: Number(newCommissionRate) || 12,
      notes: cleanNotes
    };

    try {
      const res = await fetch(`/api/partner-program/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();

      if (json.success) {
        setSaveSuccessMsg('Woman partner referral and response rating updated successfully!');
        setTimeout(() => {
          setEditingPartner(null);
          fetchPartners(true);
        }, 1200);
      } else {
        alert(json.message || 'Failed to update partner details.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating partner assignment.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNodeCard = (node: TreeNode, depth: number = 0) => {
    const p = node.partner;
    const isCollapsed = Boolean(collapsedNodes[p.id]);
    const isMatched = matchesFilter(p);
    const hasChildren = node.children.length > 0;
    const rating = getPartnerResponseRating(p);
    const ratingCfg = RESPONSE_RATINGS[rating];

    // If node and all its children do not match search query, skip rendering in filtered view
    const childrenMatchSearch = (n: TreeNode): boolean => {
      if (matchesFilter(n.partner)) return true;
      return n.children.some(childrenMatchSearch);
    };

    if (!isMatched && !childrenMatchSearch(node) && (searchQuery || selectedRatingFilter !== 'all' || selectedStatusFilter !== 'all')) {
      return null;
    }

    return (
      <div key={p.id} className="relative group/node">
        {/* Node Card Container */}
        <div 
          className={`relative z-10 bg-white dark:bg-stone-900 rounded-2xl border ${
            isMatched 
              ? 'border-stone-200/90 dark:border-stone-800 shadow-md hover:shadow-xl hover:border-amber-400/80' 
              : 'border-stone-200/50 dark:border-stone-800/50 opacity-60'
          } transition-all duration-300 p-4 max-w-xl`}
        >
          {/* Header Row: Level Badge, Partner Info, Response Status */}
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Level Indicator Badge */}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                depth === 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300/80 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/50' 
                  : depth === 1 
                  ? 'bg-blue-100 text-blue-900 border border-blue-300/80 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700/50' 
                  : 'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:text-stone-300'
              }`}>
                {depth === 0 ? '👑 Level 1 (Root)' : depth === 1 ? '🌿 Level 2 (Direct)' : `🌿 Level ${depth + 1}`}
              </span>

              {/* Status Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                p.status === 'active' || p.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : p.status === 'pending'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              }`}>
                {p.status || 'Active'}
              </span>
            </div>

            {/* Response Rating Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold shadow-xs ${ratingCfg.badgeBg} ${ratingCfg.border}`}>
              <span>{ratingCfg.emoji}</span>
              <span>{ratingCfg.label}</span>
            </div>
          </div>

          {/* Main Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Avatar & Partner Details */}
            <div className="sm:col-span-7 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {p.fullName ? p.fullName.slice(0, 2).toUpperCase() : 'WB'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                    {p.fullName || 'Woman Partner'}
                  </h4>
                  <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200/60 dark:border-amber-800/40">
                    {p.partnerCode}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                  <span>{p.city || 'Jalgaon'}{p.state ? `, ${p.state}` : ''}</span>
                  <span>•</span>
                  <span>{p.phone || 'N/A'}</span>
                </p>
                {p.referredByPartnerName && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-1 flex items-center gap-1">
                    <GitFork className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Referred by: <strong className="text-stone-800 dark:text-stone-200">{p.referredByPartnerName}</strong> ({p.referredByPartnerCode})</span>
                  </p>
                )}
              </div>
            </div>

            {/* Financial Commission & Sales Pill */}
            <div className="sm:col-span-5 bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800/80 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Commission:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(p.totalCommissionEarned || 0)} ({p.commissionRate || 12}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Direct Sales:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {formatINR(p.totalSalesAmount || 0)}
                </span>
              </div>
              {hasChildren && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
                  <span className="text-amber-700 dark:text-amber-400 font-bold">Tree Total:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {formatINR(node.totalTreeSales)} ({node.totalTreeMembers} Members)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Node Footer Actions Bar */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            {/* Direct Referrals Counter & Collapse Toggle */}
            <div>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleCollapse(p.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold rounded-lg border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer"
                >
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{node.children.length} {node.children.length === 1 ? 'Sub-Woman Assigned' : 'Sub-Women Assigned'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-stone-400 font-medium italic">No sub-referrals assigned</span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {p.phone && (
                <a
                  href={`https://wa.me/91${p.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${p.fullName || ''}, regarding your Women Business Partner account (${p.partnerCode})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                  title="WhatsApp Partner"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedDetailPartner(p)}
                className="px-2 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={() => openEditModal(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#9B111E] hover:bg-[#800d18] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Re-assign / Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Children Sub-Branches (Tree Branches View) */}
        {hasChildren && !isCollapsed && (
          <div className="pl-6 sm:pl-10 mt-3 space-y-3 relative before:absolute before:left-3 sm:before:left-5 before:top-0 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-400/80 before:to-stone-300 dark:before:to-stone-800">
            {node.children.map(childNode => renderTreeNodeCard(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout pageTitle="Woman Tree Network" breadcrumbs={[{ label: 'Women Partners', href: '/admin/partners' }, { label: 'Woman Tree' }]}>
      <div className="space-y-6 pb-12 font-sans antialiased text-stone-900 dark:text-stone-100">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-amber-500/20">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <GitFork className="w-3.5 h-3.5 text-amber-400" />
              <span>Women Partner Tree Diagram & Response Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Woman Tree & Referral Network Hierarchy
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Visualize complete hierarchical branches of which woman is assigned to whom, total sales & commission earnings, direct and sub-referral downlines, and assign engagement response ratings (Poor, Average, Good, Excellent, Outstanding).
            </p>
          </div>
        </div>

        {/* Network Metrics Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Total Network Women</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{stats.totalCount}</p>
            <p className="text-[11px] text-stone-500">{stats.rootCount} Top Roots • {stats.referredCount} Sub-Referred</p>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Tree Sales Generated</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{formatINR(stats.totalSales)}</p>
            <p className="text-[11px] text-emerald-600 font-bold">Across all referral branches</p>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Tree Commissions Earned</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatINR(stats.totalCommission)}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">12% direct referral share</p>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Response Performance Breakdown</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                🔴 Poor ({stats.ratingCounts.poor})
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                🟠 Avg ({stats.ratingCounts.average})
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300">
                🟡 Good ({stats.ratingCounts.good})
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                🟢 Exc ({stats.ratingCounts.excellent})
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                💎 Top ({stats.ratingCounts.outstanding})
              </span>
            </div>
          </div>
        </div>

        {/* Filter, Search & View Controls Bar */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search woman by name, code (e.g. WBP-PRIYA), phone, city..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Response Rating Filter */}
              <select
                value={selectedRatingFilter}
                onChange={e => setSelectedRatingFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="all">All Responses (Poor/Good/Avg)</option>
                <option value="poor">🔴 Poor Response</option>
                <option value="average">🟠 Average Response</option>
                <option value="good">🟡 Good Response</option>
                <option value="excellent">🟢 Excellent Response</option>
                <option value="outstanding">💎 Outstanding Response</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="all">All Partner Statuses</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'tree' ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Branch Tree
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'columns' ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Levels
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Table
                </button>
              </div>

              {/* Action buttons */}
              <button
                type="button"
                onClick={expandAll}
                className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors cursor-pointer"
                title="Expand All Nodes"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors cursor-pointer"
                title="Collapse All Nodes"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fetchPartners(true)}
                disabled={isRefreshing}
                className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Tree Network"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Loading Woman Partner Tree Network...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-800 dark:text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => fetchPartners()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : treeData.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No Women Partners Found</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              No registered women business partners match your filter criteria or search query.
            </p>
          </div>
        ) : (
          /* MAIN TREE CONTENT DISPLAY */
          <div className="space-y-6">
            {/* VIEW MODE 1: BRANCH TREE */}
            {viewMode === 'tree' && (
              <div className="space-y-6">
                {treeData.map(rootNode => renderTreeNodeCard(rootNode, 0))}
              </div>
            )}

            {/* VIEW MODE 2: GENERATION COLUMNS */}
            {viewMode === 'columns' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Column 1: Root Women */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <CrownIcon className="w-4 h-4" />
                      <span>Level 1 Root Women ({treeData.length})</span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {treeData.map(node => {
                      const p = node.partner;
                      const ratingCfg = RESPONSE_RATINGS[getPartnerResponseRating(p)];
                      return (
                        <div key={p.id} className="bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900 dark:text-white">{p.fullName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ratingCfg.badgeBg}`}>{ratingCfg.emoji} {ratingCfg.label}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>{p.partnerCode}</span>
                            <span className="font-bold text-emerald-600">{formatINR(p.totalCommissionEarned)}</span>
                          </div>
                          {node.children.length > 0 && (
                            <div className="text-[10px] font-bold text-amber-600 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                              ↳ {node.children.length} Sub-Referrals
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Direct Sub-Referrals */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <h3 className="text-sm font-black text-blue-700 dark:text-blue-400 flex items-center gap-2">
                      <GitFork className="w-4 h-4" />
                      <span>Level 2 Direct Sub-Referrals</span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {treeData.flatMap(r => r.children).map(node => {
                      const p = node.partner;
                      const ratingCfg = RESPONSE_RATINGS[getPartnerResponseRating(p)];
                      return (
                        <div key={p.id} className="bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900 dark:text-white">{p.fullName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ratingCfg.badgeBg}`}>{ratingCfg.emoji} {ratingCfg.label}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>Referred by: {p.referredByPartnerName || p.referredByPartnerCode}</span>
                            <span className="font-bold text-emerald-600">{formatINR(p.totalCommissionEarned)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Multi-Level Downlines */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <h3 className="text-sm font-black text-purple-700 dark:text-purple-400 flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      <span>Level 3+ Deep Branches</span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {treeData.flatMap(r => r.children.flatMap(c => c.children)).map(node => {
                      const p = node.partner;
                      const ratingCfg = RESPONSE_RATINGS[getPartnerResponseRating(p)];
                      return (
                        <div key={p.id} className="bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900 dark:text-white">{p.fullName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ratingCfg.badgeBg}`}>{ratingCfg.emoji} {ratingCfg.label}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>{p.partnerCode}</span>
                            <span className="font-bold text-emerald-600">{formatINR(p.totalCommissionEarned)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE 3: MATRIX TABLE */}
            {viewMode === 'table' && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-950 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                      <tr>
                        <th className="p-3.5">Woman Partner & Code</th>
                        <th className="p-3.5">Assigned Referrer</th>
                        <th className="p-3.5">Response Rating</th>
                        <th className="p-3.5">Commission Rate</th>
                        <th className="p-3.5">Total Sales</th>
                        <th className="p-3.5">Total Commission</th>
                        <th className="p-3.5">City / State</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {partners.filter(matchesFilter).map(p => {
                        const ratingCfg = RESPONSE_RATINGS[getPartnerResponseRating(p)];
                        return (
                          <tr key={p.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                              <div>{p.fullName}</div>
                              <div className="font-mono text-[10px] text-amber-600">{p.partnerCode}</div>
                            </td>
                            <td className="p-3.5 text-stone-600 dark:text-stone-300 font-medium">
                              {p.referredByPartnerName ? (
                                <div>
                                  <span className="font-semibold text-stone-900 dark:text-white">{p.referredByPartnerName}</span>
                                  <div className="text-[10px] text-stone-400">{p.referredByPartnerCode}</div>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">None (Root)</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${ratingCfg.badgeBg}`}>
                                {ratingCfg.emoji} {ratingCfg.label}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-amber-600">{p.commissionRate || 12}%</td>
                            <td className="p-3.5 font-bold text-stone-900 dark:text-white">{formatINR(p.totalSalesAmount)}</td>
                            <td className="p-3.5 font-bold text-emerald-600">{formatINR(p.totalCommissionEarned)}</td>
                            <td className="p-3.5 text-stone-500">{p.city || 'Jalgaon'}</td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => openEditModal(p)}
                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Edit / Re-assign
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: EDIT WOMAN & ASSIGN REFERRER / RESPONSE RATING */}
        <AnimatePresence>
          {editingPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-white">
                      Re-assign & Edit Woman Partner
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Editing <strong className="text-stone-800 dark:text-stone-200">{editingPartner.fullName}</strong> ({editingPartner.partnerCode})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPartner(null)}
                    className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {saveSuccessMsg && (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                  {/* Field 1: Assigned Parent Referrer Woman */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 dark:text-stone-200 block">
                      Assign Referred By (Parent Woman Partner)
                    </label>
                    <select
                      value={parentReferrerCode}
                      onChange={e => setParentReferrerCode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                    >
                      <option value="">-- None (Independent Top Level Root) --</option>
                      {partners
                        .filter(p => p.id !== editingPartner.id)
                        .map(p => (
                          <option key={p.id} value={p.partnerCode}>
                            {p.fullName} ({p.partnerCode}) - {p.city || 'Jalgaon'}
                          </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-stone-500">
                      Woman A will be assigned under this parent partner (Woman B) in the tree network.
                    </p>
                  </div>

                  {/* Field 2: Response / Engagement Rating */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 dark:text-stone-200 block">
                      Engagement & Response Rating
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(RESPONSE_RATINGS) as ResponseRatingType[]).map(key => {
                        const r = RESPONSE_RATINGS[key];
                        const isSelected = newResponseStatus === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setNewResponseStatus(key)}
                            className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? `${r.badgeBg} ${r.border} ring-2 ring-amber-500/50 font-black`
                                : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium'
                            }`}
                          >
                            <span className="text-base">{r.emoji}</span>
                            <div>
                              <div className="text-xs">{r.label}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 3: Commission Rate */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 dark:text-stone-200 block">
                      Direct Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="50"
                      value={newCommissionRate}
                      onChange={e => setNewCommissionRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-stone-900 dark:text-white"
                    />
                  </div>

                  {/* Field 4: Internal Notes */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 dark:text-stone-200 block">
                      Admin Notes & Relationship Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Add custom notes or partner response remarks..."
                      className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-medium text-stone-900 dark:text-white"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPartner(null)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSavingEdit && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Save Tree Assignment</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SLIDE-OVER DETAIL MODAL */}
        <AnimatePresence>
          {selectedDetailPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5"
              >
                <div className="flex items-start justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-white">
                      {selectedDetailPartner.fullName}
                    </h3>
                    <p className="text-xs text-amber-600 font-mono font-bold">
                      {selectedDetailPartner.partnerCode} • {selectedDetailPartner.city || 'Jalgaon'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailPartner(null)}
                    className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-stone-950 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                    <div>
                      <span className="text-stone-500 block">Total Sales</span>
                      <strong className="text-sm text-stone-900 dark:text-white">{formatINR(selectedDetailPartner.totalSalesAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Commission Earned</span>
                      <strong className="text-sm text-emerald-600">{formatINR(selectedDetailPartner.totalCommissionEarned)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Direct Orders</span>
                      <strong className="text-sm text-stone-900 dark:text-white">{selectedDetailPartner.totalOrdersCount || 0} Orders</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Direct Sub-Referrals</span>
                      <strong className="text-sm text-amber-600">{selectedDetailPartner.invitedPartnersCount || 0} Women</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-800 dark:text-stone-200">Contact & Banking</h4>
                    <p className="text-stone-600 dark:text-stone-400">Phone: <strong>{selectedDetailPartner.phone}</strong></p>
                    <p className="text-stone-600 dark:text-stone-400">Email: <strong>{selectedDetailPartner.email || 'N/A'}</strong></p>
                    <p className="text-stone-600 dark:text-stone-400">Bank: <strong>{selectedDetailPartner.bankName}</strong> ({selectedDetailPartner.bankAccountNumber})</p>
                    <p className="text-stone-600 dark:text-stone-400">UPI: <strong>{selectedDetailPartner.upiId || 'N/A'}</strong></p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailPartner(null)}
                    className="px-4 py-2 bg-stone-900 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}

function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
