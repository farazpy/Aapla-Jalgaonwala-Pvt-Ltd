'use client';

import React, { useState } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageCircle, 
  Package, 
  Building2, 
  HelpCircle, 
  ChevronDown, 
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Truck,
  PhoneCall
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const CONTACT_FAQS: FAQItem[] = [
  {
    category: 'Ordering & Dispatch',
    question: 'How long does delivery take across India?',
    answer: 'Orders are freshly packed and dispatched within 24 hours from our facility. Delivery typically takes 2-4 business days for metro cities and 4-6 business days for Tier-2/3 regions. Live courier tracking links are sent via SMS and WhatsApp as soon as your parcel ships.'
  },
  {
    category: 'Upwas & Fasting Purity',
    question: 'Are Upwas Special snacks 100% pure for fasting?',
    answer: 'Yes! Our Upwas (Fasting) Special banana chips and farali snacks are prepared using pure Sendha Namak (Rock Salt), groundnut/coconut oil, and raw green bananas. They are fried in completely separate kettle lines to prevent cross-contamination with non-fasting seasonings.'
  },
  {
    category: 'Bulk & Corporate Supply',
    question: 'Do you offer bulk discounts for weddings, festivals & corporate gifting?',
    answer: 'Absolutely! We specialize in custom regional snack boxes, festive hampers, and wholesale bulk packs for corporate events, weddings, and retail outlets. Reach out to our B2B team directly at wholesale@aapla-jalgaonwala.in or select "Bulk & Wholesale" in the contact form.'
  },
  {
    category: 'Returns & Quality Guarantee',
    question: 'What if my package arrives damaged or missing items?',
    answer: 'We guarantee 100% freshness and crispiness. If your box arrives damaged or open, take a quick photo/video and message our WhatsApp Mitra (+91 70574 46409) within 48 hours of delivery. We will issue a instant free replacement or refund without hassle.'
  },
  {
    category: 'Physical Store Visit',
    question: 'Where is your physical flagship store located?',
    answer: 'Our flagship retail store & live chip frying kitchen is located at Gat No. 142, Yelwadi, Dehu-Alandi Road, Pune, Maharashtra 412109. You can taste hot, live-fried Jalgaon banana chips every day between 9:00 AM and 9:00 PM IST.'
  }
];

