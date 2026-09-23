'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Order } from '@/types';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  ShoppingBag,
  Printer,
  Sparkles,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live Tracking state
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const fetchTrackingInfo = async (awb: string) => {
    setIsTrackingLoading(true);
    setShowTracking(true);
    try {
      const res = await fetch(`/api/tracking/${awb}`);
      const json = await res.json();
      if (json.success) {
        setTrackingData(json);
      } else {
        setTrackingData({ error: json.error || 'Failed to fetch tracking' });
      }
    } catch (err) {
      setTrackingData({ error: 'Failed to fetch tracking details.' });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error('Error loading order details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen text-center">
        <p className="text-xs text-stone-500 font-bold">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 bg-[#FAF6ED] min-h-screen text-center">
        <Container>
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs">
            <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
            <p className="text-xs text-stone-500 mb-6">We couldn&apos;t locate an order with ID &ldquo;{id}&rdquo;.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#9B111E] text-white font-bold text-xs">
              <span>Return to Shop</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-16 bg-[#FAF6ED] min-h-screen">
      <SEO title={`Order #${order.orderNumber} | Aapla Jalgaonwala`} description="Order confirmation and delivery tracking." />

      <Container>
        {/* Success Header Banner */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs mb-8 text-center max-w-3xl mx-auto"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <Badge variant="saffron" size="md" className="mb-2">
            Order Confirmed
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
            Thank You, {order.customer.name}!
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
            Your order <strong>#{order.orderNumber}</strong> has been received and is being prepared with fresh Jalgaon snacks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-xl text-xs font-bold text-amber-900 border border-amber-200">
              <Truck className="w-4 h-4 text-[#D9531E]" />
              <span>Estimated Delivery: 3 to 5 Business Days</span>
            </div>
            
            {order.awbNumber && (
              <button
                type="button"
                onClick={() => fetchTrackingInfo(order.awbNumber!)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9B111E] text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-800 transition-colors"
              >
                <Truck className="w-4 h-4" />
                <span>Track DTDC Order: {order.awbNumber}</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Main 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          {/* Order Items List (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#9B111E]" />
                <span>Ordered Items</span>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => window.print()}
                className="text-xs font-bold text-stone-600 hover:text-[#9B111E] flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Receipt</span>
              </button>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/60">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900">{item.productName}</h4>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">{item.variantInfo || 'Standard pack'} • Qty: <strong className="text-stone-800">{item.quantity}</strong></p>
                  </div>
                  <span className="font-black text-sm text-[#9B111E]">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-4 border-t border-stone-100 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <span className="font-bold">
                    {order.referralPartnerCode ? 'Woman Partner Discount (4% OFF)' : (order.couponCode ? `Coupon Discount (${order.couponCode})` : 'Discount')}
                  </span>
                  <span className="font-black">-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                {order.shippingFee === 0 ? (
                  <span className="font-bold text-emerald-700 uppercase flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> FREE SHIPPING
                  </span>
                ) : (
                  <span className="font-bold text-stone-900">₹{order.shippingFee}</span>
                )}
              </div>
              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-black text-stone-900">
                <span>Total Amount</span>
                <span className="text-2xl font-black text-[#9B111E]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Customer Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <h3 className="font-black text-base text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9B111E]" />
                <span>Delivery Address</span>
              </h3>

              <div className="space-y-1.5 text-xs font-medium text-stone-700">
                <p className="font-bold text-stone-900 text-sm">{order.shippingAddress.fullName}</p>
                <p className="text-stone-600">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p className="text-stone-600">{order.shippingAddress.addressLine2}</p>}
                <p className="font-bold text-stone-900">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                {order.shippingAddress.landmark && (
                  <p className="text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border border-stone-100 font-normal">
                    Landmark: <span className="font-semibold text-stone-800">{order.shippingAddress.landmark}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#D9531E] shrink-0" />
                  <span className="font-semibold truncate">{order.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#D9531E]" />
                  <span className="font-semibold truncate">{order.customer.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
              <h3 className="font-black text-base text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D9531E]" />
                <span>Payment Summary</span>
              </h3>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-semibold">Payment Method:</span>
                <span className="font-black text-stone-900 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-stone-500 font-semibold">Payment Status:</span>
                <span className={`font-black uppercase text-[10px] px-2.5 py-0.5 rounded-full border ${
                  order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  order.paymentStatus === 'Partial Paid' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  'bg-amber-100 text-amber-800 border-amber-300'
                }`}>{order.paymentStatus}</span>
              </div>

              {/* COD Advance & Cash to Collect Breakdown */}
              {order.paymentMethod === 'COD' && (
                <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
                  {order.codAdvanceFeePaid && order.codAdvanceFeePaid > 0 ? (
                    <div className="flex justify-between items-center text-emerald-800 font-medium">
                      <span>Online Advance Deposit:</span>
                      <span className="font-black">₹{order.codAdvanceFeePaid}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold">
                    <span>Cash to Collect on Delivery:</span>
                    <span className="font-black text-base text-amber-900">
                      ₹{order.codRemainingBalance !== undefined ? order.codRemainingBalance : (order.totalAmount - (order.codAdvanceFeePaid || 0))}
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Action Buttons - 2 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <a
            href={`https://wa.me/917057446409?text=${encodeURIComponent(`Hi Aapla Jalgaonwala! I have a question regarding my Order #${order.orderNumber}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Need Delivery Help? WhatsApp Support</span>
          </a>

          <Link
            href="/shop"
            className="w-full py-4 px-6 rounded-2xl bg-[#9B111E] hover:bg-[#800A14] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer text-center hover:shadow-md active:scale-[0.99]"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
            <span>Continue Shopping Fresh Snacks</span>
          </Link>
        </div>
      </Container>

      {/* DTDC Live Tracking Modal */}
      {showTracking && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3 text-stone-900">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Live Tracking
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    AWB: {order.awbNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTracking(false)} className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                <span className="sr-only">Close</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {trackingData?.shipment && (
                <div className="mb-4 p-3 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">Route</span>
                    <span className="font-bold text-stone-800">
                      {trackingData.shipment.origin || 'Courier Hub'} &rarr; {trackingData.shipment.destination || order.shippingAddress?.city || 'Destination'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">Status</span>
                    <span className="font-bold text-[#9B111E]">
                      {trackingData.shipment.status || order.status}
                    </span>
                  </div>
                  {trackingData.shipment.formatted_expected_delivery_date && (
                    <div className="col-span-2 pt-1 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Expected Delivery</span>
                      <span className="font-semibold text-stone-700">
                        {trackingData.shipment.formatted_expected_delivery_date}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isTrackingLoading ? (
                <div className="py-10 text-center">
                  <div className="w-8 h-8 border-2 border-stone-200 border-t-[#9B111E] rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-stone-500 font-bold">Connecting to DTDC...</p>
                </div>
              ) : trackingData?.error ? (
                <div className="bg-rose-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-rose-600 font-bold">{trackingData.error}</p>
                </div>
              ) : trackingData?.tracking?.length > 0 ? (
                <div className="space-y-4">
                  {trackingData.tracking.map((event: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-stone-300'}`} />
                        {idx !== trackingData.tracking.length - 1 && (
                          <div className="w-0.5 h-full bg-stone-200 my-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-stone-900">{event.action}</p>
                        <p className="text-xs text-stone-500">{event.formatted_date || event.date} at {event.formatted_time || event.time}</p>
                        {(event.origin || event.destination) && (
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            {event.origin} {event.destination ? `→ ${event.destination}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-stone-500 font-bold">No tracking events available yet.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
