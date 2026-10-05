'use client';

import React, { useState, useEffect } from 'react';
import { OwnerProfile } from '@/types';
import { Users, Plus, Edit2, Trash2, RefreshCw, Upload, Image as ImageIcon, Save, Quote, Building2, CheckCircle2 } from 'lucide-react';
import { S3Upload } from './CloudinaryUpload';

export const OwnersTab: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    photoUrl: '',
    location: '',
    quote: '',
    role: ''
  });

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/owners');
      const json = await res.json();
      if (json.success && json.data) {
        setOwners(json.data);
      }
    } catch (err) {
      console.error('Error fetching owners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/owners');
        const json = await res.json();
        if (active && json.success && json.data) {
          setOwners(json.data);
        }
      } catch (err) {
        console.error('Error fetching owners:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingOwner(null);
    setFormData({
      name: '',
      title: 'Co-Founder & Director',
      bio: '',
      photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
      location: 'Jalgaon & Pune',
      quote: '',
      role: 'Operations & Strategy'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (owner: OwnerProfile) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name,
      title: owner.title,
      bio: owner.bio,
      photoUrl: owner.photoUrl || '',
      location: owner.location || '',
      quote: owner.quote || '',
      role: owner.role || ''
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim() || !formData.bio.trim()) {
      alert('Name, Title, and Bio are required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const method = editingOwner ? 'PUT' : 'POST';
      const payload = editingOwner
        ? { id: editingOwner.id, ...formData }
        : formData;

      const res = await fetch('/api/owners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        showToast(editingOwner ? 'Owner profile updated live!' : 'New owner profile added!');
        setIsModalOpen(false);
        fetchOwners();
      } else {
        alert(json.error || 'Failed to save owner profile');
      }
    } catch (err) {
      console.error('Error saving owner:', err);
      alert('Error saving owner profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this owner profile?')) return;

    try {
      const res = await fetch(`/api/owners?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Owner profile deleted');
        fetchOwners();
      } else {
        alert('Failed to delete owner profile');
      }
    } catch (err) {
      console.error('Error deleting owner:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-stone-500 font-medium flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#9B111E]" />
        <span>Loading Owners Profiles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Leadership & Founders</span>
          <h2 className="text-xl font-black text-stone-900">Manage Owners & Founders Photos</h2>
          <p className="text-xs text-stone-500">Update co-founders profiles, photos, titles, and visions displayed on the Our Story page.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Add New Owner Profile</span>
        </button>
      </div>

      {/* Owners Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {owners.map((owner) => (
          <div key={owner.id} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4 relative flex flex-col justify-between">
            <div className="space-y-4">
              <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={owner.photoUrl} alt={owner.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-stone-950/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-white">
                  <button
                    onClick={() => handleOpenEditModal(owner)}
                    className="p-1 hover:text-amber-400 transition-colors"
                    title="Edit Owner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOwner(owner.id)}
                    className="p-1 hover:text-red-400 transition-colors"
                    title="Delete Owner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-stone-950/90 to-transparent p-3 rounded-xl text-white">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">{owner.title}</span>
                  <h3 className="text-lg font-black">{owner.name}</h3>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#9B111E]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{owner.role || 'Leadership'}</span>
                  {owner.location && <span className="text-stone-400">• {owner.location}</span>}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{owner.bio}</p>
              </div>

              {owner.quote && (
                <div className="p-3.5 rounded-2xl bg-[#FAF6ED] border border-amber-200/60 text-xs italic text-stone-700">
                  &ldquo;{owner.quote}&rdquo;
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
              <span>ID: {owner.id}</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live on Website
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FORM FOR ADD/EDIT OWNER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-black text-stone-900">
                {editingOwner ? 'Edit Owner Profile' : 'Add New Owner Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOwner} className="space-y-4 text-xs font-bold text-stone-800">
              <div>
                <label className="block mb-1">Owner / Founder Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Saurabh Patil"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block mb-1">Title / Designation</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Co-Founder & CEO"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div className="sm:col-span-2">
                <S3Upload
                  label="Owner Profile Photo (HTK S3 Storage)"
                  folder="owners"
                  currentValue={formData.photoUrl}
                  onUploadSuccess={(url) => setFormData({ ...formData, photoUrl: url })}
                />
              </div>

              <div>
                <label className="block mb-1">Focus Role / Department</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Farm Procurement & Supply Chain"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Jalgaon & Pune"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block mb-1">Bio Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block mb-1">Personal Quote / Vision Statement</label>
                <input
                  type="text"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="e.g. When you buy our chips, you support a farming family..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Save className="w-3.5 h-3.5 text-amber-300" />}
                  <span>Save Owner Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
