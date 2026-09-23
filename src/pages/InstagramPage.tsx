import React, { useState } from 'react';
import { SEO } from '@/components/seo/SEO';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/linkCompat';
import { motion, AnimatePresence } from 'motion/react';
import {
  Instagram,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Sparkles,
  Play,
  CheckCircle2,
  Bookmark,
  ShoppingBag,
  Users,
  Film,
  Camera,
  X
} from 'lucide-react';

interface InstaPost {
  id: string;
  type: 'image' | 'reel';
  image: string;
  videoThumb?: string;
  caption: string;
  likes: number;
  comments: number;
  tag: string;
  productLinked?: {
    name: string;
    price: number;
    link: string;
  };
}

const INSTA_POSTS: InstaPost[] = [
  {
    id: 'post-1',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?w=800&auto=format&fit=crop&q=80',
    caption: 'Fresh batch of our Signature Jalgaon Salted Banana Chips straight from the copper kadhai! 🍌✨ 100% natural, crispier than ever. #AaplaJalgaonwala #BananaChips #KhandeshDelight',
    likes: 1420,
    comments: 88,
    tag: '#FreshlyFried',
    productLinked: {
      name: 'Classic Salted Banana Chips (200g)',
      price: 90,
      link: '/product/classic-salted-banana-chips'
    }
  },
  {
    id: 'post-2',
    type: 'reel',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800&auto=format&fit=crop&q=80',
    caption: 'Listen to this ASMR CRUNCH! 🔊 Real Jalgaon bananas sliced paper-thin (0.8mm) for the ultimate tea-time companion. #ASMR #CrunchySnacks #JalgaonFoodies',
    likes: 3840,
    comments: 215,
    tag: '#ReelCrunch',
    productLinked: {
      name: 'Peri Peri Banana Chips (200g)',
      price: 95,
      link: '/product/peri-peri-banana-chips'
    }
  },
  {
    id: 'post-3',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    caption: 'Fast with devotion and pure taste! 🙏 Our Upwas Masala Chips made with pure Himalayan Sendha Namak & roasted cumin. 100% Fasting Approved. #UpwasSpecial #Ekadashi #SendhaNamak',
    likes: 980,
    comments: 42,
    tag: '#UpwasSpecial',
    productLinked: {
      name: 'Sendha Namak Upwas Banana Chips',
      price: 95,
      link: '/product/sendha-namak-upwas-banana-chips'
    }
  },
  {
    id: 'post-4',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    caption: 'Behind the scenes at our Jalgaon production facility! Cleanliness, traditional wood-pressed oil, and generational spice heritage. ❤️ #AuthenticFood #GenerationalHeritage',
    likes: 2190,
    comments: 134,
    tag: '#FactoryBehindTheScenes'
  },
  {
    id: 'post-5',
    type: 'reel',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80',
    caption: 'Unboxing the Mega Jalgaon Heritage Hamper! Shipped from Jalgaon to Bengaluru in 3 days. Free shipping on all orders above ₹499! 📦🚚 #SnackUnboxing #CustomerLove',
    likes: 4510,
    comments: 310,
    tag: '#CustomerReview',
    productLinked: {
      name: 'Khandesh Royal Combo Pack',
      price: 499,
      link: '/product/khandesh-royal-combo-pack'
    }
  },
  {
    id: 'post-6',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    caption: 'Did you know? Jalgaon produces over 70% of Maharashtra’s bananas. We source directly from local farmers at fair trade prices. 🚜💛 #FarmToPack #SupportFarmers',
    likes: 1750,
    comments: 64,
    tag: '#FarmFresh'
  }
];

