import React, { useState } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/linkCompat';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Truck,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  CreditCard,
  Building2,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  highlight?: boolean;
}

const FAQ_DATA: FAQItem[] = [
  // Orders & Delivery
  {
    id: 'od-1',
    category: 'Orders & Delivery',
    question: 'How long does delivery take across India?',
    answer: 'Orders are freshly packed within 24 hours of placement. Metro cities and Maharashtra destinations typically receive deliveries within 2 to 4 business days. For the rest of India, standard delivery takes 3 to 5 business days. You will receive real-time SMS & email tracking updates.',
    highlight: true
  },
  {
    id: 'od-2',
    category: 'Orders & Delivery',
    question: 'What are the shipping charges?',
    answer: 'We offer 100% FREE Delivery on all orders across India above ₹499! For orders below ₹499, a nominal flat standard shipping fee of ₹49 is applied to maintain protective, crush-resistant corrugated packaging.',
    highlight: true
  },
  {
    id: 'od-3',
    category: 'Orders & Delivery',
    question: 'Do you provide Cash on Delivery (COD)?',
    answer: 'Yes, Cash on Delivery is available across 19,000+ Indian pincodes. You can pay cash or scan UPI directly to the delivery executive upon package arrival.',
    highlight: false
  },
  {
    id: 'od-4',
    category: 'Orders & Delivery',
    question: 'How do you ensure banana chips and farsaan don’t break during transit?',
    answer: 'We pack every order in food-grade multilayer nitrogen-flushed airtight pouches, enclosed within heavy-duty 5-ply corrugated shipper boxes padded with honeycomb kraft cushions. This ensures your chips arrive crispy, whole, and fresh just like buying from our Jalgaon counter.',
    highlight: true
  },

  // Banana Chips & Quality
  {
    id: 'bc-1',
    category: 'Banana Chips & Quality',
    question: 'What makes Jalgaon Banana Chips distinct from South Indian chips?',
    answer: 'Jalgaon is known globally as the "Banana City of India" for its mineral-rich Tapi basin soil and naturally sweet Grand Naine Cavendish bananas. Unlike thick chips fried in heavy coconut oil, Aapla Jalgaonwala chips are ultra-thinly sliced (0.8mm), fried in pure cold-pressed sunflower oil, and tossed in bespoke Jalgaoni masala blends for an exceptionally light, non-greasy crunch.',
    highlight: true
  },
  {
    id: 'bc-2',
    category: 'Banana Chips & Quality',
    question: 'Are your chips and snacks 100% vegetarian?',
    answer: 'Yes! All Aapla Jalgaonwala products are 100% pure vegetarian (Green Dot certified), prepared in our dedicated pure-veg, hygiene-certified facilities in Jalgaon, Maharashtra.',
    highlight: false
  },
  {
    id: 'bc-3',
    category: 'Banana Chips & Quality',
    question: 'What is the shelf life of your snacks and farsaan?',
    answer: 'Our vacuum-sealed nitrogen-flushed chips and farsaan retain peak freshness for 6 months from the date of manufacture. Once opened, store in an airtight container in a cool, dry place to maintain maximum crunch.',
    highlight: false
  },
  {
    id: 'bc-4',
    category: 'Banana Chips & Quality',
    question: 'Do you use palm oil or artificial colors?',
    answer: 'Never. We strictly use premium refined sunflower oil and groundnut oil. We have zero artificial preservatives, zero synthetic colors, and zero trans-fats in all our authentic traditional recipes.',
    highlight: false
  },

  // Upwas & Fasting Special
  {
    id: 'up-1',
    category: 'Upwas & Fasting Special',
    question: 'Are Upwas (Fasting) products made with Sendha Namak (Rock Salt)?',
    answer: 'Yes! Our Upwas Banana Chips, Sabudana Chivda, and Farali snacks are crafted exclusively with pure Himalayan Sendha Namak (Rock Salt) in separate dedicated fasting-grade frying cauldrons, making them 100% authentic and permissible for all Hindu fasts (Ekadashi, Navratri, Mahashivratri, Shravan).',
    highlight: true
  },
  {
    id: 'up-2',
    category: 'Upwas & Fasting Special',
    question: 'Is your Upwas Masala Banana Chips suitable for Ekadashi?',
    answer: 'Absolutely. We use a proprietary fasting-compliant spice blend containing black pepper, roasted cumin powder (jeera), sendha namak, and amchur without any onion, garlic, or grain contaminants.',
    highlight: false
  },

  // Payments & Returns
  {
    id: 'pr-1',
    category: 'Payments & Returns',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major payment modes including UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, Net Banking (all Indian banks), and Cash on Delivery (COD). All online transactions are processed through 256-bit encrypted Razorpay SSL gateways.',
    highlight: false
  },
  {
    id: 'pr-2',
    category: 'Payments & Returns',
    question: 'What is your return or replacement policy?',
    answer: 'Because our products are perishable food items, returns are generally not accepted once delivered. However, if your package arrives damaged, leaked, or incorrect, simply email us at info@aaplajalgaonwala.com or WhatsApp us within 48 hours of delivery with photos, and we will issue a replacement or full refund without hassle.',
    highlight: false
  },

  // Franchise & Wholesale
  {
    id: 'fr-1',
    category: 'Franchise & Wholesale',
    question: 'Can I start an Aapla Jalgaonwala retail franchise or kiosk?',
    answer: 'Yes! We actively partner with entrepreneurs across Maharashtra, Gujarat, MP, Karnataka, and all major Indian cities. We offer comprehensive FOFO (Franchise Owned Franchise Operated) and distributor models with full marketing, supply chain, and setup assistance. Visit our Franchise Page or submit an enquiry to get our prospectus.',
    highlight: true
  },
  {
    id: 'fr-2',
    category: 'Franchise & Wholesale',
    question: 'Do you offer bulk orders for weddings, corporate gifting, and festivals?',
    answer: 'Yes, we provide custom corporate gift hampers, Diwali boxes, and wedding snack packs with personalized branding at wholesale discounts. Contact our B2B team on WhatsApp: +91 70574 46409.',
    highlight: false
  }
];

