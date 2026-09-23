'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  ShieldCheck,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
  UserCheck,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminRole, AdminStaffUser, PermissionKey } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function AdminRolesPage() {
  const { user: loggedInUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [staffUsers, setStaffUsers] = useState<AdminStaffUser[]>([]);
  const [allPermissions, setAllPermissions] = useState<
    { key: PermissionKey; label: string; group: string; description: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaffUser | null>(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Form states for Staff
  const [staffForm, setStaffForm] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    status: 'active' | 'inactive' | 'suspended';
    customPermissions: PermissionKey[];
  }>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'sub_admin',
    status: 'active',
    customPermissions: []
  });

  // Form states for Role
  const [roleForm, setRoleForm] = useState<{
    id?: string;
    name: string;
    description: string;
    color: string;
    permissions: PermissionKey[];
  }>({
    name: '',
    description: '',
    color: 'indigo',
    permissions: []
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesRes, staffRes] = await Promise.all([
        fetch('/api/admin/roles', { credentials: 'include' }),
        fetch('/api/admin/staff', { credentials: 'include' })
      ]);

      const rolesJson = await rolesRes.json();
      const staffJson = await staffRes.json();

      if (rolesJson.success && rolesJson.data) {
        setRoles(rolesJson.data.roles || []);
        if (rolesJson.data.allPermissions) {
          setAllPermissions(rolesJson.data.allPermissions);
        }
      }

      if (staffJson.success && Array.isArray(staffJson.data)) {
        setStaffUsers(staffJson.data);
      }
    } catch (err: any) {
      console.error('[AdminRolesPage] Fetch error:', err);
      setError(err.message || 'Failed to load roles and staff data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Grouped permissions for UI
  const groupedPermissions = useMemo(() => {
    const groups: { [key: string]: { key: PermissionKey; label: string; group: string; description: string }[] } = {};
    allPermissions.forEach(p => {
      const g = p.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return groups;
  }, [allPermissions]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffUsers.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.roleName && u.roleName.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || u.role?.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [staffUsers, searchQuery, roleFilter, statusFilter]);

  // Staff creation / edit handlers
  const openCreateStaffModal = () => {
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: roles[1]?.id || 'sub_admin',
      status: 'active',
      customPermissions: []
    });
    setEditingStaff(null);
    setIsAddStaffOpen(true);
  };

  const openEditStaffModal = (staff: AdminStaffUser) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      password: '', // Leave blank unless changing
      role: staff.role || 'sub_admin',
      status: staff.status || 'active',
      customPermissions: staff.customPermissions || []
    });
    setIsAddStaffOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingStaff) {
        // Update staff
        const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: staffForm.name,
            email: staffForm.email,
            phone: staffForm.phone,
            password: staffForm.password || undefined,
            role: staffForm.role,
            customPermissions: staffForm.customPermissions,
            status: staffForm.status
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to update staff member');
        showNotification(`Staff member "${staffForm.name}" updated successfully.`);
      } else {
        // Create staff
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(staffForm)
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to create staff member');
        showNotification(`New staff member "${staffForm.name}" added successfully.`);
      }

      setIsAddStaffOpen(false);
      setEditingStaff(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error saving staff');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStaffStatus = async (staff: AdminStaffUser) => {
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}/toggle-status`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to toggle status');
      showNotification(`Account status updated for ${staff.name}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaffId) return;
    try {
      const res = await fetch(`/api/admin/staff/${deletingStaffId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete staff member');
      showNotification('Staff user deleted successfully.');
      setDeletingStaffId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff user');
    }
  };

  // Role creation / edit handlers
  const openCreateRoleModal = () => {
    setRoleForm({
      name: '',
      description: '',
      color: 'indigo',
      permissions: ['dashboard', 'orders', 'products']
    });
    setEditingRole(null);
    setIsAddRoleOpen(true);
  };

  const openEditRoleModal = (role: AdminRole) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      color: role.color || 'indigo',
      permissions: [...role.permissions]
    });
    setIsAddRoleOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingRole) {
        const res = await fetch(`/api/admin/roles/${editingRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(roleForm)
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to update role');
        showNotification(`Role "${roleForm.name}" updated successfully.`);
      } else {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(roleForm)
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to create role');
        showNotification(`New role "${roleForm.name}" created successfully.`);
      }

      setIsAddRoleOpen(false);
      setEditingRole(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error saving role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRoleId) return;
    try {
      const res = await fetch(`/api/admin/roles/${deletingRoleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete role');
      showNotification('Custom role deleted successfully.');
      setDeletingRoleId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const getRoleColorBadge = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'pink':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'indigo':
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <AdminLayout
      pageTitle="Admin Roles & Staff Access"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Roles & Staff Management' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {activeTab === 'staff' ? (
            <button
              type="button"
              onClick={openCreateStaffModal}
              className="px-4 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff User</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateRoleModal}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Role Profile</span>
            </button>
          )}
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Info Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-700/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Role-Based Access Control (RBAC)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-100">
                Staff Permissions & Delegation Engine
              </h2>
              <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
                Create specific operational roles (e.g. Sub-Admin, Order Manager, Catalog Specialist) and provision
                sub-admin user accounts with granular feature-level access to secure your store operations.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-stone-800/80 border border-stone-700 rounded-xl px-4 py-2 text-center">
                <p className="text-[11px] text-stone-400 font-semibold uppercase">Active Staff</p>
                <p className="text-xl font-bold text-white">{staffUsers.length}</p>
              </div>
              <div className="bg-stone-800/80 border border-stone-700 rounded-xl px-4 py-2 text-center">
                <p className="text-[11px] text-stone-400 font-semibold uppercase">Role Profiles</p>
                <p className="text-xl font-bold text-amber-400">{roles.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex items-center justify-between border-b border-stone-200 gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'border-[#9B111E] text-[#9B111E]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff & Sub-Admins ({staffUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-[#9B111E] text-[#9B111E]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Role Profiles & Privileges ({roles.length})</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: STAFF & SUB-ADMIN USERS LIST                          */}
        {/* ============================================================ */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9B111E] focus:border-[#9B111E]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                >
                  <option value="all">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Role & Access Tier</th>
                      <th className="py-3.5 px-4">Privileges</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-stone-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold text-stone-600">No staff members found</p>
                          <p className="text-[11px]">Try adjusting your search query or add a new staff user.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map(staff => {
                        const isPrimarySuperAdmin =
                          staff.email.toLowerCase() === 'operationalhtklabs@gmail.com' || staff.role === 'super_admin';

                        return (
                          <tr key={staff.id} className="hover:bg-stone-50/70 transition-colors">
                            {/* Member Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs shrink-0 shadow-2xs">
                                  {staff.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-stone-900">{staff.name}</span>
                                    {isPrimarySuperAdmin && (
                                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.5 rounded border border-rose-200">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-stone-500 font-mono text-[11px]">{staff.email}</p>
                                  {staff.phone && <p className="text-stone-400 text-[10px]">{staff.phone}</p>}
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${getRoleColorBadge(
                                  staff.roleColor
                                )}`}
                              >
                                <Shield className="w-3 h-3" />
                                {staff.roleName || staff.role}
                              </span>
                            </td>

                            {/* Permissions count */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-800">
                                  {isPrimarySuperAdmin ? allPermissions.length : (staff.permissions || []).length}
                                </span>
                                <span className="text-stone-400 text-[11px]">/ {allPermissions.length} features</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                disabled={isPrimarySuperAdmin}
                                onClick={() => handleToggleStaffStatus(staff)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                                  staff.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                                } ${isPrimarySuperAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                                title={isPrimarySuperAdmin ? 'Primary super admin cannot be deactivated' : 'Click to toggle status'}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    staff.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'
                                  }`}
                                />
                                <span className="capitalize">{staff.status || 'active'}</span>
                              </button>
                            </td>

                            {/* Created Date */}
                            <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                              {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'System'}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditStaffModal(staff)}
                                  className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg transition-colors cursor-pointer"
                                  title="Edit staff permissions and details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {!isPrimarySuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingStaffId(staff.id)}
                                    className="p-1.5 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    title="Delete staff account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
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
        )}

        {/* ============================================================ */}
        {/* TAB 2: ROLE PROFILES & PERMISSIONS                           */}
        {/* ============================================================ */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => {
                return (
                  <div
                    key={role.id}
                    className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between hover:border-stone-300 transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-2 rounded-lg border flex items-center justify-center ${getRoleColorBadge(
                              role.color
                            )}`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                              <span>{role.name}</span>
                              {role.isSystem && (
                                <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-1.5 py-0.2 rounded border border-stone-200">
                                  Default
                                </span>
                              )}
                            </h3>
                            <p className="text-[10px] font-mono text-stone-400">ID: {role.id}</p>
                          </div>
                        </div>

                        {!role.isSystem && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditRoleModal(role)}
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit role template"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingRoleId(role.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed min-h-[36px]">{role.description}</p>

                      <div className="pt-2 border-t border-stone-100">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-stone-700 text-[11px] uppercase tracking-wider">
                            Granted Privileges
                          </span>
                          <span className="font-mono text-[11px] text-stone-500">
                            {role.permissions.length} / {allPermissions.length}
                          </span>
                        </div>

                        {/* Permissions pills preview */}
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-stone-50 rounded-lg border border-stone-100">
                          {role.permissions.map(permKey => {
                            const pObj = allPermissions.find(p => p.key === permKey);
                            return (
                              <span
                                key={permKey}
                                className="bg-white border border-stone-200 text-stone-700 text-[10px] px-2 py-0.5 rounded font-medium shadow-2xs"
                              >
                                {pObj?.label || permKey}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <strong className="text-stone-800">{role.assignedStaffCount || 0}</strong> staff assigned
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditRoleModal(role)}
                        className="text-[#9B111E] hover:underline font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{role.isSystem ? 'View Permissions' : 'Configure'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT STAFF USER                                 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      {editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Provision New Admin / Sub-Admin'}
                    </h3>
                    <p className="text-xs text-stone-500">Configure role profile and granular feature overrides</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="p-1.5 hover:bg-stone-200 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveStaff} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Basic Information</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={staffForm.name}
                        onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                        placeholder="e.g. Ramesh Joshi"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={editingStaff?.email === 'operationalhtklabs@gmail.com'}
                        value={staffForm.email}
                        onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                        placeholder="e.g. ramesh@jalgaonwala.in"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile / WhatsApp Number</label>
                      <input
                        type="tel"
                        value={staffForm.phone}
                        onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                        placeholder="e.g. 9822012345"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {editingStaff ? 'New Password (leave blank to keep unchanged)' : 'Login Password *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!editingStaff}
                          value={staffForm.password}
                          onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                          placeholder={editingStaff ? '••••••••' : 'Min 6 characters'}
                          className="w-full pl-3 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Selection & Status */}
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#9B111E]" />
                    <span>Role Assignment</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Select Role Profile</label>
                      <select
                        disabled={editingStaff?.email === 'operationalhtklabs@gmail.com'}
                        value={staffForm.role}
                        onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:opacity-60"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.permissions.length} perms)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Account Status</label>
                      <select
                        disabled={editingStaff?.email === 'operationalhtklabs@gmail.com'}
                        value={staffForm.status}
                        onChange={e => setStaffForm({ ...staffForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E] disabled:opacity-60"
                      >
                        <option value="active">Active (Full operational access)</option>
                        <option value="inactive">Inactive (Temporary disable)</option>
                        <option value="suspended">Suspended (Access blocked)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Custom Permissions */}
                <div className="space-y-3 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>Custom Permission Overrides (Optional)</span>
                    </h4>
                    <span className="text-[11px] text-stone-400">Add extra access beyond role profile</span>
                  </div>

                  <div className="space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {Object.entries(groupedPermissions).map(([groupName, permList]) => {
                      const selectedRole = roles.find(r => r.id === staffForm.role);
                      const baseRolePerms = selectedRole?.permissions || [];

                      return (
                        <div key={groupName} className="space-y-2">
                          <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wide border-b border-stone-200/80 pb-1">
                            {groupName}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {permList.map(p => {
                              const isGrantedByRole = baseRolePerms.includes(p.key);
                              const isCustomChecked = staffForm.customPermissions.includes(p.key);
                              const isChecked = isGrantedByRole || isCustomChecked;

                              return (
                                <label
                                  key={p.key}
                                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-all ${
                                    isGrantedByRole
                                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 cursor-default'
                                      : isCustomChecked
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 cursor-pointer'
                                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isGrantedByRole}
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setStaffForm({
                                          ...staffForm,
                                          customPermissions: [...staffForm.customPermissions, p.key]
                                        });
                                      } else {
                                        setStaffForm({
                                          ...staffForm,
                                          customPermissions: staffForm.customPermissions.filter(k => k !== p.key)
                                        });
                                      }
                                    }}
                                    className="mt-0.5 rounded text-[#9B111E] focus:ring-[#9B111E]"
                                  />
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1 font-semibold text-stone-900">
                                      <span>{p.label}</span>
                                      {isGrantedByRole && (
                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                                          Role
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-stone-500 leading-tight">{p.description}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingStaff ? 'Save Changes' : 'Create Staff Member'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL: CREATE / EDIT ROLE PROFILE                            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAddRoleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role Profile'}
                    </h3>
                    <p className="text-xs text-stone-500">Define granted permissions and operational privileges</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddRoleOpen(false)}
                  className="p-1.5 hover:bg-stone-200 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Role Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={roleForm.name}
                        onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                        placeholder="e.g. Regional Order Dispatcher"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Badge Color Theme</label>
                      <select
                        value={roleForm.color}
                        onChange={e => setRoleForm({ ...roleForm, color: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                      >
                        <option value="indigo">Indigo (Standard Staff)</option>
                        <option value="amber">Amber (Operations / Logistics)</option>
                        <option value="emerald">Emerald (Catalog / Inventory)</option>
                        <option value="blue">Blue (Orders / Dispatch)</option>
                        <option value="purple">Purple (Marketing & SEO)</option>
                        <option value="pink">Pink (Women Partners)</option>
                        <option value="rose">Rose (High Privilege)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Role Description</label>
                    <textarea
                      rows={2}
                      value={roleForm.description}
                      onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                      placeholder="Describe what staff with this role are responsible for..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
                    />
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-3 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>Select Granted Privileges ({roleForm.permissions.length})</span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRoleForm({ ...roleForm, permissions: allPermissions.map(p => p.key) })}
                        className="text-[11px] text-[#9B111E] hover:underline font-bold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                        className="text-[11px] text-stone-500 hover:underline font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {Object.entries(groupedPermissions).map(([groupName, permList]) => {
                      const allGroupKeys = permList.map(p => p.key);
                      const isGroupAllSelected = allGroupKeys.every(k => roleForm.permissions.includes(k));

                      return (
                        <div key={groupName} className="space-y-2">
                          <div className="flex items-center justify-between border-b border-stone-200/80 pb-1">
                            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wide">
                              {groupName}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (isGroupAllSelected) {
                                  setRoleForm({
                                    ...roleForm,
                                    permissions: roleForm.permissions.filter(k => !allGroupKeys.includes(k))
                                  });
                                } else {
                                  setRoleForm({
                                    ...roleForm,
                                    permissions: Array.from(new Set([...roleForm.permissions, ...allGroupKeys]))
                                  });
                                }
                              }}
                              className="text-[10px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                            >
                              {isGroupAllSelected ? 'Deselect Group' : 'Select Group'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {permList.map(p => {
                              const isChecked = roleForm.permissions.includes(p.key);
                              return (
                                <label
                                  key={p.key}
                                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium'
                                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setRoleForm({
                                          ...roleForm,
                                          permissions: [...roleForm.permissions, p.key]
                                        });
                                      } else {
                                        setRoleForm({
                                          ...roleForm,
                                          permissions: roleForm.permissions.filter(k => k !== p.key)
                                        });
                                      }
                                    }}
                                    className="mt-0.5 rounded text-[#9B111E] focus:ring-[#9B111E]"
                                  />
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-stone-900">{p.label}</span>
                                    <p className="text-[10px] text-stone-500 leading-tight">{p.description}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddRoleOpen(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#9B111E] hover:bg-[#800d18] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingRole ? 'Save Changes' : 'Create Role'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL: DELETE CONFIRMATION (STAFF)                           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {deletingStaffId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Delete Staff Account?</h3>
                <p className="text-xs text-stone-500">
                  This user will immediately lose all administrative dashboard privileges.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingStaffId(null)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStaff}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL: DELETE CONFIRMATION (ROLE)                            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {deletingRoleId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Delete Role Profile?</h3>
                <p className="text-xs text-stone-500">
                  This role profile will be removed. Make sure no staff are assigned to it first.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingRoleId(null)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRole}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
export default AdminRolesPage;
