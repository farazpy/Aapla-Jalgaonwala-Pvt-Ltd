'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BusinessPartner, PartnerOrderReferral, PartnerSettlement, PartnerDashboardStats } from '@/types';
import { formatDisplayName } from '@/utils/transliterate';
import {
  Users,
  Search,
  CheckCircle2,
  Plus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Eye,
  Trash2,
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Ban,
  UserCheck,
  AlertTriangle,
  Sliders,
  Mail,
  Phone,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Image as ImageIcon,
  Building2,
  IndianRupee,
  Maximize2,
  Clock,
  Smartphone,
  ShieldCheck,
  Share2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Settings2
} from 'lucide-react';

type SortField = 'createdAt' | 'fullName' | 'partnerCode' | 'city' | 'totalOrdersCount' | 'totalSalesAmount' | 'totalCommissionEarned' | 'pendingCommission' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [stats, setStats] = useState<PartnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);

  // Search and Advanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState<'all' | 'has_doc' | 'no_doc'>('all');
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending_payout' | 'zero_pending'>('all');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'has_orders' | 'no_orders'>('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Registration Fee state & Fee Popup Modal
  const [feeForm, setFeeForm] = useState<number>(699);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [tempFeeInput, setTempFeeInput] = useState<number>(699);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeSaveSuccess, setFeeSaveSuccess] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Auto-Approve state
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [isTogglingAutoApprove, setIsTogglingAutoApprove] = useState<boolean>(false);

  // Edit Partner Modal State
  const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [isSavingEditPartner, setIsSavingEditPartner] = useState(false);
  const [editPartnerError, setEditPartnerError] = useState<string | null>(null);
  const [editPartnerTab, setEditPartnerTab] = useState<'phonepe' | 'upi' | 'bank' | 'passbook'>('phonepe');
  const [editPartnerForm, setEditPartnerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: 'Maharashtra',
    socialPlatform: 'WhatsApp',
    socialHandle: '',
    status: 'active' as 'active' | 'suspended' | 'pending',
    commissionRate: 12.0,
    customerDiscountRate: 4.0,
    phonePeNumber: '',
    upiId: '',
    bankAccountName: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    aadhaarPanNumber: '',
    documentUrl: '',
    notes: ''
  });

  // Status Updating & Delete State
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<BusinessPartner | null>(null);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);
  const [deletePartnerError, setDeletePartnerError] = useState<string | null>(null);

  // Selected Partner for Modal / Details
  const [selectedPartner, setSelectedPartner] = useState<BusinessPartner | null>(null);
  const [partnerReferrals, setPartnerReferrals] = useState<PartnerOrderReferral[]>([]);
  const [partnerSettlements, setPartnerSettlements] = useState<PartnerSettlement[]>([]);
  const [partnerInvitedWomen, setPartnerInvitedWomen] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [referralNetworkFilter, setReferralNetworkFilter] = useState<'all' | 'referrers' | 'referred' | 'direct'>('all');
  const [networkSearchTerm, setNetworkSearchTerm] = useState('');

  // Image Zoom Lightbox Modal
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Settlement Creation Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementPartner, setSettlementPartner] = useState<BusinessPartner | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementMethod, setSettlementMethod] = useState<'Bank Transfer' | 'UPI' | 'NEFT' | 'IMPS'>('UPI');
  const [settlementRef, setSettlementRef] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  // WhatsApp Order Custom Fund / Commission Modal State
  const [isCustomFundModalOpen, setIsCustomFundModalOpen] = useState(false);
  const [customFundPartner, setCustomFundPartner] = useState<BusinessPartner | null>(null);
  const [customFundAmount, setCustomFundAmount] = useState<string>('');
  const [customFundOrderRef, setCustomFundOrderRef] = useState<string>('');
  const [customFundOrderTotal, setCustomFundOrderTotal] = useState<string>('');
  const [customFundCustomerName, setCustomFundCustomerName] = useState<string>('');
  const [customFundCustomerCity, setCustomFundCustomerCity] = useState<string>('');
  const [customFundNotes, setCustomFundNotes] = useState<string>('');
  const [customFundMarkAsPaid, setCustomFundMarkAsPaid] = useState<boolean>(false);
  const [customFundPaymentMethod, setCustomFundPaymentMethod] = useState<string>('UPI');
  const [customFundTxnRef, setCustomFundTxnRef] = useState<string>('');
  const [customFundSendEmail, setCustomFundSendEmail] = useState<boolean>(true);
  const [isSubmittingCustomFund, setIsSubmittingCustomFund] = useState<boolean>(false);
  const [customFundFeedback, setCustomFundFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [customFundPartnerReferrals, setCustomFundPartnerReferrals] = useState<PartnerOrderReferral[]>([]);
  const [isLoadingCustomFundReferrals, setIsLoadingCustomFundReferrals] = useState(false);

  // Delete Referral / WhatsApp Order State
  const [referralToDelete, setReferralToDelete] = useState<{ referral: PartnerOrderReferral; partner?: BusinessPartner | null } | null>(null);
  const [isDeletingReferral, setIsDeletingReferral] = useState(false);
  const [deleteReferralError, setDeleteReferralError] = useState<string | null>(null);
  const [deleteReferralSuccessMessage, setDeleteReferralSuccessMessage] = useState<string | null>(null);
  const [referralFilter, setReferralFilter] = useState<'all' | 'whatsapp' | 'website'>('all');

  // Add Partner Modal State
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [addPartnerError, setAddPartnerError] = useState<string | null>(null);
  const [adminPayoutTab, setAdminPayoutTab] = useState<'phonepe' | 'upi' | 'bank' | 'passbook'>('phonepe');
  const [addPartnerForm, setAddPartnerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: 'Maharashtra',
    socialPlatform: 'WhatsApp',
    socialHandle: '',
    phonePeNumber: '',
    upiId: '',
    bankAccountName: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    documentUrl: '',
    aadhaarPanNumber: '',
    status: 'active',
    customPartnerCode: '',
    adminNotes: '',
    isAdminBypass: true
  });

  // Bulk Selection & Editing State
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkActionFeedback, setBulkActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleCopyText = async (text: string, code: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const toggleSelectAll = (filteredList: BusinessPartner[]) => {
    if (selectedPartnerIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedPartnerIds([]);
    } else {
      setSelectedPartnerIds(filteredList.map((p) => p.id));
    }
  };

  const toggleSelectPartner = (id: string) => {
    setSelectedPartnerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'suspended' | 'approved' | 'pending') => {
    if (selectedPartnerIds.length === 0) return;
    setIsBulkProcessing(true);
    setBulkActionFeedback(null);
    try {
      const res = await fetch('/api/partner-program/partners/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPartnerIds, status: newStatus })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update partner statuses.');
      }
      setBulkActionFeedback({
        type: 'success',
        message: `Successfully set ${selectedPartnerIds.length} partner(s) to ${newStatus.toUpperCase()}.`
      });
      setSelectedPartnerIds([]);
      fetchPartnersAndStats();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: err.message || 'Error occurred during bulk status update.'
      });
    } finally {
      setIsBulkProcessing(false);
      setTimeout(() => setBulkActionFeedback(null), 4000);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPartnerIds.length === 0) return;
    setIsBulkProcessing(true);
    setBulkActionFeedback(null);
    try {
      const res = await fetch('/api/partner-program/partners/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPartnerIds })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to delete selected partners.');
      }
      setBulkActionFeedback({
        type: 'success',
        message: `Successfully removed ${selectedPartnerIds.length} partner record(s).`
      });
      setSelectedPartnerIds([]);
      setShowBulkDeleteConfirm(false);
      fetchPartnersAndStats();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: err.message || 'Error occurred during bulk deletion.'
      });
    } finally {
      setIsBulkProcessing(false);
      setTimeout(() => setBulkActionFeedback(null), 4000);
    }
  };

  const handleExportSelectedCSV = () => {
    const selected = partners.filter((p) => selectedPartnerIds.includes(p.id));
    if (selected.length === 0) return;

    const headers = [
      'Partner Code',
      'Full Name',
      'Phone',
      'Email',
      'City',
      'State',
      'Status',
      'Orders Count',
      'Total Sales (INR)',
      'Earned Commission (INR)',
      'Paid Commission (INR)',
      'Pending Commission (INR)',
      'Bank Account Name',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'UPI ID',
      'Has Document Upload',
      'Document URL',
      'Referral Link',
      'Created Date'
    ];

    const rows = selected.map((p) => [
      `"${p.partnerCode}"`,
      `"${p.fullName.replace(/"/g, '""')}"`,
      `"${p.phone}"`,
      `"${p.email}"`,
      `"${p.city}"`,
      `"${p.state}"`,
      `"${p.status}"`,
      p.totalOrdersCount || 0,
      p.totalSalesAmount || 0,
      p.totalCommissionEarned || 0,
      p.totalCommissionPaid || 0,
      p.pendingCommission || 0,
      `"${(p.bankAccountName || '').replace(/"/g, '""')}"`,
      `"${(p.bankName || '').replace(/"/g, '""')}"`,
      `"${p.bankAccountNumber || ''}"`,
      `"${p.ifscCode || ''}"`,
      `"${p.upiId || ''}"`,
      `"${p.documentUrl ? 'Yes' : 'No'}"`,
      `"${p.documentUrl || ''}"`,
      `"http://aaplajalgaonwala.com/ref/${p.partnerCode}"`,
      `"${p.createdAt || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `aapla_partners_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPartnerError(null);

    const cleanPhone = addPartnerForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setAddPartnerError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (adminPayoutTab === 'phonepe' && addPartnerForm.phonePeNumber) {
      const cleanPhonePe = addPartnerForm.phonePeNumber.replace(/\D/g, '');
      if (cleanPhonePe.length !== 10) {
        setAddPartnerError('PhonePe / Google Pay number must be exactly 10 digits.');
        return;
      }
    }

    setIsAddingPartner(true);
    try {
      const cleanPhonePe = addPartnerForm.phonePeNumber ? addPartnerForm.phonePeNumber.replace(/\D/g, '') : '';
      const fallbackAccount = cleanPhonePe || addPartnerForm.upiId.trim() || 'ADMIN_ONBOARDED';
      const fallbackIfsc = addPartnerForm.ifscCode.trim() || (cleanPhonePe ? 'PHONEPE_UPI' : 'ADMIN_BYPASS');
      const fallbackBankName = addPartnerForm.bankName.trim() || (cleanPhonePe ? 'PhonePe / GPay' : (addPartnerForm.upiId ? 'UPI Account' : 'Admin Manual'));

      const finalPayload = {
        ...addPartnerForm,
        phone: cleanPhone,
        phonePeNumber: cleanPhonePe,
        bankAccountNumber: addPartnerForm.bankAccountNumber.trim() || fallbackAccount,
        ifscCode: fallbackIfsc,
        bankName: fallbackBankName,
        bankAccountName: addPartnerForm.bankAccountName.trim() || addPartnerForm.fullName.trim()
      };

      const res = await fetch('/api/partner-program/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to add partner.');
      }
      setIsAddPartnerModalOpen(false);

      const createdPartner: BusinessPartner | undefined = json.data?.partner;
      if (createdPartner) {
        // Immediately prepend new partner to local state for instantaneous UI feedback
        setPartners(prev => [createdPartner, ...prev.filter(p => p.id !== createdPartner.id)]);
        setRecentlyAddedId(createdPartner.id);
        setTimeout(() => {
          setRecentlyAddedId(prev => (prev === createdPartner.id ? null : prev));
        }, 12000);
      }

      // Reset all search and filter conditions to ensure the new partner is immediately visible at the top
      setSearchTerm('');
      setStatusFilter('all');
      setDocumentFilter('all');
      setPayoutFilter('all');
      setOrdersFilter('all');
      setCityFilter('all');
      setSortField('createdAt');
      setSortOrder('desc');

      setBulkActionFeedback({
        type: 'success',
        message: `✨ Partner ${createdPartner?.fullName || ''} (${createdPartner?.partnerCode || ''}) added successfully and displayed below!`
      });

      setAddPartnerForm({
        fullName: '',
        phone: '',
        email: '',
        city: '',
        state: 'Maharashtra',
        socialPlatform: 'WhatsApp',
        socialHandle: '',
        phonePeNumber: '',
        upiId: '',
        bankAccountName: '',
        bankName: '',
        bankAccountNumber: '',
        ifscCode: '',
        documentUrl: '',
        aadhaarPanNumber: '',
        status: 'active',
        customPartnerCode: '',
        adminNotes: '',
        isAdminBypass: true
      });
      fetchPartnersAndStats();
    } catch (err: any) {
      setAddPartnerError(err.message || 'An error occurred.');
    } finally {
      setIsAddingPartner(false);
    }
  };

  const handleUpdateStatus = async (
    partnerId: string,
    newStatus: 'active' | 'suspended' | 'pending' | 'approved'
  ) => {
    setStatusUpdatingId(partnerId);
    try {
      const res = await fetch(`/api/partner-program/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === partnerId ? { ...p, status: newStatus as any } : p))
        );
        if (selectedPartner && selectedPartner.id === partnerId) {
          setSelectedPartner((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
        fetchPartnersAndStats();
      }
    } catch (err) {
      console.error('Failed to update partner status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    setIsDeletingPartner(true);
    setDeletePartnerError(null);
    try {
      const res = await fetch(`/api/partner-program/partners/${partnerToDelete.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to delete partner.');
      }
      setPartners((prev) => prev.filter((p) => p.id !== partnerToDelete.id));
      if (selectedPartner && selectedPartner.id === partnerToDelete.id) {
        setIsDetailsOpen(false);
        setSelectedPartner(null);
      }
      setPartnerToDelete(null);
      fetchPartnersAndStats();
    } catch (err: any) {
      setDeletePartnerError(err.message || 'Failed to delete partner.');
    } finally {
      setIsDeletingPartner(false);
    }
  };

  const fetchPartnersAndStats = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/partner-program/partners'),
        fetch('/api/partner-program/stats')
      ]);

      const pData = await pRes.json();
      const sData = await sRes.json();

      if (pData.success && Array.isArray(pData.data)) {
        setPartners(pData.data);
      }
      if (sData.success && sData.data) {
        setStats(sData.data);
      }
    } catch (err) {
      console.warn('Error loading partner admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        if (typeof json.data.womenPartnerFee === 'number') {
          setFeeForm(json.data.womenPartnerFee);
          setTempFeeInput(json.data.womenPartnerFee);
        }
        if (typeof json.data.womenPartnerAutoApprove === 'boolean') {
          setAutoApprove(json.data.womenPartnerAutoApprove);
        } else {
          setAutoApprove(true);
        }
      }
    } catch (err) {
      console.warn('Error loading fee settings:', err);
    }
  };

  const handleToggleAutoApprove = async () => {
    setIsTogglingAutoApprove(true);
    try {
      const nextSetting = !autoApprove;
      const authToken = localStorage.getItem('ajw_auth_token') || localStorage.getItem('token') || '';

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          womenPartnerAutoApprove: nextSetting
        })
      });
      const json = await res.json();
      if (json.success) {
        setAutoApprove(nextSetting);
        setBulkActionFeedback({
          type: 'success',
          message: nextSetting
            ? '✨ Auto-Approve is now ON: New partner registrations will be automatically approved and activated immediately.'
            : '⚠️ Auto-Approve is now OFF: New partner registrations will be saved as Pending for review.'
        });
        setTimeout(() => setBulkActionFeedback(null), 5000);
      } else {
        throw new Error(json.error?.message || 'Failed to update auto-approve setting.');
      }
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update auto-approve setting.'
      });
      setTimeout(() => setBulkActionFeedback(null), 5000);
    } finally {
      setIsTogglingAutoApprove(false);
    }
  };

  const openEditPartnerModal = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setEditPartnerError(null);

    // Determine initial payout tab
    const hasUpi = Boolean(partner.upiId && !partner.upiId.startsWith('PENDING'));
    const hasBank = Boolean(partner.bankAccountNumber && partner.bankAccountNumber !== 'PENDING' && partner.bankAccountNumber !== 'UPI-PAYOUT' && !partner.bankAccountNumber.includes('Passbook Attached'));
    const hasPassbook = Boolean(partner.documentUrl);

    if (hasBank) {
      setEditPartnerTab('bank');
    } else if (hasUpi) {
      setEditPartnerTab('upi');
    } else if (hasPassbook) {
      setEditPartnerTab('passbook');
    } else {
      setEditPartnerTab('phonepe');
    }

    setEditPartnerForm({
      fullName: partner.fullName || '',
      phone: (partner.phone || '').replace(/\D/g, '').slice(-10),
      email: partner.email || '',
      city: partner.city || '',
      state: partner.state || 'Maharashtra',
      socialPlatform: partner.socialPlatform || 'WhatsApp',
      socialHandle: partner.socialHandle || '',
      status: partner.status || 'active',
      commissionRate: partner.commissionRate !== undefined ? Number(partner.commissionRate) : 12.0,
      customerDiscountRate: partner.customerDiscountRate !== undefined ? Number(partner.customerDiscountRate) : 4.0,
      phonePeNumber: (partner.upiId && /^\d{10}/.test(partner.upiId)) ? partner.upiId.slice(0, 10) : (partner.phone || '').replace(/\D/g, '').slice(-10),
      upiId: partner.upiId || '',
      bankAccountName: partner.bankAccountName || partner.fullName || '',
      bankName: partner.bankName || '',
      bankAccountNumber: partner.bankAccountNumber || '',
      ifscCode: partner.ifscCode || '',
      aadhaarPanNumber: partner.aadhaarPanNumber || '',
      documentUrl: partner.documentUrl || '',
      notes: partner.notes || ''
    });
    setIsEditPartnerModalOpen(true);
  };

  const handleSaveEditPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setIsSavingEditPartner(true);
    setEditPartnerError(null);

    try {
      if (!editPartnerForm.fullName.trim() || !editPartnerForm.phone.trim() || !editPartnerForm.email.trim() || !editPartnerForm.city.trim()) {
        throw new Error('Please fill in all mandatory contact fields (Full Name, Phone, Email, City).');
      }

      if (editPartnerForm.phone.replace(/\D/g, '').length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }

      let bankAccountName = editPartnerForm.bankAccountName.trim() || editPartnerForm.fullName.trim();
      let bankName = editPartnerForm.bankName.trim();
      let bankAccountNumber = editPartnerForm.bankAccountNumber.trim();
      let ifscCode = editPartnerForm.ifscCode.trim().toUpperCase();
      let upiId = editPartnerForm.upiId.trim();

      if (editPartnerTab === 'phonepe') {
        const pNum = editPartnerForm.phonePeNumber.replace(/\D/g, '');
        if (pNum.length !== 10) {
          throw new Error('Please enter a valid 10-digit PhonePe / Google Pay mobile number.');
        }
        upiId = `${pNum}@ybl`;
        bankName = 'PhonePe / GPay';
        bankAccountNumber = pNum;
        ifscCode = 'PHONEPE-UPI';
      } else if (editPartnerTab === 'upi') {
        if (!upiId) {
          throw new Error('Please enter a valid UPI ID (e.g. mobile@upi).');
        }
        bankName = 'UPI Virtual Payout';
        bankAccountNumber = upiId;
        ifscCode = 'UPI-PAYOUT';
      } else if (editPartnerTab === 'bank') {
        if (!bankAccountNumber || !ifscCode) {
          throw new Error('Please enter both Bank Account Number and IFSC Code.');
        }
      } else if (editPartnerTab === 'passbook') {
        if (!editPartnerForm.documentUrl) {
          throw new Error('Please provide the Passbook photo/document URL.');
        }
        bankName = 'Uploaded Passbook';
        bankAccountNumber = 'Passbook Attached';
        ifscCode = 'PASSBOOK-VERIFY';
      }

      const updates: Partial<BusinessPartner> = {
        fullName: editPartnerForm.fullName.trim(),
        phone: editPartnerForm.phone.replace(/\D/g, '').trim(),
        email: editPartnerForm.email.trim().toLowerCase(),
        city: editPartnerForm.city.trim(),
        state: editPartnerForm.state.trim(),
        socialPlatform: editPartnerForm.socialPlatform,
        socialHandle: editPartnerForm.socialHandle.trim(),
        status: editPartnerForm.status,
        commissionRate: Number(editPartnerForm.commissionRate) || 12.0,
        customerDiscountRate: Number(editPartnerForm.customerDiscountRate) || 4.0,
        bankAccountName,
        bankName,
        bankAccountNumber,
        ifscCode,
        upiId,
        aadhaarPanNumber: editPartnerForm.aadhaarPanNumber.trim(),
        documentUrl: editPartnerForm.documentUrl.trim(),
        notes: editPartnerForm.notes.trim()
      };

      const res = await fetch(`/api/partner-program/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update partner details.');
      }

      const updatedPartner: BusinessPartner = json.data;

      // Update in local state immediately
      setPartners(prev => prev.map(p => p.id === updatedPartner.id ? { ...p, ...updatedPartner } : p));
      if (selectedPartner && selectedPartner.id === updatedPartner.id) {
        setSelectedPartner(prev => prev ? { ...prev, ...updatedPartner } : null);
      }

      setIsEditPartnerModalOpen(false);
      setEditingPartner(null);

      setBulkActionFeedback({
        type: 'success',
        message: `Partner ${updatedPartner.fullName} (${updatedPartner.partnerCode}) details updated successfully.`
      });
      setTimeout(() => setBulkActionFeedback(null), 5000);

      // Background refresh
      fetchPartnersAndStats();
    } catch (err: any) {
      setEditPartnerError(err.message || 'Failed to update partner.');
    } finally {
      setIsSavingEditPartner(false);
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFee(true);
    setFeeSaveSuccess(false);
    setFeeError(null);
    try {
      const authToken = localStorage.getItem('ajw_auth_token') || localStorage.getItem('token') || '';

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          womenPartnerFee: Number(tempFeeInput)
        })
      });
      const json = await res.json();
      if (json.success) {
        setFeeForm(Number(tempFeeInput));
        setFeeSaveSuccess(true);
        setTimeout(() => {
          setFeeSaveSuccess(false);
          setIsFeeModalOpen(false);
        }, 1200);
      } else {
        throw new Error(json.error?.message || json.message || 'Failed to save fee.');
      }
    } catch (err: any) {
      setFeeError(err.message || 'Error saving fee.');
    } finally {
      setIsSavingFee(false);
    }
  };

  useEffect(() => {
    fetchPartnersAndStats();
    fetchSettings();
  }, []);

  const openPartnerDetails = async (partner: BusinessPartner) => {
    setSelectedPartner(partner);
    setIsDetailsOpen(true);
    setPartnerInvitedWomen(partner.invitedPartnersList || []);
    try {
      const res = await fetch(`/api/partner-program/partners/${partner.partnerCode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPartnerReferrals(json.data.referrals || []);
        setPartnerSettlements(json.data.settlements || []);
        setPartnerInvitedWomen(json.data.invitedPartners || (partner as any).invitedPartnersList || []);
        if (json.data.partner) {
          setSelectedPartner(json.data.partner);
        }
      }
    } catch (err) {
      console.warn('Error fetching partner details:', err);
    }
  };

  const handleOpenSettlement = (partner: BusinessPartner) => {
    setSettlementPartner(partner);
    setSettlementAmount(partner.pendingCommission || 0);
    setSettlementRef(`PAY-${Date.now().toString().slice(-6)}`);
    setIsSettlementModalOpen(true);
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementPartner || settlementAmount <= 0) return;

    setIsSubmittingSettlement(true);
    try {
      const res = await fetch('/api/partner-program/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: settlementPartner.id,
          partnerCode: settlementPartner.partnerCode,
          partnerName: settlementPartner.fullName,
          amount: settlementAmount,
          settlementDate: new Date().toISOString().split('T')[0],
          settlementWeek: `Sunday ${new Date().toLocaleDateString('en-IN')}`,
          paymentMethod: settlementMethod,
          transactionReference: settlementRef,
          bankDetailsSnapshot: `${settlementPartner.bankName} - ${settlementPartner.bankAccountNumber} (UPI: ${settlementPartner.upiId || 'N/A'})`,
          notes: settlementNotes
        })
      });

      const json = await res.json();
      if (json.success) {
        setIsSettlementModalOpen(false);
        fetchPartnersAndStats();
        if (selectedPartner && selectedPartner.id === settlementPartner.id) {
          openPartnerDetails(settlementPartner);
        }
      }
    } catch (err) {
      console.warn('Settlement error:', err);
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  const isWhatsAppOrder = (r: PartnerOrderReferral) => {
    const num = (r.orderNumber || '').toUpperCase();
    const id = (r.id || '').toLowerCase();
    const name = (r.customerName || '').toLowerCase();
    return num.startsWith('WA-') || num.startsWith('WP-') || id.includes('ref_wa_') || name.includes('whatsapp');
  };

  const filteredPartnerReferrals = useMemo(() => {
    if (referralFilter === 'whatsapp') {
      return partnerReferrals.filter(isWhatsAppOrder);
    }
    if (referralFilter === 'website') {
      return partnerReferrals.filter(r => !isWhatsAppOrder(r));
    }
    return partnerReferrals;
  }, [partnerReferrals, referralFilter]);

  const fetchCustomFundPartnerReferrals = async (code: string) => {
    if (!code) {
      setCustomFundPartnerReferrals([]);
      return;
    }
    setIsLoadingCustomFundReferrals(true);
    try {
      const res = await fetch(`/api/partner-program/partners/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCustomFundPartnerReferrals(json.data.referrals || []);
      }
    } catch (err) {
      console.warn('Failed to fetch referrals for custom fund modal:', err);
    } finally {
      setIsLoadingCustomFundReferrals(false);
    }
  };

  const handleDeleteReferral = async () => {
    if (!referralToDelete) return;
    setIsDeletingReferral(true);
    setDeleteReferralError(null);

    try {
      const refId = referralToDelete.referral.id;
      const refNum = referralToDelete.referral.orderNumber;
      const res = await fetch(`/api/partner-program/referrals/${encodeURIComponent(refId)}?deleteLinkedSettlement=true`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to delete referral order');
      }

      const deletedNumber = referralToDelete.referral.orderNumber;
      const deletedAmount = referralToDelete.referral.partnerCommission;

      // 1. Remove from partnerReferrals state in Details modal
      setPartnerReferrals(prev => prev.filter(r => r.id !== refId && r.orderNumber !== refNum));
      // 2. Remove from customFundPartnerReferrals state in WhatsApp fund modal
      setCustomFundPartnerReferrals(prev => prev.filter(r => r.id !== refId && r.orderNumber !== refNum));

      // 3. Update selected partner metrics if open
      if (json.data?.partner) {
        const updated = json.data.partner;
        if (selectedPartner && (selectedPartner.id === updated.id || selectedPartner.partnerCode === updated.partnerCode)) {
          setSelectedPartner(updated);
        }
        if (customFundPartner && (customFundPartner.id === updated.id || customFundPartner.partnerCode === updated.partnerCode)) {
          setCustomFundPartner(updated);
        }
        setPartners(prev => prev.map(p => (p.id === updated.id || p.partnerCode === updated.partnerCode) ? updated : p));
      } else {
        fetchPartnersAndStats();
      }

      setDeleteReferralSuccessMessage(`WhatsApp order #${deletedNumber} deleted successfully. ₹${deletedAmount} removed from balance.`);
      setTimeout(() => setDeleteReferralSuccessMessage(null), 6000);

      setReferralToDelete(null);
    } catch (err: any) {
      setDeleteReferralError(err.message || 'Failed to delete order');
    } finally {
      setIsDeletingReferral(false);
    }
  };

  const handleOpenCustomFundModal = (partner?: BusinessPartner) => {
    setCustomFundFeedback(null);
    const targetPartner = partner || (partners.length > 0 ? partners[0] : null);
    setCustomFundPartner(targetPartner);
    setCustomFundAmount('');
    setCustomFundOrderRef(`WA-${Date.now().toString().slice(-6)}`);
    setCustomFundOrderTotal('');
    setCustomFundCustomerName('');
    setCustomFundCustomerCity(targetPartner?.city || '');
    setCustomFundNotes('WhatsApp order confirmed. Commission credited.');
    setCustomFundMarkAsPaid(false);
    setCustomFundPaymentMethod('UPI');
    setCustomFundTxnRef('');
    setCustomFundSendEmail(true);
    if (targetPartner?.partnerCode) {
      fetchCustomFundPartnerReferrals(targetPartner.partnerCode);
    } else {
      setCustomFundPartnerReferrals([]);
    }
    setIsCustomFundModalOpen(true);
  };

  const handleRecordCustomFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFundPartner) {
      setCustomFundFeedback({ type: 'error', message: 'Please select a woman partner.' });
      return;
    }
    const parsedAmount = parseFloat(customFundAmount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setCustomFundFeedback({ type: 'error', message: 'Please enter a valid commission amount in Rupees (> 0).' });
      return;
    }

    setIsSubmittingCustomFund(true);
    setCustomFundFeedback(null);
    try {
      const res = await fetch('/api/partner-program/custom-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: customFundPartner.id,
          partnerCode: customFundPartner.partnerCode,
          amount: parsedAmount,
          orderNumber: customFundOrderRef.trim() || undefined,
          orderTotal: customFundOrderTotal ? parseFloat(customFundOrderTotal) : 0,
          customerName: customFundCustomerName.trim() || undefined,
          customerCity: customFundCustomerCity.trim() || undefined,
          notes: customFundNotes.trim() || undefined,
          markAsPaid: customFundMarkAsPaid,
          paymentMethod: customFundPaymentMethod,
          transactionReference: customFundTxnRef.trim() || undefined,
          sendEmail: customFundSendEmail
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to add custom fund.');
      }

      setCustomFundFeedback({
        type: 'success',
        message: json.data?.message || `Successfully credited ₹${parsedAmount} to ${customFundPartner.fullName}!`
      });

      // Refresh partner records & stats
      fetchPartnersAndStats();
      if (customFundPartner?.partnerCode) {
        fetchCustomFundPartnerReferrals(customFundPartner.partnerCode);
      }
      if (selectedPartner && selectedPartner.id === customFundPartner.id) {
        openPartnerDetails(customFundPartner);
      }

      setTimeout(() => {
        setIsCustomFundModalOpen(false);
        setCustomFundFeedback(null);
      }, 2200);
    } catch (err: any) {
      setCustomFundFeedback({
        type: 'error',
        message: err.message || 'An error occurred while processing custom fund.'
      });
    } finally {
      setIsSubmittingCustomFund(false);
    }
  };

  // Extract unique cities for city filter
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    partners.forEach((p) => {
      if (p.city && p.city.trim()) {
        cities.add(p.city.trim());
      }
    });
    return Array.from(cities).sort();
  }, [partners]);

  // Handle Sort Header Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Partner List
  const filteredPartners = useMemo(() => {
    return partners
      .filter((p) => {
        // Search term matching across multiple fields
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.fullName.toLowerCase().includes(q) ||
          p.partnerCode.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.state && p.state.toLowerCase().includes(q)) ||
          (p.referredByPartnerCode && p.referredByPartnerCode.toLowerCase().includes(q)) ||
          (p.referredByPartnerName && p.referredByPartnerName.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          (p.bankName && p.bankName.toLowerCase().includes(q)) ||
          (p.bankAccountNumber && p.bankAccountNumber.toLowerCase().includes(q)) ||
          (p.ifscCode && p.ifscCode.toLowerCase().includes(q)) ||
          (p.upiId && p.upiId.toLowerCase().includes(q));

        // Status filter
        const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();

        // Document filter
        const matchesDoc =
          documentFilter === 'all' ||
          (documentFilter === 'has_doc' && !!p.documentUrl) ||
          (documentFilter === 'no_doc' && !p.documentUrl);

        // Payout filter
        const matchesPayout =
          payoutFilter === 'all' ||
          (payoutFilter === 'pending_payout' && (p.pendingCommission || 0) > 0) ||
          (payoutFilter === 'zero_pending' && (!p.pendingCommission || p.pendingCommission === 0));

        // Orders filter
        const matchesOrders =
          ordersFilter === 'all' ||
          (ordersFilter === 'has_orders' && (p.totalOrdersCount || 0) > 0) ||
          (ordersFilter === 'no_orders' && (!p.totalOrdersCount || p.totalOrdersCount === 0));

        // City filter
        const matchesCity = cityFilter === 'all' || (p.city && p.city.trim().toLowerCase() === cityFilter.toLowerCase());

        // Referral Network Filter (Request 2)
        const hasReferred = (p.invitedPartnersCount || (p.invitedPartnersList && p.invitedPartnersList.length) || 0) > 0;
        const isReferred = !!p.referredByPartnerCode;
        const matchesReferral =
          referralNetworkFilter === 'all' ||
          (referralNetworkFilter === 'referrers' && hasReferred) ||
          (referralNetworkFilter === 'referred' && isReferred) ||
          (referralNetworkFilter === 'direct' && !isReferred);

        return matchesSearch && matchesStatus && matchesDoc && matchesPayout && matchesOrders && matchesCity && matchesReferral;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'createdAt') {
          valA = new Date(a.createdAt || 0).getTime();
          valB = new Date(b.createdAt || 0).getTime();
        } else if (typeof valA === 'string') {
          valA = (valA || '').toLowerCase();
          valB = (valB || '').toLowerCase();
        } else {
          valA = valA || 0;
          valB = valB || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [partners, searchTerm, statusFilter, documentFilter, payoutFilter, ordersFilter, cityFilter, referralNetworkFilter, sortField, sortOrder]);

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    documentFilter !== 'all' ||
    payoutFilter !== 'all' ||
    ordersFilter !== 'all' ||
    referralNetworkFilter !== 'all' ||
    cityFilter !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDocumentFilter('all');
    setPayoutFilter('all');
    setOrdersFilter('all');
    setCityFilter('all');
    setReferralNetworkFilter('all');
    setSortField('createdAt');
    setSortOrder('desc');
  };

  return (
    <AdminLayout pageTitle="Women Business Partner Program">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header with Compact Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#9B111E]/10 text-[#9B111E]">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-stone-900">Women Business Partner Program</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Manage registered partners, verify passbooks, track referrals, and issue Sunday bank payouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Approve Setting Toggle Button */}
            <button
              type="button"
              disabled={isTogglingAutoApprove}
              onClick={handleToggleAutoApprove}
              className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                autoApprove
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700'
              }`}
              title={
                autoApprove
                  ? 'Auto-Approve is ON: New partner registrations are instantly activated without manual approval. Click to turn OFF.'
                  : 'Auto-Approve is OFF: New registrations will remain Pending for manual review. Click to turn ON.'
              }
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  autoApprove ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' : 'bg-stone-400 ring-4 ring-stone-100'
                }`}
              />
              <span>
                Auto-Approve: <strong className={autoApprove ? 'text-emerald-700' : 'text-stone-700'}>{autoApprove ? 'ON (Auto-Active)' : 'OFF (Review First)'}</strong>
              </span>
              {isTogglingAutoApprove ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin ml-0.5 text-stone-500" />
              ) : autoApprove ? (
                <ToggleRight className="w-4 h-4 text-emerald-600 ml-0.5" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-stone-500 ml-0.5" />
              )}
            </button>

            {/* Joining Fee Quick Action Button */}
            <button
              type="button"
              onClick={() => {
                setTempFeeInput(feeForm);
                setFeeSaveSuccess(false);
                setFeeError(null);
                setIsFeeModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Configure Public Registration Fee"
            >
              <IndianRupee className="w-3.5 h-3.5 text-[#D9531E]" />
              <span>
                Joining Fee: <strong className="text-stone-900">{feeForm === 0 ? 'Free (₹0)' : `₹${feeForm}`}</strong>
              </span>
              <Sliders className="w-3 h-3 text-amber-700 ml-0.5" />
            </button>

            {/* Woman Referral Network Map Button (Request 2) */}
            <button
              type="button"
              onClick={() => setIsNetworkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="View Complete Woman-to-Woman Referral Tree (Which woman referred which women)"
            >
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span>Woman Referral Tree</span>
            </button>

            {/* WhatsApp Custom Fund / Commission Action Button */}
            <button
              type="button"
              onClick={() => handleOpenCustomFundModal()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Add Custom Commission in Rupees for WhatsApp Order"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Add WhatsApp Fund</span>
            </button>

            {/* Add Partner Button */}
            <button
              onClick={() => setIsAddPartnerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#D9531E] hover:bg-[#b04015] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Partner</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchPartnersAndStats}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Partners</span>
            <div className="text-2xl font-black text-stone-900 mt-1">{stats?.totalPartners || partners.length}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">{stats?.activePartners || partners.length} Active</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Referred Orders</span>
            <div className="text-2xl font-black text-stone-900 mt-1">{stats?.totalReferredOrders || 0}</div>
            <span className="text-[10px] text-stone-500">Gross sales: ₹{(stats?.totalSalesThroughPartners ?? stats?.totalReferredSales ?? 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Commissions Paid</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">₹{(stats?.totalPaidCommissions ?? stats?.totalCommissionPaid ?? 0).toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-emerald-700">Settled to bank accounts</span>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Sunday Payout</span>
            <div className="text-2xl font-black text-[#9B111E] mt-1">₹{(stats?.pendingSundayPayouts ?? stats?.totalPendingPayout ?? 0).toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-amber-700 font-semibold">Eligible for transfer</span>
          </div>
        </div>

        {/* Bulk Actions Floating Toolbar */}
        {selectedPartnerIds.length > 0 && (
          <div className="bg-stone-900 text-white p-3.5 sm:p-4 rounded-2xl border border-stone-700 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#9B111E] text-white flex items-center justify-center font-bold text-xs">
                {selectedPartnerIds.length}
              </span>
              <div>
                <p className="text-xs font-bold text-white">
                  {selectedPartnerIds.length} partner{selectedPartnerIds.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-[10px] text-stone-400">Perform bulk operations on selected partners</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => handleBulkStatusChange('active')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Activate selected partners"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Bulk Activate</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => handleBulkStatusChange('pending')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Set selected partners status to pending review"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Bulk Mark Pending</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => handleBulkStatusChange('suspended')}
                className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Suspend selected partners"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Bulk Suspend</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bulk Delete</span>
              </button>

              <button
                type="button"
                onClick={handleExportSelectedCSV}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPartnerIds([])}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {bulkActionFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              bulkActionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {bulkActionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{bulkActionFeedback.message}</span>
          </div>
        )}

        {/* Enhanced Multi-Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3.5">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner by Name, Code, Phone, Email, City, Bank, IFSC, UPI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#9B111E] focus:outline-none placeholder:text-stone-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* Passbook Document Filter */}
              <select
                value={documentFilter}
                onChange={(e: any) => setDocumentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="all">Passbook: All</option>
                <option value="has_doc">With Passbook Upload</option>
                <option value="no_doc">Manual Details Only</option>
              </select>

              {/* Payout Filter */}
              <select
                value={payoutFilter}
                onChange={(e: any) => setPayoutFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="all">Payout: All</option>
                <option value="pending_payout">Pending Payout (&gt; ₹0)</option>
                <option value="zero_pending">Fully Paid (₹0)</option>
              </select>

              {/* Activity / Orders Filter */}
              <select
                value={ordersFilter}
                onChange={(e: any) => setOrdersFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="all">Orders: All</option>
                <option value="has_orders">With Orders (&gt; 0)</option>
                <option value="no_orders">Zero Orders (0)</option>
              </select>

              {/* Referral Network Filter (Request 2) */}
              <select
                value={referralNetworkFilter}
                onChange={(e: any) => setReferralNetworkFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="all">Referrals: All</option>
                <option value="referrers">Women Who Referred Others</option>
                <option value="referred">Referred by Another Woman</option>
                <option value="direct">Direct / Organic Signups</option>
              </select>

              {/* City Filter */}
              {uniqueCities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E] max-w-[140px] truncate"
                >
                  <option value="all">City: All</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort By Dropdown */}
              <select
                value={`${sortField}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortField(field as SortField);
                  setSortOrder(order as SortOrder);
                }}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9B111E]"
              >
                <option value="createdAt_desc">Sort: Newest First</option>
                <option value="createdAt_asc">Sort: Oldest First</option>
                <option value="totalCommissionEarned_desc">Sort: Highest Commission</option>
                <option value="pendingCommission_desc">Sort: Highest Pending Payout</option>
                <option value="totalOrdersCount_desc">Sort: Most Orders</option>
                <option value="totalSalesAmount_desc">Sort: Top Sales</option>
                <option value="fullName_asc">Sort: Name (A-Z)</option>
                <option value="fullName_desc">Sort: Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Results Summary and Filter Reset Pill */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong>{filteredPartners.length}</strong> of <strong>{partners.length}</strong> partners
              </span>
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                  <Filter className="w-2.5 h-2.5" /> Filtered
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[#9B111E] hover:text-[#800E19] font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all partners"
                      checked={filteredPartners.length > 0 && selectedPartnerIds.length === filteredPartners.length}
                      onChange={() => toggleSelectAll(filteredPartners)}
                      className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] border-stone-300 cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('partnerCode')}
                    className="p-3.5 cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Partner Code</span>
                      {sortField === 'partnerCode' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('fullName')}
                    className="p-3.5 cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Full Name</span>
                      {sortField === 'fullName' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5">Contact / Email</th>
                  <th
                    onClick={() => handleSort('city')}
                    className="p-3.5 cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>City</span>
                      {sortField === 'city' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Passbook</th>
                  <th className="p-3.5 text-center">Payment</th>
                  <th className="p-3.5">Referral Network</th>
                  <th
                    onClick={() => handleSort('totalOrdersCount')}
                    className="p-3.5 text-right cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Orders</span>
                      {sortField === 'totalOrdersCount' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalSalesAmount')}
                    className="p-3.5 text-right cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Gross Sales</span>
                      {sortField === 'totalSalesAmount' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalCommissionEarned')}
                    className="p-3.5 text-right cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Earned</span>
                      {sortField === 'totalCommissionEarned' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('pendingCommission')}
                    className="p-3.5 text-right cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Pending</span>
                      {sortField === 'pendingCommission' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="p-3.5 text-center cursor-pointer hover:bg-stone-100 select-none transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B111E]" /> : <ArrowDown className="w-3 h-3 text-[#9B111E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-stone-500">
                      No business partners found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner) => {
                    const isSelected = selectedPartnerIds.includes(partner.id);
                    const isRecentlyAdded = partner.id === recentlyAddedId;
                    return (
                      <tr
                        key={partner.id}
                        className={`transition-all duration-300 ${
                          isRecentlyAdded
                            ? 'bg-emerald-50/90 ring-2 ring-emerald-500 ring-inset'
                            : isSelected
                            ? 'bg-amber-100/50'
                            : 'hover:bg-amber-50/40'
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Select partner ${partner.fullName}`}
                            checked={isSelected}
                            onChange={() => toggleSelectPartner(partner.id)}
                            className="w-4 h-4 rounded text-[#9B111E] focus:ring-[#9B111E] border-stone-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-bold font-mono text-[#9B111E]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{partner.partnerCode}</span>
                            {isRecentlyAdded && (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse inline-flex items-center gap-0.5">
                                ✨ Latest
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  `http://aaplajalgaonwala.com/ref/${partner.partnerCode}`,
                                  partner.partnerCode
                                )
                              }
                              title={`Copy Referral Link: http://aaplajalgaonwala.com/ref/${partner.partnerCode}`}
                              className="p-1 rounded hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer inline-flex items-center"
                            >
                              {copiedCode === partner.partnerCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-stone-900">
                          <div>{formatDisplayName(partner.fullName, partner.partnerCode)}</div>
                          {partner.socialHandle && (
                            <span className="text-[10px] text-stone-400 font-normal">
                              @{partner.socialHandle} ({partner.socialPlatform || 'Social'})
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-600">
                          <div>{partner.phone}</div>
                          {partner.email && (
                            <div className="text-[10px] text-stone-400 truncate max-w-[150px]">{partner.email}</div>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-600">
                          {formatDisplayName(partner.city)}, {formatDisplayName(partner.state)}
                        </td>
                        <td className="p-3.5 text-center">
                          {partner.documentUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (partner.documentUrl?.toLowerCase().endsWith('.pdf')) {
                                  window.open(partner.documentUrl, '_blank');
                                } else {
                                  setZoomedImageUrl(partner.documentUrl || null);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="View Uploaded Bank Passbook"
                            >
                              <ImageIcon className="w-3 h-3 text-emerald-600" />
                              <span>Passbook</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400">Manual</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {partner.paymentStatus === 'paid' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                              title={`Payment Ref: ${partner.paymentRef || 'N/A'}`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid (₹{partner.paymentAmount ?? 699})</span>
                            </span>
                          ) : partner.paymentStatus === 'free' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                              Free (₹0)
                            </span>
                          ) : partner.paymentStatus === 'bypassed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold border border-stone-200">
                              Admin Bypass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              Paid (₹{partner.paymentAmount ?? 699})
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1 min-w-[140px] max-w-[200px]">
                            {partner.referredByPartnerCode ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const referrer = partners.find(p => p.partnerCode === partner.referredByPartnerCode);
                                  if (referrer) openPartnerDetails(referrer);
                                }}
                                className="text-left inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 text-[10px] font-bold border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer truncate"
                                title={`Joined using referral from ${partner.referredByPartnerName || partner.referredByPartnerCode}. Click to view referrer.`}
                              >
                                <Users className="w-3 h-3 text-purple-600 shrink-0" />
                                <span className="truncate">Ref by: <strong>{partner.referredByPartnerName || partner.referredByPartnerCode}</strong></span>
                              </button>
                            ) : null}

                            {(partner.invitedPartnersCount || (partner.invitedPartnersList && partner.invitedPartnersList.length) || 0) > 0 ? (
                              <button
                                type="button"
                                onClick={() => openPartnerDetails(partner)}
                                className="text-left inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 text-[10px] font-bold border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer truncate"
                                title={`Referred ${partner.invitedPartnersCount || partner.invitedPartnersList?.length} women. Click to view.`}
                              >
                                <Sparkles className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Referred <strong>{partner.invitedPartnersCount || partner.invitedPartnersList?.length}</strong> {(partner.invitedPartnersCount || partner.invitedPartnersList?.length) === 1 ? 'Woman' : 'Women'}</span>
                              </button>
                            ) : null}

                            {!partner.referredByPartnerCode && !(partner.invitedPartnersCount || (partner.invitedPartnersList && partner.invitedPartnersList.length)) && (
                              <span className="text-[10px] text-stone-400">Direct Signup</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-semibold">{partner.totalOrdersCount || 0}</td>
                        <td className="p-3.5 text-right text-stone-800">
                          ₹{(partner.totalSalesAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-600">
                          ₹{(partner.totalCommissionEarned || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#9B111E]">
                          ₹{(partner.pendingCommission || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              partner.status === 'active' || partner.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : partner.status === 'suspended'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {partner.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => openPartnerDetails(partner)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>

                          {/* Edit Partner Button */}
                          <button
                            type="button"
                            onClick={() => openEditPartnerModal(partner)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Edit Woman Partner Details & Banking"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Quick Status Action based on current status */}
                          {partner.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={statusUpdatingId === partner.id}
                                onClick={() => handleUpdateStatus(partner.id, 'suspended')}
                                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Reject / Suspend Partner"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {(partner.status === 'active' || partner.status === 'approved') && (
                            <>
                              <button
                                type="button"
                                disabled={statusUpdatingId === partner.id}
                                onClick={() => handleUpdateStatus(partner.id, 'pending')}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Mark status as Pending"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === partner.id}
                                onClick={() => handleUpdateStatus(partner.id, 'suspended')}
                                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Suspend Partner Access"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Suspend</span>
                              </button>
                            </>
                          )}

                          {partner.status === 'suspended' && (
                            <>
                              <button
                                type="button"
                                disabled={statusUpdatingId === partner.id}
                                onClick={() => handleUpdateStatus(partner.id, 'active')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Unsuspend & Activate Partner"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>{statusUpdatingId === partner.id ? '...' : 'Activate'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdatingId === partner.id}
                                onClick={() => handleUpdateStatus(partner.id, 'pending')}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Set status to Pending"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </button>
                            </>
                          )}

                          {/* Add WhatsApp Custom Fund */}
                          <button
                            type="button"
                            onClick={() => handleOpenCustomFundModal(partner)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Add Custom Commission in Rupees for WhatsApp Order"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>+ Fund</span>
                          </button>

                          {/* Pay Payout */}
                          <button
                            onClick={() => handleOpenSettlement(partner)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Pay
                          </button>

                          {/* Delete Partner Button */}
                          <button
                            type="button"
                            onClick={() => setPartnerToDelete(partner)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Delete Partner"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* POPUP MODAL: ADJUST PARTNER JOINING FEE (REQUEST 3) */}
        {/* ========================================================================= */}
        {isFeeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl border border-stone-100">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-[#D9531E]">
                    <Sliders className="w-4 h-4 text-[#D9531E]" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Adjust Joining Fee</h3>
                    <p className="text-[11px] text-stone-500">Public Partner Application Registration Fee</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFee} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 block">Registration Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={tempFeeInput}
                      onChange={(e) => setTempFeeInput(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      placeholder="0 or 699"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Enter <strong>0</strong> to make registration <strong>100% Free</strong>. All new applicants will activate instantly without payment gateway.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Quick Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Free (₹0)', value: 0 },
                      { label: '₹499', value: 499 },
                      { label: '₹699', value: 699 },
                      { label: '₹999', value: 999 }
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setTempFeeInput(preset.value)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          tempFeeInput === preset.value
                            ? 'bg-[#9B111E] text-white border-[#9B111E]'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {feeSaveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Registration fee updated successfully!</span>
                  </div>
                )}

                {feeError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{feeError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsFeeModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingFee}
                    className="px-5 py-2 rounded-xl bg-[#9B111E] hover:bg-[#800E19] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSavingFee ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Fee</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPREHENSIVE PARTNER DETAILS MODAL (REQUEST 2) */}
        {/* ========================================================================= */}
        {isDetailsOpen && selectedPartner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-100">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        selectedPartner.status === 'active' || selectedPartner.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : selectedPartner.status === 'suspended'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span>{selectedPartner.status}</span>
                    </span>

                    {/* Edit Partner Button in Header */}
                    <button
                      type="button"
                      onClick={() => openEditPartnerModal(selectedPartner)}
                      className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Edit Partner Profile, Banking, and Settings"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Partner</span>
                    </button>

                    {/* Header Status Controls */}
                    {selectedPartner.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedPartner.id}
                          onClick={() => handleUpdateStatus(selectedPartner.id, 'suspended')}
                          className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-700 border border-stone-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject / Suspend</span>
                        </button>
                      </div>
                    )}

                    {(selectedPartner.status === 'active' || selectedPartner.status === 'approved') && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedPartner.id}
                          onClick={() => handleUpdateStatus(selectedPartner.id, 'pending')}
                          className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Set to Pending</span>
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedPartner.id}
                          onClick={() => handleUpdateStatus(selectedPartner.id, 'suspended')}
                          className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-700 border border-stone-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </button>
                      </div>
                    )}

                    {selectedPartner.status === 'suspended' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedPartner.id}
                          onClick={() => handleUpdateStatus(selectedPartner.id, 'active')}
                          className="px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Reactivate Partner</span>
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedPartner.id}
                          onClick={() => handleUpdateStatus(selectedPartner.id, 'pending')}
                          className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Set to Pending</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-stone-900">{formatDisplayName(selectedPartner.fullName, selectedPartner.partnerCode)}</h2>
                  <p className="text-xs text-stone-500 font-mono">
                    Code: <strong>{selectedPartner.partnerCode}</strong> • Joined on{' '}
                    {new Date(selectedPartner.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-sm font-bold transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Referred by Woman Partner Banner (Request 2) */}
              {selectedPartner.referredByPartnerCode && (
                <div className="bg-purple-50/90 p-4 rounded-2xl border border-purple-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200">
                      <Users className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-800 uppercase font-black tracking-wider">
                        Referred By Woman Partner
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-stone-900 mt-0.5">
                        {selectedPartner.referredByPartnerName || 'Registered Woman Partner'} ({selectedPartner.referredByPartnerCode})
                      </p>
                      <p className="text-[11px] text-stone-500">
                        This partner joined Aapla Jalgaonwala via {selectedPartner.referredByPartnerName || 'her'}'s invite link
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const refPartner = partners.find(p => p.partnerCode === selectedPartner.referredByPartnerCode);
                      if (refPartner) openPartnerDetails(refPartner);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <span>View Referrer Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Referral Link Quick Copy Box */}
              <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider">
                    Direct Referral Link (4% Customer Discount)
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-800 break-all select-all mt-0.5">
                    http://aaplajalgaonwala.com/ref/{selectedPartner.partnerCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      `http://aaplajalgaonwala.com/ref/${selectedPartner.partnerCode}`,
                      selectedPartner.partnerCode
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-[#9B111E] hover:bg-[#800d18] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {copiedCode === selectedPartner.partnerCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Personal & Contact Information Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-stone-400">
                  Partner Contact & Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Email Address</span>
                    <div className="flex items-center gap-1.5 font-semibold text-stone-800 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a
                        href={`mailto:${selectedPartner.email}`}
                        className="text-[#9B111E] hover:underline truncate"
                      >
                        {selectedPartner.email || 'N/A'}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Phone / WhatsApp</span>
                    <div className="flex items-center gap-2 font-semibold text-stone-800 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{selectedPartner.phone}</span>
                      <a
                        href={`https://wa.me/91${selectedPartner.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-0.5"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>Chat</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Location</span>
                    <div className="font-semibold text-stone-800 mt-0.5">
                      {formatDisplayName(selectedPartner.city)}, {formatDisplayName(selectedPartner.state)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Social Media Channel</span>
                    <div className="font-semibold text-stone-800 mt-0.5">
                      {selectedPartner.socialPlatform || 'WhatsApp'}{' '}
                      {selectedPartner.socialHandle && (
                        <span className="text-stone-500 font-normal">(@{selectedPartner.socialHandle})</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Aadhaar / ID Number</span>
                    <div className="font-mono font-semibold text-stone-800 mt-0.5">
                      {selectedPartner.aadhaarPanNumber || 'Verified ID'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Commission & Discount</span>
                    <div className="font-semibold text-emerald-700 mt-0.5">
                      {selectedPartner.commissionRate || 12}% Partner / {selectedPartner.customerDiscountRate || 4}% Client Discount
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Payment Information Card */}
              <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Onboarding & Payment Verification</span>
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      selectedPartner.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : selectedPartner.paymentStatus === 'free'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-stone-100 text-stone-800 border-stone-300'
                    }`}
                  >
                    Payment: {selectedPartner.paymentStatus === 'paid' ? 'Paid' : selectedPartner.paymentStatus === 'free' ? 'Free (₹0)' : 'Admin Bypassed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold">Fee Amount</span>
                    <div className="font-bold text-stone-900 mt-0.5 text-sm">
                      ₹{selectedPartner.paymentAmount !== undefined ? selectedPartner.paymentAmount : 699}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold">Razorpay Transaction ID</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="font-mono font-semibold text-stone-900 text-[11px] truncate max-w-[150px]" title={selectedPartner.transactionId || selectedPartner.paymentRef || 'N/A'}>
                        {selectedPartner.transactionId || selectedPartner.paymentRef || 'Verified'}
                      </div>
                      {(selectedPartner.transactionId || selectedPartner.paymentRef) && (
                        <button
                          type="button"
                          onClick={() => {
                            const val = selectedPartner.transactionId || selectedPartner.paymentRef || '';
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(val);
                            }
                            setCopiedTxnId(val);
                            setTimeout(() => setCopiedTxnId(null), 2000);
                          }}
                          className="p-1 rounded-md bg-white border border-stone-200 text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                          title="Copy Transaction ID"
                        >
                          {copiedTxnId === (selectedPartner.transactionId || selectedPartner.paymentRef) ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold">Payment Date</span>
                    <div className="font-semibold text-stone-800 mt-0.5">
                      {selectedPartner.paymentDate
                        ? new Date(selectedPartner.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : new Date(selectedPartner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold">Approval Status</span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          selectedPartner.status === 'active' || selectedPartner.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedPartner.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {selectedPartner.status === 'pending' ? 'Pending Approval' : selectedPartner.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPartner.razorpayOrderId && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">Razorpay Order ID:</span>
                    <span className="font-mono font-semibold text-stone-800">{selectedPartner.razorpayOrderId}</span>
                  </div>
                )}
              </div>

              {/* Bank Account & Settlement Details Card */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Bank & Settlement Account Details</span>
                  </h3>
                  {selectedPartner.documentUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passbook Attached
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Account Holder Name</span>
                    <div className="font-bold text-stone-900 mt-0.5">
                      {formatDisplayName(selectedPartner.bankAccountName || selectedPartner.fullName)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Bank Name</span>
                    <div className="font-bold text-stone-900 mt-0.5">{selectedPartner.bankName || 'N/A'}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">Account Number</span>
                    <div className="font-mono font-bold text-stone-900 mt-0.5 flex items-center gap-1">
                      <span>{selectedPartner.bankAccountNumber}</span>
                      {selectedPartner.bankAccountNumber && selectedPartner.bankAccountNumber !== 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedPartner.bankAccountNumber, 'acc_no')}
                          className="text-stone-400 hover:text-stone-700 p-0.5"
                          title="Copy Account Number"
                        >
                          {copiedCode === 'acc_no' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">IFSC Code</span>
                    <div className="font-mono font-bold text-stone-900 mt-0.5 flex items-center gap-1">
                      <span>{selectedPartner.ifscCode}</span>
                      {selectedPartner.ifscCode && selectedPartner.ifscCode !== 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedPartner.ifscCode, 'ifsc')}
                          className="text-stone-400 hover:text-stone-700 p-0.5"
                          title="Copy IFSC Code"
                        >
                          {copiedCode === 'ifsc' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-stone-400 uppercase font-bold">
                      PhonePe / GPay / UPI (Instant Payout)
                    </span>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <span>{selectedPartner.upiId || 'Not provided'}</span>
                      {selectedPartner.upiId && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedPartner.upiId || '', 'upi_id')}
                          className="text-stone-400 hover:text-stone-700 p-0.5"
                          title="Copy UPI ID"
                        >
                          {copiedCode === 'upi_id' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* UPLOADED PASSBOOK IMAGE / DOCUMENT PREVIEW SECTION */}
                <div className="pt-3 border-t border-stone-200 mt-3">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block mb-2">
                    Uploaded Bank Passbook / Cheque Document
                  </span>
                  {selectedPartner.documentUrl ? (
                    <div className="bg-white rounded-xl p-3.5 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {selectedPartner.documentUrl.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <div
                            onClick={() => setZoomedImageUrl(selectedPartner.documentUrl || null)}
                            className="relative w-14 h-14 rounded-xl border border-stone-300 overflow-hidden bg-stone-100 shrink-0 cursor-pointer group"
                            title="Click to Zoom Passbook Image"
                          >
                            <img
                              src={selectedPartner.documentUrl}
                              alt="Bank Passbook Preview"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-stone-900">
                            {selectedPartner.documentUrl.toLowerCase().endsWith('.pdf')
                              ? 'Bank Passbook PDF Document'
                              : 'Bank Passbook Photo (Attached by Applicant)'}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Verified on application submission
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!selectedPartner.documentUrl.toLowerCase().endsWith('.pdf') && (
                          <button
                            type="button"
                            onClick={() => setZoomedImageUrl(selectedPartner.documentUrl || null)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Zoom Image</span>
                          </button>
                        )}
                        <a
                          href={selectedPartner.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[#9B111E] hover:bg-[#800E19] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Full Document</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-xl text-xs text-stone-500 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-stone-400" />
                      <span>Manual bank details entered by applicant (no passbook file uploaded).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Women Who Joined Through Her Link (Request 2) */}
              <div className="bg-rose-50/40 rounded-2xl border border-rose-200/80 p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 border border-rose-200">
                      <Users className="w-4 h-4 text-rose-700" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Women Who Joined Through Her Link ({partnerInvitedWomen.length})</span>
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Registered partner accounts attributed to {selectedPartner.fullName} (earned ₹200 bonus each).
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 shrink-0 self-start sm:self-auto">
                    Total Referral Bonus: ₹{(selectedPartner.referralBonusEarned || (partnerInvitedWomen.length * 200)).toLocaleString('en-IN')}
                  </span>
                </div>

                {partnerInvitedWomen.length === 0 ? (
                  <div className="p-4 bg-white rounded-xl border border-rose-100 text-center text-xs text-stone-500">
                    No women have registered through {selectedPartner.fullName}'s referral link yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-xl border border-rose-200/70">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                          <th className="p-3">Woman Name</th>
                          <th className="p-3">Partner Code</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3">City / State</th>
                          <th className="p-3">Joined Date</th>
                          <th className="p-3 text-center">Registration Fee</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {partnerInvitedWomen.map((woman) => (
                          <tr key={woman.id || woman.partnerCode} className="hover:bg-rose-50/30 transition-colors">
                            <td className="p-3 font-bold text-stone-900">
                              {woman.fullName}
                            </td>
                            <td className="p-3 font-mono font-bold text-[#9B111E]">
                              {woman.partnerCode}
                            </td>
                            <td className="p-3 text-stone-600">
                              <div>{woman.phone || 'N/A'}</div>
                              {woman.email && <div className="text-[10px] text-stone-400 truncate max-w-[120px]">{woman.email}</div>}
                            </td>
                            <td className="p-3 text-stone-600">
                              {woman.city}{woman.state ? `, ${woman.state}` : ''}
                            </td>
                            <td className="p-3 text-stone-600 whitespace-nowrap">
                              {new Date(woman.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>₹{woman.paymentAmount || 699} Paid</span>
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                woman.status === 'active' || woman.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {woman.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const targetWoman = partners.find(p => p.partnerCode === woman.partnerCode);
                                  if (targetWoman) openPartnerDetails(targetWoman);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Referrals List */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>Referred Customer Orders ({partnerReferrals.length})</span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Orders placed using referral code or added manually via WhatsApp fund.
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-[11px] font-bold border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setReferralFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        referralFilter === 'all'
                          ? 'bg-white text-stone-900 shadow-2xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All ({partnerReferrals.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReferralFilter('whatsapp')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        referralFilter === 'whatsapp'
                          ? 'bg-emerald-600 text-white shadow-2xs font-black'
                          : 'text-emerald-700 hover:text-emerald-800'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp ({partnerReferrals.filter(isWhatsAppOrder).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReferralFilter('website')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        referralFilter === 'website'
                          ? 'bg-white text-stone-900 shadow-2xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Website ({partnerReferrals.filter((r) => !isWhatsAppOrder(r)).length})
                    </button>
                  </div>
                </div>

                {deleteReferralSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{deleteReferralSuccessMessage}</span>
                  </div>
                )}

                {filteredPartnerReferrals.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 bg-stone-50 rounded-xl text-center border border-stone-100">
                    {referralFilter === 'whatsapp'
                      ? 'No WhatsApp orders recorded for this partner.'
                      : referralFilter === 'website'
                      ? 'No website orders placed via this referral code yet.'
                      : 'No customer orders placed yet.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-stone-200 rounded-xl shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-100 text-[10px] text-stone-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5">Order # & Source</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Customer & City</th>
                          <th className="p-2.5 text-right">Order Amount</th>
                          <th className="p-2.5 text-right">Commission (12%)</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredPartnerReferrals.map((r) => {
                          const isWA = isWhatsAppOrder(r);
                          return (
                            <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900">#{r.orderNumber}</span>
                                  {isWA ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                                      WhatsApp
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      Website
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2.5 text-stone-600 whitespace-nowrap">
                                {r.orderDate || new Date(r.createdAt).toLocaleDateString('en-IN')}
                              </td>
                              <td className="p-2.5">
                                <div className="text-stone-800 font-semibold truncate max-w-[140px]">
                                  {r.customerName || (isWA ? 'WhatsApp Customer' : 'Customer')}
                                </div>
                                <div className="text-[10px] text-stone-400">{r.customerCity || 'Maharashtra'}</div>
                              </td>
                              <td className="p-2.5 text-right font-medium text-stone-800">₹{r.orderTotal}</td>
                              <td className="p-2.5 text-right font-bold">
                                {(() => {
                                  const orderSt = String(r.orderStatus || '').toLowerCase().trim();
                                  const refSt = String(r.status || '').toLowerCase().trim();
                                  const isCancelled = orderSt === 'cancelled' || orderSt.includes('cancel') || refSt === 'cancelled';
                                  const isFailed = orderSt === 'failed' || orderSt.includes('fail') || refSt === 'failed';
                                  const isOnHold = orderSt === 'on_hold' || orderSt === 'on hold' || orderSt.includes('hold') || refSt === 'on_hold';
                                  const isDelivered = !isCancelled && !isFailed && !isOnHold && (Boolean(r.isDelivered) || orderSt === 'delivered' || refSt === 'settled');

                                  if (isCancelled) {
                                    return (
                                      <div>
                                        <span className="text-stone-400 line-through text-xs font-semibold">₹{r.partnerCommission}</span>
                                        <span className="block text-[9px] text-rose-600 font-bold">Cancelled (₹0)</span>
                                      </div>
                                    );
                                  }
                                  if (isFailed) {
                                    return (
                                      <div>
                                        <span className="text-stone-400 line-through text-xs font-semibold">₹{r.partnerCommission}</span>
                                        <span className="block text-[9px] text-rose-600 font-bold">Failed (₹0)</span>
                                      </div>
                                    );
                                  }
                                  if (!isDelivered) {
                                    return (
                                      <div>
                                        <span className="text-amber-800/80 text-xs font-semibold line-through">₹{r.partnerCommission}</span>
                                        <span className="block text-[9px] text-amber-700 font-bold">On Hold (Not Counted)</span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div>
                                      <span className="text-emerald-600 font-bold text-sm">+₹{r.partnerCommission}</span>
                                      <span className="block text-[9px] text-emerald-700 font-bold">Delivered (Counted)</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                {(() => {
                                  const orderSt = String(r.orderStatus || '').toLowerCase().trim();
                                  const refSt = String(r.status || '').toLowerCase().trim();
                                  const isCancelled = orderSt === 'cancelled' || orderSt.includes('cancel') || refSt === 'cancelled';
                                  const isFailed = orderSt === 'failed' || orderSt.includes('fail') || refSt === 'failed';
                                  const isOnHold = orderSt === 'on_hold' || orderSt === 'on hold' || orderSt.includes('hold') || refSt === 'on_hold';
                                  const isDelivered = !isCancelled && !isFailed && !isOnHold && (Boolean(r.isDelivered) || orderSt === 'delivered' || refSt === 'settled');

                                  if (isCancelled) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        Cancelled
                                      </span>
                                    );
                                  }
                                  if (isFailed) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        Failed
                                      </span>
                                    );
                                  }
                                  if (!isDelivered) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        On Hold (Pending Delivery)
                                      </span>
                                    );
                                  }
                                  return (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        r.status === 'settled'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {r.status === 'settled' ? 'Settled' : 'Delivered / Eligible'}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setReferralToDelete({ referral: r, partner: selectedPartner })}
                                  className="px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Delete order and deduct commission"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Buttons & Danger Zone */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = selectedPartner;
                    setIsDetailsOpen(false);
                    setPartnerToDelete(toDel);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Partner</span>
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenCustomFundModal(selectedPartner);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add WhatsApp Fund</span>
                  </button>
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenSettlement(selectedPartner);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    Record Sunday Payout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FULLSCREEN IMAGE ZOOM LIGHTBOX */}
        {/* ========================================================================= */}
        {zoomedImageUrl && (
          <div
            onClick={() => setZoomedImageUrl(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden p-2 shadow-2xl flex flex-col items-center"
            >
              <button
                type="button"
                onClick={() => setZoomedImageUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={zoomedImageUrl}
                alt="Bank Passbook Full Resolution"
                className="max-w-full max-h-[82vh] object-contain rounded-xl"
              />
              <div className="pt-2 text-center text-xs text-stone-300 flex items-center gap-3">
                <span>Passbook Inspection View</span>
                <a
                  href={zoomedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-1 font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {partnerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-stone-900">Delete Partner Account?</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Are you sure you want to delete partner <strong>{partnerToDelete.fullName}</strong> (Code:{' '}
                    <code>{partnerToDelete.partnerCode}</code>)?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold">⚠️ Warning:</p>
                <p>
                  This will permanently remove the partner profile, their unique referral code, and linked bank details.
                </p>
              </div>

              {deletePartnerError && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                  {deletePartnerError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingPartner}
                  onClick={() => {
                    setPartnerToDelete(null);
                    setDeletePartnerError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingPartner}
                  onClick={handleDeletePartner}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingPartner ? 'Deleting...' : 'Yes, Delete Partner'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Referral / WhatsApp Order Confirmation Modal */}
        {referralToDelete && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 border border-rose-100">
              <div className="flex justify-between items-start border-b border-stone-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                      <span>Delete WhatsApp Order</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Permanent
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Remove manually added WhatsApp order and recalculate commission.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeletingReferral) {
                      setReferralToDelete(null);
                      setDeleteReferralError(null);
                    }
                  }}
                  disabled={isDeletingReferral}
                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {deleteReferralError && (
                <div className="p-3.5 rounded-2xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{deleteReferralError}</span>
                </div>
              )}

              {/* Order Info Card */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-stone-500 font-medium">Order Number:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">#{referralToDelete.referral.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-stone-500 font-medium">Woman Partner:</span>
                  <span className="font-bold text-stone-900">
                    {referralToDelete.partner?.fullName || referralToDelete.referral.partnerName || 'Partner'} ({referralToDelete.referral.partnerCode})
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-stone-500 font-medium">Order Date:</span>
                  <span className="text-stone-800">
                    {referralToDelete.referral.orderDate || new Date(referralToDelete.referral.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-stone-500 font-medium">Customer & City:</span>
                  <span className="text-stone-800">
                    {referralToDelete.referral.customerName || 'WhatsApp Customer'} ({referralToDelete.referral.customerCity || 'N/A'})
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-stone-500 font-medium">Order Value:</span>
                  <span className="text-stone-900 font-semibold">₹{referralToDelete.referral.orderTotal}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-rose-700 font-bold">Commission to Deduct:</span>
                  <span className="text-base font-black text-rose-600">-₹{referralToDelete.referral.partnerCommission}</span>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold">Are you sure you want to delete this order?</p>
                  <p className="text-[11px] text-amber-800">
                    Deleting this WhatsApp order will permanently remove it from the partner's referral records and deduct{' '}
                    <strong>₹{referralToDelete.referral.partnerCommission}</strong> from her pending commission payout balance.
                    Her analytics dashboard will update immediately.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setReferralToDelete(null);
                    setDeleteReferralError(null);
                  }}
                  disabled={isDeletingReferral}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReferral}
                  disabled={isDeletingReferral}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingReferral ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting Order...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Order & Update Balance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Modal */}
        {isSettlementModalOpen && settlementPartner && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleRecordSettlement}
              className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <h3 className="text-base font-bold text-stone-900">Record Sunday Payout</h3>
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-stone-700">
                Partner: <strong>{settlementPartner.fullName}</strong> ({settlementPartner.partnerCode})<br />
                Bank: {settlementPartner.bankName} - {settlementPartner.bankAccountNumber} (UPI:{' '}
                {settlementPartner.upiId || 'N/A'})
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Settlement Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Payment Method</label>
                <select
                  value={settlementMethod}
                  onChange={(e: any) => setSettlementMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option value="UPI">UPI Transfer (PhonePe / GPay)</option>
                  <option value="IMPS">IMPS Immediate Bank Transfer</option>
                  <option value="NEFT">NEFT Bank Transfer</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Bank / UPI Transaction Reference ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR198274928174 or UPI Ref 42918"
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly settlement for 4 orders"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSettlement}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingSettlement ? 'Saving...' : 'Confirm Payout Receipt'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* WhatsApp Custom Fund / Commission Modal */}
        {isCustomFundModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <form
              onSubmit={handleRecordCustomFund}
              className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-stone-100"
            >
              <div className="flex justify-between items-start border-b border-stone-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                      <span>Add WhatsApp Order Commission</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Rupees (₹)
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Credit commission for a woman partner who placed an order via WhatsApp.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomFundModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Feedback Message */}
              {customFundFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 font-medium ${
                    customFundFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {customFundFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{customFundFeedback.message}</span>
                </div>
              )}

              {/* Partner Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span>Woman Business Partner *</span>
                  {customFundPartner && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Pending Commission: ₹{(customFundPartner.pendingCommission || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select
                  value={customFundPartner?.id || ''}
                  onChange={(e) => {
                    const found = partners.find((p) => p.id === e.target.value);
                    if (found) {
                      setCustomFundPartner(found);
                      fetchCustomFundPartnerReferrals(found.partnerCode);
                      if (!customFundCustomerCity) {
                        setCustomFundCustomerCity(found.city || '');
                      }
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-800 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.partnerCode}) — {p.city} | Current Pending: ₹{(p.pendingCommission || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>

                {customFundPartner && (
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span>Phone: <strong className="text-stone-900">{customFundPartner.phone}</strong></span>
                      <span>Email: <strong className="text-stone-900">{customFundPartner.email || 'None'}</strong></span>
                    </div>
                    <div>
                      <span>Rate: <strong className="text-stone-900">{customFundPartner.commissionRate || 12}%</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">WhatsApp Order Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WA-10294 or Chat Ref"
                    value={customFundOrderRef}
                    onChange={(e) => setCustomFundOrderRef(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">WhatsApp Order Value / Total (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 1500"
                      value={customFundOrderTotal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomFundOrderTotal(val);
                        // Optional auto-suggest commission if not manually entered
                        if (val && !customFundAmount && customFundPartner) {
                          const rate = customFundPartner.commissionRate || 12;
                          const calculated = Math.round((parseFloat(val) * rate) / 100);
                          if (calculated > 0) {
                            setCustomFundAmount(calculated.toString());
                          }
                        }
                      }}
                      className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patil"
                    value={customFundCustomerName}
                    onChange={(e) => setCustomFundCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Customer City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Jalgaon, Mumbai"
                    value={customFundCustomerCity}
                    onChange={(e) => setCustomFundCustomerCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Commission Amount Section */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Commission Fund in Rupees (₹) *</span>
                  </label>
                  {customFundOrderTotal && parseFloat(customFundOrderTotal) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const total = parseFloat(customFundOrderTotal);
                        const rate = customFundPartner?.commissionRate || 12;
                        const calc = Math.round((total * rate) / 100);
                        setCustomFundAmount(calc.toString());
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-300 cursor-pointer shadow-2xs"
                    >
                      Use {customFundPartner?.commissionRate || 12}% (₹{Math.round((parseFloat(customFundOrderTotal) * (customFundPartner?.commissionRate || 12)) / 100)})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-emerald-700 font-extrabold text-base">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 180"
                    value={customFundAmount}
                    onChange={(e) => setCustomFundAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border-2 border-emerald-300 text-base font-black text-emerald-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-stone-500 mr-1">Quick Presets:</span>
                  {[50, 100, 150, 200, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomFundAmount(preset.toString())}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-800 transition-colors cursor-pointer"
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commission Payout Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700">Commission Payout Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomFundMarkAsPaid(false)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      !customFundMarkAsPaid
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                      <span>Add to Pending Balance</span>
                      {!customFundMarkAsPaid && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Included in the scheduled weekly Sunday payout via bank/UPI.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomFundMarkAsPaid(true)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      customFundMarkAsPaid
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                      <span>Mark as Already Paid</span>
                      {customFundMarkAsPaid && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Already transferred to her via PhonePe, GPay, or Cash.
                    </p>
                  </button>
                </div>
              </div>

              {/* If marked as already paid */}
              {customFundMarkAsPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Payment Method</label>
                    <select
                      value={customFundPaymentMethod}
                      onChange={(e) => setCustomFundPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-medium"
                    >
                      <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                      <option value="IMPS">IMPS Bank Transfer</option>
                      <option value="NEFT">NEFT Bank Transfer</option>
                      <option value="Cash">Cash Handover</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Transaction Ref / UTR</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-3928174 or UPI Ref"
                      value={customFundTxnRef}
                      onChange={(e) => setCustomFundTxnRef(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Notes / Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Order Notes / Products Ordered</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer ordered 3kg Shev & Banana Chips via WhatsApp chat."
                  value={customFundNotes}
                  onChange={(e) => setCustomFundNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Email Checkbox */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="customFundSendEmailCheckbox"
                  checked={customFundSendEmail}
                  onChange={(e) => setCustomFundSendEmail(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="customFundSendEmailCheckbox" className="text-xs text-stone-700 cursor-pointer">
                  <strong>Send Email Notification to Partner</strong>
                  <span className="block text-[11px] text-stone-500 mt-0.5">
                    Will send an official confirmation email breakdown to{' '}
                    <span className="font-semibold text-stone-800">
                      {customFundPartner?.email || 'registered partner email'}
                    </span>
                    .
                  </span>
                </label>
              </div>

              {/* Existing WhatsApp Orders for this Partner with Delete Button */}
              {customFundPartner && (
                <div className="border border-stone-200 rounded-2xl p-3.5 bg-stone-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Existing WhatsApp Orders for {customFundPartner.fullName}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                        {customFundPartnerReferrals.filter(isWhatsAppOrder).length}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchCustomFundPartnerReferrals(customFundPartner.partnerCode)}
                      disabled={isLoadingCustomFundReferrals}
                      className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                      title="Refresh orders list"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCustomFundReferrals ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingCustomFundReferrals ? (
                    <div className="p-3 text-center text-xs text-stone-400">Loading orders...</div>
                  ) : customFundPartnerReferrals.filter(isWhatsAppOrder).length === 0 ? (
                    <p className="text-[11px] text-stone-500 italic py-1 px-1">
                      No WhatsApp orders recorded yet for this partner.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {customFundPartnerReferrals.filter(isWhatsAppOrder).map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs hover:border-emerald-200 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-stone-900 text-[11px]">#{ref.orderNumber}</span>
                              <span className="text-[10px] text-stone-400">
                                {ref.orderDate || new Date(ref.createdAt).toLocaleDateString('en-IN')}
                              </span>
                              {ref.customerCity && (
                                <span className="text-[10px] text-stone-600 truncate">({ref.customerCity})</span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700">
                              +₹{ref.partnerCommission} commission {ref.orderTotal > 0 && <span className="text-stone-500 font-normal">on ₹{ref.orderTotal} order</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReferralToDelete({ referral: ref, partner: customFundPartner })}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Delete this WhatsApp order and deduct commission"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCustomFundModalOpen(false)}
                  disabled={isSubmittingCustomFund}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomFund || !customFundAmount}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSubmittingCustomFund ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Crediting Fund...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Credit ₹{customFundAmount || '0'} Commission</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Partner Modal */}
        {isAddPartnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto border border-stone-100 space-y-5">
              <div className="flex justify-between items-start border-b border-stone-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900">Add Women Business Partner</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200 uppercase tracking-wider">
                      Admin Direct Onboarding
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Directly create and activate partner account with all KYC, reach, and payout channels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPartnerModalOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addPartnerError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-800 font-bold">{addPartnerError}</p>
                </div>
              )}

              <form onSubmit={handleAddPartnerSubmit} className="space-y-5">
                {/* SECTION 1: Personal & Contact */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>1. Personal & Contact Details</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 block">Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sunita Patil"
                      value={addPartnerForm.fullName}
                      onChange={(e) => setAddPartnerForm({ ...addPartnerForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Phone / WhatsApp Number (10 Digits) *</label>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9822012345"
                        value={addPartnerForm.phone}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Email Address *</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. sunita.patil@gmail.com"
                        value={addPartnerForm.email}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, email: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">City / Town *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Jalgaon"
                        value={addPartnerForm.city}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, city: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">State *</label>
                      <input
                        required
                        type="text"
                        value={addPartnerForm.state}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, state: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Social / Community Reach */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>2. Social & Community Reach</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Primary Network / Channel</label>
                      <select
                        value={addPartnerForm.socialPlatform}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, socialPlatform: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      >
                        <option value="WhatsApp">WhatsApp Community / Family Groups</option>
                        <option value="Housing Society">Housing Society / Colony Network</option>
                        <option value="Instagram">Instagram Page / Influencer</option>
                        <option value="Facebook">Facebook Groups / Marketplace</option>
                        <option value="Boutique">Local Boutique / Beauty Parlor</option>
                        <option value="Other">Other Community Reach</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Network Handle / Society Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Gokuldham Society Group or @sunita_kitchen"
                        value={addPartnerForm.socialHandle}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, socialHandle: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Commission Settlement Method */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/50 pb-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
                      <IndianRupee className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>3. Payout Settlement Details (Sunday Payout)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      10% Commission
                    </span>
                  </div>

                  {/* Payout Tabs */}
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 p-1 bg-stone-200/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAdminPayoutTab('phonepe')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        adminPayoutTab === 'phonepe'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      PhonePe / GPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminPayoutTab('bank')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        adminPayoutTab === 'bank'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Bank Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminPayoutTab('passbook')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        adminPayoutTab === 'passbook'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Passbook URL
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {adminPayoutTab === 'phonepe' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-bold text-stone-700 block">
                        PhonePe / Google Pay Mobile Number (10 Digits) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9822012345"
                          value={addPartnerForm.phonePeNumber}
                          onChange={(e) => setAddPartnerForm({ ...addPartnerForm, phonePeNumber: e.target.value.replace(/\D/g, '') })}
                          className="w-full pl-12 pr-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Commission is credited directly to this UPI phone number every Sunday night.
                      </p>
                    </div>
                  )}

                  {adminPayoutTab === 'upi' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-bold text-stone-700 block">UPI ID / VPA *</label>
                      <input
                        type="text"
                        placeholder="e.g. sunita@okhdfcbank or 9822012345@ybl"
                        value={addPartnerForm.upiId}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, upiId: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  )}

                  {adminPayoutTab === 'bank' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">Account Holder Name</label>
                        <input
                          type="text"
                          placeholder="Name as in bank"
                          value={addPartnerForm.bankAccountName}
                          onChange={(e) => setAddPartnerForm({ ...addPartnerForm, bankAccountName: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. SBI, HDFC, Bank of Maharashtra"
                          value={addPartnerForm.bankName}
                          onChange={(e) => setAddPartnerForm({ ...addPartnerForm, bankName: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">Bank Account Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 501002391823"
                          value={addPartnerForm.bankAccountNumber}
                          onChange={(e) => setAddPartnerForm({ ...addPartnerForm, bankAccountNumber: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">IFSC Code</label>
                        <input
                          type="text"
                          placeholder="e.g. SBIN0001234"
                          value={addPartnerForm.ifscCode}
                          onChange={(e) => setAddPartnerForm({ ...addPartnerForm, ifscCode: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-medium uppercase focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {adminPayoutTab === 'passbook' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-bold text-stone-700 block">Bank Passbook / QR Document URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={addPartnerForm.documentUrl}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, documentUrl: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 4: KYC & Identity */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>4. Identity & KYC Verification</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 block">Aadhaar (12 Digits) or PAN Card Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 5432 1098 7654 or ABCDE1234F"
                      value={addPartnerForm.aadhaarPanNumber}
                      onChange={(e) => setAddPartnerForm({ ...addPartnerForm, aadhaarPanNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* SECTION 5: Status & Controls */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>5. Account Status & Code Setup</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Initial Account Status</label>
                      <select
                        value={addPartnerForm.status}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, status: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      >
                        <option value="active">Active & Verified (Immediate Link & Sales Access)</option>
                        <option value="pending">Pending Admin Review</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Custom Partner Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate (e.g. SUNITA10)"
                        value={addPartnerForm.customPartnerCode}
                        onChange={(e) => setAddPartnerForm({ ...addPartnerForm, customPartnerCode: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsAddPartnerModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingPartner}
                    className="px-6 py-2 rounded-xl bg-[#9B111E] hover:bg-[#800E19] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isAddingPartner ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Partner...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create & Activate Partner</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Partner Modal */}
        {isEditPartnerModalOpen && editingPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto border border-stone-100 space-y-5">
              <div className="flex justify-between items-start border-b border-stone-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900">Edit Woman Business Partner</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono uppercase tracking-wider">
                      {editingPartner.partnerCode}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Update personal profile, banking details, commission rates, and account status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditPartnerModalOpen(false);
                    setEditingPartner(null);
                  }}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editPartnerError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-800 font-bold">{editPartnerError}</p>
                </div>
              )}

              <form onSubmit={handleSaveEditPartner} className="space-y-5">
                {/* SECTION 1: Personal & Contact */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>1. Personal & Contact Details</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 block">Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sunita Patil"
                      value={editPartnerForm.fullName}
                      onChange={(e) => setEditPartnerForm({ ...editPartnerForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Phone / WhatsApp (10 Digits) *</label>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9822012345"
                        value={editPartnerForm.phone}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Email Address *</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. sunita.patil@gmail.com"
                        value={editPartnerForm.email}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, email: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">City / Town *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Jalgaon"
                        value={editPartnerForm.city}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, city: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">State *</label>
                      <input
                        required
                        type="text"
                        value={editPartnerForm.state}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, state: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Social / Community Reach */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>2. Social & Community Reach</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Primary Network / Channel</label>
                      <select
                        value={editPartnerForm.socialPlatform}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, socialPlatform: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      >
                        <option value="WhatsApp">WhatsApp Community / Family Groups</option>
                        <option value="Housing Society">Housing Society / Colony Network</option>
                        <option value="Instagram">Instagram Page / Influencer</option>
                        <option value="Facebook">Facebook Groups / Marketplace</option>
                        <option value="Boutique">Local Boutique / Beauty Parlor</option>
                        <option value="Direct Word-of-Mouth">Direct Word-of-Mouth / Friends & Family</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Handle / Group Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. @sunita_jalgaon or Shivneri Society"
                        value={editPartnerForm.socialHandle}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, socialHandle: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Account Status & Commission */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>3. Account Status & Commission Setup</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Account Status *</label>
                      <select
                        value={editPartnerForm.status}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      >
                        <option value="active">Active (Full Referral & Payout Access)</option>
                        <option value="pending">Pending Review</option>
                        <option value="suspended">Suspended / Deactivated</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Partner Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={editPartnerForm.commissionRate}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, commissionRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Customer Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={editPartnerForm.customerDiscountRate}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, customerDiscountRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Payout & Bank Account */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/50 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>4. Payout & Bank Details</span>
                    </div>

                    <div className="flex bg-stone-200/60 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setEditPartnerTab('phonepe')}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          editPartnerTab === 'phonepe' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        PhonePe
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPartnerTab('upi')}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          editPartnerTab === 'upi' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPartnerTab('bank')}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          editPartnerTab === 'bank' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Bank A/C
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPartnerTab('passbook')}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          editPartnerTab === 'passbook' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Passbook
                      </button>
                    </div>
                  </div>

                  {editPartnerTab === 'phonepe' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">PhonePe / Google Pay Number *</label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number linked to PhonePe/GPay"
                        value={editPartnerForm.phonePeNumber}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, phonePeNumber: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                      <p className="text-[10px] text-stone-500">Auto-routes to IMPS/UPI via registered mobile number.</p>
                    </div>
                  )}

                  {editPartnerTab === 'upi' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">UPI ID / VPA *</label>
                      <input
                        type="text"
                        placeholder="e.g. sunita@okaxis, 9822012345@ybl"
                        value={editPartnerForm.upiId}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, upiId: e.target.value.toLowerCase().trim() })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  )}

                  {editPartnerTab === 'bank' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">Account Holder Name *</label>
                          <input
                            type="text"
                            placeholder="Name as printed in passbook"
                            value={editPartnerForm.bankAccountName}
                            onChange={(e) => setEditPartnerForm({ ...editPartnerForm, bankAccountName: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">Bank Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. State Bank of India"
                            value={editPartnerForm.bankName}
                            onChange={(e) => setEditPartnerForm({ ...editPartnerForm, bankName: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">Bank Account Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. 30894567891"
                            value={editPartnerForm.bankAccountNumber}
                            onChange={(e) => setEditPartnerForm({ ...editPartnerForm, bankAccountNumber: e.target.value.trim() })}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">IFSC Code *</label>
                          <input
                            type="text"
                            placeholder="e.g. SBIN0000380"
                            value={editPartnerForm.ifscCode}
                            onChange={(e) => setEditPartnerForm({ ...editPartnerForm, ifscCode: e.target.value.toUpperCase().trim() })}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono uppercase focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {editPartnerTab === 'passbook' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Passbook / Cheque Document URL</label>
                      <input
                        type="url"
                        placeholder="https://res.cloudinary.com/..."
                        value={editPartnerForm.documentUrl}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, documentUrl: e.target.value.trim() })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 5: KYC Verification & Notes */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200/50 pb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>5. KYC Verification & Admin Notes</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Aadhaar / PAN Number</label>
                      <input
                        type="text"
                        placeholder="12-digit Aadhaar or 10-digit PAN"
                        value={editPartnerForm.aadhaarPanNumber}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, aadhaarPanNumber: e.target.value.toUpperCase().trim() })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 block">Passbook / Document URL</label>
                      <input
                        type="text"
                        placeholder="Image or PDF URL"
                        value={editPartnerForm.documentUrl}
                        onChange={(e) => setEditPartnerForm({ ...editPartnerForm, documentUrl: e.target.value.trim() })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium font-mono focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 block">Admin Internal Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions, referral history, or notes..."
                      value={editPartnerForm.notes}
                      onChange={(e) => setEditPartnerForm({ ...editPartnerForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditPartnerModalOpen(false);
                      setEditingPartner(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEditPartner}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isSavingEditPartner ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 rounded-2xl bg-rose-100">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Bulk Delete Partners</h3>
                  <p className="text-xs text-stone-500">Irreversible Action</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{selectedPartnerIds.length}</strong> selected partner
                account(s)? This will remove their partner records and access.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isBulkProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete {selectedPartnerIds.length} Partners</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
