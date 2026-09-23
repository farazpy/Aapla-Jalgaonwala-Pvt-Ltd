import React, { useState, useMemo } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/context/SettingsContext';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  CreditCard,
  Truck,
  Server,
  Cookie,
  Users,
  Clock,
  HelpCircle,
  Mail,
  PhoneCall,
  MapPin,
  Search,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Share2,
  DownloadCloud,
  ArrowUpRight,
  RefreshCw,
  Info
} from 'lucide-react';

interface PolicySection {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export default function PrivacyPolicyPage() {
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('introduction');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const storeName = settings.storeName || 'Aapla Jalgaonwala';
  const tagline = settings.tagline || 'Khandeshi Swaad, Shuddhata Aapli';
  const contactEmail = settings.contactEmail || 'info@aaplajalgaonwala.com';
  const contactPhone = settings.contactPhone || '+91 70574 46409';
  const storeAddress = settings.storeAddress || 'Gat No. 142, Yelwadi, Dehu-Alandi Road, Pune, Maharashtra 412109';
  const lastUpdated = 'September 14, 2026';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const sections: PolicySection[] = useMemo(
    () => [
      {
        id: 'introduction',
        number: '01',
        title: 'Introduction & Scope of Policy',
        shortDesc: 'Who we are, our commitment to your privacy, and applicable legal framework.',
        icon: FileText,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              Welcome to <strong>{storeName}</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;, or &ldquo;AJW&rdquo;). We are deeply committed to safeguarding the personal privacy, financial confidentiality, and digital security of our customers, website visitors, and business partners.
            </p>
            <p>
              This Privacy Policy explains in detail how we collect, handle, process, store, transfer, and protect your personal data when you visit our website (
              <code className="bg-stone-100 text-[#9B111E] px-1.5 py-0.5 rounded font-mono text-xs">aaplajalgaonwala.com</code>), place orders for our authentic banana chips, farsaan, kitchen masalas, and festive snack combos, register as a Women Business Partner, or interact with our customer care services.
            </p>
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Statutory Compliance Framework</p>
                <p className="mt-0.5">
                  This policy is formulated in strict accordance with the <strong>Digital Personal Data Protection Act (DPDP Act, 2023)</strong>, the <strong>Information Technology Act, 2000</strong> (including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011), and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
                </p>
              </div>
            </div>
            <p>
              By accessing, browsing, registering on, or purchasing from our platform, you acknowledge that you have read, understood, and consented to the practices described in this Privacy Policy.
            </p>
          </div>
        )
      },
      {
        id: 'data-collected',
        number: '02',
        title: 'Information We Collect',
        shortDesc: 'Comprehensive breakdown of customer, partner, device, and transactional data.',
        icon: UserCheck,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              We collect information that is strictly necessary to provide authentic food delivery, manage accounts, calculate partner commissions, and enhance your shopping journey. The categories of data collected include:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
                  <UserCheck className="w-4 h-4 text-[#9B111E]" />
                  <span>A. Customer Profile & Delivery Data</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li>Full Name and Title</li>
                  <li>Mobile Phone Number (for OTP login & SMS delivery updates)</li>
                  <li>Email Address (for invoices, receipts & order notices)</li>
                  <li>Shipping & Billing Addresses (Street, Area, Landmark, City, State, and 6-Digit PIN Code)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
                  <CreditCard className="w-4 h-4 text-[#D9531E]" />
                  <span>B. Order & Payment Metadata</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li>Items ordered, pack weights (200g, 500g, 1kg), quantities</li>
                  <li>Order status, tracking IDs, dispatch timestamps</li>
                  <li>Payment Mode selected (Prepaid UPI, Cards, Netbanking, COD)</li>
                  <li>Payment Gateway Transaction ID & tokenized confirmation (We never store card numbers or PINs)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
                  <Users className="w-4 h-4 text-purple-700" />
                  <span>C. Women Business Partner Data</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li>Partner Name, WhatsApp Business Number, District/City</li>
                  <li>Unique Referral Code & Referral link tracking metrics</li>
                  <li>Verified UPI ID / Bank Account details (stored in encrypted format solely for direct weekly/monthly commission payouts)</li>
                  <li>Commission ledger and cumulative sales stats</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wide">
                  <Server className="w-4 h-4 text-emerald-700" />
                  <span>D. Technical, Device & Usage Logs</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                  <li>IP Address, approximate geolocation (City/State level)</li>
                  <li>Browser type, operating system, and screen resolution</li>
                  <li>Pages visited, time spent on snacks, referring URLs</li>
                  <li>Cart contents saved in local browser storage</li>
                </ul>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'collection-methods',
        number: '03',
        title: 'How We Collect Your Information',
        shortDesc: 'Direct customer entry, automated technical logs, and secure third-party integrations.',
        icon: Eye,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>We gather data through three transparent methods:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs">Direct Interactions</h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    When you fill in checkout forms, sign up for an account, subscribe to our festival discount newsletter, register for the Women Partner program, submit a contact inquiry, or message our WhatsApp support desk.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs">Automated Technical Collection</h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    As you navigate our website, our server and analytics cookies log anonymous diagnostic metrics, network telemetry, page loading times, and error traces to maintain zero-downtime reliability.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs">Verified Service Integrations</h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    We receive instant webhooks from RBI-licensed payment aggregators (confirming payment success or failure) and courier APIs (confirming real-time shipment milestone scans such as Out for Delivery or Delivered).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'usage-purpose',
        number: '04',
        title: 'How We Use Your Information (Purpose of Processing)',
        shortDesc: 'Order fulfillment, courier dispatch, customer care, fraud prevention, and legal duties.',
        icon: Truck,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              We process your personal information strictly under lawful grounds (contractual performance, user consent, and legitimate legal interest). Your data is utilized for:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-700">
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Order Fulfillment:</strong> Baking, frying, packaging, labeling, and dispatching your snack parcels.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Live Tracking & Updates:</strong> Sending automated SMS, WhatsApp, and email tracking alerts.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Customer Assistance:</strong> Resolving address revisions, transit delays, or package replacements.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Partner Commission Remittances:</strong> Calculating monthly earnings and remitting payouts to woman partners.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Fraud Prevention & COD Verification:</strong> Preventing bogus orders, duplicate coupon abuse, and automated bots.</span>
              </li>
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Statutory Tax Invoicing:</strong> Generating GST-compliant tax invoices as mandated by Indian GST authorities.</span>
              </li>
            </ul>
          </div>
        )
      },
      {
        id: 'payment-security',
        number: '05',
        title: 'Payment Security & Financial Safeguards',
        shortDesc: 'PCI-DSS Level 1 compliance, RBI tokenization, zero raw card storage.',
        icon: Lock,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Strict Zero Card Storage Guarantee</h4>
                <p className="mt-1 leading-relaxed">
                  <strong>{storeName} NEVER stores, logs, or views your credit card numbers, debit card PINs, CVVs, or Netbanking passwords.</strong> All monetary transactions take place over 256-bit SSL encrypted channels directly with Reserve Bank of India (RBI) authorized payment aggregators (e.g., Razorpay, Cashfree, BHIM UPI).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">UPI & QR Instant Pay</p>
                <p className="text-stone-600">Processed securely via NPCI Unified Payments Interface protocols with two-factor biometric/PIN authentication on your mobile.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">Cards & Netbanking</p>
                <p className="text-stone-600">Tokenized in accordance with RBI CoF (Card-on-File) tokenization mandates, ensuring your actual card PAN is never shared.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">Cash on Delivery (COD)</p>
                <p className="text-stone-600">Verified via automated phone/SMS OTP verification prior to dispatch to prevent delivery failure and misuse.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'third-parties',
        number: '06',
        title: 'Third-Party Disclosures & Logistics Partners',
        shortDesc: 'Trusted couriers, cloud storage, SMS gateways, and strict non-disclosure obligations.',
        icon: Share2,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              We do <strong>NOT</strong> sell, trade, or rent your personal information to third-party advertisers or data brokers under any circumstances. We only share essential data with verified operational service providers under strict Non-Disclosure Agreements (NDAs):
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#9B111E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900">Courier & Logistics Aggregators</h4>
                  <p className="text-stone-600 mt-0.5">
                    <strong>Partners:</strong> Delhivery, Shiprocket, BlueDart, DTDC, India Post.
                    <br />
                    <strong>Data Shared:</strong> Customer Name, Delivery Address, PIN code, Contact Number, and Package Weight. Used exclusively to route and hand over physical parcels.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900">Payment Processors</h4>
                  <p className="text-stone-600 mt-0.5">
                    <strong>Partners:</strong> Razorpay, Cashfree, UPI Aggregators.
                    <br />
                    <strong>Data Shared:</strong> Order Value, Currency, Customer Email, and Phone Number for transaction matching and digital receipt generation.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <Server className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900">Cloud Storage & Media CDN</h4>
                  <p className="text-stone-600 mt-0.5">
                    <strong>Partners:</strong> Cloudinary, Google Cloud Platform (Asia-South Region).
                    <br />
                    <strong>Data Stored:</strong> Product visuals, promotional media banners, and encrypted application database records.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900">Statutory & Law Enforcement Bodies</h4>
                  <p className="text-stone-600 mt-0.5">
                    We may disclose information if required to comply with court subpoenas, Indian police investigations, GST audits, or to protect the safety and property of {storeName} and its customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'cookies',
        number: '07',
        title: 'Cookies, Local Storage & Tracking Technologies',
        shortDesc: 'How we preserve shopping carts, remember language preferences, and optimize site speed.',
        icon: Cookie,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              Our website uses cookies and browser local storage to ensure smooth shopping functionality and fast page loading.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">Essential (Strictly Necessary)</Badge>
                <p className="font-bold text-stone-900 mt-1">Cart & Auth Sessions</p>
                <p className="text-stone-600 leading-relaxed">
                  Maintains your selected banana chips & masalas in your shopping bag as you browse different categories. Cannot be disabled without breaking checkout.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">Functional</Badge>
                <p className="font-bold text-stone-900 mt-1">Language & Pincode Memory</p>
                <p className="text-stone-600 leading-relaxed">
                  Remembers your language selection (Marathi / English) and pre-fills your verified delivery PIN code for instant shipping estimation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">Performance</Badge>
                <p className="font-bold text-stone-900 mt-1">Diagnostic Telemetry</p>
                <p className="text-stone-600 leading-relaxed">
                  Collects aggregated, non-personally identifiable metrics on page load times and mobile render speeds to continuously optimize the app.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 italic">
              <strong>Cookie Management:</strong> You can manage or disable cookies via your browser settings (Chrome, Safari, Firefox, Edge). Note that disabling essential cookies will prevent placing orders online.
            </p>
          </div>
        )
      },
      {
        id: 'women-partner',
        number: '08',
        title: 'Women Business Partner Privacy Framework',
        shortDesc: 'Specific protections for partner referral codes, earnings, and banking records.',
        icon: Users,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              Our <strong>Women Business Partner Program</strong> empowers home entrepreneurs across Maharashtra and India. We treat partner records with heightened confidentiality:
            </p>

            <ul className="space-y-2.5 text-xs text-stone-700">
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900">Protected Referral Attribution:</span>
                  <p className="text-stone-600 mt-0.5">When customers order using your unique partner link (<code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">/ref/CODE</code>), customer financial info remains private to the customer, while the verified order value and commission percentage are attributed to your private dashboard.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900">Encrypted Payout Details:</span>
                  <p className="text-stone-600 mt-0.5">Your submitted UPI ID or Bank Account Number is used strictly for disbursing earned margins and incentives. These credentials are never displayed publicly or shared with third parties.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900">Marketing Toolkit Safety:</span>
                  <p className="text-stone-600 mt-0.5">Promotional graphics and WhatsApp status creatives provided in the Partner Toolkit are pre-cleared for direct social sharing without embedding personal tracking scripts.</p>
                </div>
              </li>
            </ul>
          </div>
        )
      },
      {
        id: 'data-security',
        number: '09',
        title: 'Data Security, Retention & Storage',
        shortDesc: 'SSL encryption, automated backups, and 7-year GST record preservation rules.',
        icon: Server,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              We implement comprehensive technical, organizational, and physical security measures to protect your personal data from unauthorized access, accidental alteration, disclosure, or destruction.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Technical Safeguards</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  End-to-end SSL/TLS 256-bit encryption in transit, hashed passwords, database firewall isolation, and restricted admin role access with multi-factor authentication.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Retention Timeline</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Tax and billing invoices are retained for <strong>7 years</strong> in compliance with the Indian Goods and Services Tax (GST) Act. Account data is retained until you request deletion.
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'user-rights',
        number: '10',
        title: 'Your Legal Rights & Data Choices',
        shortDesc: 'Access, correct, export, or permanently delete your account data anytime.',
        icon: CheckCircle2,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              Under the Indian Digital Personal Data Protection Act (DPDP Act, 2023), you hold the following explicit rights regarding your personal information:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-700">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">1. Right to Access & Summary</p>
                <p className="text-stone-600">Request a complete summary of the personal data we hold about you and the processing activities undertaken.</p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">2. Right to Rectification</p>
                <p className="text-stone-600">Update or correct inaccurate contact numbers, shipping addresses, or account credentials at any time in your Account tab.</p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">3. Right to Erasure (Data Deletion)</p>
                <p className="text-stone-600">Request permanent deletion of your account and personal identifiers (subject to statutory GST invoice retention obligations).</p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">4. Right to Withdraw Consent</p>
                <p className="text-stone-600">Unsubscribe from WhatsApp or email promotional broadcasts at any time with a single tap.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-sm">Need to exercise your data rights?</p>
                <p className="text-stone-400 text-xs mt-0.5">Send a request to our privacy desk and we will process it within 48 business hours.</p>
              </div>
              <a
                href={`mailto:${contactEmail}?subject=Privacy%20Data%20Request%20-%20${encodeURIComponent(storeName)}`}
                className="px-4 py-2 rounded-xl bg-[#9B111E] text-white font-bold hover:bg-[#800A14] transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Submit Data Request</span>
              </a>
            </div>
          </div>
        )
      },
      {
        id: 'children',
        number: '11',
        title: "Children's Privacy Notice",
        shortDesc: 'Our services are intended for individuals 18 years and older.',
        icon: AlertCircle,
        content: (
          <div className="space-y-3 text-stone-700 text-sm leading-relaxed">
            <p>
              Our website and online purchasing services are designed for a general audience and are intended for use by persons aged <strong>18 years or older</strong> who can form legally binding contracts under the Indian Contract Act, 1872.
            </p>
            <p className="text-xs text-stone-600">
              We do not knowingly collect personal information from minors under 18 years without verifiable parental consent. If a parent or guardian becomes aware that a child has provided us with personal information without consent, please contact our Grievance Officer immediately, and we will delete such data from our databases promptly.
            </p>
          </div>
        )
      },
      {
        id: 'grievance',
        number: '12',
        title: 'Grievance Officer & Statutory Contact Details',
        shortDesc: 'Official Grievance Officer, regulatory address, and 48-hour response SLA.',
        icon: Mail,
        content: (
          <div className="space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              In accordance with the <strong>Information Technology Act, 2000</strong> and rules made thereunder, as well as the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the contact details of the Grievance Officer for {storeName} are provided below:
            </p>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-black text-stone-900 text-base">Grievance Redressal Officer</h4>
                  <p className="text-xs text-stone-500 font-semibold">{storeName} Regulatory & Legal Compliance</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs">
                  SLA: Acknowledgment within 48 Hours
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-stone-500 block font-semibold">Physical Facility / Correspondence Address:</span>
                  <div className="flex items-start gap-2 text-stone-800 font-medium">
                    <MapPin className="w-4 h-4 text-[#D9531E] shrink-0 mt-0.5" />
                    <span>{storeAddress}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-stone-500 block font-semibold">Email Redressal Desk:</span>
                    <div className="flex items-center gap-2 text-stone-800 font-medium">
                      <Mail className="w-4 h-4 text-[#D9531E] shrink-0" />
                      <a href={`mailto:${contactEmail}`} className="hover:text-[#9B111E] underline">
                        {contactEmail}
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block font-semibold">Customer Care Helpline:</span>
                    <div className="flex items-center gap-2 text-stone-800 font-medium">
                      <PhoneCall className="w-4 h-4 text-[#D9531E] shrink-0" />
                      <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="hover:text-[#9B111E]">
                        {contactPhone}
                      </a>
                      <span className="text-[10px] text-stone-500">(Mon - Sat, 9:00 AM - 6:00 PM IST)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 text-xs text-stone-600">
                <p>
                  <strong>Resolution Timeline:</strong> Any grievance or privacy inquiry submitted will be acknowledged within <strong>48 hours</strong> and redressed within <strong>30 days</strong> from the date of receipt as mandated by Indian law.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ],
    [storeName, contactEmail, contactPhone, storeAddress]
  );

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(query) ||
        sec.shortDesc.toLowerCase().includes(query) ||
        sec.id.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12">
      <SEO
        title={`Privacy Policy | ${storeName} - Data Protection & Security`}
        description={`Read the official Privacy Policy of ${storeName}. Learn how we protect your personal information, delivery addresses, and payment security in compliance with the Indian DPDP Act 2023.`}
        canonical="https://aaplajalgaonwala.com/privacy-policy"
      />

      <Container className="max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#9B111E] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-900 font-bold">Privacy Policy</span>
        </nav>

        {/* Hero Header */}
        <div className="rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white p-6 sm:p-10 shadow-xl border border-stone-800 mb-8 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#9B111E]/20 blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 -top-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-[#9B111E]/30 text-amber-300 border-[#9B111E] text-[11px] font-bold py-0.5 px-2.5">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                DPDP Act 2023 Compliant
              </Badge>
              <span className="text-xs text-stone-400 font-mono">
                Effective: {lastUpdated} • Version 2.4
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Privacy Policy &amp; Data Protection
            </h1>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
              At <strong>{storeName}</strong>, your trust is our most valuable asset. We uphold stringent security practices to ensure your personal details, delivery locations, and financial transactions are safeguarded with highest digital protection.
            </p>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-3 pt-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer font-medium"
              >
                {copiedEmail ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Privacy Email</span>
                  </>
                )}
              </button>

              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white transition-all font-bold"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Guarantees Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-stone-900">Zero Data Monetization</h3>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">We never sell, rent, or trade your shopping history to third-party ad networks.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-stone-900">256-Bit SSL Protection</h3>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">All checkout sessions and OTP authorizations are protected with bank-grade encryption.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-stone-900">User Data Autonomy</h3>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">You can review, correct, download, or permanently erase your profile upon request.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-stone-900">Partner Confidentiality</h3>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">Encrypted payout ledgers and private referral tracking for Women Business Partners.</p>
            </div>
          </div>
        </div>

        {/* Search & Navigation layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Table of Contents (Sticky on lg) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            
            {/* Search Box */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-3">
              <label htmlFor="policy-search" className="text-xs font-bold text-stone-900 block">
                Search Policy Sections
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="policy-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. cookies, payment, partner, delete..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#9B111E] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-stone-400 hover:text-stone-600 text-xs absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Jump Index */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 px-2">
                Table of Contents ({sections.length} Sections)
              </h3>
              <nav className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all ${
                      activeSectionId === sec.id
                        ? 'bg-[#9B111E]/10 text-[#9B111E] font-bold'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-stone-400 font-bold shrink-0">
                      {sec.number}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Support Callout */}
            <div className="rounded-2xl bg-gradient-to-br from-[#9B111E]/10 via-amber-500/10 to-stone-100 p-4 border border-[#9B111E]/20 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <HelpCircle className="w-4 h-4 text-[#9B111E]" />
                <span>Have Privacy Questions?</span>
              </div>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Our support and legal compliance team is available Mon–Sat (9 AM to 6 PM IST) to assist with any data inquiries.
              </p>
              <div className="pt-1">
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-bold text-[#9B111E] hover:underline flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{contactEmail}</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/90 shadow-sm space-y-3">
                <Search className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="text-base font-bold text-stone-900">No matching sections found</h3>
                <p className="text-xs text-stone-500">
                  No policy clauses matched &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;cookies&rdquo;, &ldquo;bank&rdquo;, &ldquo;delivery&rdquo;, or clear the search.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  View All Sections
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm scroll-mt-24 transition-all hover:border-stone-300"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4 mb-5 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-900 flex items-center justify-center shrink-0">
                          <IconComponent className="w-5 h-5 text-[#9B111E]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#D9531E]">
                              SECTION {section.number}
                            </span>
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                            {section.title}
                          </h2>
                        </div>
                      </div>
                    </div>

                    {/* Section Body */}
                    <div>{section.content}</div>
                  </article>
                );
              })
            )}

            {/* Related Policies Navigation Bar */}
            <div className="bg-stone-900 text-stone-300 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Related Policies &amp; Store Information
                </h3>
                <span className="text-xs text-amber-400 font-bold">{storeName}</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                For detailed terms governing snack orders, franchise partnerships, shipping timelines, or customer queries, please review our companion policies:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Link
                  to="/faq"
                  className="p-3 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-white text-xs font-bold transition-all flex items-center justify-between group"
                >
                  <span>Frequently Asked Questions</span>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
                </Link>
                <Link
                  to="/women-business-partner"
                  className="p-3 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-white text-xs font-bold transition-all flex items-center justify-between group"
                >
                  <span>Women Partner Terms</span>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
                </Link>
                <Link
                  to="/contact"
                  className="p-3 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-white text-xs font-bold transition-all flex items-center justify-between group"
                >
                  <span>Contact &amp; Store Locations</span>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </Container>
    </div>
  );
}