const CATEGORIES = [
  'All Questions',
  'Orders & Delivery',
  'Banana Chips & Quality',
  'Upwas & Fasting Special',
  'Payments & Returns',
  'Franchise & Wholesale'
];

export function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['od-1', 'bc-1', 'up-1']);

  const toggleAccordion = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'All Questions' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-8 md:py-16 bg-[#FAFAF8] min-h-screen">
      <SEO
        title="Frequently Asked Questions (FAQ) | Aapla Jalgaonwala"
        description="Find answers to all your questions about Aapla Jalgaonwala banana chips, upwas special snacks, delivery, franchise opportunities, and freshness guarantee."
      />

      <Container>
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
          <Badge variant="saffron" size="md" className="mb-3">
            Help & Knowledge Hub
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Frequently Asked <span className="text-[#9B111E]">Questions</span>
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-xl mx-auto">
            Everything you need to know about our authentic Jalgaon snacks, fast delivery, fasting purity, ingredients, and franchise partnerships.
          </p>

          {/* Search Bar */}
          <div className="mt-8 relative max-w-xl mx-auto">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics (e.g. shipping time, sendha namak, COD, franchise)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/30 focus:border-[#9B111E] text-stone-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar justify-start sm:justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#9B111E] text-white shadow-md'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/80 shadow-xs">
              <HelpCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800 mb-1">No matching questions found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;. Feel free to reach out to our team directly!
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All Questions'); }}
                className="px-4 py-2 bg-stone-100 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[#9B111E]/40 shadow-sm ring-1 ring-[#9B111E]/10'
                      : 'border-stone-200/80 shadow-2xs hover:border-stone-300'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isOpen ? 'bg-[#9B111E]/10 text-[#9B111E]' : 'bg-stone-100 text-stone-500'
                      }`}>
                        <HelpCircle className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#D9531E]">
                          {faq.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-0.5">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <div className={`p-1.5 rounded-full shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#9B111E] text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100/80">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Contact / Still Have Questions Card */}
        <div className="max-w-3xl mx-auto mt-12 bg-gradient-to-br from-[#9B111E] to-[#800A14] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Need Personalized Assistance?</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Still have a question?</h3>
            <p className="text-xs text-amber-100 max-w-md">
              Our Jalgaon customer support champions are happy to help with orders, special fasting packs, or bulk hampers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="https://wa.me/917057446409?text=Hello%20Aapla%20Jalgaonwala,%20I%20have%20a%20query%20about%20your%20products"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
            >
              <span>Contact Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default FAQPage;
