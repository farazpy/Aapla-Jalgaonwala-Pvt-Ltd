'use client';

import React, { useState, useRef } from 'react';
import { Upload, ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { applyCloudinaryOriginalFlag } from '@/lib/utils';

interface CloudinaryUploadProps {
  onUploadSuccess?: (url: string) => void;
  onSuccess?: (url: string) => void;
  onMultiUploadSuccess?: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  onError?: (error: string) => void;
  folder?: string;
  currentValue?: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onUploadSuccess,
  onSuccess,
  onMultiUploadSuccess,
  onUploadError,
  onError,
  folder = 'aapla_jalgaonwala',
  currentValue,
  label = 'Upload Image',
  accept = 'image/*,video/*',
  multiple = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f && f.size > 0);
    if (fileArray.length === 0) return;

    setError(null);
    setSuccess(false);
    setIsUploading(true);
    setUploadCount(fileArray.length);

    try {
      const formData = new FormData();
      formData.append('folder', folder);
      
      fileArray.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      const rawUrls: string[] =
        data.urls ||
        data.data?.urls ||
        (data.url ? [data.url] : (data.data?.url ? [data.data.url] : []));

      const uploadedUrls: string[] = rawUrls.map(u => applyCloudinaryOriginalFlag(u));

      if (data.success && uploadedUrls.length > 0) {
        setSuccess(true);
        setSuccessCount(uploadedUrls.length);

        if (onMultiUploadSuccess) {
          try {
            onMultiUploadSuccess(uploadedUrls);
          } catch (callbackErr) {
            console.error('[CloudinaryUpload] onMultiUploadSuccess error:', callbackErr);
          }
        }
        if (uploadedUrls.length > 0) {
          const firstUrl = uploadedUrls[0];
          try {
            if (typeof onUploadSuccess === 'function') {
              onUploadSuccess(firstUrl);
            }
            if (typeof onSuccess === 'function') {
              onSuccess(firstUrl);
            }
          } catch (callbackErr) {
            console.error('[CloudinaryUpload] onUploadSuccess error:', callbackErr);
          }
        }
      } else {
        const errorMsg =
          (typeof data.error === 'string' ? data.error : data.error?.message) ||
          (typeof data.message === 'string' && !data.success ? data.message : null) ||
          'Failed to upload files. Please verify your Cloudinary configurations.';
        setError(errorMsg);
        if (typeof onUploadError === 'function') onUploadError(errorMsg);
        if (typeof onError === 'function') onError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during upload.';
      setError(errorMsg);
      if (typeof onUploadError === 'function') onUploadError(errorMsg);
      if (typeof onError === 'function') onError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-2">
      {label && <span className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">{label}</span>}
      
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        id="cloudinary-dropzone"
        className={`
          border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all min-h-[110px] flex flex-col justify-center items-center gap-2
          ${isDragging 
            ? 'border-[#9B111E] bg-[#fdf2f2]' 
            : 'border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
          id="cloudinary-file-input"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-1.5 text-[#9B111E]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[11px] font-bold">
              Uploading {uploadCount > 1 ? `${uploadCount} files` : 'file'} to Cloudinary...
            </span>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-[11px] font-bold">
              {successCount > 1 ? `${successCount} Files Uploaded Successfully!` : 'Uploaded Successfully!'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-stone-500">
            <Upload className="w-6 h-6 text-stone-400" />
            <span className="text-[11px] font-bold text-stone-700">
              {multiple ? 'Drag & drop multiple files or click to browse' : 'Drag & drop here or click to browse'}
            </span>
            <span className="text-[9px] text-stone-400">Supports JPG, PNG, WEBP, MP4, GIF (Max 10MB per file)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2 text-[10px] leading-relaxed text-red-700 font-bold">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {currentValue && !isUploading && (
        <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
          {currentValue.match(/\.(mp4|webm|ogg)$/i) || currentValue.includes('/video/upload/') ? (
            <div className="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              VIDEO
            </div>
          ) : (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentValue} alt="Current Thumbnail" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-stone-500 truncate">{currentValue}</p>
            <button
              type="button"
              onClick={() => {
                if (typeof onUploadSuccess === 'function') onUploadSuccess('');
                if (typeof onSuccess === 'function') onSuccess('');
              }}
              className="text-[9px] text-[#9B111E] hover:underline font-bold mt-0.5"
            >
              Clear / Remove File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