export default function ContactPage() {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
      } else {
        setError(data.error || 'Failed to submit form');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappPhone = settings.whatsappNumber || settings.contactPhone || '+91 70574 46409';
  const cleanPhone = whatsappPhone.replace(/[^\d]/g, '');
  const phoneDisplay = whatsappPhone.startsWith('+') ? whatsappPhone : `+${whatsappPhone}`;

  return (
    <div className="py-12 md:py-20 bg-[#FAF6ED] min-h-screen">
      <SEO
        title="Contact Us & Support | Aapla Jalgaonwala"
        description="Reach out to Aapla Jalgaonwala support team. Visit our store in Yelwadi, Pune or Jalgaon hub. Get quick help via WhatsApp, email or phone."
      />

      <Container>
        {/* Header Title */}
        <SectionHeading
          eyebrow="We're Here For You"
          title="Contact & Customer Support"
          subtitle="Have a question about our Jalgaon banana chips, track an order, or explore wholesale partnerships? We'd love to connect with you."
          centered
        />

        {/* 1. SUPPORT CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-12">
          {/* Card 1: WhatsApp Mitra */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-stone-900 group-hover:text-emerald-700 transition-colors">
                WhatsApp Mitra
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Instant order help, delivery tracking & product queries on WhatsApp.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20Aapla%20Jalgaonwala,%20I%20have%20a%20query`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Phone & Order Support */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#D9531E] flex items-center justify-center font-bold">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-stone-900 group-hover:text-[#D9531E] transition-colors">
                Phone Support
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Speak directly with our Jalgaon store support desk during operational hours.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#D9531E] hover:underline"
              >
                <span>{phoneDisplay}</span>
              </a>
            </div>
          </div>

          {/* Card 3: Wholesale & B2B */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-stone-900 group-hover:text-indigo-700 transition-colors">
                Bulk & Franchise
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Distributorship, corporate gifting hampers, and store franchise inquiries.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <a
                href="mailto:wholesale@aapla-jalgaonwala.in"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 hover:underline"
              >
                <span>Inquire B2B Supply</span>
              </a>
            </div>
          </div>

          {/* Card 4: Store Outlet */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-[#9B111E] flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-stone-900 group-hover:text-[#9B111E] transition-colors">
                Flagship Store
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium line-clamp-2">
                Yelwadi, Dehu-Alandi Road, Pune • Open 8 AM to 10 PM IST daily.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <a
                href="https://maps.google.com/?q=Yelwadi+Dehu+Alandi+Road+Pune"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#9B111E] hover:underline"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. FORM & STORE INFO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 my-12">
          {/* Contact Details Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
              <h3 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D9531E]" />
                <span>Store Information</span>
              </h3>

              <div className="space-y-5 text-xs text-stone-700 font-medium">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-[#9B111E] shrink-0 mt-0.5 border border-amber-200">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 text-sm font-bold mb-0.5">Physical Retail Outlet</strong>
                    <span className="leading-relaxed block text-stone-600">
                      {settings.storeAddress || 'Gat No. 142, Yelwadi, Dehu-Alandi Road, Pune, Maharashtra 412109'}
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-1">
                      Secondary Sourcing Hub: Shendurni, Jalgaon, Maharashtra 424204
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-[#9B111E] shrink-0 mt-0.5 border border-amber-200">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 text-sm font-bold mb-0.5">Direct Helpline</strong>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="text-[#9B111E] font-bold text-sm hover:underline block"
                    >
                      {settings.contactPhone || '+91 70574 46409'}
                    </a>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Available Mon - Sat, 9:00 AM - 9:00 PM IST
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-[#9B111E] shrink-0 mt-0.5 border border-amber-200">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 text-sm font-bold mb-0.5">Official Support Email</strong>
                    <a
                      href={`mailto:${settings.contactEmail || 'info@aaplajalgaonwala.com'}`}
                      className="text-stone-800 font-bold text-xs hover:underline block"
                    >
                      {settings.contactEmail || 'info@aaplajalgaonwala.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-[#9B111E] shrink-0 mt-0.5 border border-amber-200">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-stone-900 text-sm font-bold mb-0.5">Store & Operations Hours</strong>
                    <p className="text-stone-600">Store Outlet: {settings.storeHours || 'Mon - Sun: 8:00 AM - 10:00 PM IST'}</p>
                    <p className="text-stone-600 mt-0.5">Online Support: Mon - Sat: 9:00 AM - 8:00 PM IST</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-600">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>FSSAI Certified Unit</span>
                </span>
                <span className="text-stone-400">Lic. 11524022000184</span>
              </div>
            </div>
          </div>

          {/* Form Right Column */}
          <div className="lg:col-span-7 bg-white p-7 sm:p-10 rounded-3xl border border-stone-200/90 shadow-sm">
            <h3 className="text-xl font-extrabold text-stone-900 mb-1">Send Us a Direct Message</h3>
            <p className="text-xs text-stone-500 mb-6 font-medium">
              Fill in your details below and our Jalgaon store representative will get back to you within 2-4 business hours.
            </p>

            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-stone-900">Message Received!</h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-medium">
                  Thank you for reaching out to Aapla Jalgaonwala. Our team has received your message and will reach back shortly.
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline" size="md" className="rounded-xl mt-4">
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Your Full Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Patil"
                  />
                  <Input
                    label="Mobile Number *"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Email Address *"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Inquiry Category *
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 outline-none focus:border-[#9B111E] transition-colors"
                    >
                      <option value="General Inquiry">General Product Inquiry</option>
                      <option value="Track Order">Order Status & Courier Tracking</option>
                      <option value="Bulk & Wholesale">Bulk Order & Corporate Gifting</option>
                      <option value="Franchise">Franchise & Retail Outlet Opportunity</option>
                      <option value="Feedback">Quality & Taste Feedback</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Your Message or Special Request *"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can assist you..."
                />

                {error && <p className="text-xs text-red-600 font-extrabold">{error}</p>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full gap-2 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white font-bold py-3.5"
                >
                  <span>Submit Message</span>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* 3. INTERACTIVE GOOGLE MAP EMBED SECTION */}
        <div className="my-16 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase text-[#D9531E] tracking-wider block mb-1">
                Store Location Map
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                Visit Our Store & Frying Kitchen
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Gat No. 142, Yelwadi, Dehu-Alandi Road, Pune, Maharashtra 412109
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Yelwadi+Dehu+Alandi+Road+Pune"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-xs"
            >
              <MapPin className="w-4 h-4" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3779.620138988019!2d73.81152!3d18.68012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b952f44c4b69%3A0xa5ff0bf5ed14995b!2sYelwadi%2C%20Maharashtra%20412109!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Aapla Jalgaonwala Store Map"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* 4. COMPREHENSIVE FAQS SECTION */}
        <div className="my-16 bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-sm max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-black uppercase text-[#D9531E] tracking-wider inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <HelpCircle className="w-4 h-4" />
              <span>Frequently Asked Questions</span>
            </span>
            <h3 className="text-2xl font-black text-stone-900">Have Questions? We Have Answers.</h3>
            <p className="text-xs text-stone-500 font-medium">
              Common answers regarding order dispatches, Upwas purity, shipping rates, and store visit hours.
            </p>
          </div>

          <div className="space-y-3.5">
            {CONTACT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen ? 'border-[#9B111E] bg-amber-50/40 shadow-xs' : 'border-stone-200/80 bg-stone-50/50 hover:bg-stone-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-stone-900 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 shrink-0">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#9B111E]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-stone-600 leading-relaxed font-medium border-t border-stone-200/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