export function InstagramPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'photos'>('all');
  const [selectedPost, setSelectedPost] = useState<InstaPost | null>(null);

  const filteredPosts = INSTA_POSTS.filter(post => {
    if (activeTab === 'reels') return post.type === 'reel';
    if (activeTab === 'photos') return post.type === 'image';
    return true;
  });

  return (
    <div className="py-8 md:py-16 bg-[#FAFAF8] min-h-screen">
      <SEO
        title="Instagram Feed & Stories | @aapla_jalgaonwala"
        description="Follow Aapla Jalgaonwala on Instagram for live snack making, crunch reels, customer stories, farm stories, and fresh snack drops."
      />

      <Container>
        {/* Profile Card / Header */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Avatar with Animated Gradient Ring */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-[#D9531E] to-[#9B111E] shadow-md">
                <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden">
                  <div className="w-full h-full rounded-full bg-[#9B111E] flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                    AJW
                  </div>
                </div>
              </div>
              <span className="absolute bottom-1 right-1 p-1.5 bg-[#0087FF] text-white rounded-full ring-2 ring-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center justify-center sm:justify-start gap-2">
                    <span>aapla_jalgaonwala__19</span>
                    <Badge variant="saffron" size="sm">Official</Badge>
                  </h1>
                  <p className="text-xs font-bold text-stone-500 mt-0.5">
                    Aapla Jalgaonwala • Authentic Banana Chips & Fasting Snacks
                  </p>
                </div>

                <a
                  href="https://www.instagram.com/aapla_jalgaonwala__19/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9B111E] to-[#D9531E] hover:from-[#800A14] hover:to-[#B84010] text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Follow on Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Bio */}
              <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                🍌 Authentic GI-grade Jalgaon Banana Chips & Khandeshi Savories<br />
                🥥 100% Pure Veg • Himalayan Sendha Namak for Upwas<br />
                📦 Pan-India Fresh Shipping • Free delivery above ₹499<br />
                🏷️ Tag us <span className="font-bold text-[#9B111E]">#AaplaJalgaonwala</span> to get featured!
              </p>

              {/* Stats Counters */}
              <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 border-t border-stone-100 text-xs text-stone-600">
                <div>
                  <strong className="text-stone-900 font-bold">148</strong> posts
                </div>
                <div>
                  <strong className="text-stone-900 font-bold">24.6K</strong> followers
                </div>
                <div>
                  <strong className="text-stone-900 font-bold">4.9★</strong> rating
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex justify-center border-b border-stone-200 mb-8 max-w-4xl mx-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>All Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'reels'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Crunch Reels</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'photos'
                ? 'border-[#9B111E] text-[#9B111E]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Photos</span>
          </button>
        </div>

        {/* Grid of Instagram Posts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden cursor-pointer group flex flex-col"
            >
              {/* Media Preview */}
              <div className="relative aspect-square overflow-hidden bg-stone-100">
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                    {post.tag}
                  </span>
                </div>

                {/* Reel Play Icon */}
                {post.type === 'reel' && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>

              {/* Caption & Product Link */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed">
                  {post.caption}
                </p>

                {post.productLinked && (
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 truncate max-w-[170px]">
                      {post.productLinked.name}
                    </span>
                    <span className="font-black text-[#9B111E] shrink-0">
                      ₹{post.productLinked.price}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tagged Community Callout */}
        <div className="max-w-4xl mx-auto mt-14 bg-gradient-to-r from-amber-500 via-[#D9531E] to-[#9B111E] rounded-3xl p-6 sm:p-8 text-white text-center shadow-lg">
          <Sparkles className="w-8 h-8 text-amber-200 mx-auto mb-2" />
          <h2 className="text-xl sm:text-2xl font-black">Want to be featured on our feed?</h2>
          <p className="text-xs text-amber-100 max-w-md mx-auto mt-1 mb-6">
            Share a photo or reel of your snack time with Aapla Jalgaonwala chips, tag <strong className="text-white">@aapla_jalgaonwala__19</strong> & use <strong className="text-white">#AaplaJalgaonwala</strong>. Best posts win monthly snack hampers!
          </p>
          <a
            href="https://www.instagram.com/aapla_jalgaonwala__19/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#9B111E] font-bold text-xs shadow-md hover:bg-stone-50 transition-all cursor-pointer"
          >
            <Instagram className="w-4 h-4" />
            <span>Open Instagram App</span>
          </a>
        </div>

        {/* Modal View for Post Detail */}
        <AnimatePresence>
          {selectedPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2"
              >
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="aspect-square bg-stone-900">
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.caption}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                      <div className="w-8 h-8 rounded-full bg-[#9B111E] text-white flex items-center justify-center font-bold text-xs">
                        AJW
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">aapla_jalgaonwala</h4>
                        <span className="text-[10px] text-stone-400">Jalgaon, Maharashtra</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      {selectedPost.caption}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold text-stone-600">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        {selectedPost.likes} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-stone-400" />
                        {selectedPost.comments} comments
                      </span>
                    </div>
                  </div>

                  {selectedPost.productLinked ? (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-stone-900">{selectedPost.productLinked.name}</p>
                        <p className="text-xs font-black text-[#9B111E]">₹{selectedPost.productLinked.price}</p>
                      </div>
                      <Link
                        href={selectedPost.productLinked.link}
                        onClick={() => setSelectedPost(null)}
                        className="px-3 py-1.5 bg-[#9B111E] text-white rounded-xl text-xs font-bold hover:bg-[#800A14] flex items-center gap-1 shrink-0"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order Now</span>
                      </Link>
                    </div>
                  ) : (
                    <a
                      href="https://www.instagram.com/aapla_jalgaonwala__19/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 text-center"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>View on Instagram</span>
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
}

export default InstagramPage;
