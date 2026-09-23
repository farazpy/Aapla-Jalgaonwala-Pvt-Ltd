'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { 
  Sprout, 
  Award, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Building2, 
  ArrowRight,
  Sun,
  PackageCheck,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  Image as ImageIcon,
  Quote,
  Newspaper,
  Maximize2
} from 'lucide-react';

import { GalleryItem, VideoItem } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { WatchStorySection } from '@/components/common/WatchStorySection';

// Media Items Data
const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'f1',
    title: 'Founders Saurabh & Jayesh at Jalgaon Farm',
    category: 'founders',
    categoryLabel: 'Founders & Leadership',
    imgUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=80',
    caption: 'Co-founders Saurabh Patil and Jayesh Patil inspecting raw green Grand Naine banana bunches in Shendurni orchard, Jalgaon.',
    date: 'August 2024',
    location: 'Shendurni, Jalgaon'
  },
  {
    id: 'f2',
    title: 'Co-Founder Saurabh Patil with Local Farmers',
    category: 'founders',
    categoryLabel: 'Founders & Leadership',
    imgUrl: 'https://images.unsplash.com/photo-[#522075]?auto=format&fit=crop&w=1000&q=80',
    caption: 'Saurabh finalizing farmgate purchase agreements with local banana growers in Jalgaon district.',
    date: 'June 2024',
    location: 'Jalgaon Orchards'
  },
  {
    id: 'f3',
    title: 'Jayesh Patil Testing Spice Formulations',
    category: 'founders',
    categoryLabel: 'Founders & Leadership',
    imgUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=80',
    caption: 'Jayesh supervising the master blending of traditional Khandeshi Kala Masala in small culinary batches.',
    date: 'October 2024',
    location: 'Central Kitchen, Pune'
  },
  {
    id: 'g1',
    title: 'Harvesting Raw Bananas at Dawn',
    category: 'farmgate',
    categoryLabel: 'Farmgate & Sourcing',
    imgUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    caption: 'Freshly harvested firm green bananas selected specifically for low moisture and ideal starch density.',
    date: 'Daily Morning',
    location: 'Jalgaon'
  },
  {
    id: 'g2',
    title: 'Quality Inspection & Sorting',
    category: 'farmgate',
    categoryLabel: 'Farmgate & Sourcing',
    imgUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1000&q=80',
    caption: 'Hand-sorting bunches to remove imperfections before transport to processing facility.',
    date: 'Daily Harvest',
    location: 'Jalgaon Direct Hub'
  },
  {
    id: 'p1',
    title: 'Artisanal Small-Batch Frying Kettles',
    category: 'factory',
    categoryLabel: 'Production & Quality',
    imgUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80',
    caption: 'Clean, temperature-controlled frying in high-grade vegetable oil to achieve golden crispness.',
    date: 'Batch Operations',
    location: 'Processing Unit'
  },
  {
    id: 'p2',
    title: 'Precision Ultra-Thin Slicing Line',
    category: 'factory',
    categoryLabel: 'Production & Quality',
    imgUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1000&q=80',
    caption: 'Automated ultra-thin slicing ensures even thickness and satisfying snap in every single chip.',
    date: 'Quality Control',
    location: 'Processing Unit'
  },
  {
    id: 'pr1',
    title: 'Felicitation at Agri-Food Conclave',
    category: 'press',
    categoryLabel: 'Media & Press',
    imgUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    caption: 'Aapla Jalgaonwala awarded Best Regional Agro-Retail Brand at the Maharashtra Food Leadership Summit.',
    date: 'November 2024',
    location: 'Mumbai'
  },
  {
    id: 'pr2',
    title: 'Featured in Regional Business Daily',
    category: 'press',
    categoryLabel: 'Media & Press',
    imgUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
    caption: 'Special coverage on how Jalgaon’s banana farmers are earning higher returns through direct brand partnerships.',
    date: 'January 2025',
    location: 'Pune Press Release'
  }
];

// Video Showcase Data
const VIDEO_ITEMS: VideoItem[] = [
  {
    id: 'v1',
    title: 'The Journey from Jalgaon Farms to Your Snack Bowl',
    duration: '03:45',
    thumbnail: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: 'Watch co-founders Saurabh and Jayesh take you through the banana orchards of Jalgaon and demonstrate the small-batch frying process.',
    category: 'Brand Story',
    speaker: 'Saurabh Patil & Jayesh Patil'
  },
  {
    id: 'v2',
    title: 'How We Formulate Authentic Khandeshi Kala Masala',
    duration: '02:15',
    thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: 'Jayesh Patil demonstrates the slow roasting of 18 whole spices in iron kadhais to create our signature masala dusting.',
    category: 'Behind the Scenes',
    speaker: 'Jayesh Patil (Co-Founder)'
  },
  {
    id: 'v3',
    title: 'Flagship Store Launch in Dehu, Pune',
    duration: '01:50',
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: 'Highlights from our inauguration day featuring live chip frying, customer reactions, and tasting sessions.',
    category: 'Event Highlight',
    speaker: 'Aapla Jalgaonwala Team'
  }
];

