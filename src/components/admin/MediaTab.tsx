'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { GalleryItem, VideoItem } from '@/types';
import {
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  Play,
  CheckCircle2,
  Save,
  Link as LinkIcon,
  AlertTriangle,
  FileImage,
  Check,
  Loader2,
  Info,
  X,
  Sparkles,
  Search,
  Edit2,
  ExternalLink,
  Tag,
  Filter,
  Grid,
  Camera,
  FolderOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { CloudinaryUpload } from './CloudinaryUpload';
import { SearchableSelect, SelectOption } from './SearchableSelect';

export interface CloudinaryAsset {
  id: string;
  url: string;
  publicId?: string;
  name: string;
  bytes?: number;
  format?: string;
  createdAt: string;
}

// Pre-defined gallery categories
const PRESET_GALLERY_CATEGORIES = [
  { id: 'founders', label: 'Founders & Leadership', description: 'Photos of Saurabh & Jayesh, leadership meetings, farm visits' },
  { id: 'farmgate', label: 'Farmgate & Sourcing', description: 'Jalgaon banana orchards, harvesting, fresh crop sorting' },
  { id: 'factory', label: 'Production & Quality', description: 'Artisanal kettle frying, slicing lines, spice dusting, hygiene' },
  { id: 'press', label: 'Media & Press', description: 'Agri-food conclaves, newspaper articles, certificates, awards' },
  { id: 'events', label: 'Store Launches & Events', description: 'Dehu flagship store opening, tasting sessions, food festivals' }
];

const PRESET_VIDEO_CATEGORIES = [
  'Brand Story',
  'Behind the Scenes',
  'Event Highlight',
  'Customer Stories',
  'Recipes & Pairings',
  'Farm Tour'
];

export const MediaTab: React.FC<{
  showToast: (msg: string) => void;
  defaultSubTab?: 'cloudinary' | 'gallery' | 'videos';
}> = ({ showToast, defaultSubTab = 'cloudinary' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'cloudinary' | 'gallery' | 'videos'>(defaultSubTab);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery Filters
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('all');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');

  // Video Filters
  const [videoCategoryFilter, setVideoCategoryFilter] = useState<string>('all');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');

  // Cloudinary media assets states
  const [cloudinaryAssets, setCloudinaryAssets] = useState<CloudinaryAsset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CloudinaryAsset | null>(null);

  // Multiple selection for bulk deletion
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Lists for direct assignment
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [assignProductId, setAssignProductId] = useState('');
  const [assignCategoryId, setAssignCategoryId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Quick Add to Story Gallery from Cloudinary
  const [isQuickStoryAddOpen, setIsQuickStoryAddOpen] = useState(false);
  const [quickStoryCategory, setQuickStoryCategory] = useState('founders');
  const [quickStoryTitle, setQuickStoryTitle] = useState('');
  const [quickStoryCaption, setQuickStoryCaption] = useState('');
  const [isQuickStorySubmitting, setIsQuickStorySubmitting] = useState(false);

  // Searchable Select2-style options for products and categories
  const productSelectOptions: SelectOption[] = useMemo(() => {
    return products.map((p) => ({
      value: String(p.id),
      label: p.name || 'Untitled Product',
      subtitle: p.category ? `Category: ${p.category}${p.price ? ` • ₹${p.price}` : ''}` : (p.price ? `₹${p.price}` : undefined),
      image: p.image || undefined,
      badge: p.flavour || (p.isBestSeller ? 'Best Seller' : p.isNew ? 'New' : undefined),
      keywords: [p.flavour, p.category, p.slug].filter(Boolean) as string[]
    }));
  }, [products]);

  const categorySelectOptions: SelectOption[] = useMemo(() => {
    return categories.map((c) => ({
      value: String(c.id),
      label: c.name || 'Untitled Category',
      subtitle: c.slug ? `Slug: /${c.slug}` : undefined,
      image: c.image || undefined,
      badge: c.productCount !== undefined ? `${c.productCount} items` : undefined,
      keywords: [c.slug].filter(Boolean) as string[]
    }));
  }, [categories]);

  // Modals & Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'picker'>('upload');

  // Gallery Form State
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'farmgate',
    categoryLabel: 'Farmgate & Sourcing',
    imgUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    caption: '',
    date: 'August 2024',
    location: 'Jalgaon'
  });

  // Video Form State
  const [videoForm, setVideoForm] = useState({
    title: '',
    duration: '03:15',
    thumbnail: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: '',
    category: 'Brand Story',
    speaker: 'Founders'
  });

  // Deletion confirmation scanner state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    assets: CloudinaryAsset[];
    isChecking: boolean;
    linkedProducts: Array<{ id: string; name: string }>;
    linkedCategories: Array<{ id: string; name: string }>;
    isSiteLogo: boolean;
  }>({
    isOpen: false,
    assets: [],
    isChecking: false,
    linkedProducts: [],
    linkedCategories: [],
    isSiteLogo: false
  });

  const fetchMedia = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/media');
      const json = await res.json();
      if (json.success && json.data) {
        setGalleryItems(json.data.gallery || []);
        setVideoItems(json.data.videos || []);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCloudinaryAssets = useCallback(async (showLoading = false, forceSync = false) => {
    if (forceSync) {
      setIsSyncing(true);
    } else if (showLoading) {
      setIsAssetsLoading(true);
    }
    try {
      const url = `/api/admin/cloudinary?t=${Date.now()}${forceSync ? '&sync=true' : ''}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCloudinaryAssets(json.data);
        if (forceSync) {
          showToast(`Media library synchronized! (${json.data.length} assets live from Cloudinary)`);
        }
      }
    } catch (err) {
      console.error('Error fetching Cloudinary assets:', err);
    } finally {
      setIsAssetsLoading(false);
      setIsSyncing(false);
    }
  }, [showToast]);

  const fetchProductsAndCategories = useCallback(async () => {
    try {
      const [prodRes, catRes, setRes] = await Promise.allSettled([
        fetch('/api/products?includeUnavailable=true'),
        fetch('/api/categories'),
        fetch('/api/settings')
      ]);

      if (prodRes.status === 'fulfilled') {
        const prodJson = await prodRes.value.json();
        if (prodJson.success && prodJson.data) setProducts(prodJson.data);
      }
      if (catRes.status === 'fulfilled') {
        const catJson = await catRes.value.json();
        if (catJson.success && catJson.data) setCategories(catJson.data);
      }
      if (setRes.status === 'fulfilled') {
        const setJson = await setRes.value.json();
        if (setJson.success && setJson.data) setSettings(setJson.data);
      }
    } catch (err) {
      console.error('Error loading options lists:', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      await Promise.all([fetchMedia(true), fetchCloudinaryAssets(true), fetchProductsAndCategories()]);
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchMedia, fetchCloudinaryAssets, fetchProductsAndCategories]);

  // Section visibility toggles for Our Story page
  const toggleShowMediaGallery = async () => {
    const nextVal = settings?.showStoryMediaGallery === false ? true : false;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showStoryMediaGallery: nextVal })
      });
      const json = await res.json();
      if (json.success) {
        setSettings((prev: any) => ({ ...prev, showStoryMediaGallery: nextVal }));
        showToast(nextVal ? 'Media & Photo Gallery is now VISIBLE on Our Story page.' : 'Media & Photo Gallery is now HIDDEN on Our Story page.');
      }
    } catch (err) {
      console.error('Failed to update gallery visibility:', err);
    }
  };

  const toggleShowVideoSection = async () => {
    const nextVal = settings?.showStoryVideoSection === false ? true : false;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showStoryVideoSection: nextVal })
      });
      const json = await res.json();
      if (json.success) {
        setSettings((prev: any) => ({ ...prev, showStoryVideoSection: nextVal }));
        showToast(nextVal ? 'Watch Story Video section is now VISIBLE on Our Story page.' : 'Watch Story Video section is now HIDDEN on Our Story page.');
      }
    } catch (err) {
      console.error('Failed to update video section visibility:', err);
    }
  };

  // Client-side quick asset usage scanner
  const getAssetUsage = useCallback((url: string) => {
    const isLogo = settings?.logoUrl === url;
    const matchedProducts: Array<{ id: string; name: string }> = [];
    const matchedCategories: Array<{ id: string; name: string }> = [];
    const matchedGallery: Array<{ id: string; title: string }> = [];

    products.forEach((p) => {
      const pImgs = (p.images || []).map((i: any) => i.url);
      if (p.image === url || pImgs.includes(url)) {
        matchedProducts.push({ id: p.id, name: p.name });
      }
    });

    categories.forEach((c) => {
      if (c.image === url || c.banner === url) {
        matchedCategories.push({ id: c.id, name: c.name });
      }
    });

    galleryItems.forEach((g) => {
      if (g.imgUrl === url) {
        matchedGallery.push({ id: g.id, title: g.title });
      }
    });

    const totalCount = matchedProducts.length + matchedCategories.length + matchedGallery.length + (isLogo ? 1 : 0);

    return {
      isSiteLogo: isLogo,
      products: matchedProducts,
      categories: matchedCategories,
      gallery: matchedGallery,
      totalCount
    };
  }, [products, categories, galleryItems, settings]);

  // Dynamic Categories from Gallery Items + Presets
  const allGalleryCategories = useMemo(() => {
    const map = new Map<string, string>();
    PRESET_GALLERY_CATEGORIES.forEach(c => map.set(c.id, c.label));
    galleryItems.forEach(item => {
      if (item.category && !map.has(item.category)) {
        map.set(item.category, item.categoryLabel || item.category);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [galleryItems]);

  // Filtered Gallery Items
  const filteredGalleryItems = useMemo(() => {
    return galleryItems.filter(item => {
      const matchesCat = galleryCategoryFilter === 'all' || item.category === galleryCategoryFilter;
      const matchesSearch =
        gallerySearchQuery.trim() === '' ||
        item.title.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
        (item.caption && item.caption.toLowerCase().includes(gallerySearchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(gallerySearchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [galleryItems, galleryCategoryFilter, gallerySearchQuery]);

  // Filtered Video Items
  const filteredVideoItems = useMemo(() => {
    return videoItems.filter(item => {
      const matchesCat = videoCategoryFilter === 'all' || item.category === videoCategoryFilter;
      const matchesSearch =
        videoSearchQuery.trim() === '' ||
        item.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(videoSearchQuery.toLowerCase())) ||
        (item.speaker && item.speaker.toLowerCase().includes(videoSearchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [videoItems, videoCategoryFilter, videoSearchQuery]);

  // Helper to format YouTube URLs into proper embed URLs
  const formatYouTubeEmbed = (url: string) => {
    if (!url) return url;
    if (url.includes('/embed/')) return url;
    const matchWatch = url.match(/[?&]v=([^&]+)/);
    if (matchWatch) return `https://www.youtube.com/embed/${matchWatch[1]}?autoplay=1`;
    const matchShort = url.match(/youtu\.be\/([^?]+)/);
    if (matchShort) return `https://www.youtube.com/embed/${matchShort[1]}?autoplay=1`;
    return url;
  };

  // Open modal for Adding new item
  const handleOpenAddModal = (type: 'gallery' | 'video', prefillCategory?: string) => {
    setEditingItemId(null);
    if (type === 'gallery') {
      const cat = prefillCategory || (galleryCategoryFilter !== 'all' ? galleryCategoryFilter : 'farmgate');
      const preset = PRESET_GALLERY_CATEGORIES.find(c => c.id === cat);
      setGalleryForm({
        title: '',
        category: cat,
        categoryLabel: preset?.label || 'Gallery Photo',
        imgUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
        caption: '',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        location: 'Jalgaon'
      });
    } else {
      setVideoForm({
        title: '',
        duration: '03:00',
        thumbnail: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
        description: '',
        category: videoCategoryFilter !== 'all' ? videoCategoryFilter : 'Brand Story',
        speaker: 'Founders'
      });
    }
    setIsModalOpen(true);
  };

  // Open modal for Editing existing item
  const handleOpenEditGallery = (item: GalleryItem) => {
    setEditingItemId(item.id);
    setGalleryForm({
      title: item.title,
      category: item.category,
      categoryLabel: item.categoryLabel || item.category,
      imgUrl: item.imgUrl,
      caption: item.caption,
      date: item.date || '',
      location: item.location || ''
    });
    setActiveSubTab('gallery');
    setIsModalOpen(true);
  };

  const handleOpenEditVideo = (item: VideoItem) => {
    setEditingItemId(item.id);
    setVideoForm({
      title: item.title,
      duration: item.duration,
      thumbnail: item.thumbnail,
      videoUrl: item.videoUrl,
      description: item.description,
      category: item.category,
      speaker: item.speaker
    });
    setActiveSubTab('videos');
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleAddOrEditMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItemId) {
        // Update existing item
        const payload = activeSubTab === 'gallery'
          ? { id: editingItemId, mediaType: 'gallery', ...galleryForm }
          : { id: editingItemId, mediaType: 'video', ...videoForm, videoUrl: formatYouTubeEmbed(videoForm.videoUrl) };

        const res = await fetch('/api/media', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Updated ${activeSubTab === 'gallery' ? 'gallery photo' : 'video showcase item'} successfully!`);
          setIsModalOpen(false);
          setEditingItemId(null);
          await fetchMedia();
        } else {
          alert(json.error || 'Failed to update item');
        }
      } else {
        // Create new item
        const payload = activeSubTab === 'gallery'
          ? { mediaType: 'gallery', ...galleryForm }
          : { mediaType: 'video', ...videoForm, videoUrl: formatYouTubeEmbed(videoForm.videoUrl) };

        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
          showToast(activeSubTab === 'gallery' ? '🎉 Added new photo to Our Story Gallery!' : '🎉 Added new video to Our Story Showcase!');
          setIsModalOpen(false);
          await fetchMedia();
        } else {
          alert(json.error || 'Failed to add media item');
        }
      }
    } catch (err) {
      console.error('Error saving media:', err);
      alert('Error saving media item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete media item
  const handleDeleteShowcaseMedia = async (id: string, type: 'gallery' | 'video') => {
    if (!confirm('Are you sure you want to delete this media item from Our Story?')) return;

    try {
      const res = await fetch(`/api/media?id=${id}&type=${type}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Showcase item deleted');
        fetchMedia();
      } else {
        alert('Failed to delete media item');
      }
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  // 1-Click Quick Add Cloudinary Asset to Our Story Gallery
  const handleQuickAddAssetToGallery = async () => {
    if (!selectedAsset) return;
    setIsQuickStorySubmitting(true);
    try {
      const preset = PRESET_GALLERY_CATEGORIES.find(c => c.id === quickStoryCategory);
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: 'gallery',
          title: quickStoryTitle.trim() || selectedAsset.name,
          category: quickStoryCategory,
          categoryLabel: preset?.label || 'Gallery',
          imgUrl: selectedAsset.url,
          caption: quickStoryCaption.trim() || `Authentic moment captured at Jalgaon.`,
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          location: 'Jalgaon'
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Added "${quickStoryTitle || selectedAsset.name}" to Our Story Gallery (${preset?.label || quickStoryCategory})!`);
        setIsQuickStoryAddOpen(false);
        setQuickStoryTitle('');
        setQuickStoryCaption('');
        await fetchMedia();
      } else {
        alert(json.error || 'Failed to add to gallery');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add to gallery');
    } finally {
      setIsQuickStorySubmitting(false);
    }
  };

  // Direct Cloudinary asset assignment to Product or Category
  const handleAssignAsset = async (url: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!assignProductId && !assignCategoryId) {
      alert('Please select either a product or a category to assign this media.');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch('/api/admin/cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          url,
          productId: assignProductId || undefined,
          categoryId: assignCategoryId || undefined
        })
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Asset successfully linked directly!');
        setAssignProductId('');
        setAssignCategoryId('');
        fetchProductsAndCategories();
        fetchCloudinaryAssets();
      } else {
        alert(json.error || 'Failed to assign asset');
      }
    } catch (err) {
      console.error('Error assigning asset:', err);
      alert('An error occurred during asset assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  // Toggle single asset selection checkbox
  const toggleSelectAsset = (assetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAssetIds(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  // Select all or deselect all assets
  const handleSelectAll = () => {
    if (selectedAssetIds.length === cloudinaryAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(cloudinaryAssets.map(a => a.id));
    }
  };

  // Safe deletion scanner trigger
  const startDeleteAssets = async (assetsToDelete?: CloudinaryAsset[]) => {
    const assets = assetsToDelete || cloudinaryAssets.filter(a => selectedAssetIds.includes(a.id));
    if (assets.length === 0) return;

    setDeleteConfirmation({
      isOpen: true,
      assets,
      isChecking: true,
      linkedProducts: [],
      linkedCategories: [],
      isSiteLogo: false
    });

    try {
      const urls = assets.map(a => a.url);
      const res = await fetch(`/api/admin/cloudinary?checkLink=true&urls=${encodeURIComponent(JSON.stringify(urls))}`);
      const json = await res.json();
      if (json.success && json.linked) {
        setDeleteConfirmation(prev => ({
          ...prev,
          isChecking: false,
          linkedProducts: json.linked.products || [],
          linkedCategories: json.linked.categories || [],
          isSiteLogo: Boolean(json.linked.isSiteLogo)
        }));
      } else {
        setDeleteConfirmation(prev => ({ ...prev, isChecking: false }));
      }
    } catch (err) {
      console.error('Error scanning asset usage:', err);
      setDeleteConfirmation(prev => ({ ...prev, isChecking: false }));
    }
  };

  // Confirmed asset deletion execution
  const executeDeleteAssets = async () => {
    const assets = deleteConfirmation.assets;
    if (assets.length === 0 || isDeleting) return;

    setIsDeleting(true);
    const ids = assets.map(a => a.id);
    try {
      const res = await fetch('/api/admin/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Successfully deleted ${ids.length} asset(s) from Cloudinary`);
        setSelectedAssetIds(prev => prev.filter(id => !ids.includes(id)));
        if (selectedAsset && ids.includes(selectedAsset.id)) {
          setSelectedAsset(null);
        }
        await fetchCloudinaryAssets();
      } else {
        alert(json.error || 'Failed to delete asset(s)');
      }
    } catch (err) {
      console.error('Error deleting assets:', err);
      alert('Error deleting asset(s)');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({
        isOpen: false,
        assets: [],
        isChecking: false,
        linkedProducts: [],
        linkedCategories: [],
        isSiteLogo: false
      });
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-stone-500 font-bold flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#9B111E]" />
        <span>Loading Media & Gallery Manager...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TOP HEADER CONTROLS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Cloudinary Media & Story Showcase</span>
          </div>
          <h2 className="text-xl font-black text-stone-900">
            {activeSubTab === 'gallery'
              ? 'Our Story Photo Gallery & Image Categories'
              : activeSubTab === 'videos'
              ? 'Our Story Video Showcase'
              : 'Cloudinary Asset Library'}
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Manage photos, categorize gallery shots for Our Story, curate videos, and upload assets to Cloudinary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subtabs Switch */}
          <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('gallery')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'gallery' ? 'bg-white text-[#9B111E] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Story Gallery ({galleryItems.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('videos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'videos' ? 'bg-white text-[#D9531E] shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Story Videos ({videoItems.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('cloudinary')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'cloudinary' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileImage className="w-3.5 h-3.5 text-[#9B111E]" />
              <span>Cloudinary Storage ({cloudinaryAssets.length})</span>
            </button>
          </div>

          {activeSubTab !== 'cloudinary' ? (
            <button
              onClick={() => handleOpenAddModal(activeSubTab === 'gallery' ? 'gallery' : 'video')}
              className="px-4 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Add {activeSubTab === 'gallery' ? 'Photo to Gallery' : 'Video to Showcase'}</span>
            </button>
          ) : (
            <Link
              href="/our-story"
              target="_blank"
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>View Story Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OUR STORY PHOTO GALLERY WITH PROPER IMAGE CATEGORIES                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-6">
          {/* SECTION VISIBILITY CONTROL BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-50/90 to-stone-50 border border-amber-200/90 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${settings?.showStoryMediaGallery !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                {settings?.showStoryMediaGallery !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Show/Hide "Media & Photo Gallery" on Our Story Page</h4>
                <p className="text-[11px] text-stone-500">
                  {settings?.showStoryMediaGallery !== false
                    ? 'This section is currently VISIBLE to customers on /our-story page.'
                    : 'This section is currently HIDDEN from customers on /our-story page.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleShowMediaGallery}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto ${
                settings?.showStoryMediaGallery !== false
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
              }`}
            >
              {settings?.showStoryMediaGallery !== false ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Section Enabled (Click to Hide)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Section Hidden (Click to Show)</span>
                </>
              )}
            </button>
          </div>

          {/* IMAGE CATEGORIES SHOWCASE & QUICK FILTER CARDS */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#9B111E]" />
                  <span>Our Story Image Categories</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  Organize photographs displayed on the public Our Story page by section and theme.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal('gallery')}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-black border border-amber-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category Photo</span>
              </button>
            </div>

            {/* Category Cards / Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => setGalleryCategoryFilter('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  galleryCategoryFilter === 'all'
                    ? 'border-[#9B111E] bg-[#9B111E]/5 ring-2 ring-[#9B111E]'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">All</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#9B111E] text-white text-[10px] font-black">
                    {galleryItems.length}
                  </span>
                </div>
                <div className="text-xs font-black text-stone-900 mt-1">All Photos</div>
              </button>

              {PRESET_GALLERY_CATEGORIES.map(cat => {
                const count = galleryItems.filter(i => i.category === cat.id).length;
                const isSelected = galleryCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setGalleryCategoryFilter(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#9B111E] bg-[#9B111E]/5 ring-2 ring-[#9B111E]'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Category</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isSelected ? 'bg-[#9B111E] text-white' : 'bg-stone-200 text-stone-700'}`}>
                        {count}
                      </span>
                    </div>
                    <div className="text-xs font-black text-stone-900 mt-1 line-clamp-1">{cat.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gallerySearchQuery}
                onChange={e => setGallerySearchQuery(e.target.value)}
                placeholder="Search photos by title, caption, or location (e.g. Jalgaon, Orchards, Slicing)..."
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20"
              />
              {gallerySearchQuery && (
                <button onClick={() => setGallerySearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* GALLERY PHOTOS GRID (5 per row) */}
          {filteredGalleryItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-2xs space-y-3">
              <Camera className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="text-sm font-black text-stone-800">No photos found in this category</h4>
              <p className="text-xs text-stone-500">Upload a photo using the button below or clear your search filter.</p>
              <button
                type="button"
                onClick={() => handleOpenAddModal('gallery', galleryCategoryFilter !== 'all' ? galleryCategoryFilter : undefined)}
                className="px-4 py-2 bg-[#9B111E] text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Add Photo to Category</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredGalleryItems.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-2xs flex flex-col justify-between group hover:shadow-md transition-all">
                  <div>
                    <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imgUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

                      {/* Category Badge */}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-stone-950/85 backdrop-blur-xs text-amber-300 text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                        {item.categoryLabel || item.category}
                      </span>

                      {/* Action buttons */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGallery(item)}
                          className="p-1.5 bg-white/90 hover:bg-white text-stone-700 rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                          title="Edit Photo Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShowcaseMedia(item.id, 'gallery')}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-1">
                      <h4 className="text-sm font-black text-stone-900 leading-snug line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{item.caption}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 text-[11px] font-bold text-stone-400 flex items-center justify-between border-t border-stone-100 mt-2">
                    <span className="truncate">{item.location || 'Jalgaon'}</span>
                    <span className="shrink-0">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OUR STORY VIDEOS SHOWCASE                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'videos' && (
        <div className="space-y-6">
          {/* SECTION VISIBILITY CONTROL BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-50/90 to-stone-50 border border-amber-200/90 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${settings?.showStoryVideoSection !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                {settings?.showStoryVideoSection !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Show/Hide "Watch Our Story" Videos on Our Story Page</h4>
                <p className="text-[11px] text-stone-500">
                  {settings?.showStoryVideoSection !== false
                    ? 'This video documentary section is currently VISIBLE to customers on /our-story page.'
                    : 'This video documentary section is currently HIDDEN from customers on /our-story page.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleShowVideoSection}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto ${
                settings?.showStoryVideoSection !== false
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
              }`}
            >
              {settings?.showStoryVideoSection !== false ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Section Enabled (Click to Hide)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Section Hidden (Click to Show)</span>
                </>
              )}
            </button>
          </div>

          {/* VIDEO CATEGORIES & FILTERS */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#D9531E]" />
                  <span>Our Story Video Showcase</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  Add video documentaries, founder stories, factory operations, and YouTube embeds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal('video')}
                className="px-3.5 py-1.5 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Add Video</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVideoCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  videoCategoryFilter === 'all'
                    ? 'bg-[#9B111E] text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Videos ({videoItems.length})
              </button>
              {PRESET_VIDEO_CATEGORIES.map(cat => {
                const count = videoItems.filter(v => v.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVideoCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      videoCategoryFilter === cat
                        ? 'bg-[#9B111E] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Video Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={videoSearchQuery}
                onChange={e => setVideoSearchQuery(e.target.value)}
                placeholder="Search videos by title, speaker, or description..."
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]/20"
              />
            </div>
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideoItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-2xs flex flex-col justify-between group hover:shadow-md transition-all">
                <div>
                  <div className="relative h-48 w-full bg-stone-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-85 transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-stone-950/30 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#9B111E] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditVideo(item)}
                        className="p-2 bg-white/90 hover:bg-white text-stone-800 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                        title="Edit Video"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShowcaseMedia(item.id, 'video')}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-stone-950/85 backdrop-blur-xs text-white text-[10px] font-black rounded-md">
                      {item.duration}
                    </span>
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-[#9B111E] text-white text-[10px] font-black rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h4 className="text-sm font-black text-stone-900 leading-snug">{item.title}</h4>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 text-[11px] font-bold text-stone-500 flex items-center justify-between border-t border-stone-100 mt-2">
                  <span className="text-[#9B111E] font-extrabold">{item.speaker || 'Founders'}</span>
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-stone-800 flex items-center gap-1"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CLOUDINARY MEDIA EXPLORER GRID AND PANEL                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'cloudinary' && (
        <div className="space-y-6">
          {/* Upload Center & Cloud Sync Bar */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-stone-500 uppercase tracking-wider">Cloudinary Upload Center</h3>
                <p className="text-xs text-stone-400 mt-0.5">Live direct fetch active &bull; No cache</p>
              </div>
              <button
                type="button"
                disabled={isAssetsLoading || isSyncing}
                onClick={() => fetchCloudinaryAssets(true, true)}
                className="px-3.5 py-2 text-xs font-black uppercase text-[#9B111E] bg-[#fdf2f2] hover:bg-[#fbdada] rounded-xl transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer shadow-2xs active:scale-98"
                title="Pull full catalog and sync directly from your Cloudinary cloud storage"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isAssetsLoading ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Cloud...' : `Sync Cloud Assets (${cloudinaryAssets.length})`}</span>
              </button>
            </div>

            {/* Directly Upload to Media Library */}
            <CloudinaryUpload
              label="DROP / SELECT MULTIPLE IMAGES OR VIDEOS TO ADD DIRECTLY TO CLOUDINARY ASSETS LIBRARY"
              folder="cloudinary_assets"
              multiple={true}
              onMultiUploadSuccess={async (urls) => {
                showToast(`${urls.length} media file(s) uploaded successfully into Cloudinary Assets!`);
                await fetchCloudinaryAssets();
                if ((assignProductId || assignCategoryId) && urls.length > 0) {
                  for (const u of urls) {
                    await handleAssignAsset(u);
                  }
                }
              }}
              onUploadSuccess={async () => {
                await fetchCloudinaryAssets();
              }}
            />
          </div>

          {/* Selected Asset Quick Action Drawer / Bar */}
          {selectedAsset && (
            <div className="sticky top-14 md:top-[57px] z-30 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-5 border-2 border-amber-500 shadow-xl space-y-3.5 ring-4 ring-amber-500/10 transition-all duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 bg-white border border-stone-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded tracking-wider shadow-2xs">Selected</span>
                      <p className="text-xs font-bold text-stone-900 truncate" title={selectedAsset.name}>{selectedAsset.name}</p>
                    </div>
                    <p className="text-[10px] text-stone-500 font-medium mt-0.5 uppercase tracking-wider">
                      {selectedAsset.format} &bull; {formatBytes(selectedAsset.bytes)} &bull; {selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : ''}
                    </p>
                    <a
                      href={selectedAsset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#9B111E] font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      <span>Open direct URL</span>
                    </a>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Action 1: Add Directly to Our Story Gallery */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickStoryTitle(selectedAsset.name.replace(/[_-]/g, ' '));
                      setIsQuickStoryAddOpen(true);
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span>Add to Story Gallery</span>
                  </button>

                  {/* Action 2: Link Product */}
                  <div className="flex items-center gap-2">
                    <div className="w-44 sm:w-52">
                      <SearchableSelect
                        options={productSelectOptions}
                        value={assignProductId}
                        onChange={(val) => {
                          setAssignProductId(val);
                          if (val) setAssignCategoryId('');
                        }}
                        placeholder="Assign to Product..."
                        searchPlaceholder="Search product..."
                        type="product"
                        disabled={isAssigning}
                      />
                    </div>
                    {assignProductId && (
                      <button
                        type="button"
                        onClick={(e) => handleAssignAsset(selectedAsset.url, e)}
                        disabled={isAssigning}
                        className="px-3 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Set Image</span>
                      </button>
                    )}
                  </div>

                  {/* Action 3: Link Category */}
                  <div className="flex items-center gap-2">
                    <div className="w-40 sm:w-48">
                      <SearchableSelect
                        options={categorySelectOptions}
                        value={assignCategoryId}
                        onChange={(val) => {
                          setAssignCategoryId(val);
                          if (val) setAssignProductId('');
                        }}
                        placeholder="Assign to Category..."
                        searchPlaceholder="Search category..."
                        type="category"
                        disabled={isAssigning}
                      />
                    </div>
                    {assignCategoryId && (
                      <button
                        type="button"
                        onClick={(e) => handleAssignAsset(selectedAsset.url, e)}
                        disabled={isAssigning}
                        className="px-3 py-2 bg-[#D9531E] hover:bg-[#bf4414] text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Set Banner</span>
                      </button>
                    )}
                  </div>

                  {/* Delete button & Close button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startDeleteAssets([selectedAsset]);
                    }}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors cursor-pointer"
                    title="Delete from Cloudinary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedAsset(null);
                      setAssignProductId('');
                      setAssignCategoryId('');
                      setIsQuickStoryAddOpen(false);
                    }}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors text-xs font-bold cursor-pointer"
                    title="Deselect and Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* QUICK ADD TO STORY GALLERY INLINE FORM */}
              {isQuickStoryAddOpen && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Publish Photo to Our Story & Photo Gallery</span>
                    </h4>
                    <button onClick={() => setIsQuickStoryAddOpen(false)} className="text-stone-400 hover:text-stone-700 text-xs font-bold">
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                    <div>
                      <label className="block mb-1 text-stone-700">Category Section</label>
                      <select
                        value={quickStoryCategory}
                        onChange={e => setQuickStoryCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-stone-900"
                      >
                        {PRESET_GALLERY_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-stone-700">Photo Title</label>
                      <input
                        type="text"
                        value={quickStoryTitle}
                        onChange={e => setQuickStoryTitle(e.target.value)}
                        placeholder="e.g. Inspecting Farmgate Harvest"
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-stone-700">Caption / Description</label>
                      <input
                        type="text"
                        value={quickStoryCaption}
                        onChange={e => setQuickStoryCaption(e.target.value)}
                        placeholder="Brief caption for story viewers..."
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-stone-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isQuickStorySubmitting}
                      onClick={handleQuickAddAssetToGallery}
                      className="px-4 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {isQuickStorySubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-amber-300" />}
                      <span>Publish to Our Story Page</span>
                    </button>
                  </div>
                </div>
              )}

              {/* REALTIME USAGE BANNER */}
              {(() => {
                const usage = getAssetUsage(selectedAsset.url);
                return (
                  <div className="w-full bg-white rounded-2xl p-3 border border-stone-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-black text-stone-800 uppercase tracking-wider">
                          Realtime Website Usage Detector
                        </span>
                      </div>
                    </div>

                    {usage.totalCount > 0 ? (
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ACTIVE ON WEBSITE ({usage.totalCount} LOCATIONS)</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                          {usage.products.map(p => (
                            <span key={p.id} className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                              <span className="text-emerald-700">📦 Product:</span>
                              <strong className="text-emerald-950 font-extrabold">{p.name}</strong>
                            </span>
                          ))}
                          {usage.categories.map(c => (
                            <span key={c.id} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                              <span className="text-amber-700">🏷️ Category:</span>
                              <strong className="text-amber-950 font-extrabold">{c.name}</strong>
                            </span>
                          ))}
                          {usage.gallery.map(g => (
                            <span key={g.id} className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                              <span className="text-blue-700">🖼️ Story Gallery:</span>
                              <strong className="text-blue-950 font-extrabold">{g.title}</strong>
                            </span>
                          ))}
                          {usage.isSiteLogo && (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                              <span>👑 Header Logo</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-stone-500 text-xs pt-0.5">
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-md uppercase">
                          Unused Asset
                        </span>
                        <span className="text-stone-600 text-[11px] font-medium">This photo is currently not assigned to any product, category banner, story gallery, or header logo.</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Cloudinary Asset Grid (5 photos per row) */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedAssetIds.length > 0 && selectedAssetIds.length === cloudinaryAssets.length}
                    className="rounded accent-[#9B111E] cursor-pointer"
                  />
                  <span>{selectedAssetIds.length === cloudinaryAssets.length ? 'Deselect All' : 'Select All'}</span>
                </button>

                <span className="text-xs text-stone-500 font-semibold">
                  Showing <strong className="text-stone-900">{cloudinaryAssets.length}</strong> live Cloudinary photos (5 per row)
                </span>

                {selectedAssetIds.length > 0 && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-lg">
                    {selectedAssetIds.length} Selected
                  </span>
                )}
              </div>

              {selectedAssetIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => startDeleteAssets()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>Delete Selected ({selectedAssetIds.length})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {cloudinaryAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const isChecked = selectedAssetIds.includes(asset.id);
                const usage = getAssetUsage(asset.url);
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setAssignProductId('');
                      setAssignCategoryId('');
                      setIsQuickStoryAddOpen(false);
                    }}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${isChecked ? 'border-red-500 ring-2 ring-red-500/20 shadow-md bg-red-50/10' : isSelected ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-[1.01]' : 'border-stone-200/80 hover:border-stone-300 shadow-xs'}`}
                  >
                    <div className="relative aspect-square w-full bg-stone-50 border-b border-stone-100 flex items-center justify-center p-1">
                      {/* Top Left Checkbox for Multi-Selection */}
                      <div
                        onClick={(e) => toggleSelectAsset(asset.id, e)}
                        className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-white/90 backdrop-blur-xs border border-stone-200 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                        title={isChecked ? 'Uncheck asset' : 'Check asset for bulk deletion'}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded accent-red-600 cursor-pointer block"
                        />
                      </div>

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-contain rounded-xl" />

                      {/* Status Badge */}
                      {usage.totalCount > 0 ? (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-600/90 text-white text-[9px] font-black rounded-md shadow-xs backdrop-blur-xs flex items-center gap-0.5 z-10" title={`Used in ${usage.totalCount} location(s) on website`}>
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-200" />
                          <span>Used ({usage.totalCount})</span>
                        </span>
                      ) : isSelected && !isChecked ? (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-sm z-10">
                          <Check className="w-3.5 h-3.5 font-bold" />
                        </div>
                      ) : null}

                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-stone-900/60 backdrop-blur-xs text-[9px] text-white font-extrabold rounded-md uppercase">
                        {asset.format || 'img'}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-0.5">
                      <p className="text-xs font-bold text-stone-900 truncate leading-snug" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
                        <span>{formatBytes(asset.bytes)}</span>
                        <span>{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SAFE DELETION WARNING MODAL                                            */}
      {/* ========================================================================= */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-xl space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-stone-900">
                Delete {deleteConfirmation.assets.length > 1 ? `${deleteConfirmation.assets.length} Media Assets` : 'Media Asset'}
              </h3>
            </div>

            {deleteConfirmation.isChecking ? (
              <div className="py-6 text-center text-stone-500 font-bold text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#9B111E]" />
                <span>Checking references and linked products/categories for {deleteConfirmation.assets.length} item(s)...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold text-stone-600 leading-relaxed">
                  Are you sure you want to permanently delete {deleteConfirmation.assets.length > 1 ? (
                    <strong className="text-stone-950 font-extrabold">{deleteConfirmation.assets.length} selected assets</strong>
                  ) : (
                    <strong className="text-stone-950 font-extrabold">{deleteConfirmation.assets[0]?.name}</strong>
                  )}?
                </p>

                {deleteConfirmation.assets.length > 1 && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-2 overflow-x-auto max-h-24">
                    {deleteConfirmation.assets.map(a => (
                      <div key={a.id} className="relative w-12 h-12 bg-white rounded-xl border border-stone-200 shrink-0 overflow-hidden p-0.5" title={a.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt={a.name} className="w-full h-full object-contain rounded-lg" />
                      </div>
                    ))}
                  </div>
                )}

                {(deleteConfirmation.linkedProducts.length > 0 ||
                  deleteConfirmation.linkedCategories.length > 0 ||
                  deleteConfirmation.isSiteLogo) ? (
                  <div className="bg-amber-50 rounded-2xl border border-amber-200/80 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-900">⚠️ Link Warnings Detected</p>
                        <p className="text-[10px] text-amber-700 font-semibold mt-0.5 leading-normal">
                          One or more selected items are currently used as the active image for the following entities. Deleting them will leave these elements with broken media!
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-amber-900 space-y-1.5 border-t border-amber-200/40 pt-2.5 max-h-36 overflow-y-auto">
                      {deleteConfirmation.isSiteLogo && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span><strong>Website Branding Logo</strong></span>
                        </div>
                      )}
                      {deleteConfirmation.linkedProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span>Product: <strong>{p.name}</strong></span>
                        </div>
                      ))}
                      {deleteConfirmation.linkedCategories.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span>Category Banner: <strong>{c.name}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 leading-normal">
                    The selected media asset(s) are safe to delete and are not currently linked to any active products or category banners.
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeleteConfirmation({ isOpen: false, assets: [], isChecking: false, linkedProducts: [], linkedCategories: [], isSiteLogo: false })}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={executeDeleteAssets}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Deleting ({deleteConfirmation.assets.length})...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-amber-200" />
                        <span>Delete {deleteConfirmation.assets.length > 1 ? `${deleteConfirmation.assets.length} Items` : 'Item'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT SHOWCASE MEDIA MODAL                                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-stone-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  {editingItemId ? 'Edit' : 'Add New'} {activeSubTab === 'gallery' ? 'Story Gallery Photo' : 'Video Item'}
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  {activeSubTab === 'gallery'
                    ? 'Publish photo into Our Story section with proper category classification.'
                    : 'Add video showcase item with duration, speaker, and YouTube link.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOrEditMedia} className="space-y-4 text-xs font-bold text-stone-800">
              <div>
                <label className="block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={activeSubTab === 'gallery' ? galleryForm.title : videoForm.title}
                  onChange={(e) => activeSubTab === 'gallery'
                    ? setGalleryForm({ ...galleryForm, title: e.target.value })
                    : setVideoForm({ ...videoForm, title: e.target.value })
                  }
                  placeholder={activeSubTab === 'gallery' ? "e.g. Hand Sorting Bananas in Jalgaon Orchards" : "e.g. The Journey from Jalgaon Farms to Snack Bowl"}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              {activeSubTab === 'gallery' ? (
                <>
                  {/* Category Selection */}
                  <div>
                    <label className="block mb-1">Image Category (Our Story Section)</label>
                    <select
                      value={galleryForm.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        const preset = PRESET_GALLERY_CATEGORIES.find(c => c.id === val);
                        setGalleryForm({
                          ...galleryForm,
                          category: val,
                          categoryLabel: preset?.label || val
                        });
                      }}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                    >
                      {PRESET_GALLERY_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label} ({c.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Image Source Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-stone-700">Photo Image Asset</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('upload')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                            imageSourceMode === 'upload' ? 'bg-[#9B111E] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          Upload New File
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('picker')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                            imageSourceMode === 'picker' ? 'bg-[#9B111E] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          Pick from Cloudinary ({cloudinaryAssets.length})
                        </button>
                      </div>
                    </div>

                    {imageSourceMode === 'upload' ? (
                      <CloudinaryUpload
                        label="Gallery Image File (Cloudinary)"
                        folder="gallery"
                        currentValue={galleryForm.imgUrl}
                        onUploadSuccess={(url) => setGalleryForm({ ...galleryForm, imgUrl: url })}
                      />
                    ) : (
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                        <div className="text-[11px] text-stone-500 font-medium">
                          Click any Cloudinary asset to use as this gallery photo:
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                          {cloudinaryAssets.map(asset => (
                            <div
                              key={asset.id}
                              onClick={() => setGalleryForm({ ...galleryForm, imgUrl: asset.url })}
                              className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer p-0.5 ${
                                galleryForm.imgUrl === asset.url ? 'border-[#9B111E] ring-2 ring-[#9B111E]' : 'border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-contain bg-white rounded-lg" />
                              {galleryForm.imgUrl === asset.url && (
                                <div className="absolute top-1 right-1 bg-[#9B111E] text-white rounded-full p-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Date / Period</label>
                      <input
                        type="text"
                        value={galleryForm.date}
                        onChange={(e) => setGalleryForm({ ...galleryForm, date: e.target.value })}
                        placeholder="e.g. August 2024 / Daily Morning"
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Location</label>
                      <input
                        type="text"
                        value={galleryForm.location}
                        onChange={(e) => setGalleryForm({ ...galleryForm, location: e.target.value })}
                        placeholder="e.g. Jalgaon / Central Kitchen, Pune"
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Caption / Story Description</label>
                    <textarea
                      rows={3}
                      value={galleryForm.caption}
                      onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                      placeholder="Detailed caption explaining what is happening in the photograph..."
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900 leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block mb-1">YouTube URL / Embed Link</label>
                    <input
                      type="text"
                      required
                      value={videoForm.videoUrl}
                      onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... or embed URL"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Video Category</label>
                    <select
                      value={videoForm.category}
                      onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                    >
                      {PRESET_VIDEO_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-stone-700">Video Thumbnail Image (Cloudinary)</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('upload')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                            imageSourceMode === 'upload' ? 'bg-[#9B111E] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('picker')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                            imageSourceMode === 'picker' ? 'bg-[#9B111E] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          Pick from Cloudinary
                        </button>
                      </div>
                    </div>

                    {imageSourceMode === 'upload' ? (
                      <CloudinaryUpload
                        label="Video Thumbnail Image"
                        folder="video_thumbnails"
                        currentValue={videoForm.thumbnail}
                        onUploadSuccess={(url) => setVideoForm({ ...videoForm, thumbnail: url })}
                      />
                    ) : (
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                          {cloudinaryAssets.map(asset => (
                            <div
                              key={asset.id}
                              onClick={() => setVideoForm({ ...videoForm, thumbnail: asset.url })}
                              className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer p-0.5 ${
                                videoForm.thumbnail === asset.url ? 'border-[#9B111E] ring-2 ring-[#9B111E]' : 'border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-contain bg-white rounded-lg" />
                              {videoForm.thumbnail === asset.url && (
                                <div className="absolute top-1 right-1 bg-[#9B111E] text-white rounded-full p-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Duration</label>
                      <input
                        type="text"
                        value={videoForm.duration}
                        onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                        placeholder="03:45"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Speaker / Presenter</label>
                      <input
                        type="text"
                        value={videoForm.speaker}
                        onChange={(e) => setVideoForm({ ...videoForm, speaker: e.target.value })}
                        placeholder="Saurabh Patil & Jayesh Patil"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      placeholder="Brief overview of the video content..."
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900 leading-relaxed"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Save className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{editingItemId ? 'Update Item' : 'Save Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
