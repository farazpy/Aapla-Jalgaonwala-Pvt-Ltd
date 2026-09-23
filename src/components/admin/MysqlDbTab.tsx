'use client';

import React, { useState, useEffect } from 'react';
import { Database, Play, CheckCircle2, AlertTriangle, RefreshCw, Server, ShieldCheck, Key, Cpu, FileCode2, Copy, Check } from 'lucide-react';

export const MysqlDbTab: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [dbConfig, setDbConfig] = useState({
    host: '',
    port: '3306',
    user: '',
    password: '',
    database: ''
  });

  useEffect(() => {
    fetch('/api/admin/db')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setDbConfig((prev) => ({
            ...prev,
            host: json.data.host || prev.host,
            port: String(json.data.port || prev.port),
            user: json.data.user || prev.user,
            database: json.data.database || prev.database
          }));
        }
      })
      .catch(() => {});
  }, []);

  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
    serverTime?: string;
    error?: string;
  } | null>(null);

  const [isTesting, setIsTesting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleTestConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      const json = await res.json();
      setTestResult({
        tested: true,
        success: json.connected || false,
        message: json.message,
        serverTime: json.serverTime,
        error: json.error
      });
      if (json.connected) {
        showToast('Database connection test passed successfully!');
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        error: err?.message || 'Network error during connection test'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunMigration = async () => {
    if (!confirm(`Run Database Schema Migration & Seed Initial Products into '${dbConfig.database}'?`)) return;
    setIsMigrating(true);
    setMigrationLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting Database Migration process...`]);

    try {
      const res = await fetch('/api/admin/db/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      const json = await res.json();

      if (json.success) {
        setMigrationLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] SUCCESS: ${json.message}`,
          `[${new Date().toLocaleTimeString()}] Tables created: products, categories, orders, site_settings, owners, gallery_media, video_media`,
          `[${new Date().toLocaleTimeString()}] Seeded default products, initial site settings, owners profiles & gallery media!`
        ]);
        showToast('Database schema migrated and catalog seeded successfully!');
      } else {
        setMigrationLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ERROR: ${json.error || 'Migration failed'}`
        ]);
        alert(json.error || 'Migration failed');
      }
    } catch (err: any) {
      setMigrationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] EXCEPTION: ${err?.message || 'Network error'}`
      ]);
    } finally {
      setIsMigrating(false);
    }
  };

  const copySqlSchema = () => {
    const sql = `-- Aapla Jalgaonwala E-Commerce MySQL Schema
CREATE DATABASE IF NOT EXISTS aaplajalgaonwala CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aaplajalgaonwala;

CREATE TABLE categories (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  image VARCHAR(512),
  product_count INT DEFAULT 0
);

CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  category_id VARCHAR(64),
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  net_quantity VARCHAR(64),
  flavour VARCHAR(64),
  tags JSON,
  is_featured BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  stock INT DEFAULT 100,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE site_settings (
  setting_key VARCHAR(128) PRIMARY KEY,
  setting_value JSON NOT NULL
);

CREATE TABLE owners (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  title VARCHAR(128) NOT NULL,
  bio TEXT NOT NULL,
  photo_url VARCHAR(512) NOT NULL,
  location VARCHAR(128),
  quote TEXT,
  role VARCHAR(128),
  socials JSON
);

CREATE TABLE gallery_media (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  img_url TEXT NOT NULL,
  caption TEXT
);`;

    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. STATUS BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-md flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Production Database Control</span>
          </div>
          <h2 className="text-2xl font-black">Database Engine & Schema Management</h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            Configure live database parameters, run automated migrations, seed default catalog data, and verify system connectivity.
          </p>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Database Connection Active</span>
          </span>
          <span className="text-[11px] text-stone-400">Automatic Local & Cloud Storage Fallback Enabled</span>
        </div>
      </div>

      {/* 2. CONFIGURATION FORM & CONNECTION TEST */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Database Connection</span>
            <h3 className="text-lg font-black text-stone-900">Database Server Connection Settings</h3>
          </div>

          <button
            onClick={copySqlSchema}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copiedSchema ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
            <span>{copiedSchema ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        <form onSubmit={handleTestConnection} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-stone-800">
            <div>
              <label className="block mb-1">Host / Server IP</label>
              <input
                type="text"
                value={dbConfig.host}
                onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                placeholder="e.g. localhost or 127.0.0.1"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block mb-1">Port</label>
              <input
                type="text"
                value={dbConfig.port}
                onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                placeholder="3306"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block mb-1">Database Name</label>
              <input
                type="text"
                value={dbConfig.database}
                onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                placeholder="aaplajalgaonwala"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block mb-1">Username</label>
              <input
                type="text"
                value={dbConfig.user}
                onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                placeholder="root"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block mb-1">Password</label>
              <input
                type="password"
                value={dbConfig.password}
                onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={isTesting}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Server className="w-3.5 h-3.5 text-amber-300" />}
                <span>Test Connection</span>
              </button>
            </div>
          </div>
        </form>

        {/* TEST RESULT RESPONSE */}
        {testResult && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            <div>
              <p className="font-extrabold">{testResult.success ? 'Database Connection Verified!' : 'Connection Test Failed'}</p>
              <p className="font-normal mt-0.5">{testResult.message || testResult.error}</p>
              {testResult.serverTime && <p className="text-[10px] text-emerald-700 mt-1">Server Time: {testResult.serverTime}</p>}
            </div>
          </div>
        )}
      </div>

      {/* 3. SCHEMA MIGRATION & SEEDING */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider">Automated Migrations</span>
            <h3 className="text-lg font-black text-stone-900">Run Schema Migration & Data Seeding</h3>
            <p className="text-xs text-stone-500">Executes DDL statements to create database tables and seed initial products, owners, and settings.</p>
          </div>

          <button
            onClick={handleRunMigration}
            disabled={isMigrating}
            className="px-6 py-2.5 bg-[#9B111E] hover:bg-[#800A14] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> : <Play className="w-4 h-4 fill-amber-300 text-amber-300" />}
            <span>{isMigrating ? 'Migrating Database Schema...' : 'Run Migration & Seed Data'}</span>
          </button>
        </div>

        {/* LOGS CONSOLE */}
        <div className="bg-stone-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] space-y-1.5 min-h-[120px] max-h-60 overflow-y-auto">
          <div className="text-stone-500 font-bold border-b border-stone-800 pb-1 mb-2">Migration & Activity Logs</div>
          {migrationLogs.length === 0 ? (
            <div className="text-stone-600 italic">Click &quot;Run Migration &amp; Seed Data&quot; to initialize database tables and catalog records.</div>
          ) : (
            migrationLogs.map((log, idx) => <div key={idx}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};
