'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Check, 
  Copy, 
  RefreshCw, 
  FileCode, 
  Smartphone, 
  Laptop, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Code2,
  Layers,
  Edit3
} from 'lucide-react';

export interface FaviconItemData {
  key: string;
  filename: string;
  path: string;
  exists: boolean;
  size: number;
  updatedAt: string | null;
  dimensions?: string;
  type: string;
  tagSnippet: string;
  manifestContent?: any;
}

export interface FaviconSuiteData {
  favicon96: FaviconItemData;
  faviconSvg: FaviconItemData;
  faviconIco: FaviconItemData;
  appleTouchIcon: FaviconItemData;
  siteWebmanifest: FaviconItemData & { manifestContent?: any };
  mobileWebAppTitle: string;
  htmlSnippet: string;
  allFilesExist: boolean;
  lastModifiedOverall: string | null;
}

interface Props {
  showToast: (msg: string) => void;
  mobileWebAppTitle?: string;
  onMobileTitleChange?: (newTitle: string) => void;
}

export const FaviconSuiteManager: React.FC<Props> = ({ 
  showToast, 
  mobileWebAppTitle = 'AJW',
  onMobileTitleChange 
}) => {
  const [suiteData, setSuiteData] = useState<FaviconSuiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [mobileTitle, setMobileTitle] = useState(mobileWebAppTitle || 'AJW');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [showManifestEditor, setShowManifestEditor] = useState(false);
  const [manifestJsonText, setManifestJsonText] = useState('');

  const masterFileRef = useRef<HTMLInputElement>(null);
  const singleFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/favicons/status');
      const json = await res.json();
      if (json.success && json.data) {
        setSuiteData(json.data);
        if (json.data.mobileWebAppTitle) {
          setMobileTitle(json.data.mobileWebAppTitle);
        }
        if (json.data.siteWebmanifest?.manifestContent) {
          setManifestJsonText(JSON.stringify(json.data.siteWebmanifest.manifestContent, null, 2));
        }
        setCacheBuster(Date.now());
      }
    } catch (err) {
      console.error('Failed to fetch favicon suite status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySnippet = () => {
    const snippet = suiteData?.htmlSnippet || `<link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
<link rel="shortcut icon" href="/favicons/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="${mobileTitle || 'AJW'}" />
<link rel="manifest" href="/favicons/site.webmanifest" />`;

    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    showToast('Favicon HTML tags copied to clipboard!');
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const handleGenerateAllFromMaster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGeneratingAll(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mobileWebAppTitle', mobileTitle);

      const res = await fetch('/api/admin/favicons/generate-all', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        showToast('All 5 favicon sizes & manifest generated successfully!');
        if (json.data?.suiteStatus) {
          setSuiteData(json.data.suiteStatus);
        } else {
          fetchStatus();
        }
        setCacheBuster(Date.now());
      } else {
        alert(json.error || 'Failed to generate favicon suite');
      }
    } catch (err: any) {
      console.error('Batch favicon generation error:', err);
      alert(err.message || 'Error generating favicon suite');
    } finally {
      setIsGeneratingAll(false);
      if (masterFileRef.current) masterFileRef.current.value = '';
    }
  };

  const handleSingleFileUpload = async (targetFilename: string, file: File) => {
    setUploadingTarget(targetFilename);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFilename', targetFilename);

      const res = await fetch('/api/admin/favicons/upload', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Uploaded ${targetFilename} successfully!`);
        if (json.data?.suiteStatus) {
          setSuiteData(json.data.suiteStatus);
        } else {
          fetchStatus();
        }
        setCacheBuster(Date.now());
      } else {
        alert(json.error || `Failed to upload ${targetFilename}`);
      }
    } catch (err: any) {
      console.error(`Upload error for ${targetFilename}:`, err);
      alert(`Error uploading ${targetFilename}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSaveMobileTitle = async () => {
    setIsSavingTitle(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileWebAppTitle: mobileTitle })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Apple Mobile Web App title saved!');
        if (onMobileTitleChange) onMobileTitleChange(mobileTitle);
        fetchStatus();
      } else {
        alert(json.error || 'Failed to update title');
      }
    } catch (err: any) {
      console.error('Error saving mobile title:', err);
      alert('Error updating title');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleSaveManifestJson = async () => {
    try {
      const parsed = JSON.parse(manifestJsonText);
      const res = await fetch('/api/admin/favicons/manifest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestContent: parsed, mobileWebAppTitle: mobileTitle })
      });
      const json = await res.json();
      if (json.success) {
        showToast('site.webmanifest updated successfully!');
        setShowManifestEditor(false);
        fetchStatus();
      } else {
        alert(json.error || 'Failed to update manifest');
      }
    } catch (err: any) {
      alert('Invalid JSON syntax: ' + err.message);
    }
  };

  const faviconCards = [
    {
      key: 'favicon96',
      filename: 'favicon-96x96.png',
      label: 'PNG Favicon (96x96)',
      sub: 'Standard high-DPI desktop browser tab icon',
      accept: '.png,image/png',
      tag: '<link rel="icon" type="image/png" href="/favicons/favicon-96x96.png" sizes="96x96" />',
      data: suiteData?.favicon96
    },
    {
      key: 'faviconSvg',
      filename: 'favicon.svg',
      label: 'Vector SVG Favicon',
      sub: 'Scalable vector icon for modern browsers & dark/light themes',
      accept: '.svg,image/svg+xml',
      tag: '<link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />',
      data: suiteData?.faviconSvg
    },
    {
      key: 'faviconIco',
      filename: 'favicon.ico',
      label: 'Classic Shortcut Icon (.ico)',
      sub: 'Legacy browser, bookmarks bar, and shortcut fallback',
      accept: '.ico,.png',
      tag: '<link rel="shortcut icon" href="/favicons/favicon.ico" />',
      data: suiteData?.faviconIco
    },
    {
      key: 'appleTouchIcon',
      filename: 'apple-touch-icon.png',
      label: 'Apple Touch Icon (180x180)',
      sub: 'iOS Safari homescreen bookmark & iPad app icon',
      accept: '.png,image/png',
      tag: '<link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />',
      data: suiteData?.appleTouchIcon
    },
    {
      key: 'siteWebmanifest',
      filename: 'site.webmanifest',
      label: 'Web App Manifest (PWA)',
      sub: 'Defines mobile install banner, standalone display & icons',
      accept: '.webmanifest,.json,application/json',
      tag: '<link rel="manifest" href="/favicons/site.webmanifest" />',
      data: suiteData?.siteWebmanifest,
      isManifest: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Serving Status Banner */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-stone-50 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white">
                Core Brand Asset
              </span>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Live on All Ecommerce Pages
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              Favicon & Web App Icons Suite
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
              Upload each required icon individually or generate all standard resolutions in 1 click. All assets are served dynamically from <code className="px-1.5 py-0.5 bg-amber-100/70 text-amber-950 rounded text-xs font-mono">/favicons/</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#9B111E]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSnippet ? 'Copied HTML!' : 'Copy HTML Tags'}
            </button>
          </div>
        </div>

        {/* 2. 1-Click Master Generator Bar */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9B111E] to-[#D9531E] text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">1-Click Auto-Generator from Master Logo</h3>
              <p className="text-xs text-stone-500">Upload a single 512x512 PNG/SVG to automatically crop, optimize, and generate all 5 icon files.</p>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={masterFileRef}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleGenerateAllFromMaster}
              className="hidden"
              id="master-favicon-input"
            />
            <label
              htmlFor="master-favicon-input"
              className={`w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-[#9B111E] to-[#D9531E] hover:opacity-95 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                isGeneratingAll ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {isGeneratingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating All Sizes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate All From Master Logo
                </>
              )}
            </label>
          </div>
        </div>

        {/* 3. Apple Mobile Web App Title Configuration */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-stone-900">Apple Mobile Web App Title</p>
              <p className="text-[11px] text-stone-500">Tag: <code className="font-mono text-[10px] bg-stone-100 px-1 rounded">&lt;meta name="apple-mobile-web-app-title"&gt;</code></p>
            </div>
          </div>

          <div className="md:col-span-6">
            <input
              type="text"
              value={mobileTitle}
              onChange={(e) => setMobileTitle(e.target.value)}
              placeholder="e.g. AJW"
              maxLength={20}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#9B111E]"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleSaveMobileTitle}
              disabled={isSavingTitle}
              className="w-full px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingTitle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Title
            </button>
          </div>
        </div>
      </div>

      {/* 4. Individual Favicon Asset Upload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {faviconCards.map((item) => {
          const isUploading = uploadingTarget === item.filename;
          const isManifest = item.isManifest;
          const fileExists = item.data?.exists;
          
          const rawPath = item.data?.path || `/favicons/${item.filename}`;
          const previewUrl = rawPath.startsWith('http') ? rawPath : `${rawPath}?v=${cacheBuster}`;

          return (
            <div 
              key={item.key}
              className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-stone-900">{item.label}</h4>
                    {fileExists ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Not Uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">{item.sub}</p>
                </div>

                {/* Live File Preview Icon */}
                <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {isManifest ? (
                    <FileCode className="w-7 h-7 text-amber-600" />
                  ) : fileExists ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={previewUrl} 
                      alt={item.label} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Layers className="w-6 h-6 text-stone-300" />
                  )}
                </div>
              </div>

              {/* Tag snippet copy block */}
              <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70 font-mono text-[11px] text-stone-700 break-all select-all">
                {item.data?.tagSnippet || item.tag}
              </div>

              {/* Metadata & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-100 text-xs">
                <div className="text-stone-500 font-medium">
                  {item.data?.size ? (
                    <span className="truncate max-w-[240px] inline-block" title={item.data?.path || `/favicons/${item.filename}`}>
                      Path: {item.data?.path || `/favicons/${item.filename}`} ({(item.data.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <span className="truncate max-w-[240px] inline-block" title={item.data?.path || `/favicons/${item.filename}`}>
                      Path: {item.data?.path || `/favicons/${item.filename}`}
                    </span>
                  )}
                  {item.data?.updatedAt && (
                    <span className="ml-2 text-[10px] text-stone-400">
                      • {new Date(item.data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isManifest ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowManifestEditor(true)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit JSON
                      </button>
                      <input
                        type="file"
                        ref={(el) => { singleFileRefs.current[item.filename] = el; }}
                        accept={item.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSingleFileUpload(item.filename, file);
                        }}
                        className="hidden"
                        id={`upload-${item.filename}`}
                      />
                      <label
                        htmlFor={`upload-${item.filename}`}
                        className={`px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isUploading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload File
                      </label>
                    </>
                  ) : (
                    <>
                      {fileExists && (
                        <a
                          href={`/favicons/${item.filename}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      )}
                      <input
                        type="file"
                        ref={(el) => { singleFileRefs.current[item.filename] = el; }}
                        accept={item.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSingleFileUpload(item.filename, file);
                        }}
                        className="hidden"
                        id={`upload-${item.filename}`}
                      />
                      <label
                        htmlFor={`upload-${item.filename}`}
                        className={`px-3 py-1.5 bg-[#9B111E] hover:bg-[#800E19] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                          isUploading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {fileExists ? 'Replace Icon' : 'Upload Icon'}
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Live Simulation & Browser Preview */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#D9531E]" />
            Live Browser & Device Simulation Previews
          </h3>
          <p className="text-xs text-stone-500">Preview how your uploaded icons render in actual user browser tabs and iOS home screens.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Desktop Browser Tab Simulation */}
          <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Laptop className="w-4 h-4 text-stone-500" />
              Desktop Chrome / Edge Tab
            </div>
            
            <div className="bg-stone-200/60 rounded-xl p-2 flex items-center">
              <div className="bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xs max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`/favicons/favicon-96x96.png?v=${cacheBuster}`} 
                  alt="Tab Favicon" 
                  className="w-4 h-4 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[11px] font-semibold text-stone-800 truncate">
                  Aapla Jalgaonwala | Authentic Taste...
                </span>
                <span className="text-[10px] text-stone-400 ml-1">×</span>
              </div>
            </div>
          </div>

          {/* iOS Safari Home Screen Bookmark */}
          <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Smartphone className="w-4 h-4 text-purple-600" />
              iOS iPhone Home Screen Tile
            </div>

            <div className="flex flex-col items-center justify-center p-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-stone-300 shadow-md p-1 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`/favicons/apple-touch-icon.png?v=${cacheBuster}`} 
                  alt="Apple Touch Icon" 
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-stone-800 mt-1.5 tracking-tight">
                {mobileTitle || 'AJW'}
              </span>
            </div>
          </div>

          {/* Google Search Result Preview */}
          <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Globe className="w-4 h-4 text-blue-600" />
              Google Search Result Snippet
            </div>

            <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`/favicons/favicon-96x96.png?v=${cacheBuster}`} 
                    alt="Search Favicon" 
                    className="w-3.5 h-3.5 object-contain"
                  />
                </div>
                <div className="text-[11px] text-stone-600 truncate leading-tight">
                  aaplajalgaonwala.com
                </div>
              </div>
              <p className="text-xs font-bold text-blue-800 truncate">
                Aapla Jalgaonwala: Authentic Khandeshi Taste
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Modal: Edit site.webmanifest JSON */}
      {showManifestEditor && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#9B111E]" />
                <h3 className="text-base font-black text-stone-900">Edit site.webmanifest Content</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManifestEditor(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Customize the Web App Manifest configuration served at <code className="font-mono text-stone-800">/favicons/site.webmanifest</code>.
            </p>

            <textarea
              rows={12}
              value={manifestJsonText}
              onChange={(e) => setManifestJsonText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-stone-900 text-amber-200 rounded-xl border border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManifestEditor(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManifestJson}
                className="px-5 py-2 text-xs font-bold text-white bg-[#9B111E] hover:bg-[#800E19] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
