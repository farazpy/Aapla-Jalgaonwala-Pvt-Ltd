'use client';

import React, { useState } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { initialSiteSettings } from '@/data/settings';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setError(data.error || 'Failed to submit form');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-20 bg-[#FAF6ED]">
      <SEO
        title="Contact Us | Aapla Jalgaonwala"
        description="Get in touch with Aapla Jalgaonwala. Visit our flagship store in Yelwadi, Pune or reach out to our support team."
      />

      <Container>
        <SectionHeading
          eyebrow="We'd Love To Hear From You"
          title="Contact Us"
          subtitle="Have questions about our products, bulk orders, or store hours? Reach out to us directly."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Left */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
              <h3 className="text-xl font-bold text-stone-900">Store Information</h3>

              <div className="flex items-start gap-3.5 text-xs text-stone-600">
                <MapPin className="w-5 h-5 text-[#9B111E] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">Physical Outlet</strong>
                  <span>{initialSiteSettings.storeAddress}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-xs text-stone-600">
                <Phone className="w-5 h-5 text-[#9B111E] flex-shrink-0" />
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">Contact Phone</strong>
                  <a href={`tel:${initialSiteSettings.contactPhone}`} className="hover:underline text-[#9B111E] font-bold">
                    {initialSiteSettings.contactPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-xs text-stone-600">
                <Mail className="w-5 h-5 text-[#9B111E] flex-shrink-0" />
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">Email Support</strong>
                  <a href={`mailto:${initialSiteSettings.contactEmail}`} className="hover:underline">
                    {initialSiteSettings.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-xs text-stone-600">
                <Clock className="w-5 h-5 text-[#9B111E] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">Store & Support Hours</strong>
                  <p>Store: {initialSiteSettings.storeHours}</p>
                  <p>Support: {initialSiteSettings.supportHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Right */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/80 shadow-xs">
            {success ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">Message Sent!</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto">
                  Thank you for reaching out. A representative from Aapla Jalgaonwala will contact you shortly.
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline" size="md">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Your Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
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
                  <Input
                    label="Subject *"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Inquiry subject"
                  />
                </div>

                <Textarea
                  label="Message *"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                />

                {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full gap-2 rounded-xl"
                >
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
