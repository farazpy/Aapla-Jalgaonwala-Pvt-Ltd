'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Database, 
  Sparkles, 
  ArrowRight, 
  Layers,
  ShieldCheck,
  Info
} from 'lucide-react';

interface S3DomainReplacerProps {
  showToast: (msg: string) => void;
  onSuccess?: () => void;
}

export const S3DomainReplacer: React.FC<S3DomainReplacerProps> = ({ showToast, onSuccess }) => {
  const [currentDomain, setCurrentDomain] = useState('https://s3.htknetwork.in');
  const [newDomain, setNewDomain] = useState('');
  const [updateUploadEndpoint, setUpdateUploadEndpoint] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    currentDomain: string;
    currentHost: string;
    totalMatches: number;
    tables: Array<{
      table: string;
      column: string;
      count: number;
      samples: string[];
    }>;
    jsonFiles: Array<{
      filename: string;
      count: number;
    }>;
  } | null>(null);

  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceResult, setReplaceResult] = useState<{
    success: boolean;
    message: string;
    currentDomain: string;
    newDomain: string;
    totalReplaced: number;
    tablesUpdated: Array<{
      table: string;
      column: string;
      rowsAffected: number;
    }>;
    samples: Array<{
      table: string;
      column: string;
      before: string;
      after: string;
    }>;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Run initial scan on mount
  const handleScan = async (domainToScan = currentDomain) => {
    setIsScanning(true);
    setErrorMessage(null);
    setReplaceResult(null);

    try {
      const res = await fetch('/api/admin/storage/s3-domain-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentDomain: domainToScan })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setScanResult(json.data);
      } else {
        setErrorMessage(json.error || 'Failed to scan S3 domain matches in database.');
      }
    } catch (err: any) {
      console.error('[S3DomainReplacer] Scan error:', err);
      setErrorMessage(err.message || 'Error communicating with S3 domain scan endpoint.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    handleScan();
  }, []);

  const handleExecuteReplace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newDomain || !newDomain.trim()) {
      setErrorMessage('Please enter the new S3 domain or custom CDN URL (e.g. https://cdn.aaplajalgaonwala.com or https://s3.customhost.in)');
      return;
    }

    const cleanOld = currentDomain.trim();
    const cleanNew = newDomain.trim();

    if (cleanOld.toLowerCase() === cleanNew.toLowerCase()) {
      setErrorMessage('Old S3 domain and new replacement domain are identical. Please enter a different replacement domain.');
      return;
    }

    if (!confirm(`Are you sure you want to replace "${cleanOld}" with "${cleanNew}" across all MySQL database tables and settings?\n\nThis will update all stored URLs, keeping /f/{file_id} paths identical.`)) {
      return;
    }

    setIsReplacing(true);
    setErrorMessage(null);
    setReplaceResult(null);

    try {
      const res = await fetch('/api/admin/storage/s3-domain-replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDomain: cleanOld,
          newDomain: cleanNew,
          updateUploadEndpoint
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setReplaceResult(json.data);
        showToast(json.data.message || `Successfully replaced domain to ${cleanNew}!`);
        setCurrentDomain(cleanNew);
        setNewDomain('');
        // Rescan with new domain
        await handleScan(cleanNew);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(json.error || 'Failed to execute S3 domain replacement.');
      }
    } catch (err: any) {
      console.error('[S3DomainReplacer] Replace error:', err);
      setErrorMessage(err.message || 'Error executing domain replacement in MySQL database.');
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-full mb-1.5">
            <Globe className="w-3.5 h-3.5 text-[#9B111E]" />
            <span>S3 Domain & Custom CDN URL Manager</span>
          </div>
          <h3 className="text-xl font-black text-stone-900">Replace HTK S3 Domain URL in MySQL</h3>
          <p className="text-xs text-stone-500 max-w-2xl mt-1">
            Replace <code className="bg-amber-50 px-1.5 py-0.5 rounded text-[#9B111E] font-mono font-bold">https://s3.htknetwork.in</code> with any custom CDN or new domain.
            All file paths like <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-800 font-mono">/f/&#123;file_id&#125;</code> will remain unchanged while updating all database records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleScan(currentDomain)}
          disabled={isScanning || isReplacing}
          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#9B111E]' : ''}`} />
          <span>{isScanning ? 'Scanning Database...' : 'Rescan Database'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black">Replacement Error</p>
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Replace Form */}
      <form onSubmit={handleExecuteReplace} className="space-y-5 bg-[#FAF6ED] p-5 sm:p-6 rounded-2xl border border-amber-200/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Old Domain Input */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
              Current / Old S3 Domain
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={currentDomain}
                onChange={(e) => setCurrentDomain(e.target.value)}
                placeholder="https://s3.htknetwork.in"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#9B111E] shadow-2xs"
                required
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Domain URL currently stored in MySQL records</p>
          </div>

          {/* New Domain Input */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
              New Replacement Domain / CDN URL
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-[#D9531E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. https://cdn.aaplajalgaonwala.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border-2 border-amber-500/80 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#9B111E] shadow-2xs"
                required
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Enter your new S3 or custom CDN base URL</p>
          </div>
        </div>

        {/* Checkbox option */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="updateUploadEndpoint"
            checked={updateUploadEndpoint}
            onChange={(e) => setUpdateUploadEndpoint(e.target.checked)}
            className="w-4 h-4 accent-[#9B111E] rounded cursor-pointer"
          />
          <label htmlFor="updateUploadEndpoint" className="text-xs font-bold text-stone-800 cursor-pointer">
            Also update S3 Upload API endpoint domain in TeleCloud configuration
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleScan(currentDomain)}
            disabled={isScanning || isReplacing}
            className="px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Scan Database ({scanResult ? `${scanResult.totalMatches} matches` : 'Scan'})</span>
          </button>

          <button
            type="submit"
            disabled={isReplacing || isScanning || !newDomain.trim()}
            className="px-6 py-2.5 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isReplacing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <Database className="w-4 h-4 text-amber-300" />
            )}
            <span>{isReplacing ? 'Replacing in MySQL...' : 'Replace Domain in MySQL Database'}</span>
          </button>
        </div>
      </form>

      {/* Replacement Success Banner */}
      {replaceResult && replaceResult.success && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{replaceResult.message}</span>
          </div>

          {replaceResult.tablesUpdated.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-emerald-800">Updated Database Tables Breakdown:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {replaceResult.tablesUpdated.map((tu, idx) => (
                  <div key={idx} className="bg-white/80 p-2 rounded-xl border border-emerald-200 text-[11px]">
                    <p className="font-bold text-stone-900">{tu.table}.{tu.column}</p>
                    <p className="text-emerald-700 font-extrabold">{tu.rowsAffected} row(s) replaced</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {replaceResult.samples.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-emerald-200/80">
              <p className="text-xs font-bold text-emerald-800">Sample URL Transformations:</p>
              <div className="space-y-1.5 font-mono text-[11px]">
                {replaceResult.samples.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center gap-1.5">
                    <span className="text-red-700 line-through truncate max-w-xs">{s.before}</span>
                    <ArrowRight className="w-3 h-3 text-stone-400 shrink-0 hidden sm:inline-block" />
                    <span className="text-emerald-800 font-bold truncate max-w-xs">{s.after}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Database Matches Preview Card */}
      {scanResult && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#9B111E]" />
              <span>Database Scan Summary ({scanResult.totalMatches} matches found for "{scanResult.currentHost}")</span>
            </h4>
            <span className="text-[11px] font-extrabold text-stone-500">
              {scanResult.tables.length} tables affected
            </span>
          </div>

          {scanResult.tables.length === 0 ? (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-500 font-medium">
              No records found matching domain <code className="font-bold text-stone-800">{scanResult.currentHost}</code> in MySQL database.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scanResult.tables.map((t, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-900">{t.table} &bull; {t.column}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full">
                      {t.count} match{t.count > 1 ? 'es' : ''}
                    </span>
                  </div>
                  {t.samples.length > 0 && (
                    <div className="bg-stone-50 p-2 rounded-xl text-[10px] font-mono text-stone-600 truncate">
                      {t.samples[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
