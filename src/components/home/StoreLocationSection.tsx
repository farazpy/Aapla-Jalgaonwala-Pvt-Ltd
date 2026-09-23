'use client';

import React from 'react';
import { MapPin, Clock, Phone, MessageSquare, Navigation, Store } from 'lucide-react';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { useSettings } from '@/context/SettingsContext';

export const StoreLocationSection: React.FC = () => {
  const { settings } = useSettings();

  const storeAddr = settings.storeAddress || 'Ground Floor Shop No. 20, Yelwadi, Dehu-Alandi Road, Pune, Maharashtra 412109';
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Aapla Jalgaonwala ${storeAddr}`
  )}`;

  const whatsappNum = settings.whatsappNumber || settings.contactPhone || '9890123456';
  const cleanWhatsapp = whatsappNum.replace(/[^\d]/g, '');

  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    'Hello Aapla Jalgaonwala team, I would like to inquire about your store products and orders.'
  )}`;

  return (
    <section className="py-16 md:py-24 bg-white border-t border-stone-200/60">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Store Info Left */}
          <div className="lg:col-span-6 space-y-6">
            <SectionHeading
              eyebrow="Visit Our Physical Store"
              title={`Visit ${settings.storeName || 'Aapla Jalgaonwala'}`}
              subtitle="Experience our fresh snack counters and taste authentic Jalgaon products at our flagship store."
              className="mb-6"
            />

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-[#FAF6ED] rounded-2xl border border-amber-900/10">
                <div className="p-3 bg-white rounded-xl text-[#9B111E] shadow-xs flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 mb-1">Store Address</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    {storeAddr}
                  </p>
                  {settings.storeLegalNameEnt && (
                    <p className="text-[11px] text-[#D9531E] font-semibold mt-1">
                      Entity: {settings.storeLegalNameEnt}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3.5 p-4 bg-[#FAF6ED] rounded-2xl border border-amber-900/10">
                  <div className="p-2.5 bg-white rounded-xl text-amber-700 shadow-xs flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Store Hours</h4>
                    <p className="text-xs text-stone-600 mt-0.5">{settings.storeHours || 'Mon - Sun: 8:00 AM - 10:00 PM IST'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 bg-[#FAF6ED] rounded-2xl border border-amber-900/10">
                  <div className="p-2.5 bg-white rounded-xl text-emerald-700 shadow-xs flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Phone & Support</h4>
                    <a
                      href={`tel:${settings.contactPhone || '+91 98901 23456'}`}
                      className="text-xs text-[#9B111E] font-bold hover:underline"
                    >
                      {settings.contactPhone || '+91 98901 23456'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="md" className="gap-2 rounded-xl">
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </Button>
              </a>

              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="md" className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </Button>
              </a>
            </div>
          </div>

          {/* Interactive Map Placeholder Right */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden bg-stone-100 border-2 border-stone-200 shadow-md aspect-4/3 flex flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold text-stone-800 shadow-xs">
                  <Store className="w-4 h-4 text-[#9B111E]" />
                  <span>Aapla Jalgaonwala Experience Center</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" title="Open Now" />
              </div>

              {/* Styled Map Graphic Simulation */}
              <div className="my-auto text-center space-y-3 py-8">
                <div className="w-16 h-16 rounded-full bg-[#9B111E] text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-stone-900">Dehu Yelwadi, Pune</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    Located conveniently on Dehu Yelwadi Road, Ground Floor Shop No. 20
                  </p>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xs p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">Open 7 Days • 8:00 AM - 11:00 PM</span>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#9B111E] hover:underline"
                >
                  Open in Google Maps &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
