'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Users,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Mail,
  Phone,
  Shield,
  ShoppingBag,
  Calendar,
  MapPin,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface EnrichedCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'customer' | 'admin' | string;
  authProvider?: string;
  googleId?: string;
  createdAt?: string;
  addresses: UserAddress[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'google' | 'email'>('all');

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<EnrichedCustomer | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer'
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch customer data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      c.id.toLowerCase().includes(query);

    const matchesRole = roleFilter === 'all' || c.role === roleFilter;
    const matchesProvider =
      providerFilter === 'all' ||
      (providerFilter === 'google' && c.authProvider === 'google') ||
      (providerFilter === 'email' && c.authProvider !== 'google');

    return matchesSearch && matchesRole && matchesProvider;
  });

  // Action handlers
  const handleOpenView = (customer: EnrichedCustomer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  const handleOpenEdit = (customer: EnrichedCustomer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      role: customer.role || 'customer'
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (customer: EnrichedCustomer) => {
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Customer "${editForm.name}" updated successfully`);
        setEditModalOpen(false);
        fetchCustomers();
      } else {
        alert(json.error?.message || 'Failed to update customer');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedCustomer.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Customer "${selectedCustomer.name}" has been deleted`);
        setDeleteModalOpen(false);
        fetchCustomers();
      } else {
        alert(json.error?.message || 'Failed to delete customer');
      }
    } catch (err: any) {
      alert(err.message || 'Network error deleting customer');
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalCustomers = customers.length;
  const googleUsersCount = customers.filter((c) => c.authProvider === 'google').length;
  const activeOrderersCount = customers.filter((c) => c.orderCount > 0).length;
  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <AdminLayout pageTitle="Customers & User Data">
      <div className="space-y-6 pb-12 font-sans">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#9B111E] uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>User Directory</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Customer Database</h1>
            <p className="text-xs text-stone-500 mt-1">
              Manage registered accounts, contact details, addresses, and purchase history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCustomers}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-black text-stone-900">{totalCustomers}</div>
            <div className="text-[11px] text-stone-500">Registered Accounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Google Sign-In</span>
              <Shield className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-600">{googleUsersCount}</div>
            <div className="text-[11px] text-stone-500">Google Verified Accounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Buyers</span>
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{activeOrderersCount}</div>
            <div className="text-[11px] text-stone-500">Placed 1+ Orders</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-bold uppercase tracking-wider">Customer LTV</span>
              <span className="text-xs font-bold text-amber-600">₹</span>
            </div>
            <div className="text-2xl font-black text-stone-900">₹{totalSpentAll.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-stone-500">Total Revenue Generated</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone or ID..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 text-xs focus:outline-none focus:border-[#9B111E]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar mask-edges-right pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#9B111E]"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customer Only</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold shrink-0">
              <span>Auth:</span>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#9B111E]"
              >
                <option value="all">All Providers</option>
                <option value="google">Google OAuth</option>
                <option value="email">Direct Email</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-stone-500">Loading customer database...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600 space-y-2">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={fetchCustomers}
                className="mt-2 px-4 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200"
              >
                Try Again
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <UserX className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-bold text-stone-600">No matching customers found</p>
              <p className="text-xs text-stone-400">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full min-w-[900px] text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-3.5">Customer Profile</th>
                    <th className="px-6 py-3.5">Contact Details</th>
                    <th className="px-6 py-3.5">Auth Type</th>
                    <th className="px-6 py-3.5">Orders & Spend</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {customer.avatarUrl ? (
                            <img
                              src={customer.avatarUrl}
                              alt={customer.name}
                              className="w-10 h-10 rounded-full object-cover border border-stone-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#9B111E]/10 text-[#9B111E] font-extrabold flex items-center justify-center text-sm border border-[#9B111E]/20">
                              {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{customer.name}</div>
                            <div className="text-[10px] text-stone-400 font-mono">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-800">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone ? (
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>{customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">No phone added</span>
                        )}
                      </td>

                      {/* Auth Type */}
                      <td className="px-6 py-4">
                        {customer.authProvider === 'google' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Google Auth
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                            Email / Password
                          </span>
                        )}
                      </td>

                      {/* Orders & LTV */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-900">
                          {customer.orderCount} {customer.orderCount === 1 ? 'Order' : 'Orders'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          ₹{customer.totalSpent.toLocaleString('en-IN')} Total
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {customer.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-extrabold border border-amber-300">
                            <Shield className="w-3 h-3 text-amber-700" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-stone-600 font-semibold text-xs">Customer</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenView(customer)}
                            title="View Full Profile & Addresses"
                            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(customer)}
                            title="Edit Customer Info"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(customer)}
                            title="Delete Customer Account"
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VIEW DETAILS MODAL */}
        <AnimatePresence>
          {viewModalOpen && selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-6"
              >
                <div className="flex justify-between items-start border-b border-stone-200 pb-4">
                  <div className="flex items-center gap-4">
                    {selectedCustomer.avatarUrl ? (
                      <img
                        src={selectedCustomer.avatarUrl}
                        alt={selectedCustomer.name}
                        className="w-14 h-14 rounded-full object-cover border border-stone-300"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#9B111E]/10 text-[#9B111E] font-black text-xl flex items-center justify-center border border-[#9B111E]/30">
                        {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-extrabold text-stone-900">{selectedCustomer.name}</h3>
                      <p className="text-xs text-stone-500 font-mono">User ID: {selectedCustomer.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                  <div>
                    <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Email Address</span>
                    <span className="font-bold text-stone-900">{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Phone Number</span>
                    <span className="font-bold text-stone-900">{selectedCustomer.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Authentication Method</span>
                    <span className="font-bold text-stone-900 capitalize">{selectedCustomer.authProvider || 'Email'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Account Role</span>
                    <span className="font-bold text-stone-900 uppercase">{selectedCustomer.role}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Orders Placed</span>
                    <span className="font-bold text-stone-900">{selectedCustomer.orderCount}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-semibold block uppercase tracking-wider text-[10px]">Total Revenue Spent</span>
                    <span className="font-bold text-emerald-700">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Saved Delivery Addresses */}
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9B111E]" />
                    <span>Saved Delivery Addresses ({selectedCustomer.addresses.length})</span>
                  </h4>

                  {selectedCustomer.addresses.length === 0 ? (
                    <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                      No delivery addresses saved for this customer.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((addr) => (
                        <div key={addr.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-stone-900">
                            <span>{addr.name} ({addr.phone})</span>
                            {addr.isDefault && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md">Default</span>
                            )}
                          </div>
                          <p className="text-stone-600">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-5 py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-all cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* EDIT CUSTOMER MODAL */}
        <AnimatePresence>
          {editModalOpen && selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-6"
              >
                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                  <h3 className="text-xl font-extrabold text-stone-900">Edit Customer Information</h3>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:border-[#9B111E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">System Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:border-[#9B111E]"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Administrator (Admin Panel Access)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      {saving ? 'Saving Changes...' : 'Save Customer Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRMATION MODAL */}
        <AnimatePresence>
          {deleteModalOpen && selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5"
              >
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-stone-900">Delete Customer Account?</h3>
                  <p className="text-xs text-stone-600">
                    Are you sure you want to delete <strong className="text-stone-900">{selectedCustomer.name}</strong> ({selectedCustomer.email})? This action will permanently remove their profile data and saved addresses.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Customer'}
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
