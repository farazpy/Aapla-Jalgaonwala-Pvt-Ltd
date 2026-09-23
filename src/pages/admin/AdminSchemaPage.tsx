'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MysqlDbTab } from '@/components/admin/MysqlDbTab';
import { Copy, Check, Layers, Code, Database, RefreshCw, Terminal } from 'lucide-react';

export default function AdminSchemaPage() {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rawSchemaSql = `-- ====================================================
-- AAPLA JALGAONWALA E-COMMERCE MYSQL FULL DATABASE SCHEMA
-- ====================================================

CREATE DATABASE IF NOT EXISTS aaplajalgaonwala CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aaplajalgaonwala;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  image VARCHAR(512),
  product_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
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
  seo_title VARCHAR(255),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 3. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  url VARCHAR(512) NOT NULL,
  alt VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  weight VARCHAR(64) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 100,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  description VARCHAR(255),
  type VARCHAR(32) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2) DEFAULT NULL,
  is_store_wide TINYINT(1) DEFAULT 1,
  applicable_categories TEXT,
  applicable_product_ids TEXT,
  usage_limit INT DEFAULT NULL,
  usage_count INT DEFAULT 0,
  starts_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64),
  customer_name VARCHAR(128) NOT NULL,
  customer_email VARCHAR(128) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  shipping_address_json JSON NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(64),
  status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  payment_status ENUM('Pending', 'Paid', 'Partial Paid', 'Failed', 'Refunded') DEFAULT 'Pending',
  payment_method VARCHAR(64) DEFAULT 'COD',
  cod_advance_fee_paid DECIMAL(10,2) DEFAULT 0,
  cod_remaining_balance DECIMAL(10,2) DEFAULT 0,
  payment_details_json JSON,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(128) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  variant_info VARCHAR(128),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 8. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(128) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawSchemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <AdminLayout
      pageTitle="Database Schema & Structure"
      breadcrumbs={[
        { label: 'Database & Systems', href: '/admin/database' },
        { label: 'Schema SQL' }
      ]}
      actions={
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-300" />}
          <span>{copied ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
        </button>
      }
    >
      <div className="space-y-8 max-w-6xl">
        {/* Header Banner */}
        <div className="p-6 bg-stone-900 text-white rounded-3xl border border-stone-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Database DDL & Schema Definitions</span>
            </div>
            <h2 className="text-xl font-black">Database Schema & Table Definitions</h2>
            <p className="text-xs text-stone-300">
              View, copy, or migrate the database SQL table structures for Aapla Jalgaonwala.
            </p>
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2.5 bg-amber-400 text-stone-950 font-black text-xs rounded-xl hover:bg-amber-300 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Full DDL Script'}</span>
          </button>
        </div>

        {/* SQL Viewer */}
        <div className="bg-stone-950 text-emerald-400 p-6 rounded-3xl border border-stone-800 shadow-inner font-mono text-xs overflow-x-auto relative space-y-4">
          <div className="flex items-center justify-between text-stone-400 pb-3 border-b border-stone-800">
            <span className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-amber-400" />
              schema.sql DDL Script
            </span>
            <span className="text-[10px] bg-stone-900 px-2.5 py-1 rounded-full text-stone-400">MySQL 8.0+ Compatible</span>
          </div>
          <pre className="text-stone-200 leading-relaxed font-mono whitespace-pre-wrap select-all">
            {rawSchemaSql}
          </pre>
        </div>

        {/* Migration tab embedded */}
        <MysqlDbTab showToast={showToast} />
      </div>
    </AdminLayout>
  );
}
