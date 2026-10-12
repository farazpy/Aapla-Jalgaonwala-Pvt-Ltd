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
  Award, 
  TrendingUp, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Trophy,
  Crown,
  UserCheck,
  Building2,
  ArrowDownCircle,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BusinessPartner } from '@/types';

// Response Rating configuration for Light White UI
export type ResponseRatingType = 'poor' | 'average' | 'good' | 'excellent' | 'outstanding';

interface RatingConfig {
  id: ResponseRatingType;
  label: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  emoji: string;
}

const RESPONSE_RATINGS: Record<ResponseRatingType, RatingConfig> = {
  poor: {
    id: 'poor',
    label: 'Poor',
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeText: 'text-rose-700',
    border: 'border-rose-200',
    emoji: '🔴'
  },
  average: {
    id: 'average',
    label: 'Average',
    badgeBg: 'bg-amber-50 text-amber-700',
    badgeText: 'text-amber-700',
    border: 'border-amber-200',
    emoji: '🟠'
  },
  good: {
    id: 'good',
    label: 'Good',
    badgeBg: 'bg-yellow-50 text-yellow-800',
    badgeText: 'text-yellow-800',
    border: 'border-yellow-200',
    emoji: '🟡'
  },
  excellent: {
    id: 'excellent',
    label: 'Excellent',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-200',
    emoji: '🟢'
  },
  outstanding: {
    id: 'outstanding',
    label: 'Outstanding',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeText: 'text-purple-700',
    border: 'border-purple-200',
    emoji: '💎'
  }
};

