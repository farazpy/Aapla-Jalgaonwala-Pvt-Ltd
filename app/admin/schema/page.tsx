'use client';

import React, { useState } from 'react';
import {
  Database,
  Copy,
  Layers,
  CheckCircle2,
  FileCode,
  Download,
  Terminal,
  ShieldCheck,
  Server,
  Check
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

const SCHEMA_SQL = `-- AAPLA JALGAONWALA RELATIONAL MYSQL DATABASE SCHEMA
-- Generated for High-Performance Next.js E-Commerce Engine

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(1024),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category_id VARCHAR(64),
  description TEXT,
  short_description VARCHAR(512),
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  discount_percentage INT DEFAULT 0,
  stock INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  flavour VARCHAR(128),
  net_quantity VARCHAR(64),
  ingredients TEXT,
  shelf_life VARCHAR(64),
  country_of_origin VARCHAR(64) DEFAULT 'India',
  fssai_license VARCHAR(64),
  tags JSON,
  seo_title VARCHAR(255),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id),
  INDEX idx_slug (slug),
  INDEX idx_available (is_available)
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  alt VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  customer_email VARCHAR(255),
  shipping_address TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(64) DEFAULT 'COD',
  payment_status VARCHAR(64) DEFAULT 'pending',
  status VARCHAR(64) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(1024),
  INDEX idx_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(64) PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  app_logo VARCHAR(1024),
  tagline VARCHAR(255),
  support_phone VARCHAR(64),
  support_email VARCHAR(255),
  store_address TEXT,
  instagram_url VARCHAR(1024),
  facebook_url VARCHAR(1024),
  youtube_url VARCHAR(1024),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS owners (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  photo_url VARCHAR(1024),
  bio TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255),
  url VARCHAR(1024) NOT NULL,
  type ENUM('image', 'video') DEFAULT 'image',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudinary_assets (
  id VARCHAR(64) PRIMARY KEY,
  url VARCHAR(1024) NOT NULL,
  public_id VARCHAR(255),
  name VARCHAR(255),
  bytes INT,
  format VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_public_id (public_id)
);

CREATE TABLE IF NOT EXISTS seo_metadata (
  id VARCHAR(64) PRIMARY KEY,
  page_key VARCHAR(64) NOT NULL UNIQUE,
  page_name VARCHAR(255) NOT NULL,
  seo_title VARCHAR(255) NOT NULL,
  seo_description TEXT NOT NULL,
  keywords JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

export default function AdminSchemaPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([SCHEMA_SQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aapla_jalgaonwala_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tables = [
    {
      name: 'products',
      desc: 'Catalogue index storing core items, prices, weight, ingredients, and taxonomy tags.',
      fields: ['id (PK, VARCHAR)', 'slug (UNIQUE, VARCHAR)', 'name, category_id', 'price, mrp, cost_price', 'stock, is_available', 'is_featured, is_best_seller']
    },
    {
      name: 'categories',
      desc: 'Product taxonomy collections allowing automated count calculations and banners.',
      fields: ['id (PK, VARCHAR)', 'slug (UNIQUE, VARCHAR)', 'name, description', 'image (Cloudinary banner)', 'display_order (INT)']
    },
    {
      name: 'product_images',
      desc: 'External thumbnail and gallery URLs connected with cascade delete triggers to product entries.',
      fields: ['id (PK, VARCHAR)', 'product_id (FK, CASCADE)', 'url, alt', 'is_primary (BOOLEAN)', 'display_order (INT)']
    },
    {
      name: 'orders & order_items',
      desc: 'Transaction log storing order status, customer details, addresses, and line-item snapshots.',
      fields: ['id (PK, VARCHAR)', 'order_number (UNIQUE)', 'customer_name, phone', 'total_amount, status', 'order_items (FK, CASCADE)']
    },
    {
      name: 'cloudinary_assets',
      desc: 'Cached index of Cloudinary cloud media enabling high-speed $O(1)$ catalog assignment.',
      fields: ['id (PK, VARCHAR)', 'url, public_id', 'name, format, bytes', 'created_at (TIMESTAMP)']
    },
    {
      name: 'seo_metadata',
      desc: 'Custom Google search snippet definitions and focus keywords for store routes.',
      fields: ['id (PK, VARCHAR)', 'page_key (UNIQUE)', 'seo_title, seo_description', 'keywords (JSON)']
    }
  ];

  return (
    <AdminLayout
      pageTitle="Schema SQL"
      breadcrumbs={[
        { label: 'Database & Systems', href: '/admin/database' },
        { label: 'Schema SQL' }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .SQL</span>
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'SQL Copied!' : 'Copy Script'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Overview */}
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e5] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <Database className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest">Relational Database Architecture</span>
          </div>
          <h2 className="text-base font-bold text-stone-900 tracking-tight">Database Schema Specification</h2>
          <p className="text-xs text-stone-500 max-w-3xl leading-relaxed">
            Standard MySQL table schemas equipped with foreign key cascade triggers, performance indexing, JSON attributes, and full compatibility with local JSON storage fallbacks.
          </p>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t) => (
            <div key={t.name} className="bg-white p-4 rounded-xl border border-[#e1e3e5] shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-[#9B111E]">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-xs text-stone-900">{t.name}</h4>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">{t.desc}</p>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-[10px] font-mono text-stone-700 space-y-1">
                {t.fields.map((f, i) => (
                  <div key={i}>• {f}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Full SQL Code Block */}
        <div className="bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-stone-200">MySQL Schema DDL Script</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
            </button>
          </div>

          <pre className="text-[11px] font-mono text-stone-300 overflow-x-auto p-2 bg-stone-950/60 rounded-xl leading-relaxed max-h-96">
            {SCHEMA_SQL}
          </pre>
        </div>
      </div>
    </AdminLayout>
  );
}
