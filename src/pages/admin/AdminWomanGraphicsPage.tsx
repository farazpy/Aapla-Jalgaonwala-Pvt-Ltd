import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Plus,
  RefreshCw,
  ExternalLink,
  Code2,
  AlertCircle,
  FileText,
  Sparkles,
  Search,
  X,
  Layers,
  Edit3
} from 'lucide-react';

interface GraphicPost {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  publicId?: string;
  createdAt: string;
}

export function AdminWomanGraphicsPage() {
  const [posts, setPosts] = useState<GraphicPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Single/Multiple upload form state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchTitle, setBatchTitle] = useState('');
  const [batchCaption, setBatchCaption] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Caption Modal state
  const [editingPost, setEditingPost] = useState<GraphicPost | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  
  // API Response Modal
  const [apiResponseModal, setApiResponseModal] = useState<any | null>(null);
  const [loadingApiTest, setLoadingApiTest] = useState(false);

  // Delete Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchGraphics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/woman-graphics');
      const data = await res.json();
      if (data.success && Array.isArray(data.graphics)) {
        setPosts(data.graphics);
      } else {
        // Fallback fetch via public API
        const fallbackRes = await fetch('/api/woman', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_media' })
        });
        const fallbackData = await fallbackRes.json();
        const items = fallbackData.data || fallbackData.graphics || fallbackData.media || [];
        if (Array.isArray(items)) {
          setPosts(items);
        }
      }
    } catch (err) {
      console.error('Failed to fetch woman graphics:', err);
      showToast('Error loading graphics posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphics();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0 && !customImageUrl) {
      alert('Please select files to upload or enter a custom image URL.');
      return;
    }

    setUploading(true);
    try {
      const uploadedPostsPayload: Array<{ title: string; caption: string; imageUrl: string; publicId: string }> = [];

      // 1. Upload files to Cloudinary via /api/upload endpoint
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('folder', 'woman_graphics');
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || uploadData.message || 'Failed to upload files to Cloudinary');
        }

        let uploadedResults = uploadData.results || uploadData.data?.results || uploadData.data?.items || [];
        if ((!Array.isArray(uploadedResults) || uploadedResults.length === 0) && Array.isArray(uploadData.urls) && uploadData.urls.length > 0) {
          uploadedResults = uploadData.urls.map((u: string) => ({ url: u }));
        }

        if (Array.isArray(uploadedResults) && uploadedResults.length > 0) {
          uploadedResults.forEach((resItem: any, idx: number) => {
            const fileOriginalName = selectedFiles[idx]?.name
              ? selectedFiles[idx].name.replace(/\.[^/.]+$/, "")
              : `Graphic #${posts.length + idx + 1}`;

            const singleTitle = batchTitle.trim()
              ? (uploadedResults.length > 1 ? `${batchTitle.trim()} #${idx + 1}` : batchTitle.trim())
              : fileOriginalName;

            uploadedPostsPayload.push({
              title: singleTitle,
              caption: batchCaption.trim(),
              imageUrl: resItem.url || resItem.imageUrl,
              publicId: resItem.publicId || resItem.filename || ''
            });
          });
        } else if (uploadData.url) {
          uploadedPostsPayload.push({
            title: batchTitle.trim() || `Woman Graphic #${posts.length + 1}`,
            caption: batchCaption.trim(),
            imageUrl: uploadData.url,
            publicId: uploadData.publicId || ''
          });
        }
      }

      // 2. Add custom URL if specified
      if (customImageUrl) {
        uploadedPostsPayload.push({
          title: batchTitle.trim() || `Woman Graphic #${posts.length + uploadedPostsPayload.length + 1}`,
          caption: batchCaption.trim(),
          imageUrl: customImageUrl.trim(),
          publicId: ''
        });
      }

      // 3. Save posts via admin API
      const saveRes = await fetch('/api/admin/woman-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: uploadedPostsPayload })
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Failed to save graphics posts');
      }

      showToast(`Successfully uploaded & saved ${uploadedPostsPayload.length} graphic post(s)!`);
      
      // Reset form
      setSelectedFiles([]);
      setBatchTitle('');
      setBatchCaption('');
      setCustomImageUrl('');
      
      // Refresh list
      fetchGraphics();
    } catch (err: any) {
      console.error('Upload Error:', err);
      showToast(err.message || 'Error uploading graphics to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch('/api/admin/woman-graphics/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Graphic post deleted successfully');
        setPosts(prev => prev.filter(p => p.id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete post');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete post');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleOpenEditModal = (post: GraphicPost) => {
    setEditingPost(post);
    setEditTitle(post.title || '');
    setEditCaption(post.caption || '');
  };

  const handleSaveCaption = async () => {
    if (!editingPost) return;
    setSavingCaption(true);
    try {
      const res = await fetch('/api/admin/woman-graphics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPost.id,
          title: editTitle.trim(),
          caption: editCaption.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update caption');
      }

      showToast('Caption updated successfully!');
      setPosts(prev =>
        prev.map(p => (p.id === editingPost.id ? { ...p, title: editTitle.trim(), caption: editCaption.trim() } : p))
      );
      setEditingPost(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update caption');
    } finally {
      setSavingCaption(false);
    }
  };

  const handleTestApiMedia = async () => {
    setLoadingApiTest(true);
    try {
      const res = await fetch('/api/woman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_media' })
      });
      const data = await res.json();
      setApiResponseModal(data);
    } catch (err: any) {
      setApiResponseModal({ error: err.message || 'API request failed' });
    } finally {
      setLoadingApiTest(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      pageTitle="Woman Graphics"
      breadcrumbs={[
        { label: 'Partners', href: '/admin/partners' },
        { label: 'Woman Graphics' }
      ]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-stone-800 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header & KPI Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9B111E]" />
              <h1 className="text-xl font-black text-stone-900">Woman Partner Graphics & Media</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1 font-medium max-w-2xl">
              Upload promotional banners, Instagram posts, and marketing graphics for Woman Business Partners.
              Media files are stored on Cloudinary and accessible via <code className="bg-stone-100 text-[#9B111E] px-1.5 py-0.5 rounded text-[11px] font-mono">/api/woman</code> with <code className="bg-stone-100 text-[#9B111E] px-1.5 py-0.5 rounded text-[11px] font-mono">"action": "get_media"</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTestApiMedia}
              disabled={loadingApiTest}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {loadingApiTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5 text-[#9B111E]" />}
              <span>Test API (get_media)</span>
            </button>

            <button
              type="button"
              onClick={fetchGraphics}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              title="Refresh Graphics List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Upload className="w-4 h-4 text-[#9B111E]" />
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-wide">Upload Multiple Graphics Posts (S3 Storage)</h2>
          </div>

          <form onSubmit={handleUploadAndSave} className="space-y-4">
            {/* File Drag & Drop / Selector */}
            <div className="border-2 border-dashed border-stone-300 hover:border-[#9B111E] rounded-2xl p-6 text-center transition-colors bg-stone-50/50 hover:bg-stone-50 relative group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#9B111E] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-stone-800">
                    Click to browse or drag & drop multiple image files here
                  </p>
                  <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                    PNG, JPG, WEBP formats supported • Uploaded securely via S3 Storage Engine
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Files Preview List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    {selectedFiles.length} file(s) selected for upload:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative group bg-white rounded-lg p-2 border border-stone-200 text-center">
                      <div className="w-full h-16 bg-stone-100 rounded overflow-hidden mb-1 flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-stone-700 truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stone-900/80 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  Post Title (Optional)
                </label>
                <input
                  type="text"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="e.g. Diwali Offer Banner #1"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  Custom Image URL (Optional - if already uploaded)
                </label>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  Post Caption / Description
                </label>
                <textarea
                  rows={2}
                  value={batchCaption}
                  onChange={(e) => setBatchCaption(e.target.value)}
                  placeholder="Enter the marketing caption or message that woman partners will use when sharing this graphic..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading || (selectedFiles.length === 0 && !customImageUrl)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                  uploading || (selectedFiles.length === 0 && !customImageUrl)
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-[#9B111E] hover:bg-[#800A14] text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading to Cloudinary & Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Save Graphics Posts</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Graphics Posts List & Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#9B111E]" />
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide">
                All Woman Graphics ({posts.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, caption or ID..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium focus:ring-1 focus:ring-[#9B111E] outline-none"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200/90 space-y-2">
              <div className="w-8 h-8 border-3 border-[#9B111E] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-stone-600">Loading graphics posts...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPosts.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200/90 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">No Real Graphics Present in MySQL</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery ? 'No posts matched your search criteria.' : 'Upload graphic image files above to save real images into MySQL database.'}
              </p>
            </div>
          )}

          {/* Graphics Cards Grid */}
          {!loading && filteredPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden flex flex-col justify-between group hover:border-stone-300 transition-all"
                >
                  <div className="space-y-3 p-4">
                    {/* Image Container */}
                    <div
                      onClick={() => handleOpenEditModal(post)}
                      className="relative w-full h-48 bg-stone-100 rounded-xl overflow-hidden border border-stone-100 cursor-pointer group/img"
                      title="Click to add or edit caption"
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white/95 text-stone-900 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <Edit3 className="w-3.5 h-3.5 text-[#9B111E]" />
                          {post.caption ? 'Edit Caption' : '+ Add Caption'}
                        </span>
                      </div>
                      <a
                        href={post.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-stone-900"
                        title="Open full size image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Content Details */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-black text-stone-900 truncate">{post.title}</h4>
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {post.caption ? (
                        <div
                          onClick={() => handleOpenEditModal(post)}
                          className="group/cap text-[11px] text-stone-700 leading-relaxed font-medium line-clamp-3 bg-stone-50 hover:bg-amber-50/50 p-2.5 rounded-xl border border-stone-100 hover:border-amber-200 cursor-pointer transition-colors relative"
                          title="Click to edit caption"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span>{post.caption}</span>
                            <Edit3 className="w-3 h-3 text-stone-400 group-hover/cap:text-[#9B111E] shrink-0 mt-0.5" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(post)}
                          className="w-full py-2 px-3 rounded-xl border border-dashed border-stone-200 hover:border-[#9B111E] bg-stone-50 hover:bg-stone-100/80 text-stone-500 hover:text-[#9B111E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Caption</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(post)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-amber-700" />
                      <span>{post.caption ? 'Edit Caption' : 'Add Caption'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(post.imageUrl, 'Image URL')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-stone-900 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>Copy URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(post.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Test Result Modal */}
      {apiResponseModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#9B111E]" />
                <h3 className="text-sm font-black text-stone-900">
                  /api/woman ("action": "get_media") Response
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApiResponseModal(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 font-medium">
              This is the exact JSON response returned when calling <code className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#9B111E]">POST /api/woman</code> with <code className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#9B111E]">{"{ \"action\": \"get_media\" }"}</code>:
            </p>

            <div className="flex-1 overflow-auto bg-stone-900 text-stone-100 p-4 rounded-2xl font-mono text-xs leading-relaxed border border-stone-800">
              <pre>{JSON.stringify(apiResponseModal, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(apiResponseModal, null, 2), 'JSON Response')}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setApiResponseModal(null)}
                className="px-4 py-2 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Caption Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#9B111E]" />
                <h3 className="text-sm font-black text-stone-900">
                  Add / Edit Graphic Caption
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200">
                <img
                  src={editingPost.imageUrl}
                  alt={editingPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-stone-800 truncate">{editingPost.title}</p>
                <p className="text-[10px] text-stone-400 font-mono">ID: {editingPost.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Post Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Diwali Special Offer Banner"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Post Caption / Share Message
                </label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Write the promotional caption here..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#9B111E] outline-none"
                />
                <p className="text-[11px] text-stone-400 mt-1 font-medium">
                  This caption will be visible to Woman Business Partners when they share this graphic.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingCaption}
                onClick={handleSaveCaption}
                className="px-5 py-2 rounded-xl bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {savingCaption ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Caption</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">Delete Graphic Post?</h3>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Are you sure you want to delete this graphic post? It will no longer appear in the Woman Partners API response.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deleteTargetId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminWomanGraphicsPage;
