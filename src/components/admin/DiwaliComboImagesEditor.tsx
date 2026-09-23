'use client';

import React from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  RotateCcw, 
  CheckCircle2, 
  Upload, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { CloudinaryUpload } from './CloudinaryUpload';

export interface ComboSectionMeta {
  id: string;
  categoryNumber: number;
  title: string;
  categoryTag: string;
  icon: string;
  totalWeight: string;
  defaultImageUrl: string;
  summary: string;
  colorScheme: {
    bg: string;
    border: string;
    badge: string;
  };
}

export const COMBO_SECTIONS_META: ComboSectionMeta[] = [
  {
    id: 'farsan',
    categoryNumber: 1,
    title: 'Homemade Diwali Farsan',
    categoryTag: 'Authentic Khandeshi Faral',
    icon: '🥣',
    totalWeight: '4.5 kg Total (Chakli, Chivda, Shankarpale, Karanji, Anarse, Bhakarwadi)',
    defaultImageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    summary: 'Chakli 500g, Chivda 2kg, Shankarpale 500g, Karanji 500g, Anarse 500g, Bhakarwadi 500g',
    colorScheme: {
      bg: 'from-amber-50 to-orange-50/50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-900 border-amber-300'
    }
  },
  {
    id: 'sweets',
    categoryNumber: 2,
    title: 'Traditional Homemade Sweets',
    categoryTag: 'Pure Cow Desi Ghee',
    icon: '🍬',
    totalWeight: '2.5 kg Total (Besan Ladoo, Motichoor Ladoo, Gulab Jamun, Rasgulla)',
    defaultImageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    summary: 'Besan Ladoo 250g, Motichoor Ladoo 250g, Gulab Jamun 1kg, Rasgulla 1kg',
    colorScheme: {
      bg: 'from-rose-50 to-orange-50/40',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-900 border-rose-300'
    }
  },
  {
    id: 'special',
    categoryNumber: 3,
    title: 'Aapla Jalgaonwala Special',
    categoryTag: 'Secret Kitchen Blend',
    icon: '🌶️',
    totalWeight: '2 Signature Items (Special Chivda & 1 Time Family Masala)',
    defaultImageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80',
    summary: 'Special Jalgaon Savory Chivda and 1-Time Festive Family Masala Pouch',
    colorScheme: {
      bg: 'from-red-50 to-amber-50/40',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-900 border-red-300'
    }
  },
  {
    id: 'puja',
    categoryNumber: 4,
    title: 'Complete Lakshmi Puja Kit',
    categoryTag: '100% Satvik Ritual Box',
    icon: '🪔',
    totalWeight: 'All-In-One Ritual Kit (Idol, Coconut, Paan, Supari, Haldi, Camphor)',
    defaultImageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=800&q=80',
    summary: 'Lakshmi Murti, Sacred Coconut, Betel Nut/Leaves, Kumkum/Akshata, Camphor, Dhoop, Wicks',
    colorScheme: {
      bg: 'from-yellow-50 to-amber-50/60',
      border: 'border-yellow-300',
      badge: 'bg-yellow-100 text-yellow-900 border-yellow-300'
    }
  },
  {
    id: 'firecrackers',
    categoryNumber: 5,
    title: 'Diwali Firecrackers',
    categoryTag: 'Child-Safe & Family Joy',
    icon: '🎆',
    totalWeight: 'Curated Family Sparkler Box',
    defaultImageUrl: 'https://images.unsplash.com/photo-1508963493744-76fce69379c0?auto=format&fit=crop&w=800&q=80',
    summary: 'Fuljhadi sparklers, ground chakri spinners, flower pots, safe child varieties',
    colorScheme: {
      bg: 'from-purple-50 to-pink-50/40',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-900 border-purple-300'
    }
  },
  {
    id: 'rangoli',
    categoryNumber: 6,
    title: 'Rangoli Art & Decor Kit',
    categoryTag: 'Festive Entrance Decor',
    icon: '🎨',
    totalWeight: 'Complete Stencil & Pigment Set',
    defaultImageUrl: 'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?auto=format&fit=crop&w=800&q=80',
    summary: '5 Vibrant Rangoli color powders, Lakshmi feet and lotus stencils, decorative accessories',
    colorScheme: {
      bg: 'from-teal-50 to-emerald-50/40',
      border: 'border-teal-200',
      badge: 'bg-teal-100 text-teal-900 border-teal-300'
    }
  },
  {
    id: 'surprise_gift',
    categoryNumber: 7,
    title: 'Attractive Surprise Diwali Gift',
    categoryTag: 'Exclusive Souvenir',
    icon: '🎁',
    totalWeight: 'Exclusive Keepsake from Jalgaon Artisans',
    defaultImageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    summary: 'Surprise handcrafted festive souvenir packed exclusively for the first 1,000 customers',
    colorScheme: {
      bg: 'from-emerald-50 to-amber-50/40',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    }
  }
];