import { initialOwners } from '@/data/owners';
import { initialGalleryItems, initialVideoItems } from '@/data/media';

export default function OurStoryPage() {
  const { settings } = useSettings();
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'founders' | 'farmgate' | 'factory' | 'press'>('all');
  const [selectedImageModal, setSelectedImageModal] = useState<GalleryItem | null>(null);

  const [ownersList, setOwnersList] = useState<any[]>(initialOwners);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(initialGalleryItems);

  React.useEffect(() => {
    fetch('/api/owners')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setOwnersList(json.data);
        }
      })
      .catch((err) => console.log('Note: using initial owners', err));

    fetch('/api/media')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          if (Array.isArray(json.data.gallery) && json.data.gallery.length > 0) {
            setGalleryList(json.data.gallery);
          }
          if (Array.isArray(json.data.videos) && json.data.videos.length > 0) {
            setVideoList(json.data.videos);
          }
        }
      })
      .catch((err) => console.log('Note: using initial media', err));
  }, []);

  const stats = [
    { label: 'Started In', value: '2024', subtext: 'Born in Jalgaon, Maharashtra' },
    { label: 'Farmgate Direct', value: '100%', subtext: 'Zero middlemen involved' },
    { label: 'Farmer Partners', value: '50+', subtext: 'Families supported in Jalgaon' },
    { label: 'Packs Delivered', value: '100k+', subtext: 'Happy snackers across India' },
  ];

  const pillars = [
    {
      icon: Sprout,
      title: 'Direct Farmgate Sourcing',
      desc: 'We procure raw green bananas directly from local Jalgaon orchards within hours of harvest, ensuring optimal starch content and crispy texture.'
    },
    {
      icon: Flame,
      title: 'Artisanal Small-Batch Craft',
      desc: 'Cooked in clean, temperature-controlled oil in small batches to maintain uniform golden crunch and prevent oiliness.'
    },
    {
      icon: Sparkles,
      title: 'Ancestral Khandeshi Masalas',
      desc: 'Dusted with traditional house-blended spices like roasted Kala Masala, dry garlic, and native chilli for authentic regional flavor.'
    },
    {
      icon: ShieldCheck,
      title: 'Uncompromising Quality',
      desc: 'Zero artificial preservatives, zero synthetic colors, and sealed in high-barrier nitrogen foil pouches to lock in freshness.'
    }
  ];

  const filteredGallery = activeGalleryTab === 'all' 
    ? galleryList 
    : galleryList.filter(item => item.category === activeGalleryTab);

  const handleNextImage = () => {
    if (!selectedImageModal) return;
    const currentIndex = filteredGallery.findIndex(i => i.id === selectedImageModal.id);
    const nextIndex = (currentIndex + 1) % filteredGallery.length;
    setSelectedImageModal(filteredGallery[nextIndex]);
  };

  const handlePrevImage = () => {
    if (!selectedImageModal) return;
    const currentIndex = filteredGallery.findIndex(i => i.id === selectedImageModal.id);
    const prevIndex = (currentIndex - 1 + filteredGallery.length) % filteredGallery.length;
    setSelectedImageModal(filteredGallery[prevIndex]);
  };

  return (
    <div className="bg-[#FAF6ED] min-h-screen">
      <SEO
        title="Our Story, Founders & Media Gallery | Aapla Jalgaonwala"
        description="Discover the journey of Aapla Jalgaonwala, co-founded by Saurabh Patil and Jayesh Patil. Explore our founders media gallery, video documentaries, and farmgate sourcing story."
      />

      {/* 1. HERO SECTION */}
      {settings?.showStoryHeroSection !== false && (
        <section className="relative py-16 md:py-24 bg-stone-900 text-white overflow-hidden">
          {settings?.ourStoryHeroImageUrl ? (
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy"
                src={settings.ourStoryHeroImageUrl}
                alt="Our Story Background"
                className="w-full h-full object-cover opacity-40 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-[#800A14]/80" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#800A14] via-[#9B111E] to-[#B8222F]">
              <div className="absolute inset-0 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            </div>
          )}
          
          <Container className="relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-widest shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                The Heritage of Khandesh • Started in 2024
              </span>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {settings?.ourStoryHeroTitle || (
                  <>
                    Rooted in Soil. <br className="hidden sm:inline" />
                    <span className="text-amber-300">Crafted for Modern Taste.</span>
                  </>
                )}
              </h1>

              <p className="text-stone-200 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
                {settings?.ourStoryHeroSubtitle || 'Started in 2024, Aapla Jalgaonwala connects local farming families in Jalgaon directly with snack lovers across India to bring unadulterated crunch, wafer-thin banana chips, and authentic regional taste.'}
              </p>
            </div>

            {/* Key Stats Bar */}
            <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {stats.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center transition-all hover:bg-white/15"
                >
                  <div className="text-2xl sm:text-4xl font-extrabold text-amber-300 mb-1">{item.value}</div>
                  <div className="text-xs sm:text-sm font-bold text-white">{item.label}</div>
                  <div className="text-[11px] text-stone-300 mt-0.5">{item.subtext}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 2. THE 2024 BRAND ORIGIN STORY */}
      <section className="py-16 md:py-20 bg-white border-b border-stone-200/80">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-3 mb-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#9B111E]/10 text-[#9B111E] text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Our Story & Journey
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight">
                Our Brand Started in 2024
              </h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Founded in 2024 in Jalgaon, Maharashtra — the Banana Capital of India — Aapla Jalgaonwala was created to bring authentic, farmgate-fresh Khandeshi snacks and crispy banana chips straight to households across India.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FAF6ED] p-6 rounded-3xl border border-stone-200/80 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-800 uppercase tracking-wider bg-amber-100/90 px-2.5 py-1 rounded-lg">
                    Inception • 2024
                  </div>
                  <h3 className="text-lg font-black text-stone-900">Rooted in Jalgaon&apos;s Soil</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    In 2024, our founders recognized that while Jalgaon grows over 16% of India&apos;s bananas, pure artisanal chips made without adulteration were missing from city grocery shelves. Aapla Jalgaonwala was established to bridge that gap.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF6ED] p-6 rounded-3xl border border-stone-200/80 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/90 px-2.5 py-1 rounded-lg">
                    Farmgate Direct
                  </div>
                  <h3 className="text-lg font-black text-stone-900">Empowering 50+ Farmers</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    From our launch in 2024, we bypassed mandi brokers, establishing direct purchase agreements with local banana farming families at guaranteed premium prices within 12 hours of harvest.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF6ED] p-6 rounded-3xl border border-stone-200/80 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#9B111E] uppercase tracking-wider bg-[#9B111E]/10 px-2.5 py-1 rounded-lg">
                    Growth & Trust
                  </div>
                  <h3 className="text-lg font-black text-stone-900">Delivering Across India</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Since starting in 2024, Aapla Jalgaonwala has grown from small kitchen batches into an All-India delivery brand with physical retail presence in Pune and a thriving women business partner network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. FOUNDERS DETAILED SPOTLIGHT & PROFILE */}
      {settings?.showStoryFoundersSection !== false && (
        <section className="py-16 md:py-24 bg-white border-b border-stone-200/80">
          <Container>
            <SectionHeading
              eyebrow="Leadership & Vision"
              title="Meet Our Founders"
              subtitle="Driven by a passion to empower Jalgaon banana farmers and share authentic Maharashtrian snacking traditions nationwide."
              centered
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12 max-w-5xl mx-auto">
              {ownersList.map((owner) => (
                <div key={owner.id} className="bg-[#FAFAF8] rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-amber-100 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy"
                        src={owner.photoUrl || owner.photo_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80'}
                        alt={owner.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{owner.title}</span>
                        <h3 className="text-2xl font-black">{owner.name}</h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#9B111E] bg-[#9B111E]/10 px-3 py-1.5 rounded-lg w-fit">
                        <Building2 className="w-4 h-4" />
                        <span>{owner.role || owner.location || 'Leadership & Operations'}</span>
                      </div>

                      <p className="text-sm text-stone-700 leading-relaxed font-medium">
                        {owner.bio}
                      </p>
                    </div>
                  </div>

                  {owner.quote && (
                    <div className="p-4 rounded-2xl bg-white border border-stone-200/60 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                        <Quote className="w-4 h-4 text-[#D9531E]" />
                        <span>{owner.name}&apos;s Vision:</span>
                      </div>
                      <p className="text-xs text-stone-600 italic leading-relaxed">
                        &ldquo;{owner.quote}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 3. MEDIA GALLERY & FOUNDER PHOTOS SECTION */}
      {settings?.showStoryMediaGallery !== false && (
        <section className="py-16 md:py-24 bg-[#FAFAF8] border-b border-stone-200/80">
          <Container>
            <SectionHeading
              eyebrow="Visual Journey"
              title="Media & Photo Gallery"
              subtitle="Explore moments from our Jalgaon banana orchards, small-batch frying kitchens, press awards, and founder interactions."
              centered
            />

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center items-center gap-2 my-8">
              {[
                { id: 'all', label: 'All Photos' },
                { id: 'founders', label: 'Founders & Leadership' },
                { id: 'farmgate', label: 'Farmgate & Orchards' },
                { id: 'factory', label: 'Production & Craft' },
                { id: 'press', label: 'Media & Awards' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGalleryTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    activeGalleryTab === tab.id
                      ? 'bg-[#9B111E] text-white shadow-md'
                      : 'bg-white text-stone-700 hover:bg-stone-200/80 border border-stone-200/80'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Gallery Grid (5 photos in one row on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedImageModal(item)}
                  className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-56 w-full overflow-hidden bg-stone-200">
                      <Image
                        src={item.imgUrl}
                        alt={item.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="p-3 bg-white/90 rounded-full text-[#9B111E] shadow-lg transform group-hover:scale-110 transition-transform">
                          <Maximize2 className="w-5 h-5" />
                        </span>
                      </div>
                      <span className="absolute top-3 left-3 px-3 py-1 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <h4 className="text-base font-bold text-stone-900 group-hover:text-[#9B111E] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-1 border-t border-stone-100 flex items-center justify-between text-[11px] font-medium text-stone-500">
                    {item.location && <span>📍 {item.location}</span>}
                    {item.date && <span>🗓️ {item.date}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 4. VIDEO DOCUMENTARY & MEDIA HIGHLIGHTS */}
      {settings?.showStoryVideoSection !== false && <WatchStorySection />}

      {/* 5. PRESS & RECOGNITION BADGES */}
      {settings?.showStoryPressSection !== false && (
        <section className="py-12 bg-stone-900 text-white">
          <Container>
            <div className="text-center space-y-2 mb-8">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                Featured In Media & Publications
              </span>
              <h3 className="text-xl font-bold">As Seen On Regional News & Food Journals</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
                <p className="text-base font-black text-amber-300">Maharashtra Times</p>
                <p className="text-[11px] text-stone-400 mt-1">&ldquo;Innovators of Jalgaon Agriculture&rdquo;</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
                <p className="text-base font-black text-amber-300">Sakal News</p>
                <p className="text-[11px] text-stone-400 mt-1">&ldquo;Empowering Local Farmers&rdquo;</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
                <p className="text-base font-black text-amber-300">Lokmat</p>
                <p className="text-[11px] text-stone-400 mt-1">&ldquo;Authentic Taste of Khandesh&rdquo;</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
                <p className="text-base font-black text-amber-300">Agrowon Today</p>
                <p className="text-[11px] text-stone-400 mt-1">&ldquo;Direct Farmgate Brand Success&rdquo;</p>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 6. CORE PILLARS & BRAND PROMISES */}
      {settings?.showStoryPillarsSection !== false && (
        <section className="py-16 md:py-24 border-b border-stone-200/80 bg-white">
          <Container>
            <SectionHeading
              eyebrow="Our Guiding Principles"
              title="The 4 Golden Pillars of Our Craft"
              subtitle="How we guarantee uncompromising quality and authentic taste in every single packet."
              centered
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div 
                    key={idx}
                    className="bg-[#FAF6ED] p-6 rounded-3xl border border-stone-200/80 shadow-xs hover:border-[#D9531E]/40 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#9B111E]/10 text-[#9B111E] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{p.title}</h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* 7. STORE LOCATION SPOTLIGHT */}
      {settings?.showStoryStoreLocationSection !== false && (
        <section className="py-16 md:py-20 bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  Physical Flagship Store
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Visit Our Store in Yelwadi, Dehu (Pune)
                </h2>
                <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
                  Experience fresh hot frying, sample our latest flavour creations, and meet our team in person at our flagship outlet in Pune district.
                </p>
                <div className="text-xs text-amber-200 font-semibold bg-white/10 p-4 rounded-xl border border-white/10 inline-block">
                  📍 Store Address: Yelwadi, Dehu, Pune, Maharashtra 412109 • Contact: +91 70574 46409
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link href="/contact" className="w-full">
                  <button className="w-full py-3.5 px-6 rounded-xl bg-amber-400 text-stone-950 font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>View Store Location & Map</span>
                  </button>
                </Link>
                <Link href="/shop" className="w-full">
                  <button className="w-full py-3.5 px-6 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                    <PackageCheck className="w-4 h-4" />
                    <span>Order Online For Home Delivery</span>
                  </button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200">
            {/* Close button */}
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Nav buttons */}
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="relative h-80 sm:h-96 w-full bg-stone-900">
              <Image
                src={selectedImageModal.imgUrl}
                alt={selectedImageModal.title}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-6 space-y-2 bg-white">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 bg-amber-100 text-[#9B111E] text-xs font-bold rounded-full">
                  {selectedImageModal.categoryLabel}
                </span>
                {selectedImageModal.date && (
                  <span className="text-xs text-stone-500 font-medium">{selectedImageModal.date}</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-stone-900">{selectedImageModal.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                {selectedImageModal.caption}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
