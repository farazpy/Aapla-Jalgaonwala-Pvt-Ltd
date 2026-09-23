import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { SEO } from '@/components/seo/SEO';
import { Link } from '@/lib/linkCompat';
import { UserAddress, Order } from '@/types';
import { AddressAutocompleteInput } from '@/components/common/AddressAutocompleteInput';
import { ShipmentTrackerMap } from '@/components/common/ShipmentTrackerMap';
import { INDIAN_STATES_AND_CITIES, ALL_STATES } from '@/data/indianStatesAndCities';
import {
  User as UserIcon,
  Package,
  MapPin,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  Truck,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Search,
  Copy,
  Check,
  Edit2,
  Printer,
  X,
  ExternalLink,
  ShoppingBag,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';

export function AccountPage() {
  const {
    user,
    isAuthenticated,
    isLoading,
    refreshProfile,
    logout,
    updateProfile,
    openAuthModal,
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    userOrders,
    fetchUserOrders
  } = useAuth();

  const { addToCart, setIsCartOpen } = useCart();
  const { settings } = useSettings();

  const fallbackAvatar = settings.defaultUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80';
  const userAvatar = user?.avatarUrl || fallbackAvatar;

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');

  // Order filters and search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Copy order id state
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleOpenTrackingModal = async (order: Order) => {
    setSelectedTrackingOrder(order);
    setTrackingData(null);
    setTrackingError(null);
    setCopiedAwb(false);

    if (order.awbNumber) {
      setIsTrackingLoading(true);
      try {
        const res = await fetch(`/api/tracking/${encodeURIComponent(order.awbNumber)}`);
        const json = await res.json();
        if (json.success && json.shipment) {
          setTrackingData(json);
          // If status got updated on courier side, update selectedTrackingOrder & refresh orders list
          if (json.mappedStatus && json.mappedStatus !== order.status) {
            setSelectedTrackingOrder(prev => prev ? { ...prev, status: json.mappedStatus } : prev);
            fetchUserOrders();
          }
        } else {
          setTrackingError(json.error || 'Tracking details are being updated by courier partner.');
        }
      } catch (e) {
        setTrackingError('Unable to connect to live tracking service at this moment.');
      } finally {
        setIsTrackingLoading(false);
      }
    }
  };

  const copyAwbNumber = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  // Edit Profile form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Add/Edit Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [editingAddress, setEditingAddress] = useState<Partial<UserAddress>>({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: 'Jalgaon',
    state: 'Maharashtra',
    pincode: '425001',
    isDefault: false
  });

  const activeStateCities = INDIAN_STATES_AND_CITIES[editingAddress.state || 'Maharashtra'] || [];
  const finalCityList = Array.from(new Set([...activeStateCities, ...customCities])).sort();

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      fetchUserOrders();
    } else {
      refreshProfile();
    }
  }, [user, fetchUserOrders, refreshProfile]);

  if (isLoading) {
    return (
      <div className="py-24 bg-[#FAFAF8] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#9B111E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-stone-500">Loading your user dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="py-20 bg-[#FAFAF8] min-h-screen text-center">
        <Container>
          <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#9B111E]/10 flex items-center justify-center text-[#9B111E] mx-auto ring-8 ring-[#9B111E]/5">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900">Sign in to your Dashboard</h2>
              <p className="text-xs text-stone-500 mt-1">
                Access your past orders, saved addresses, and profile details with Google Login or Email.
              </p>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-3.5 rounded-2xl bg-[#9B111E] text-white font-bold text-xs hover:bg-[#800A14] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Log In or Sign Up</span>
            </button>
            <div>
              <Link href="/shop" className="text-xs text-stone-500 font-bold hover:underline">
                Explore Jalgaon banana chips & snacks →
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Copy order id handler
  const copyOrderNumber = (ordNum: string) => {
    navigator.clipboard.writeText(ordNum);
    setCopiedOrderId(ordNum);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Reorder all items from past order
  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach(item => {
      addToCart(
        {
          id: item.productId || `prod_${item.id}`,
          slug: item.productId || 'snack',
          name: item.productName,
          category: 'Banana Chips',
          price: item.price,
          mrp: Math.round(item.price * 1.15),
          netQuantity: '250g',
          images: item.image ? [{ id: 'img1', url: item.image, altText: item.productName }] : [],
          isAvailable: true,
          stock: 100
        },
        undefined,
        item.quantity,
        false
      );
    });
    setIsCartOpen(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg('');
    try {
      const ok = await updateProfile({ name: profileName.trim(), phone: profilePhone.trim() });
      if (ok) {
        setProfileMsg('Profile updated successfully!');
      } else {
        setProfileMsg('Failed to update profile.');
      }
    } catch {
      setProfileMsg('Error saving profile changes.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress.addressLine1 || !editingAddress.city || !editingAddress.pincode) {
      alert('Please fill in required address fields');
      return;
    }
    await saveAddress(editingAddress);
    setShowAddressModal(false);
    setEditingAddress({
      name: user.name,
      phone: user.phone || '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: 'Jalgaon',
      state: 'Maharashtra',
      pincode: '425001',
      isDefault: false
    });
  };

  const openEditAddressModal = (addr: UserAddress) => {
    setEditingAddress(addr);
    if (addr.city && addr.state) {
      const list = INDIAN_STATES_AND_CITIES[addr.state] || [];
      if (!list.includes(addr.city)) {
        setCustomCities(prev => prev.includes(addr.city) ? prev : [...prev, addr.city]);
      }
    }
    setShowAddressModal(true);
  };

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

  // Filter orders by search and status
  const filteredOrders = userOrders.filter(ord => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.items.some(i => i.productName.toLowerCase().includes(orderSearch.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (orderStatusFilter === 'ALL') return true;
    if (orderStatusFilter === 'DELIVERED') return ord.status.toLowerCase() === 'delivered';
    if (orderStatusFilter === 'CANCELLED') return ord.status.toLowerCase() === 'cancelled';
    if (orderStatusFilter === 'PENDING') return ord.status.toLowerCase() !== 'delivered' && ord.status.toLowerCase() !== 'cancelled';
    return true;
  });

  return (
    <div className="py-8 md:py-16 bg-[#FAFAF8] min-h-screen">
      <SEO title="My Account | Aapla Jalgaonwala" description="Manage your profile, delivery addresses, and track snack orders." />

      <Container>
        {/* Account Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <img
                src={userAvatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#9B111E]/20 shadow-md shrink-0 bg-stone-100"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackAvatar;
                }}
              />

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-stone-900">{user.name}</h1>
                  {user.authProvider === 'google' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Google Verified</span>
                    </span>
                  ) : (
                    <Badge variant="saffron" size="sm">
                      {user.authProvider === 'truecaller' ? 'Truecaller' : 'Verified Customer'}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-stone-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{user.email}</span>
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{user.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-2xl border border-stone-200/90 text-stone-600 hover:text-red-700 hover:bg-red-50/50 hover:border-red-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-stone-400 group-hover:text-red-600" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Metric Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-stone-100">
            <div className="bg-stone-50/80 rounded-2xl p-3.5 sm:p-4 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Orders</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 block">{userOrders.length}</span>
            </div>
            <div className="bg-stone-50/80 rounded-2xl p-3.5 sm:p-4 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Saved Addresses</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 block">{addresses.length}</span>
            </div>
            <div className="bg-stone-50/80 rounded-2xl p-3.5 sm:p-4 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Default Pincode</span>
              <span className="text-base sm:text-lg font-black text-[#9B111E] mt-1 block truncate">
                {defaultAddress?.pincode || '425001 (Jalgaon)'}
              </span>
            </div>
            <div className="bg-stone-50/80 rounded-2xl p-3.5 sm:p-4 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Auth Method</span>
              <span className="text-xs sm:text-sm font-black text-emerald-700 mt-1 block capitalize truncate">
                {user.authProvider || 'Google Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-8 max-w-4xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({userOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'addresses'
                ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-black transition-all border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#9B111E] text-[#9B111E] bg-[#9B111E]/5 rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6 max-w-4xl">
            {/* Filter and Search controls */}
            {userOrders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Order # or item name..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {(['ALL', 'PENDING', 'DELIVERED', 'CANCELLED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-[#9B111E] text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {userOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-stone-200/80 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-stone-900">No orders placed yet</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Treat yourself to crisp Jalgaon banana chips, authentic fasting snacks, and spicy farsan prepared fresh in pure groundnut oil!
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#9B111E] text-white font-black text-xs shadow-md hover:bg-[#800A14] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Explore Authentic Snacks</span>
                </Link>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/80 shadow-xs">
                <p className="text-xs text-stone-500 font-semibold">No orders matched your search or status filter.</p>
                <button
                  onClick={() => { setOrderSearch(''); setOrderStatusFilter('ALL'); }}
                  className="mt-2 text-xs font-black text-[#9B111E] hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-all space-y-5"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-stone-900">Order #{order.orderNumber}</span>
                        <button
                          onClick={() => copyOrderNumber(order.orderNumber)}
                          className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-500 text-[10px] flex items-center gap-1 cursor-pointer"
                          title="Copy Order Number"
                        >
                          {copiedOrderId === order.orderNumber ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status.toLowerCase() === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status.toLowerCase() === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOpenTrackingModal(order)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                          order.status.toLowerCase() === 'shipped' || order.awbNumber
                            ? 'bg-[#9B111E] hover:bg-[#800A14] text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                        }`}
                        title="Track shipment progress"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Order</span>
                      </button>

                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        <span>Invoice</span>
                      </button>

                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#9B111E]/10 hover:bg-[#9B111E]/20 text-[#9B111E] text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>

                  {/* Shipping Destination Summary */}
                  {order.shippingAddress && (
                    <div className="bg-stone-50/80 rounded-2xl p-3 text-xs text-stone-600 flex items-start gap-2 border border-stone-100">
                      <Truck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-800">Deliver to: </span>
                        <span>
                          {order.shippingAddress.fullName || order.customer.name} - {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.pincode}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center justify-between text-xs py-1 border-b border-stone-50 last:border-0">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200/80 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-[#9B111E] font-black text-xs flex items-center justify-center shrink-0">
                              AJW
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-stone-900">{item.productName}</p>
                            <p className="text-[11px] text-stone-400">
                              Qty: {item.quantity} × ₹{item.price} {item.variantInfo ? `(${item.variantInfo})` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-stone-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer Totals */}
                  <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <span className="text-stone-500 font-semibold">
                      Payment: <strong className="text-stone-800 uppercase">{order.paymentMethod}</strong> ({order.paymentStatus})
                    </span>
                    <div className="text-right w-full sm:w-auto">
                      <span className="text-[11px] text-stone-400 block sm:inline mr-2">Total Amount Paid / Due:</span>
                      <span className="text-lg font-black text-[#9B111E]">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
              <div>
                <h3 className="text-base font-black text-stone-900">Saved Delivery Addresses</h3>
                <p className="text-xs text-stone-500">Fast 1-click address selection at checkout</p>
              </div>
              <button
                onClick={() => {
                  setEditingAddress({
                    name: user.name,
                    phone: user.phone || '',
                    addressLine1: '',
                    addressLine2: '',
                    landmark: '',
                    city: 'Jalgaon',
                    state: 'Maharashtra',
                    pincode: '425001',
                    isDefault: addresses.length === 0
                  });
                  setShowAddressModal(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#9B111E] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-[#800A14] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/80 shadow-xs space-y-3">
                <MapPin className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500">No saved addresses found. Add one for faster checkout!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-3xl p-6 border transition-all ${
                      addr.isDefault
                        ? 'border-[#9B111E] shadow-sm ring-2 ring-[#9B111E]/10'
                        : 'border-stone-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-stone-900">{addr.name}</span>
                        {addr.isDefault && (
                          <span className="px-2.5 py-0.5 rounded-md bg-[#9B111E]/10 text-[#9B111E] font-black text-[10px] uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditAddressModal(addr)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Edit Address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <p className="font-medium text-stone-800">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      {addr.landmark && <p className="text-stone-400 text-[11px]">Near: {addr.landmark}</p>}
                      <p className="font-bold text-stone-900 pt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-stone-600 text-[11px] pt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>Phone: {addr.phone}</span>
                      </p>
                    </div>

                    {!addr.isDefault && (
                      <div className="pt-4 mt-3 border-t border-stone-100">
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-xs font-bold text-[#9B111E] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Set as Default Address</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-stone-900">Personal Profile Details</h3>
              <p className="text-xs text-stone-500 mt-0.5">Update your contact details and account information</p>
            </div>

            {profileMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{profileMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address (Primary)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-xs bg-stone-100 text-stone-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-stone-400 mt-1">Email is verified via {user.authProvider || 'Google Login'}.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9823012345"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-3.5 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-black shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal for Adding/Editing Address */}
        {showAddressModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-stone-200 my-8">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#9B111E]" />
                    <span>{editingAddress.id ? 'Edit Delivery Address' : 'Add New Delivery Address'}</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Address will be stored safely for 1-click express checkout</p>
                </div>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                {/* Recipient Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingAddress.name || ''}
                      onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                      placeholder="e.g. Rahul Patil"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Phone *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={editingAddress.phone ? editingAddress.phone.replace(/\D/g, '').slice(-10) : ''}
                        onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Line 1 with Google Autocomplete */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      House/Flat No., Building, Society, Street *
                    </label>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Google Autocomplete
                    </span>
                  </div>
                  <AddressAutocompleteInput
                    required
                    placeholder="Search for your building, society, or street name..."
                    value={editingAddress.addressLine1 || ''}
                    onChange={(val) => setEditingAddress(prev => ({ ...prev, addressLine1: val }))}
                    onAddressSelect={(data) => {
                      let newState = editingAddress.state || 'Maharashtra';
                      let newCity = editingAddress.city || 'Jalgaon';

                      if (data.state) {
                        const matchedState = ALL_STATES.find(s => s.toLowerCase() === data.state!.toLowerCase()) || data.state!;
                        newState = matchedState;

                        if (data.city) {
                          const stateCities = INDIAN_STATES_AND_CITIES[matchedState] || [];
                          const matchedCity = stateCities.find(c => c.toLowerCase() === data.city!.toLowerCase()) || data.city!;
                          if (!stateCities.includes(matchedCity)) {
                            setCustomCities(prev => prev.includes(matchedCity) ? prev : [...prev, matchedCity]);
                          }
                          newCity = matchedCity;
                        }
                      } else if (data.city) {
                        newCity = data.city;
                      }

                      setEditingAddress(prev => ({
                        ...prev,
                        addressLine1: data.addressLine1 || prev.addressLine1,
                        landmark: data.landmark || prev.landmark,
                        pincode: data.pincode || prev.pincode,
                        state: newState,
                        city: newCity
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9531E]/30 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E] bg-amber-50/10 placeholder:text-stone-400"
                  />
                </div>

                {/* Address Line 2 & Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Locality / Area / Colony (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ring Road, Ramanand Nagar"
                      value={editingAddress.addressLine2 || ''}
                      onChange={(e) => setEditingAddress({ ...editingAddress, addressLine2: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Floor, Block or Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Main Gate, Opp Pharmacy"
                      value={editingAddress.landmark || ''}
                      onChange={(e) => setEditingAddress({ ...editingAddress, landmark: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    />
                  </div>
                </div>

                {/* PIN code, State, City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">6-Digit PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={editingAddress.pincode || ''}
                      onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 425001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Select State *</label>
                    <select
                      required
                      value={editingAddress.state || 'Maharashtra'}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setCustomCities([]);
                        const list = INDIAN_STATES_AND_CITIES[newState] || [];
                        setEditingAddress(prev => ({ ...prev, state: newState, city: list[0] || '' }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    >
                      {ALL_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Select City / Town *</label>
                    <select
                      required
                      value={editingAddress.city || ''}
                      onChange={(e) => setEditingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                    >
                      {finalCityList.map((cty) => (
                        <option key={cty} value={cty}>{cty}</option>
                      ))}
                      {finalCityList.length === 0 && (
                        <option value="">Choose State First</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefaultCheck"
                    checked={editingAddress.isDefault || false}
                    onChange={(e) => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded-md text-[#9B111E] border-stone-300 focus:ring-[#9B111E] cursor-pointer"
                  />
                  <label htmlFor="isDefaultCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
                    Set as default address for future orders
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-3 rounded-2xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Professional Tax Invoice Modal */}
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />

        {/* Modal for Live Order Tracking View */}
        {selectedTrackingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 max-w-5xl xl:max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-5 my-auto animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-stone-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center shrink-0 border border-[#9B111E]/20">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#9B111E] tracking-widest block">
                        Live Delivery Tracker
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedTrackingOrder.status.toLowerCase() === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedTrackingOrder.status.toLowerCase() === 'out for delivery'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}>
                        {selectedTrackingOrder.status}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-black text-stone-900 leading-tight">
                      Order #{selectedTrackingOrder.orderNumber}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedTrackingOrder.awbNumber) {
                        fetchTracking(selectedTrackingOrder.awbNumber);
                      }
                    }}
                    disabled={isTrackingLoading}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 cursor-pointer transition-colors border border-stone-200 shadow-2xs hidden sm:flex items-center gap-1.5 text-xs font-bold"
                    title="Refresh live tracking data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTrackingLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => setSelectedTrackingOrder(null)}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Order Status Stepper - Unified & Mobile Responsive (No text collisions) */}
              {(() => {
                const s = selectedTrackingOrder.status.toLowerCase();
                const steps = [
                  { label: 'Order Placed', desc: 'Received & Queued', done: true },
                  { label: 'Confirmed', desc: 'Packing in Jalgaon', done: s !== 'pending' && s !== 'cancelled' },
                  { label: 'Dispatched', desc: selectedTrackingOrder.awbNumber ? `${selectedTrackingOrder.courierName || 'DTDC'} Shipped` : 'Handed to Courier', done: s === 'shipped' || s === 'out for delivery' || s === 'delivered' || !!selectedTrackingOrder.awbNumber },
                  { label: 'Out for Delivery', desc: 'Nearby Hub', done: s === 'out for delivery' || s === 'delivered' },
                  { label: 'Delivered', desc: 'Delivered', done: s === 'delivered' }
                ];

                const currentStepIdx = steps.reduce((acc, step, i) => step.done ? i : acc, 0);

                if (s === 'cancelled') {
                  return (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <span>This order was cancelled. Please reach out to customer support for any refund assistance.</span>
                    </div>
                  );
                }

                return (
                  <div className="bg-stone-50/80 p-3.5 sm:p-4 rounded-2xl border border-stone-200/90">
                    {/* Mobile Unified Presentation (< sm) */}
                    <div className="block sm:hidden space-y-3">
                      {/* Active Status Callout */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200/80">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#9B111E] animate-pulse" />
                          <span className="text-xs font-bold text-stone-900">
                            Phase: {steps[currentStepIdx]?.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium">
                          Step {currentStepIdx + 1} of 5
                        </span>
                      </div>

                      {/* Unified Mobile Horizontal Step Track with Safe Node Spacing */}
                      <div className="overflow-x-auto no-scrollbar pb-1">
                        <div className="flex items-center justify-between min-w-[320px] px-1 relative">
                          {/* Background connecting track */}
                          <div className="absolute top-3.5 left-4 right-4 h-1 bg-stone-200 -z-0 rounded-full" />
                          <div 
                            className="absolute top-3.5 left-4 h-1 bg-[#9B111E] -z-0 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                          />

                          {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center relative z-10 w-14 shrink-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                step.done 
                                  ? idx === 4 
                                    ? 'bg-emerald-600 text-white ring-3 ring-emerald-100'
                                    : 'bg-[#9B111E] text-white ring-3 ring-[#9B111E]/20' 
                                  : 'bg-stone-200 text-stone-500'
                              }`}>
                                {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                              </div>
                              <span className={`text-[10px] font-bold mt-1.5 leading-tight ${
                                step.done ? 'text-stone-900' : 'text-stone-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Desktop & Tablet Stepper (>= sm) */}
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-5 gap-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 -z-0 rounded-full" />
                        <div 
                          className="absolute top-4 left-6 h-1 bg-[#9B111E] -z-0 rounded-full transition-all duration-500"
                          style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center text-center relative z-10 px-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              step.done 
                                ? idx === 4
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                  : 'bg-[#9B111E] text-white ring-4 ring-[#9B111E]/20' 
                                : 'bg-stone-200 text-stone-500'
                            }`}>
                              {step.done ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                            </div>
                            <span className={`text-xs font-black mt-2 leading-tight ${
                              step.done ? 'text-stone-900' : 'text-stone-400'
                            }`}>
                              {step.label}
                            </span>
                            <span className="text-[10px] text-stone-500 mt-0.5">
                              {step.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2-Column Responsive Layout on Desktop/Large Screens */}
              {selectedTrackingOrder.awbNumber ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Courier Details + Timeline Checkpoints (lg:col-span-6) */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Courier Partner & AWB Highlight Box (Brand Styled, No DTDC Tracking Button) */}
                    <div className="bg-[#9B111E]/5 border border-[#9B111E]/15 p-4 sm:p-5 rounded-2xl space-y-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-[#9B111E]/20 flex items-center justify-center text-[#9B111E]">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-[#9B111E] tracking-wider block">
                              Courier Partner
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-stone-900">
                              {selectedTrackingOrder.courierName || 'DTDC Express'}
                            </h4>
                          </div>
                        </div>

                        {/* AWB Pill with Copy button */}
                        <div className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl flex items-center gap-2 shadow-2xs">
                          <span className="text-xs font-mono font-bold text-stone-800">
                            AWB: {selectedTrackingOrder.awbNumber}
                          </span>
                          <button
                            onClick={() => copyAwbNumber(selectedTrackingOrder.awbNumber!)}
                            className="text-stone-400 hover:text-[#9B111E] transition-colors p-0.5 cursor-pointer"
                            title="Copy AWB Number"
                          >
                            {copiedAwb ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Shipment Meta summary if available */}
                      {trackingData?.shipment && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#9B111E]/10 text-xs">
                          <div className="bg-white/95 p-2.5 rounded-xl border border-stone-200/80">
                            <span className="text-[9.5px] text-stone-400 font-bold uppercase block">Route</span>
                            <span className="font-bold text-stone-800 truncate block">
                              {trackingData.shipment.origin || 'JALGAON'} &rarr; {trackingData.shipment.destination || selectedTrackingOrder.shippingAddress?.city || 'DEST'}
                            </span>
                          </div>
                          <div className="bg-white/95 p-2.5 rounded-xl border border-stone-200/80">
                            <span className="text-[9.5px] text-stone-400 font-bold uppercase block">Expected ETA</span>
                            <span className="font-bold text-[#9B111E] truncate block">
                              {trackingData.shipment.expected_delivery_date || 'In Transit'}
                            </span>
                          </div>
                          <div className="bg-white/95 p-2.5 rounded-xl border border-stone-200/80">
                            <span className="text-[9.5px] text-stone-400 font-bold uppercase block">Status Code</span>
                            <span className="font-bold text-stone-800 truncate block">
                              {trackingData.shipment.status_code || trackingData.shipment.status || 'Active'}
                            </span>
                          </div>
                          <div className="bg-white/95 p-2.5 rounded-xl border border-stone-200/80">
                            <span className="text-[9.5px] text-stone-400 font-bold uppercase block">Signee / Recv</span>
                            <span className="font-bold text-stone-800 truncate block">
                              {trackingData.shipment.remarks || selectedTrackingOrder.shippingAddress?.fullName || 'Pending'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Checkpoint API Timeline */}
                    <div className="bg-white border border-stone-200 p-4 sm:p-5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#9B111E]" />
                          Shipment Checkpoint Timeline:
                        </span>
                        {isTrackingLoading && (
                          <RefreshCw className="w-3.5 h-3.5 text-[#9B111E] animate-spin" />
                        )}
                      </div>

                      {isTrackingLoading ? (
                        <div className="py-6 text-center space-y-2">
                          <RefreshCw className="w-5 h-5 text-[#9B111E] animate-spin mx-auto" />
                          <p className="text-xs text-stone-500 font-medium">Fetching real-time tracking checkpoints from DTDC...</p>
                        </div>
                      ) : trackingData?.tracking && trackingData.tracking.length > 0 ? (
                        <div className="relative pl-5 space-y-2.5 max-h-56 sm:max-h-64 lg:max-h-72 overflow-y-auto pr-1 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 pt-1">
                          {trackingData.tracking.map((evt: any, idx: number) => {
                            const hasCoords = evt.latitude && evt.longitude;
                            const isFirst = idx === 0;
                            return (
                              <div key={idx} className="relative">
                                <div className={`absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full ${
                                  isFirst ? 'bg-[#9B111E] ring-3 ring-[#9B111E]/20' : 'bg-stone-300 ring-2 ring-white'
                                }`} />
                                <div className="bg-stone-50/80 p-2.5 sm:p-3 rounded-xl border border-stone-200/80">
                                  <div className="flex justify-between items-start text-xs font-bold text-stone-900">
                                    <span className="flex items-center gap-1.5">
                                      {evt.action || evt.remarks || 'In Transit'}
                                      {hasCoords && (
                                        <span className="text-[9px] px-1.5 py-0.2 bg-[#9B111E]/10 text-[#9B111E] rounded font-mono font-bold">
                                          📍 GPS
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10.5px] text-stone-400 font-normal shrink-0 ml-2">{evt.date} {evt.time}</span>
                                  </div>
                                  {(evt.origin || evt.destination) && (
                                    <p className="text-[11px] text-stone-600 mt-0.5">
                                      📍 {evt.origin || evt.destination}
                                    </p>
                                  )}
                                  {evt.remarks && evt.remarks !== evt.action && (
                                    <p className="text-[10.5px] text-stone-500 mt-0.5 italic">
                                      &ldquo;{evt.remarks}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : trackingData?.shipment ? (
                        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                          <p><strong>Status:</strong> {trackingData.shipment.status || 'Dispatched'}</p>
                          {trackingData.shipment.origin && (
                            <p><strong>Origin:</strong> {trackingData.shipment.origin} &rarr; <strong>Destination:</strong> {trackingData.shipment.destination || selectedTrackingOrder.shippingAddress?.city}</p>
                          )}
                          {trackingData.shipment.expected_delivery_date && (
                            <p className="text-[#9B111E] font-semibold">
                              <strong>Expected Delivery:</strong> {trackingData.shipment.expected_delivery_date}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
                          <Clock className="w-4 h-4 text-[#9B111E] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-stone-800">Shipment Handed Over to Courier</p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Tracking events are scanned as your package moves through courier transit hubs.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Interactive Leaflet GPS Map + Delivery Address (lg:col-span-6) */}
                  <div className="lg:col-span-6 space-y-4">
                    <ShipmentTrackerMap
                      coordinates={trackingData?.coordinates || []}
                      originCity={trackingData?.shipment?.origin || 'Jalgaon'}
                      destinationCity={trackingData?.shipment?.destination || selectedTrackingOrder.shippingAddress?.city || 'Destination'}
                      status={trackingData?.shipment?.status || selectedTrackingOrder.status}
                      awbNumber={selectedTrackingOrder.awbNumber}
                      mapHeight="h-[260px] sm:h-[300px] lg:h-[350px]"
                    />

                    {/* Delivery Address Summary */}
                    {selectedTrackingOrder.shippingAddress && (
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                          Shipping Destination Address
                        </span>
                        <p className="font-bold text-stone-900">
                          {selectedTrackingOrder.shippingAddress.fullName || selectedTrackingOrder.customer?.name}
                        </p>
                        <p className="text-stone-600 mt-0.5">
                          {selectedTrackingOrder.shippingAddress.addressLine1}, {selectedTrackingOrder.shippingAddress.city}, {selectedTrackingOrder.shippingAddress.state} - {selectedTrackingOrder.shippingAddress.pincode}
                        </p>
                        <p className="text-stone-500 mt-0.5">Phone: {selectedTrackingOrder.shippingAddress.phone || selectedTrackingOrder.customer?.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <p className="font-bold text-sm text-stone-900">Preparing Your Package for Dispatch</p>
                  </div>
                  <p className="text-amber-800/90 text-xs leading-relaxed">
                    Our team in Jalgaon is preparing and packing your authentic snacks fresh. As soon as the parcel is handed to DTDC Express, your AWB tracking number will appear here and will be emailed to <strong>{selectedTrackingOrder.customer?.email}</strong>.
                  </p>
                  {selectedTrackingOrder.shippingAddress && (
                    <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70 text-xs mt-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                        Will be shipped to
                      </span>
                      <p className="font-bold text-stone-900">
                        {selectedTrackingOrder.shippingAddress.fullName || selectedTrackingOrder.customer?.name}
                      </p>
                      <p className="text-stone-600">
                        {selectedTrackingOrder.shippingAddress.addressLine1}, {selectedTrackingOrder.shippingAddress.city}, {selectedTrackingOrder.shippingAddress.state} - {selectedTrackingOrder.shippingAddress.pincode}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200 text-xs">
                <span className="text-[11px] text-stone-500 text-center sm:text-left">
                  Questions about your delivery? Call/WhatsApp support at <strong>+91 70574 46409</strong>
                </span>
                <button
                  onClick={() => setSelectedTrackingOrder(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default AccountPage;