interface DiwaliComboImagesEditorProps {
  comboImages: Record<string, string>;
  onChange: (newComboImages: Record<string, string>) => void;
}

export const DiwaliComboImagesEditor: React.FC<DiwaliComboImagesEditorProps> = ({
  comboImages = {},
  onChange
}) => {
  const handleUrlChange = (sectionId: string, url: string) => {
    onChange({
      ...comboImages,
      [sectionId]: url.trim()
    });
  };

  const handleResetToDefault = (sectionId: string, defaultUrl: string) => {
    onChange({
      ...comboImages,
      [sectionId]: defaultUrl
    });
  };

  const handleResetAllToDefaults = () => {
    const allDefaults: Record<string, string> = {};
    COMBO_SECTIONS_META.forEach(s => {
      allDefaults[s.id] = s.defaultImageUrl;
    });
    onChange(allDefaults);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
              <Layers className="w-5 h-5 text-[#9B111E]" />
            </span>
            <h3 className="text-lg font-black text-stone-900">
              Diwali Combo Pack Sub-Product Imagery
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Customize the individual photography shown for each of the 7 sub-products inside this Diwali Box.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAllToDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shrink-0"
          title="Reset all 7 images to recommended curated festive photos"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Reset All to Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {COMBO_SECTIONS_META.map((section) => {
          const currentUrl = comboImages[section.id] || section.defaultImageUrl;
          const isCustom = Boolean(comboImages[section.id] && comboImages[section.id] !== section.defaultImageUrl);

          return (
            <div
              key={section.id}
              className={`rounded-2xl p-5 border bg-gradient-to-br ${section.colorScheme.bg} ${section.colorScheme.border} transition-all space-y-4`}
            >
              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                        {section.categoryNumber}. {section.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${section.colorScheme.badge}`}>
                        {section.categoryTag}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {section.totalWeight}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCustom ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Custom Image
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-stone-500 bg-white/80 border border-stone-200 px-2 py-0.5 rounded-md">
                      Curated Default
                    </span>
                  )}
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => handleResetToDefault(section.id, section.defaultImageUrl)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 underline ml-1"
                    >
                      Restore Default
                    </button>
                  )}
                </div>
              </div>

              {/* Items in this sub pack */}
              <p className="text-xs text-stone-600 bg-white/70 rounded-xl p-2.5 border border-stone-200/60 leading-relaxed">
                <strong>Includes:</strong> {section.summary}
              </p>

              {/* Image Input & Preview Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-1">
                {/* Visual Preview */}
                <div className="sm:col-span-4 lg:col-span-3">
                  <div className="relative aspect-4/3 sm:aspect-square w-full rounded-xl overflow-hidden border border-stone-300/80 bg-stone-100 shadow-xs group">
                    <img
                      src={currentUrl}
                      alt={section.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = section.defaultImageUrl;
                      }}
                    />
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Open full image in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Controls & Cloudinary Upload */}
                <div className="sm:col-span-8 lg:col-span-9 space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                      Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={comboImages[section.id] || ''}
                        onChange={(e) => handleUrlChange(section.id, e.target.value)}
                        placeholder={section.defaultImageUrl}
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9B111E] bg-white font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Paste any Cloudinary, CDN, or web image URL for this specific pack.
                    </p>
                  </div>

                  {/* Direct Cloudinary Upload for this section */}
                  <div className="bg-white/90 p-3 rounded-xl border border-stone-200/80">
                    <p className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#9B111E]" />
                      <span>Upload New Image for {section.title}:</span>
                    </p>
                    <CloudinaryUpload
                      folder="diwali-combo"
                      label={`Upload ${section.title} Photo`}
                      currentValue={currentUrl}
                      onUploadSuccess={(url) => handleUrlChange(section.id, url)}
                      onSuccess={(url) => handleUrlChange(section.id, url)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