function getPartnerResponseRating(partner: BusinessPartner): ResponseRatingType {
  if (partner.responseStatus && RESPONSE_RATINGS[partner.responseStatus as ResponseRatingType]) {
    return partner.responseStatus as ResponseRatingType;
  }
  
  const sales = partner.totalSalesAmount || 0;
  const orders = partner.totalOrdersCount || 0;
  const invited = partner.invitedPartnersCount || 0;

  if (sales >= 25000 || orders >= 20 || invited >= 5) return 'outstanding';
  if (sales >= 10000 || orders >= 8 || invited >= 2) return 'excellent';
  if (sales >= 3000 || orders >= 3) return 'good';
  if (sales >= 500 || orders >= 1) return 'average';
  return 'poor';
}

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

  // Filters & Controls (Default: Only Women with Referrals enabled, White Light UI)
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithReferrals, setOnlyWithReferrals] = useState(true);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'invited' | 'sales' | 'name'>('invited');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'diagram' | 'leaderboard' | 'matrix'>('diagram');

  // Collapsed Nodes Map
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Re-assign / Edit Partner Modal State
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [parentReferrerCode, setParentReferrerCode] = useState<string>('');
  const [newResponseStatus, setNewResponseStatus] = useState<ResponseRatingType>('good');
  const [newCommissionRate, setNewCommissionRate] = useState<number>(12);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Detail Modal
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

  const formatINR = (amount: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Build Hierarchical Tree Structure
  const rawTreeData = useMemo(() => {
    if (!partners || partners.length === 0) return [];

    const codeMap = new Map<string, BusinessPartner>();
    partners.forEach(p => {
      if (p.partnerCode) {
        codeMap.set(p.partnerCode.trim().toUpperCase(), p);
      }
    });

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

    const buildNode = (p: BusinessPartner, level: number): TreeNode => {
      const code = (p.partnerCode || '').trim().toUpperCase();
      const rawChildren = childrenMap.get(code) || [];
      const childrenNodes = rawChildren.map(c => buildNode(c, level + 1));

      // Sort children by invited count
      childrenNodes.sort((a, b) => (b.children.length - a.children.length));

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

  // Filtered Tree Data: If onlyWithReferrals is true, show roots that have invited women (or have children)
  const treeData = useMemo(() => {
    let list = [...rawTreeData];

    if (onlyWithReferrals) {
      list = list.filter(node => node.children.length > 0);
    }

    // Sort roots by criteria
    if (sortBy === 'invited') {
      list.sort((a, b) => (b.children.length - a.children.length) || (b.totalTreeMembers - a.totalTreeMembers));
    } else if (sortBy === 'sales') {
      list.sort((a, b) => (b.totalTreeSales - a.totalTreeSales));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.partner.fullName || '').localeCompare(b.partner.fullName || ''));
    }

    return list;
  }, [rawTreeData, onlyWithReferrals, sortBy]);

  // Top Referrers Leaderboard Ranking (Women who invited the most women)
  const topInviters = useMemo(() => {
    const list = partners
      .map(p => {
        const code = (p.partnerCode || '').trim().toUpperCase();
        // Count direct children
        const directInvitedCount = partners.filter(
          child => (child.referredByPartnerCode || '').trim().toUpperCase() === code
        ).length;

        return {
          partner: p,
          directInvitedCount,
          rating: getPartnerResponseRating(p)
        };
      })
      .filter(item => item.directInvitedCount > 0)
      .sort((a, b) => b.directInvitedCount - a.directInvitedCount || (b.partner.totalSalesAmount || 0) - (a.partner.totalSalesAmount || 0));

    return list;
  }, [partners]);

  // Network Statistics
  const stats = useMemo(() => {
    const totalCount = partners.length;
    const activeTreeCount = rawTreeData.filter(r => r.children.length > 0).length;
    const totalReferrals = partners.filter(p => Boolean(p.referredByPartnerCode)).length;

    let totalSales = 0;
    let totalCommission = 0;

    partners.forEach(p => {
      totalSales += p.totalSalesAmount || 0;
      totalCommission += p.totalCommissionEarned || 0;
    });

    return {
      totalCount,
      activeTreeCount,
      totalReferrals,
      totalSales,
      totalCommission
    };
  }, [partners, rawTreeData]);

  // Search Match Filter
  const matchesFilter = (p: BusinessPartner) => {
    const r = getPartnerResponseRating(p);
    if (selectedRatingFilter !== 'all' && r !== selectedRatingFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return Boolean(
        p.fullName?.toLowerCase().includes(q) ||
        p.partnerCode?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
      );
    }

    return true;
  };

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsedNodes({});
  const collapseAll = () => {
    const map: Record<string, boolean> = {};
    partners.forEach(p => { map[p.id] = true; });
    setCollapsedNodes(map);
  };

  const openEditModal = (p: BusinessPartner) => {
    setEditingPartner(p);
    setParentReferrerCode(p.referredByPartnerCode || '');
    setNewResponseStatus(getPartnerResponseRating(p));
    setNewCommissionRate(p.commissionRate || 12);
    setEditNotes(p.notes || '');
    setSaveSuccessMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    setIsSavingEdit(true);
    setSaveSuccessMsg(null);

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
        }, 1000);
      } else {
        alert(json.message || 'Failed to update partner assignment.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating partner assignment.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // RECURSIVE VISUAL ORG-CHART NODE COMPONENT (Clean White Light Theme)
  const VisualDiagramTreeNode: React.FC<{ node: TreeNode; rankIndex?: number }> = ({ node, rankIndex }) => {
    const p = node.partner;
    const isCollapsed = Boolean(collapsedNodes[p.id]);
    const isMatched = matchesFilter(p);
    const hasChildren = node.children.length > 0;
    const rating = getPartnerResponseRating(p);
    const ratingCfg = RESPONSE_RATINGS[rating];

    const isTopInviter = rankIndex === 0;

    return (
      <div className="flex flex-col items-center relative">
        {/* WOMAN PARTNER NODE CARD */}
        <div 
          className={`relative z-10 w-72 sm:w-80 bg-white rounded-2xl border ${
            isTopInviter
              ? 'border-amber-400 shadow-lg ring-2 ring-amber-300/60'
              : hasChildren
              ? 'border-stone-300/90 shadow-md hover:border-amber-400 hover:shadow-xl'
              : 'border-stone-200 shadow-xs hover:border-stone-400'
          } ${!isMatched ? 'opacity-40' : ''} transition-all duration-300 p-4 font-sans text-stone-900`}
        >
          {/* Top Rank / Crown / Code Row */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-1.5">
              {isTopInviter ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>#1 Top Inviter</span>
                </span>
              ) : rankIndex !== undefined && rankIndex < 3 ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-800 border border-stone-300">
                  Top #{rankIndex + 1}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700">
                  Level {node.level}
                </span>
              )}

              <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {p.partnerCode}
              </span>
            </div>

            {/* Response Rating Tag */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ratingCfg.badgeBg} ${ratingCfg.border}`}>
              {ratingCfg.emoji} {ratingCfg.label}
            </span>
          </div>

          {/* Woman Profile Info */}
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl ${isTopInviter ? 'bg-gradient-to-br from-amber-500 to-rose-600' : 'bg-gradient-to-br from-stone-800 to-amber-700'} text-white font-black text-sm flex items-center justify-center shadow-md shrink-0`}>
              {p.fullName ? p.fullName.slice(0, 2).toUpperCase() : 'WB'}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-stone-900 truncate">
                {p.fullName || 'Woman Partner'}
              </h4>
              <p className="text-[11px] text-stone-500 truncate">
                {p.city || 'Jalgaon'}{p.state ? `, ${p.state}` : ''} • {p.phone || 'N/A'}
              </p>
            </div>
          </div>

          {/* Highlighted Invited Counter Badge */}
          <div className="mt-3 bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Users className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Invited Women Partners:</span>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-600 text-white font-black text-xs rounded-full shadow-xs">
              {node.children.length} Women
            </span>
          </div>

          {/* Financial Metrics */}
          <div className="mt-2 space-y-1 text-[11px] px-1 pt-1">
            <div className="flex items-center justify-between text-stone-600">
              <span>Commission Earned:</span>
              <span className="font-bold text-emerald-700">{formatINR(p.totalCommissionEarned)} ({p.commissionRate || 12}%)</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Direct Sales:</span>
              <span className="font-bold text-stone-900">{formatINR(p.totalSalesAmount)}</span>
            </div>
            {hasChildren && (
              <div className="flex items-center justify-between font-bold text-amber-800 pt-1 border-t border-stone-100">
                <span>Tree Downline Sales:</span>
                <span>{formatINR(node.totalTreeSales)}</span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(p.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-300 transition-colors cursor-pointer"
              >
                {isCollapsed ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>{isCollapsed ? 'Show' : 'Hide'} {node.children.length} Below</span>
              </button>
            ) : (
              <span className="text-[10px] text-stone-400 italic">No sub-referrals</span>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDetailPartner(p)}
                className="p-1 text-stone-500 hover:text-stone-900 rounded-md transition-colors text-[11px] font-bold cursor-pointer"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => openEditModal(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#9B111E] hover:bg-[#800d18] text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Re-assign</span>
              </button>
            </div>
          </div>
        </div>

        {/* DOWNWARD BRANCHING LINES & SUB-WOMEN GRID (CONNECTED DIRECTLY BELOW) */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical Connector Line Down from Parent Node */}
            <div className="w-0.5 h-8 bg-amber-500 shrink-0" />

            {/* Horizontal Stem Line Across All Children */}
            <div className="relative flex justify-center w-full">
              {node.children.length > 1 && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-amber-500"
                  style={{
                    width: `calc(100% - ${100 / node.children.length}%)`
                  }}
                />
              )}

              {/* Children Row directly underneath */}
              <div className="flex flex-row justify-center gap-6 sm:gap-10 w-full pt-8">
                {node.children.map(childNode => (
                  <div key={childNode.partner.id} className="relative flex flex-col items-center">
                    {/* Vertical Connector Line down to top of Child Node */}
                    <div className="absolute -top-8 w-0.5 h-8 bg-amber-500" />
                    <VisualDiagramTreeNode node={childNode} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout pageTitle="Woman Tree Network" breadcrumbs={[{ label: 'Women Partners', href: '/admin/partners' }, { label: 'Woman Tree' }]}>
      <div className="space-y-6 pb-12 font-sans text-stone-900 antialiased bg-stone-50/50 p-2 sm:p-4 rounded-3xl">
        
        {/* WHITE LIGHT HEADER BANNER */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Woman Tree & Top Referrer Leaderboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Woman Network Referral Tree
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Filter and view women who invited other women partners. See top inviters ranked by referral count, track downline sales, and re-assign parent referrers.
              </p>
            </div>

            {/* Quick Stats Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center min-w-[120px]">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Active Network Trees</span>
                <span className="text-xl font-black text-amber-900">{stats.activeTreeCount} Trees</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center min-w-[120px]">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Tree Sales</span>
                <span className="text-xl font-black text-emerald-900">{formatINR(stats.totalSales)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOP REFERRER LEADERBOARD SHOWCASE (MAIN PURPOSE: SEE WHICH WOMAN INVITED MOST WOMEN) */}
        {topInviters.length > 0 && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <span>Top Women Partners Leaderboard (Most Invited)</span>
                </h2>
                <p className="text-xs text-stone-500">Ranked by highest number of invited women partners</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                {topInviters.length} Active Referrers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topInviters.slice(0, 4).map((item, index) => {
                const ratingCfg = RESPONSE_RATINGS[item.rating];
                return (
                  <div 
                    key={item.partner.id}
                    className={`relative bg-stone-50/80 border ${
                      index === 0 
                        ? 'border-amber-400 bg-gradient-to-b from-amber-50/60 to-white shadow-md' 
                        : 'border-stone-200/80 hover:border-amber-300'
                    } rounded-2xl p-4 space-y-3 transition-all`}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shadow-xs ${
                        index === 0 
                          ? 'bg-amber-500 text-white' 
                          : index === 1 
                          ? 'bg-stone-300 text-stone-800' 
                          : index === 2 
                          ? 'bg-amber-700 text-white' 
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ratingCfg.badgeBg} ${ratingCfg.border}`}>
                        {ratingCfg.emoji} {ratingCfg.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-stone-900 truncate">
                        {item.partner.fullName}
                      </h4>
                      <p className="font-mono text-xs font-bold text-amber-700">
                        {item.partner.partnerCode} • {item.partner.city || 'Jalgaon'}
                      </p>
                    </div>

                    <div className="bg-white border border-stone-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-bold">Women Invited:</span>
                      <strong className="text-amber-800 font-black text-sm bg-amber-100 px-2 py-0.5 rounded-md">
                        {item.directInvitedCount} Women
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-600">
                      <span>Total Sales:</span>
                      <strong className="text-emerald-700">{formatINR(item.partner.totalSalesAmount)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS BAR (WHITE LIGHT UI) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search woman by name, code (e.g. WBP-PRIYA), phone, city..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Options */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              
              {/* Filter Toggle: Only Women with Referrals vs All Partners */}
              <button
                type="button"
                onClick={() => setOnlyWithReferrals(!onlyWithReferrals)}
                className={`px-3 py-2 rounded-xl font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  onlyWithReferrals
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 text-amber-600" />
                <span>{onlyWithReferrals ? 'Showing: Only Women with Referrals' : 'Showing: All Partners'}</span>
              </button>

              {/* Response Rating Filter */}
              <select
                value={selectedRatingFilter}
                onChange={e => setSelectedRatingFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="all">All Response Ratings</option>
                <option value="poor">🔴 Poor Response</option>
                <option value="average">🟠 Average Response</option>
                <option value="good">🟡 Good Response</option>
                <option value="excellent">🟢 Excellent Response</option>
                <option value="outstanding">💎 Outstanding Response</option>
              </select>

              {/* Sort By Criteria */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="invited">Sort: Most Invited Women First</option>
                <option value="sales">Sort: Highest Tree Sales</option>
                <option value="name">Sort: Partner Name A-Z</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setViewMode('diagram')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'diagram' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Tree Diagram
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('leaderboard')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'leaderboard' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Leaderboard
                </button>
              </div>

              {/* Zoom Controls */}
              {viewMode === 'diagram' && (
                <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button type="button" onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className="p-1 hover:bg-stone-200 rounded-lg">
                    <ZoomOut className="w-4 h-4 text-stone-700" />
                  </button>
                  <span className="text-[11px] font-bold px-1.5 min-w-[36px] text-center">{zoomLevel}%</span>
                  <button type="button" onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))} className="p-1 hover:bg-stone-200 rounded-lg">
                    <ZoomIn className="w-4 h-4 text-stone-700" />
                  </button>
                </div>
              )}

              <button type="button" onClick={expandAll} className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl" title="Expand All">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button type="button" onClick={collapseAll} className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl" title="Collapse All">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => fetchPartners(true)} disabled={isRefreshing} className="p-2 bg-stone-100 text-stone-700 rounded-xl disabled:opacity-50" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN TREE DISPLAY CANVAS (CLEAN WHITE LIGHT UI) */}
        {isLoading ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-stone-700">Loading Woman Referral Tree Network...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-800">{error}</p>
          </div>
        ) : treeData.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <Users className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">No Referral Network Trees Found</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {onlyWithReferrals 
                ? 'No women partners currently have sub-referrals assigned. Click "Showing: All Partners" to view standalone partners or re-assign referrers.' 
                : 'No partners match your current filter criteria.'}
            </p>
            {onlyWithReferrals && (
              <button
                type="button"
                onClick={() => setOnlyWithReferrals(false)}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Show All Partners
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* MODE 1: VISUAL TREE DIAGRAM (WHITE CANVAS WITH GOLD BRANCH STEMS) */}
            {viewMode === 'diagram' && (
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 overflow-x-auto shadow-sm">
                <div 
                  className="min-w-max flex flex-col items-center gap-16 transition-transform duration-200 origin-top"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {treeData.map((rootNode, rankIdx) => (
                    <VisualDiagramTreeNode key={rootNode.partner.id} node={rootNode} rankIndex={rankIdx} />
                  ))}
                </div>
              </div>
            )}

            {/* MODE 2: LEADERBOARD DETAILED LIST */}
            {viewMode === 'leaderboard' && (
              <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between font-bold text-xs text-stone-700">
                  <span>Women Partners Ranked by Direct Referrals</span>
                  <span>{topInviters.length} Active Inviters</span>
                </div>
                <div className="divide-y divide-stone-100">
                  {topInviters.map((item, idx) => {
                    const ratingCfg = RESPONSE_RATINGS[item.rating];
                    return (
                      <div key={item.partner.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-stone-50/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 border border-amber-300">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-stone-900 text-sm">{item.partner.fullName}</h4>
                            <p className="text-stone-500">{item.partner.partnerCode} • {item.partner.city || 'Jalgaon'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-stone-500 block text-[10px]">Direct Referrals</span>
                            <strong className="text-amber-800 font-black text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{item.directInvitedCount} Women</strong>
                          </div>
                          <div className="text-right">
                            <span className="text-stone-500 block text-[10px]">Direct Sales</span>
                            <strong className="text-stone-900">{formatINR(item.partner.totalSalesAmount)}</strong>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ratingCfg.badgeBg} ${ratingCfg.border}`}>
                            {ratingCfg.emoji} {ratingCfg.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditModal(item.partner)}
                            className="px-3 py-1.5 bg-[#9B111E] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            Re-assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: RE-ASSIGN WOMAN & EDIT RESPONSE RATING */}
        <AnimatePresence>
          {editingPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-stone-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
              >
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      Re-assign Woman & Response Rating
                    </h3>
                    <p className="text-xs text-stone-500">
                      Editing <strong className="text-stone-800">{editingPartner.fullName}</strong> ({editingPartner.partnerCode})
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditingPartner(null)} className="p-1 text-stone-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {saveSuccessMsg && (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 block">
                      Assign Referred By (Parent Woman Partner)
                    </label>
                    <select
                      value={parentReferrerCode}
                      onChange={e => setParentReferrerCode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- None (Independent Root) --</option>
                      {partners
                        .filter(p => p.id !== editingPartner.id)
                        .map(p => (
                          <option key={p.id} value={p.partnerCode}>
                            {p.fullName} ({p.partnerCode}) - {p.city || 'Jalgaon'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 block">
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
                            className={`p-2 rounded-xl border text-left flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? `${r.badgeBg} ${r.border} ring-2 ring-amber-500/50 font-black`
                                : 'bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-xs">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-800 block">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newCommissionRate}
                      onChange={e => setNewCommissionRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setEditingPartner(null)} className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSavingEdit} className="px-5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5">
                      {isSavingEdit && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Save Tree Assignment</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DETAIL PROFILE MODAL */}
        <AnimatePresence>
          {selectedDetailPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
              >
                <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-stone-900">{selectedDetailPartner.fullName}</h3>
                    <p className="text-xs text-amber-700 font-mono font-bold">{selectedDetailPartner.partnerCode}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedDetailPartner(null)} className="p-1 text-stone-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-stone-600">Sales: <strong>{formatINR(selectedDetailPartner.totalSalesAmount)}</strong></p>
                  <p className="text-stone-600">Commission Earned: <strong className="text-emerald-700">{formatINR(selectedDetailPartner.totalCommissionEarned)}</strong></p>
                  <p className="text-stone-600">Phone: <strong>{selectedDetailPartner.phone}</strong></p>
                  <p className="text-stone-600">City: <strong>{selectedDetailPartner.city || 'Jalgaon'}</strong></p>
                </div>
                <div className="pt-2 text-right">
                  <button type="button" onClick={() => setSelectedDetailPartner(null)} className="px-4 py-2 bg-stone-900 text-white font-bold rounded-xl cursor-pointer">Close</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
