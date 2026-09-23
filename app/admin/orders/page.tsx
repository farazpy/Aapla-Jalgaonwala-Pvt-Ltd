'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Order, BusinessPartner } from '@/types';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  Phone,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Download,
  Mail,
  ChevronDown,
  X,
  Filter,
  Truck,
  MapPin,
  Navigation,
  Users,
  FileText,
  ArrowRightLeft,
  UserCheck,
  UserPlus,
  Coins,
  Percent,
  Check,
  Sparkles,
  Copy,
  ExternalLink,
  Code
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ShipmentTrackerMap } from '@/components/common/ShipmentTrackerMap';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { formatDisplayName } from '@/utils/transliterate';
import { formatDtdcDate, formatDtdcTime } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingTracking, setIsSyncingTracking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Bulk Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('Processing');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showDeleteCancelledConfirm, setShowDeleteCancelledConfirm] = useState(false);
  const [isDeletingCancelled, setIsDeletingCancelled] = useState(false);

  // AWB / Tracking State
  const [awbModalOrder, setAwbModalOrder] = useState<Order | null>(null);
  const [awbInput, setAwbInput] = useState('');
  const [isSavingAwb, setIsSavingAwb] = useState(false);
  const [isValidatingAwb, setIsValidatingAwb] = useState(false);
  const [awbValidation, setAwbValidation] = useState<{
    testedAwb: string;
    isValid: boolean;
    error?: string;
    details?: {
      shipmentNo?: string;
      origin?: string;
      destination?: string;
      status?: string;
      bookedDate?: string;
      expectedDelivery?: string;
    };
  } | null>(null);

  // Invoice Modal for Admin View & Download
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Live Map Modal for Admin
  const [adminTrackingOrder, setAdminTrackingOrder] = useState<Order | null>(null);
  const [adminTrackingData, setAdminTrackingData] = useState<any>(null);
  const [isAdminTrackingLoading, setIsAdminTrackingLoading] = useState(false);
  const [activeTrackingAwb, setActiveTrackingAwb] = useState<string>('');
  const [customAwbInput, setCustomAwbInput] = useState<string>('');
  const [showRawJsonModal, setShowRawJsonModal] = useState<boolean>(false);
  const [copiedTrackingJson, setCopiedTrackingJson] = useState<boolean>(false);
  const [copiedAwbModal, setCopiedAwbModal] = useState<boolean>(false);
  const [trackingSortOrder, setTrackingSortOrder] = useState<'latest_first' | 'oldest_first'>('latest_first');

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Woman Partner Referral & Commission Transfer State
  const [transferModalOrder, setTransferModalOrder] = useState<Order | null>(null);
  const [partnersList, setPartnersList] = useState<BusinessPartner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [selectedPartnerCode, setSelectedPartnerCode] = useState('');
  const [customCommission, setCustomCommission] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [notifyPartnerToggle, setNotifyPartnerToggle] = useState(true);
  const [partnerFilterQuery, setPartnerFilterQuery] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const showToast = (message: any, type: 'success' | 'error' = 'success') => {
    const safeMsg = typeof message === 'string'
      ? message
      : (message?.message || message?.error?.message || (typeof message === 'object' ? JSON.stringify(message) : String(message)));
    setToast({ message: safeMsg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/orders');
        const json = await res.json();
        if (!ignore && json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    // Exclude cancelled orders from total revenue calculations
    const totalRevenue = orders
      .filter((o) => String(o.status || '').toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const pending = orders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s === 'pending' || s === 'processing';
    }).length;
    const delivered = orders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s === 'delivered' || s === 'completed';
    }).length;
    const cancelled = orders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s === 'cancelled';
    }).length;
    return { total, totalRevenue, pending, delivered, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer?.phone?.includes(searchQuery) ||
        o.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.referralPartnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.referralPartnerCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.couponCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const s = String(o.status || '').toLowerCase();
      const matchStatus = statusFilter === 'all' || s === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Check if any orders have partial payment / COD advance paid
  const hasPartiallyPaidOrders = useMemo(() => {
    return orders.some((o) => {
      const ps = (o.paymentStatus || '').toLowerCase();
      return ps === 'partial paid' || ps === 'partially paid' || ((o.codAdvanceFeePaid || 0) > 0 && ps !== 'paid');
    });
  }, [orders]);

  // Bulk Selection Handlers
  const isAllSelected = useMemo(() => {
    if (filteredOrders.length === 0) return false;
    return filteredOrders.every((o) => selectedOrderIds.includes(o.id));
  }, [filteredOrders, selectedOrderIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status Change Handler for single order
  const handleSingleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
        showToast(`Order status updated to ${newStatus}. Notification email sent to customer!`);
      } else {
        showToast(json.error || 'Failed to update order status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating order status', 'error');
    }
  };

  // Live DTDC Tracking Validator
  const handleValidateAwb = async (awbToTest?: string): Promise<boolean> => {
    const target = (awbToTest !== undefined ? awbToTest : awbInput).trim().toUpperCase();
    if (!target) {
      setAwbValidation({
        testedAwb: '',
        isValid: false,
        error: 'Please enter a DTDC consignment tracking number.'
      });
      return false;
    }

    if (target.length < 8 || target.length > 15) {
      setAwbValidation({
        testedAwb: target,
        isValid: false,
        error: `Invalid format: DTDC consignment numbers must be 8-15 alphanumeric characters (entered ${target.length}).`
      });
      return false;
    }

    if (!/^[A-Z0-9]+$/.test(target)) {
      setAwbValidation({
        testedAwb: target,
        isValid: false,
        error: 'Invalid format: Only letters and numbers are permitted in DTDC tracking numbers.'
      });
      return false;
    }

    setIsValidatingAwb(true);
    try {
      const res = await fetch('/api/tracking/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awb: target })
      });
      const data = await res.json();
      if (res.ok && data.success && data.isValid) {
        setAwbValidation({
          testedAwb: target,
          isValid: true,
          details: data.details
        });
        return true;
      } else {
        setAwbValidation({
          testedAwb: target,
          isValid: false,
          error: data.error || 'Consignment not found on DTDC tracking network.'
        });
        return false;
      }
    } catch (err: any) {
      setAwbValidation({
        testedAwb: target,
        isValid: false,
        error: 'Connection error while validating with DTDC service. Please try again.'
      });
      return false;
    } finally {
      setIsValidatingAwb(false);
    }
  };

  const handleSaveAwb = async () => {
    if (!awbModalOrder) return;
    const trimmedAwb = awbInput.trim().toUpperCase();
    if (!trimmedAwb) {
      showToast('Please enter a DTDC tracking number', 'error');
      return;
    }

    // Must be strictly verified with DTDC before saving
    let isCurrentlyValid = false;
    if (awbValidation && awbValidation.testedAwb === trimmedAwb && awbValidation.isValid) {
      isCurrentlyValid = true;
    } else {
      isCurrentlyValid = await handleValidateAwb(trimmedAwb);
    }

    if (!isCurrentlyValid) {
      showToast('Cannot add: Tracking number is invalid or not registered on DTDC network', 'error');
      return;
    }

    setIsSavingAwb(true);
    try {
      const trackingUrl = `https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${trimmedAwb}`;
      const res = await fetch(`/api/orders/${awbModalOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          awbNumber: trimmedAwb, 
          courierName: 'DTDC',
          trackingUrl,
          status: 'Shipped' 
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === awbModalOrder.id ? { 
            ...o, 
            awbNumber: trimmedAwb, 
            courierName: 'DTDC',
            trackingUrl,
            status: 'Shipped' 
          } : o))
        );
        showToast(`DTDC Tracking #${trimmedAwb} verified & assigned! Order marked as Shipped.`);
        setAwbModalOrder(null);
        setAwbInput('');
        setAwbValidation(null);
      } else {
        showToast(json.error || 'Failed to save tracking number', 'error');
        setAwbValidation({
          testedAwb: trimmedAwb,
          isValid: false,
          error: json.error || 'Failed to save tracking number.'
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving tracking number', 'error');
    } finally {
      setIsSavingAwb(false);
    }
  };

  // Bulk Status Change Handler
  const handleBulkStatusChange = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch('/api/orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          status: bulkStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) =>
            selectedOrderIds.includes(o.id) ? { ...o, status: bulkStatus as any } : o
          )
        );
        showToast(`🎉 ${json.data?.count || selectedOrderIds.length} orders updated to '${bulkStatus}'. Customer update emails triggered!`);
        setSelectedOrderIds([]);
      } else {
        showToast(json.error || 'Failed bulk status update', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error executing bulk status update', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    const idsToDelete = orderToDelete ? [orderToDelete] : selectedOrderIds;
    if (idsToDelete.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: idsToDelete })
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) => prev.filter((o) => !idsToDelete.includes(o.id)));
        setSelectedOrderIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
        showToast(`Deleted ${json.data?.count || idsToDelete.length} order(s) permanently.`);
      } else {
        showToast(json.error || 'Failed bulk delete', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error executing bulk delete', 'error');
    } finally {
      setIsBulkDeleting(false);
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  // 1-Click Delete All Cancelled Orders Handler
  const handleDeleteAllCancelled = async () => {
    const cancelledOrders = orders.filter((o) => String(o.status || '').toLowerCase() === 'cancelled');
    const idsToDelete = cancelledOrders.map((o) => o.id);
    if (idsToDelete.length === 0) {
      showToast('No cancelled orders found to delete', 'error');
      setShowDeleteCancelledConfirm(false);
      return;
    }

    setIsDeletingCancelled(true);
    try {
      const res = await fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: idsToDelete })
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) => prev.filter((o) => !idsToDelete.includes(o.id)));
        setSelectedOrderIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
        showToast(`Permanently deleted ${json.data?.count || idsToDelete.length} cancelled order(s).`);
      } else {
        showToast(json.error || 'Failed to delete cancelled orders', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error executing delete', 'error');
    } finally {
      setIsDeletingCancelled(false);
      setShowDeleteCancelledConfirm(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const listToExport = selectedOrderIds.length > 0
      ? orders.filter((o) => selectedOrderIds.includes(o.id))
      : filteredOrders;

    if (listToExport.length === 0) {
      showToast('No orders available to export', 'error');
      return;
    }

    const headers = [
      'Order Code',
      'Date',
      'Customer Name',
      'Phone',
      'Email',
      'Subtotal (INR)',
      'Discount (INR)',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Advance Paid (INR)',
      'Cash to Collect (INR)',
      'Order Status'
    ];
    const rows = listToExport.map((o) => {
      const subtotal = Number(o.subtotal) || (o.items ? o.items.reduce((acc, it) => acc + (it.price * it.quantity), 0) : 0);
      let discount = Number(o.discount) || 0;
      if (discount === 0 && (o.referralPartnerCode || o.couponCode || (o.notes && /Discount from/i.test(o.notes)))) {
        discount = Math.round(subtotal * 0.04);
      }
      const advancePaid = Number(o.codAdvanceFeePaid) || 0;
      const remainingCash = (o.paymentStatus === 'Paid')
        ? 0
        : (advancePaid > 0
            ? (o.codRemainingBalance !== undefined ? Number(o.codRemainingBalance) : Math.max(0, o.totalAmount - advancePaid))
            : (o.paymentMethod === 'COD' ? o.totalAmount : 0));

      return [
        `"${o.orderNumber || o.id}"`,
        `"${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}"`,
        `"${(o.customer?.name || 'Guest').replace(/"/g, '""')}"`,
        `"${o.customer?.phone || ''}"`,
        `"${o.customer?.email || ''}"`,
        subtotal,
        discount,
        o.totalAmount,
        `"${o.paymentMethod || 'COD'}"`,
        `"${o.paymentStatus || 'Pending'}"`,
        advancePaid,
        remainingCash,
        `"${o.status || 'Pending'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} order(s) to CSV!`);
  };

  // DTDC Courier Sync Handler
  const handleSyncTracking = async () => {
    setIsSyncingTracking(true);
    try {
      const res = await fetch('/api/tracking/cron/sync-all');
      const json = await res.json();
      if (json.success) {
        showToast(`DTDC Tracking Synced: ${json.summary?.updated || 0} order(s) updated, ${json.summary?.notified || 0} customer(s) notified!`);
        await fetchOrders(false);
      } else {
        showToast(json.error || 'Failed to sync with DTDC tracking', 'error');
      }
    } catch (err) {
      console.error('Error syncing tracking:', err);
      showToast('Server error executing DTDC courier sync', 'error');
    } finally {
      setIsSyncingTracking(false);
    }
  };

  // Open Admin Tracking & Map Inspector Modal
  const handleOpenAdminTrackingModal = async (order: Order, customAwb?: string) => {
    const targetAwb = (customAwb || order.awbNumber || '').trim();
    setAdminTrackingOrder(order);
    setActiveTrackingAwb(targetAwb);
    setCustomAwbInput(targetAwb);
    setAdminTrackingData(null);
    setShowRawJsonModal(false);
    if (!targetAwb) return;

    setIsAdminTrackingLoading(true);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(targetAwb)}`);
      const json = await res.json();
      setAdminTrackingData(json);
      if (json.success && json.mappedStatus && json.mappedStatus !== order.status) {
        setAdminTrackingOrder((prev) => prev ? { ...prev, status: json.mappedStatus } : prev);
        fetchOrders(false);
      }
    } catch (err) {
      console.error('Error fetching tracking for modal:', err);
      showToast('Error connecting to DTDC tracking API', 'error');
    } finally {
      setIsAdminTrackingLoading(false);
    }
  };

  const handleFetchCustomAwb = async (awbToFetch: string) => {
    const clean = awbToFetch.trim();
    if (!clean) {
      showToast('Please enter a valid DTDC AWB consignment number', 'error');
      return;
    }
    setActiveTrackingAwb(clean);
    setIsAdminTrackingLoading(true);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(clean)}`);
      const json = await res.json();
      setAdminTrackingData(json);
      if (json.success) {
        showToast(`Loaded live DTDC data for AWB ${clean}`, 'success');
        if (adminTrackingOrder && json.mappedStatus && json.mappedStatus !== adminTrackingOrder.status) {
          setAdminTrackingOrder((prev) => prev ? { ...prev, status: json.mappedStatus } : prev);
          fetchOrders(false);
        }
      } else {
        showToast(json.error || `No consignment records found on DTDC network for ${clean}`, 'error');
      }
    } catch (err) {
      console.error('Error querying custom AWB:', err);
      showToast('Failed to fetch from DTDC tracking service', 'error');
    } finally {
      setIsAdminTrackingLoading(false);
    }
  };

  // Open Transfer Referral Modal
  const handleOpenTransferModal = async (order: Order) => {
    setTransferModalOrder(order);
    setSelectedPartnerCode(order.referralPartnerCode || '');
    setTransferReason('');
    setNotifyPartnerToggle(true);
    setPartnerFilterQuery('');

    // Pre-calculate default 12% commission
    const defaultAmt = Math.round(Number(order.totalAmount || 0) * 0.12);
    setCustomCommission(String(defaultAmt));

    if (partnersList.length === 0) {
      setIsLoadingPartners(true);
      try {
        const res = await fetch('/api/partner-program/partners');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPartnersList(json.data);
          if (order.referralPartnerCode) {
            const currentP = json.data.find((p: BusinessPartner) => p.partnerCode.toUpperCase() === order.referralPartnerCode?.toUpperCase());
            if (currentP) {
              const currentAmt = Math.round(Number(order.totalAmount || 0) * ((currentP.commissionRate || 12) / 100));
              setCustomCommission(String(currentAmt));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load woman partners list:', err);
      } finally {
        setIsLoadingPartners(false);
      }
    } else if (order.referralPartnerCode) {
      const currentP = partnersList.find(p => p.partnerCode.toUpperCase() === order.referralPartnerCode?.toUpperCase());
      if (currentP) {
        const currentAmt = Math.round(Number(order.totalAmount || 0) * ((currentP.commissionRate || 12) / 100));
        setCustomCommission(String(currentAmt));
      }
    }
  };

  const handleSelectPartner = (partner: BusinessPartner) => {
    setSelectedPartnerCode(partner.partnerCode);
    if (transferModalOrder) {
      const rate = partner.commissionRate || 12;
      const calc = Math.round(Number(transferModalOrder.totalAmount || 0) * (rate / 100));
      setCustomCommission(String(calc));
    }
  };

  const handleSetCommissionPreset = (percentage: number) => {
    if (transferModalOrder) {
      const calc = Math.round(Number(transferModalOrder.totalAmount || 0) * (percentage / 100));
      setCustomCommission(String(calc));
    }
  };

  const handleExecuteTransfer = async () => {
    if (!transferModalOrder) return;
    if (!selectedPartnerCode) {
      showToast('Please select a woman partner to transfer this order to.', 'error');
      return;
    }

    const commissionNum = Number(customCommission);
    if (isNaN(commissionNum) || commissionNum < 0) {
      showToast('Please enter a valid commission amount in Rupees.', 'error');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch(`/api/orders/${transferModalOrder.id}/transfer-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPartnerCode: selectedPartnerCode,
          commissionAmount: commissionNum,
          reason: transferReason,
          notifyPartner: notifyPartnerToggle
        })
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Order and commission successfully transferred!', 'success');
        setTransferModalOrder(null);
        await fetchOrders();
      } else {
        showToast(json.error || 'Failed to transfer order referral', 'error');
      }
    } catch (err: any) {
      console.error('Error executing referral transfer:', err);
      showToast(err?.message || 'Network error while transferring referral', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const filteredPartners = useMemo(() => {
    if (!partnerFilterQuery.trim()) return partnersList;
    const q = partnerFilterQuery.trim().toLowerCase();
    return partnersList.filter(
      p =>
        (p.fullName && p.fullName.toLowerCase().includes(q)) ||
        (p.partnerCode && p.partnerCode.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q))
    );
  }, [partnersList, partnerFilterQuery]);

  const targetPartnerData = useMemo(() => {
    return partnersList.find(p => p.partnerCode.toUpperCase() === selectedPartnerCode.toUpperCase()) || null;
  }, [partnersList, selectedPartnerCode]);

  const currentOrderPartnerData = useMemo(() => {
    if (!transferModalOrder?.referralPartnerCode) return null;
    return partnersList.find(p => p.partnerCode.toUpperCase() === transferModalOrder.referralPartnerCode?.toUpperCase()) || null;
  }, [partnersList, transferModalOrder]);

  return (
    <AdminLayout
      pageTitle="Orders Management"
      breadcrumbs={[
        { label: 'Sales & Catalog', href: '/admin' },
        { label: 'Orders' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncTracking}
            disabled={isSyncingTracking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#9B111E]/20 bg-[#9B111E]/10 hover:bg-[#9B111E]/15 rounded-lg text-xs font-bold text-[#9B111E] transition-colors shadow-2xs cursor-pointer"
            title="Auto-check DTDC for all non-delivered orders, update status & GPS, and notify customers"
          >
            <Truck className={`w-3.5 h-3.5 ${isSyncingTracking ? 'animate-bounce text-[#9B111E]' : 'text-[#9B111E]'}`} />
            <span>{isSyncingTracking ? 'Syncing DTDC...' : 'Sync DTDC'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
            title="Export orders list to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => fetchOrders(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : 'bg-stone-900 text-white border-stone-800'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-stone-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-xl font-bold text-stone-900 mt-0.5">{stats.total}</h3>
              <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-bold border border-stone-200 mt-1 inline-block">
                All-time registered
              </span>
            </div>
            <div className="w-9 h-9 bg-[#e1e3e5]/40 rounded-lg flex items-center justify-center text-stone-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-xl font-bold text-[#9B111E] mt-0.5">₹{stats.totalRevenue}</h3>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100 mt-1 inline-block">
                Excl. Cancelled
              </span>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Pending Orders</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">{stats.pending}</h3>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100 mt-1 inline-block">
                Awaiting dispatch
              </span>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Delivered / Complete</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{stats.delivered}</h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100 mt-1 inline-block">
                Fulfilled
              </span>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              statusFilter === 'cancelled'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-white border-[#e1e3e5] hover:border-rose-200'
            }`}
          >
            <div>
              <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Cancelled Orders</p>
              <h3 className="text-xl font-bold text-rose-700 mt-0.5">{stats.cancelled}</h3>
              <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold border border-rose-200 mt-1 inline-block">
                View Cancelled
              </span>
            </div>
            <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Filter Controls & Direct Status Tabs */}
        <div className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, phone, #order..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar mask-edges-right pb-1 md:pb-0">
              {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === st
                      ? st === 'cancelled'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'bg-[#9B111E] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st === 'all' 
                    ? `All (${stats.activeCount})` 
                    : st === 'cancelled' 
                      ? `Cancelled (${stats.cancelled})` 
                      : st}
                </button>
              ))}

              {/* 1-Click Delete Cancelled Orders button */}
              {stats.cancelled > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteCancelledConfirm(true)}
                  disabled={isDeletingCancelled}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer md:ml-2 animate-in fade-in whitespace-nowrap shrink-0"
                  title="Permanently delete all cancelled orders"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Cancelled ({stats.cancelled})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informative Banner when Cancelled filter is selected */}
        {statusFilter === 'cancelled' && (
          <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">
                Showing {filteredOrders.length} Cancelled Order(s). Cancelled orders are hidden by default from the All orders view.
              </span>
            </div>
            {stats.cancelled > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteCancelledConfirm(true)}
                disabled={isDeletingCancelled}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Cancelled Orders</span>
              </button>
            )}
          </div>
        )}

        {/* FLOATING BULK EDIT BAR */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-stone-900 text-white p-4 rounded-xl shadow-xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#9B111E] text-white font-extrabold text-xs rounded-lg shadow-2xs">
                {selectedOrderIds.length} Selected
              </span>
              <p className="text-xs text-stone-300 font-medium hidden sm:block">
                Choose an action to perform on all selected orders:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Status Selector */}
              <div className="flex items-center gap-1.5 bg-stone-800 border border-stone-700 rounded-lg p-1">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="Pending" className="bg-stone-900 text-white">Status: Pending</option>
                  <option value="Confirmed" className="bg-stone-900 text-white">Status: Confirmed</option>
                  <option value="Processing" className="bg-stone-900 text-white">Status: Processing</option>
                  <option value="Shipped" className="bg-stone-900 text-white">Status: Shipped</option>
                  <option value="Delivered" className="bg-stone-900 text-white">Status: Delivered</option>
                  <option value="Cancelled" className="bg-stone-900 text-white">Status: Cancelled</option>
                </select>

                <button
                  type="button"
                  onClick={handleBulkStatusChange}
                  disabled={isBulkUpdating}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isBulkUpdating ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Mail className="w-3 h-3" />
                  )}
                  <span>Apply & Email Customers</span>
                </button>
              </div>

              {/* Bulk Delete Button */}
              <button
                type="button"
                onClick={() => {
                  setOrderToDelete(null);
                  setShowDeleteModal(true);
                }}
                className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedOrderIds.length})</span>
              </button>

              {/* Deselect All Button */}
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-2.5 py-2 text-stone-400 hover:text-white text-xs font-bold transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="bg-stone-50 border-b border-[#e1e3e5] text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#9B111E]" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Order Code</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Woman Partner & Discount</th>
                  <th className="p-4">Total & Breakdown</th>
                  <th className="p-4">Payment</th>
                  {hasPartiallyPaidOrders && (
                    <th className="p-4 bg-amber-50/70 text-amber-900 border-l border-r border-amber-200/80">Cash to Collect</th>
                  )}
                  <th className="p-4">Status & Update</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5] font-medium text-stone-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={hasPartiallyPaidOrders ? 9 : 8} className="p-12 text-center text-stone-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 font-semibold">
                          <div className="w-5 h-5 border-2 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
                          <span>Loading orders...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                          <p className="font-bold text-stone-800">No orders found</p>
                          <p className="text-xs text-stone-400">Orders placed by customers will appear here automatically</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isSelected = selectedOrderIds.includes(o.id);
                    const subtotal = Number(o.subtotal) || (o.items ? o.items.reduce((acc, it) => acc + (it.price * it.quantity), 0) : 0);
                    let discount = Number(o.discount) || 0;
                    if (discount === 0 && (o.referralPartnerCode || o.couponCode || (o.notes && /Discount from/i.test(o.notes)))) {
                      discount = Math.round(subtotal * 0.04);
                    }
                    const advancePaid = Number(o.codAdvanceFeePaid) || 0;
                    const remainingCash = (o.paymentStatus === 'Paid')
                      ? 0
                      : (advancePaid > 0
                          ? (o.codRemainingBalance !== undefined ? Number(o.codRemainingBalance) : Math.max(0, o.totalAmount - advancePaid))
                          : (o.paymentMethod === 'COD' ? o.totalAmount : 0));

                    return (
                      <tr
                        key={o.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-amber-50/60' : 'hover:bg-stone-50/50'
                        }`}
                      >
                        <td className="p-4 w-10">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(o.id)}
                            className="text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#9B111E]" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-300" />
                            )}
                          </button>
                        </td>

                        <td className="p-4 font-bold text-stone-900">
                          <div className="flex items-center gap-1.5">
                            <span>#{o.orderNumber || o.id.substring(0, 8)}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-normal block mt-0.5">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-stone-950">
                            {formatDisplayName(o.customer?.name, 'Guest Customer')}
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-stone-400" />
                            <span>{o.customer?.phone || 'No phone'}</span>
                          </div>
                          {o.customer?.email && (
                            <div className="text-[10px] text-stone-400 truncate max-w-[160px]">
                              {o.customer.email}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          {o.referralPartnerName || o.referralPartnerCode ? (
                            <div className="flex flex-col items-start gap-1">
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-[#9B111E] font-bold text-[11px] border border-rose-200 shadow-2xs"
                                title={o.referralPartnerName || o.referralPartnerCode || 'Woman Partner'}
                              >
                                <Users className="w-3 h-3 text-[#9B111E] shrink-0" />
                                <span className="truncate max-w-[150px]">
                                  {formatDisplayName(o.referralPartnerName, o.referralPartnerCode)}
                                </span>
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {o.referralPartnerCode && (
                                  <span className="text-[10px] font-mono text-stone-500 font-bold ml-1">
                                    Ref: {o.referralPartnerCode}
                                  </span>
                                )}
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  4% Partner Disc
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenTransferModal(o)}
                                className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-[#9B111E] text-[10px] font-bold border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Change assigned woman partner and transfer commission"
                              >
                                <ArrowRightLeft className="w-2.5 h-2.5 text-stone-500 hover:text-[#9B111E]" />
                                <span>Change Partner</span>
                              </button>
                            </div>
                          ) : o.couponCode ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-200">
                                Coupon: {o.couponCode}
                              </span>
                              {discount > 0 && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  -₹{discount} OFF
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenTransferModal(o)}
                                className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-[#9B111E] text-[10px] font-bold border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Assign to a Woman Partner & credit commission"
                              >
                                <UserPlus className="w-2.5 h-2.5 text-stone-500 hover:text-[#9B111E]" />
                                <span>Assign Partner</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-stone-400 text-[11px] font-normal italic">Direct Order</span>
                              <button
                                type="button"
                                onClick={() => handleOpenTransferModal(o)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-[#9B111E] text-[10px] font-bold border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Assign to a Woman Partner & credit commission"
                              >
                                <UserPlus className="w-2.5 h-2.5 text-stone-500 hover:text-[#9B111E]" />
                                <span>Assign Partner</span>
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-extrabold text-[#9B111E] text-sm">
                            ₹{o.totalAmount}
                          </div>
                          {discount > 0 ? (
                            <div className="mt-0.5 space-y-0.5">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                -₹{discount} (4% OFF)
                              </span>
                              <div className="text-[10px] text-stone-400 font-medium">
                                Sub: ₹{subtotal}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-stone-400 font-medium mt-0.5">
                              Sub: ₹{subtotal || o.totalAmount}
                            </div>
                          )}
                          <div className="text-[10px] text-stone-400 font-normal">
                            {o.items ? `${o.items.length} items` : ''}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 rounded bg-stone-100 font-bold uppercase text-[9px] border border-stone-200 text-stone-700">
                              {o.paymentMethod || 'COD'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              o.paymentStatus === 'Partial Paid' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              o.paymentStatus === 'Failed' || o.paymentStatus === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {o.paymentStatus || (o.status === 'Cancelled' ? 'Cancelled' : 'Payment Pending')}
                            </span>
                            {advancePaid > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700">
                                Paid: ₹{advancePaid}
                              </span>
                            )}
                          </div>
                        </td>

                        {hasPartiallyPaidOrders && (
                          <td className="p-4 bg-amber-50/25 border-l border-r border-amber-200/50 font-mono">
                            {o.paymentStatus === 'Partial Paid' || advancePaid > 0 ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100/90 text-amber-950 font-black text-xs border border-amber-300 shadow-2xs">
                                  ₹{remainingCash}
                                </span>
                                <span className="text-[10px] text-amber-800/80 font-bold">
                                  Due on Delivery
                                </span>
                              </div>
                            ) : o.paymentStatus === 'Paid' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                ₹0 (Paid Full)
                              </span>
                            ) : o.paymentMethod === 'COD' ? (
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="font-bold text-stone-900 text-xs">
                                  ₹{o.totalAmount}
                                </span>
                                <span className="text-[10px] text-stone-400">Full COD</span>
                              </div>
                            ) : (
                              <span className="text-stone-400 text-xs italic">N/A</span>
                            )}
                          </td>
                        )}

                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <select
                              value={o.status || 'Pending'}
                              onChange={(e) => handleSingleStatusChange(o.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#9B111E] cursor-pointer ${
                                String(o.status || '').toLowerCase() === 'cancelled'
                                  ? 'border-rose-300 text-rose-700 bg-rose-50/50'
                                  : 'border-stone-200 text-stone-800'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            {/* Small direct button to delete cancelled order with Yes/No confirmation */}
                            {String(o.status || '').toLowerCase() === 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderToDelete(o.id);
                                  setShowDeleteModal(true);
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                title="Delete this cancelled order"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {o.awbNumber && (
                              <button
                                type="button"
                                onClick={() => handleOpenAdminTrackingModal(o)}
                                className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 inline-flex items-center gap-1 transition-colors text-xs font-bold"
                                title="View Live GPS Map & Courier Timeline"
                              >
                                <Navigation className="w-3.5 h-3.5 text-purple-600" />
                                <span className="hidden sm:inline">Track</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setAwbModalOrder(o);
                                setAwbInput(o.awbNumber || '');
                                setAwbValidation(null);
                              }}
                              className={`p-1.5 rounded-lg border inline-flex items-center gap-1 transition-colors text-xs font-bold ${
                                o.awbNumber 
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' 
                                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                              }`}
                              title={o.awbNumber ? `AWB: ${o.awbNumber}` : "Assign DTDC AWB"}
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{o.awbNumber ? 'AWB' : 'Ship'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceOrder(o)}
                              className="p-1.5 text-stone-700 hover:text-[#9B111E] bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 inline-flex items-center gap-1 transition-colors text-xs font-bold cursor-pointer"
                              title="View & Download Official Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#9B111E]" />
                              <span className="hidden sm:inline">Invoice</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenTransferModal(o)}
                              className="p-1.5 text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 inline-flex items-center gap-1 transition-colors text-xs font-bold cursor-pointer"
                              title="Change Woman Referral / Transfer Commission"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                              <span className="hidden sm:inline">Transfer</span>
                            </button>

                            <Link
                              href={`/order/${o.id}`}
                              target="_blank"
                              className="p-1.5 text-stone-600 hover:text-[#9B111E] rounded-lg hover:bg-stone-100 border border-stone-200 inline-flex items-center gap-1 transition-colors text-xs font-bold"
                              title="View Order Details & Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setOrderToDelete(o.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 border border-rose-200 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
              {orderToDelete ? (
                <>Are you sure you want to permanently delete order <strong>#{orders.find(o => o.id === orderToDelete)?.orderNumber || orderToDelete.substring(0, 8)}</strong>?</>
              ) : (
                <>Are you sure you want to permanently delete all <strong>{selectedOrderIds.length}</strong> selected orders?</>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                disabled={isBulkDeleting}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isBulkDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMALL CONFIRMATION MODAL TO DELETE ALL CANCELLED ORDERS */}
      {showDeleteCancelledConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Delete Cancelled Orders?
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
              Are you sure you want to permanently delete all <strong>{stats.cancelled}</strong> cancelled order(s)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteCancelledConfirm(false)}
                disabled={isDeletingCancelled}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDeleteAllCancelled}
                disabled={isDeletingCancelled}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingCancelled ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AWB ASSIGNMENT MODAL WITH LIVE DTDC VALIDATION */}
      {awbModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 text-stone-900">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Assign DTDC Tracking
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Order #{awbModalOrder.orderNumber || awbModalOrder.id.substring(0, 8)} &bull; {awbModalOrder.customer?.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setAwbModalOrder(null);
                  setAwbValidation(null);
                }} 
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-stone-600 leading-relaxed bg-blue-50/80 p-3 rounded-xl border border-blue-100">
              Each DTDC tracking number is strictly validated directly against DTDC's live consignment network before saving to prevent incorrect or fake tracking details.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                DTDC AWB Number <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={awbInput}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setAwbInput(val);
                      if (awbValidation && awbValidation.testedAwb !== val.trim()) {
                        setAwbValidation(null);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleValidateAwb();
                      }
                    }}
                    placeholder="e.g., 7D139736131"
                    className={`w-full px-3.5 py-2.5 text-sm font-mono tracking-wider uppercase border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${
                      awbValidation
                        ? awbValidation.isValid
                          ? 'border-emerald-400 focus:ring-emerald-200 text-emerald-900 bg-emerald-50/30'
                          : 'border-rose-400 focus:ring-rose-200 text-rose-900 bg-rose-50/30'
                        : 'border-stone-200 focus:ring-[#9B111E]/20 focus:border-[#9B111E]'
                    }`}
                  />
                  {awbInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setAwbInput('');
                        setAwbValidation(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleValidateAwb()}
                  disabled={isValidatingAwb || !awbInput.trim()}
                  className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isValidatingAwb ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#9B111E]" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Validation Feedback Display */}
            {isValidatingAwb && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-600" />
                <span className="font-medium">Validating tracking with DTDC consignment network...</span>
              </div>
            )}

            {!isValidatingAwb && awbValidation && !awbValidation.isValid && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-in fade-in-50">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-rose-900">Tracking Number Invalid</div>
                  <div className="text-rose-700 leading-snug">{awbValidation.error}</div>
                  <div className="text-[11px] text-rose-600 font-medium pt-0.5">
                    Order will not be updated with invalid tracking. Please check the DTDC consignment receipt or barcode.
                  </div>
                </div>
              </div>
            )}

            {!isValidatingAwb && awbValidation && awbValidation.isValid && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Verified on DTDC Network</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 rounded text-emerald-900">
                    {awbValidation.testedAwb}
                  </span>
                </div>
                {awbValidation.details && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                    <div>
                      <span className="text-emerald-700 block font-semibold">Origin &rarr; Dest</span>
                      <span className="text-emerald-950 font-bold truncate block">
                        {awbValidation.details.origin || 'JALGAON'} &rarr; {awbValidation.details.destination || awbModalOrder.shippingAddress?.city || 'Destination'}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 block font-semibold">DTDC Status</span>
                      <span className="text-emerald-950 font-bold truncate block">
                        {awbValidation.details.status || 'Active / Booked'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAwbModalOrder(null);
                  setAwbValidation(null);
                }}
                disabled={isSavingAwb || isValidatingAwb}
                className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAwb}
                disabled={
                  isSavingAwb || 
                  isValidatingAwb || 
                  !awbInput.trim() ||
                  (awbValidation !== null && !awbValidation.isValid && awbValidation.testedAwb === awbInput.trim().toUpperCase())
                }
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  awbValidation && awbValidation.isValid && awbValidation.testedAwb === awbInput.trim().toUpperCase()
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    : 'bg-[#9B111E] hover:bg-rose-700 text-white'
                }`}
              >
                {isSavingAwb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isValidatingAwb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : awbValidation && awbValidation.isValid && awbValidation.testedAwb === awbInput.trim().toUpperCase() ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm & Notify</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Validate & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ADMIN LIVE TRACKING & MAP INSPECTOR MODAL */}
      {adminTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 my-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9B111E]/10 border border-[#9B111E]/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-[#9B111E]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-stone-900">
                      Live DTDC Courier Tracking & Consignment Inspector
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live DTDC API
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-medium">
                    Order #{adminTrackingOrder.orderNumber || adminTrackingOrder.id.substring(0, 8)} &bull; Customer: {adminTrackingOrder.customer?.name} &bull; Shipping to: {adminTrackingOrder.shippingAddress?.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowRawJsonModal(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    showRawJsonModal
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="Toggle raw DTDC API JSON response"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showRawJsonModal ? 'Hide DTDC JSON' : 'View DTDC JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFetchCustomAwb(activeTrackingAwb || adminTrackingOrder.awbNumber || '')}
                  disabled={isAdminTrackingLoading}
                  className="p-2 text-stone-600 hover:text-[#9B111E] hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh live DTDC tracking status"
                >
                  <RefreshCw className={`w-4 h-4 ${isAdminTrackingLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    setAdminTrackingOrder(null);
                    setAdminTrackingData(null);
                    setShowRawJsonModal(false);
                  }}
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl border border-transparent hover:border-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Consignment AWB Switcher & Quick Lookup Bar */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Truck className="w-4 h-4 text-stone-500" />
                  </div>
                  <input
                    type="text"
                    value={customAwbInput}
                    onChange={(e) => setCustomAwbInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFetchCustomAwb(customAwbInput);
                    }}
                    placeholder="Enter DTDC AWB Number (e.g. 7D139736129)..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFetchCustomAwb(customAwbInput)}
                    disabled={isAdminTrackingLoading || !customAwbInput.trim()}
                    className="px-4 py-2 bg-[#9B111E] hover:bg-[#800E19] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isAdminTrackingLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Fetch Live Status</span>
                  </button>

                  {activeTrackingAwb && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeTrackingAwb);
                          setCopiedAwbModal(true);
                          setTimeout(() => setCopiedAwbModal(false), 2000);
                        }}
                        className="px-2.5 py-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Copy AWB number to clipboard"
                      >
                        {copiedAwbModal ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                        )}
                        <span className="hidden sm:inline font-mono">{copiedAwbModal ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={`https://track.dtdc.com/ctrk-web-war/track/search?reqType=tracking&awbNo=${encodeURIComponent(activeTrackingAwb)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-colors flex items-center gap-1 shrink-0"
                        title="Track on official DTDC portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                        <span className="hidden sm:inline">DTDC Portal</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Consignment Presets */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                <span className="font-semibold text-stone-600">Quick Consignments:</span>
                {adminTrackingOrder.awbNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAwbInput(adminTrackingOrder.awbNumber!);
                      handleFetchCustomAwb(adminTrackingOrder.awbNumber!);
                    }}
                    className={`px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                      activeTrackingAwb === adminTrackingOrder.awbNumber
                        ? 'bg-[#9B111E]/10 border-[#9B111E]/30 text-[#9B111E] font-bold'
                        : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    Order AWB: {adminTrackingOrder.awbNumber}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCustomAwbInput('7D139736129');
                    handleFetchCustomAwb('7D139736129');
                  }}
                  className={`px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                    activeTrackingAwb === '7D139736129'
                      ? 'bg-[#9B111E]/10 border-[#9B111E]/30 text-[#9B111E] font-bold'
                      : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  Live In-Transit: 7D139736129
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAwbInput('7D139736130');
                    handleFetchCustomAwb('7D139736130');
                  }}
                  className={`px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                    activeTrackingAwb === '7D139736130'
                      ? 'bg-[#9B111E]/10 border-[#9B111E]/30 text-[#9B111E] font-bold'
                      : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  Live Delivered: 7D139736130
                </button>
              </div>
            </div>

            {/* RAW DTDC JSON DRAWER (when toggled) */}
            {showRawJsonModal && adminTrackingData && (
              <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-stone-200">
                      Live DTDC API Response Payload (JSON)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const exportObj = {
                        success: adminTrackingData.success,
                        status: adminTrackingData.status,
                        shipment: adminTrackingData.shipment,
                        tracking: adminTrackingData.tracking
                      };
                      navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
                      setCopiedTrackingJson(true);
                      setTimeout(() => setCopiedTrackingJson(false), 2000);
                    }}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedTrackingJson ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedTrackingJson ? 'Copied JSON!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto max-h-56 p-2 bg-stone-950 rounded-xl text-emerald-400/90 selection:bg-emerald-800 selection:text-white">
                  {JSON.stringify(
                    {
                      success: adminTrackingData.success,
                      status: adminTrackingData.status,
                      shipment: adminTrackingData.shipment,
                      tracking: adminTrackingData.tracking
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Error or Consignment Not Found Notice */}
            {adminTrackingData && !adminTrackingData.success && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>DTDC Tracking Verification Notice</span>
                </div>
                <p className="text-xs text-rose-700">
                  {adminTrackingData.error || 'No shipment data found for this consignment number on DTDC network. Please confirm that the AWB was booked and dispatched.'}
                </p>
              </div>
            )}

            {/* Shipment Overview Cards */}
            {adminTrackingData?.shipment && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Route</span>
                  <span className="font-bold text-stone-800 truncate block">
                    {adminTrackingData.shipment.origin || 'N/A'} &rarr; {adminTrackingData.shipment.destination || adminTrackingOrder.shippingAddress?.city || 'N/A'}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Status</span>
                  <span className="font-bold text-[#9B111E] truncate block">
                    {adminTrackingData.shipment.status || adminTrackingOrder.status}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Booking Date</span>
                  <span className="font-bold text-stone-800 truncate block">
                    {adminTrackingData.shipment.formatted_booking_date || formatDtdcDate(adminTrackingData.shipment.booking_date) || 'Recorded'}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Expected ETA</span>
                  <span className="font-bold text-stone-800 truncate block">
                    {adminTrackingData.shipment.formatted_expected_delivery_date || formatDtdcDate(adminTrackingData.shipment.expected_delivery_date) || 'In Transit'}
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Ref # / Product</span>
                  <span className="font-bold text-stone-800 truncate block">
                    {adminTrackingData.shipment.reference_number || 'Standard'} ({adminTrackingData.shipment.cn_type || 'CPDP'})
                  </span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Signee / Recipient</span>
                  <span className="font-bold text-stone-800 truncate block">
                    {(() => {
                      const dlvEvent = adminTrackingData.tracking?.find((e: any) => e.code === 'DLV');
                      if (dlvEvent?.receiver) return dlvEvent.receiver;
                      if (dlvEvent?.remarks && dlvEvent.remarks !== '0.00') return dlvEvent.remarks;
                      if (adminTrackingData.shipment.remarks && adminTrackingData.shipment.remarks !== '0.00') {
                        return adminTrackingData.shipment.remarks;
                      }
                      return adminTrackingOrder.shippingAddress?.fullName || 'Pending Delivery';
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* Leaflet Map */}
            <ShipmentTrackerMap
              coordinates={adminTrackingData?.coordinates || []}
              originCity={adminTrackingData?.shipment?.origin || 'PUNE'}
              destinationCity={adminTrackingData?.shipment?.destination || adminTrackingOrder.shippingAddress?.city || 'Destination'}
              status={adminTrackingData?.shipment?.status || adminTrackingOrder.status}
              awbNumber={activeTrackingAwb || adminTrackingOrder.awbNumber}
              mapHeight="h-[260px] sm:h-[300px]"
            />

            {/* Live Checkpoints Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-800">
                    DTDC Event Timeline
                  </span>
                  {adminTrackingData?.tracking?.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-full font-bold text-stone-600">
                      {adminTrackingData.tracking.length} Checkpoints
                    </span>
                  )}
                </div>

                {adminTrackingData?.tracking?.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTrackingSortOrder(prev => prev === 'latest_first' ? 'oldest_first' : 'latest_first')}
                    className="text-[11px] font-bold text-stone-600 hover:text-[#9B111E] transition-colors cursor-pointer"
                  >
                    Sort: {trackingSortOrder === 'latest_first' ? 'Latest First' : 'Oldest First'}
                  </button>
                )}
              </div>

              {isAdminTrackingLoading ? (
                <div className="py-8 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2 bg-stone-50 rounded-2xl border border-stone-200">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#9B111E]" />
                  <span className="font-semibold text-stone-700">Connecting to live DTDC tracking server...</span>
                </div>
              ) : adminTrackingData?.tracking && adminTrackingData.tracking.length > 0 ? (
                <div className="relative pl-5 space-y-2.5 max-h-56 sm:max-h-64 overflow-y-auto pr-1 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {(trackingSortOrder === 'latest_first'
                    ? [...adminTrackingData.tracking].reverse()
                    : adminTrackingData.tracking
                  ).map((evt: any, idx: number) => {
                    const isDelivered = evt.code === 'DLV' || String(evt.action).toLowerCase().includes('delivered');
                    const isOutForDelivery = evt.code === 'OUTDLV' || String(evt.action).toLowerCase().includes('out for delivery');
                    const isBooked = evt.code === 'BKD' || evt.code === 'SPL';

                    return (
                      <div key={idx} className="relative text-xs">
                        <div
                          className={`absolute -left-5 top-2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                            isDelivered
                              ? 'bg-emerald-600'
                              : isOutForDelivery
                              ? 'bg-amber-500'
                              : isBooked
                              ? 'bg-blue-600'
                              : 'bg-[#9B111E]'
                          }`}
                        />
                        <div className="bg-stone-50 p-2.5 sm:p-3 rounded-xl border border-stone-200/90 space-y-1 hover:bg-stone-100/50 transition-colors">
                          <div className="flex justify-between items-start gap-2 font-bold text-stone-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-stone-900">{evt.action || evt.remarks || 'Checkpoint'}</span>
                              {evt.code && (
                                <span className="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold bg-stone-200 text-stone-700">
                                  {evt.code}
                                </span>
                              )}
                            </div>
                            <span className="text-[10.5px] text-stone-500 font-medium shrink-0">
                              {evt.formatted_date || formatDtdcDate(evt.date)} &bull; {evt.formatted_time || formatDtdcTime(evt.time)}
                            </span>
                          </div>

                          {/* Origin to Destination Route */}
                          {(evt.origin || evt.destination) && (
                            <p className="text-[11px] text-stone-600 font-medium">
                              📍 Location:{' '}
                              <span className="font-semibold text-stone-800">{evt.origin || 'Courier Hub'}</span>
                              {evt.destination && (
                                <>
                                  {' '}&rarr;{' '}
                                  <span className="font-semibold text-stone-800">{evt.destination}</span>
                                </>
                              )}
                              {evt.origin_code && (
                                <span className="text-[9.5px] text-stone-400 font-mono ml-1">
                                  ({evt.origin_code}{evt.destination_code ? ` &rarr; ${evt.destination_code}` : ''})
                                </span>
                              )}
                            </p>
                          )}

                          {/* Manifest No */}
                          {evt.manifest_number && (
                            <p className="text-[10px] text-stone-500 font-mono">
                              Manifest: #{evt.manifest_number}
                            </p>
                          )}

                          {/* Courier Remarks (filtered from '0.00') */}
                          {evt.remarks && evt.remarks !== '0.00' && evt.remarks !== evt.action && (
                            <p className="text-[11px] text-stone-600 italic bg-white/80 px-2 py-1 rounded-md border border-stone-200/60 mt-1">
                              &ldquo;{evt.remarks}&rdquo;
                            </p>
                          )}

                          {/* Receiver Name if code is DLV */}
                          {evt.receiver && (
                            <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 mt-1">
                              ✓ Received by: {evt.receiver}
                            </p>
                          )}

                          {/* GPS Coordinates Badge */}
                          {evt.latitude && evt.longitude && (
                            <div className="pt-0.5">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${evt.latitude},${evt.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-[#9B111E] hover:underline bg-[#9B111E]/5 px-2 py-0.5 rounded border border-[#9B111E]/20"
                              >
                                <span>📍 GPS: {evt.latitude}, {evt.longitude}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-500 text-center">
                  No checkpoint timeline available yet for this consignment.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <span className="text-[11px] text-stone-400">
                Verified with DTDC Express API &bull; {new Date().toLocaleTimeString()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdminTrackingOrder(null);
                  setAdminTrackingData(null);
                  setShowRawJsonModal(false);
                }}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice Modal for View and Download */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />

      {/* TRANSFER WOMAN REFERRAL & COMMISSION MODAL */}
      {transferModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 bg-stone-50/75 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B111E] to-[#780016] text-white flex items-center justify-center shadow-md shadow-[#9B111E]/20 shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                      Transfer Woman Referral & Commission
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide border border-amber-200">
                      Reassign
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">
                    ऑर्डर व कमिशन हस्तांतरण — Reassign Order <span className="font-mono font-bold text-stone-700">#{transferModalOrder.orderNumber}</span> to another woman partner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOrder(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
              {/* Order Context Card */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Order No</span>
                    <span className="font-mono font-extrabold text-stone-900">#{transferModalOrder.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Order Total</span>
                    <span className="font-extrabold text-[#9B111E] text-sm">₹{transferModalOrder.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Customer</span>
                    <span className="font-bold text-stone-800 truncate block">
                      {formatDisplayName(transferModalOrder.customer?.name, 'Guest Customer')}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {transferModalOrder.shippingAddress?.city || 'Jalgaon'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Order Status</span>
                    <Badge variant={
                      transferModalOrder.status === 'Delivered' ? 'success' :
                      transferModalOrder.status === 'Cancelled' ? 'error' :
                      transferModalOrder.status === 'Shipped' ? 'info' : 'warning'
                    }>
                      {transferModalOrder.status || 'Pending'}
                    </Badge>
                  </div>
                </div>

                {/* Current Referral Status */}
                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500">Current Attribution:</span>
                    {transferModalOrder.referralPartnerCode ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#9B111E] font-bold text-xs border border-rose-200">
                        <Users className="w-3 h-3" />
                        <span>
                          {formatDisplayName(currentOrderPartnerData?.fullName || transferModalOrder.referralPartnerName, transferModalOrder.referralPartnerCode)}
                        </span>
                        <span className="font-mono text-[10px] opacity-80">({transferModalOrder.referralPartnerCode})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium text-xs">
                        Direct Order (No partner currently credited)
                      </span>
                    )}
                  </div>
                  {currentOrderPartnerData && (
                    <span className="text-[11px] text-stone-500 font-medium">
                      Current pending earnings: <strong className="text-stone-800">₹{currentOrderPartnerData.pendingCommission || 0}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Target Woman Partner Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Select Target Woman Partner *</span>
                  </label>
                  <span className="text-[11px] text-stone-500">
                    {filteredPartners.length} partner{filteredPartners.length === 1 ? '' : 's'} available
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={partnerFilterQuery}
                    onChange={(e) => setPartnerFilterQuery(e.target.value)}
                    placeholder="Search by name, code (AJW-...), city or phone..."
                    className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] transition-all"
                  />
                  {partnerFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setPartnerFilterQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Partners List */}
                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-stone-100 bg-white">
                  {isLoadingPartners ? (
                    <div className="p-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#9B111E]" />
                      <span>Loading woman partners...</span>
                    </div>
                  ) : filteredPartners.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500">
                      No approved woman partners found matching your search.
                    </div>
                  ) : (
                    filteredPartners.map((partner) => {
                      const isSelected = selectedPartnerCode.toUpperCase() === partner.partnerCode.toUpperCase();
                      const isCurrent = transferModalOrder.referralPartnerCode?.toUpperCase() === partner.partnerCode.toUpperCase();

                      return (
                        <button
                          key={partner.id || partner.partnerCode}
                          type="button"
                          onClick={() => handleSelectPartner(partner)}
                          className={`w-full text-left p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-rose-50/80 border-l-4 border-l-[#9B111E]' 
                              : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs ${
                              isSelected
                                ? 'bg-[#9B111E] text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              {isSelected ? <Check className="w-4 h-4" /> : partner.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs truncate">
                                  {formatDisplayName(partner.fullName, partner.partnerCode)}
                                </span>
                                <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                                  {partner.partnerCode}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                                {partner.city} • {partner.phone}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {partner.commissionRate || 12}% Rate
                            </span>
                            <span className="text-[10px] text-stone-500 mt-0.5 font-medium">
                              Pending: ₹{partner.pendingCommission || 0}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {targetPartnerData && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950">
                          Selected: {formatDisplayName(targetPartnerData.fullName, targetPartnerData.partnerCode)}
                        </span>
                        <span className="text-[10px] text-emerald-700 block font-medium">
                          {targetPartnerData.city} • Payout via {targetPartnerData.upiId ? `UPI: ${targetPartnerData.upiId}` : targetPartnerData.bankName || 'Direct'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-900 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                      {targetPartnerData.partnerCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Commission Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Commission to Transfer (₹) *</span>
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Order Total: ₹{transferModalOrder.totalAmount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-stone-500 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={customCommission}
                      onChange={(e) => setCustomCommission(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-black text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E]"
                      placeholder="e.g. 150"
                    />
                  </div>

                  {/* Percentage Presets */}
                  <div className="flex items-center gap-1.5">
                    {[10, 12, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleSetCommissionPreset(pct)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          Math.round(Number(transferModalOrder.totalAmount || 0) * (pct / 100)) === Number(customCommission)
                            ? 'bg-[#9B111E] text-white border-[#9B111E]'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                        title={`Set to ${pct}% of Order Total (₹${Math.round(Number(transferModalOrder.totalAmount || 0) * (pct / 100))})`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 leading-normal">
                  💡 This amount will be credited to <strong className="text-stone-800">{targetPartnerData?.fullName || 'the new partner'}</strong>&apos;s pending commission account and paid out on Sunday.
                  {currentOrderPartnerData && (
                    <span className="block text-amber-700 font-medium mt-0.5">
                      ⚠️ Previous partner ({currentOrderPartnerData.fullName})&apos;s pending commission will be updated accordingly.
                    </span>
                  )}
                </p>
              </div>

              {/* Transfer Reason / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block">
                  Transfer Reason / Admin Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Customer entered wrong referral code at checkout"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E]"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[
                    'Customer entered wrong partner code',
                    'Direct order attributed to partner',
                    'Partner mutual reassignment',
                    'WhatsApp referral attribution'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTransferReason(chip)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-[#9B111E] border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Email Notification Toggle */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                <input
                  id="notifyPartnerToggle"
                  type="checkbox"
                  checked={notifyPartnerToggle}
                  onChange={(e) => setNotifyPartnerToggle(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-blue-300 text-[#9B111E] focus:ring-[#9B111E] cursor-pointer"
                />
                <label htmlFor="notifyPartnerToggle" className="text-xs text-blue-950 font-medium cursor-pointer select-none">
                  <strong className="block font-bold text-blue-900">
                    Send Celebration Email to New Woman Partner
                  </strong>
                  <span className="text-[11px] text-blue-800/80">
                    She will receive a notification email with Order #{transferModalOrder.orderNumber}, customer details, credited commission (₹{customCommission || '0'}), and her updated Sunday payout balance.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isTransferring}
                onClick={() => setTransferModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isTransferring || !selectedPartnerCode || !customCommission}
                onClick={handleExecuteTransfer}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B111E] to-[#780016] hover:brightness-110 shadow-md shadow-[#9B111E]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transferring Referral...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Confirm & Transfer Referral</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
