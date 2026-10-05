import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let poolFailed = false;

function getEnvValue(...aliases: string[]): string {
  // First check exact case
  for (const alias of aliases) {
    if (process.env[alias] !== undefined && process.env[alias] !== '') {
      return process.env[alias]!;
    }
  }
  // Then check case-insensitive match across all process.env keys
  const envKeys = Object.keys(process.env);
  for (const alias of aliases) {
    const target = alias.toLowerCase();
    for (const key of envKeys) {
      if (key.toLowerCase() === target && process.env[key] !== undefined && process.env[key] !== '') {
        return process.env[key]!;
      }
    }
  }
  return '';
}

export function getDbConfig() {
  let host = getEnvValue('DB_HOST', 'db_host', 'DATABASE_HOST', 'database_host');
  let port = getEnvValue('DB_PORT', 'db_port', 'DATABASE_PORT', 'database_port');
  let user = getEnvValue('DB_USER', 'db_user', 'DB_USERNAME', 'db_username', 'DATABASE_USER', 'database_user');
  let password = getEnvValue('DB_PASSWORD', 'db_password', 'DB_PASS', 'db_pass', 'DATABASE_PASSWORD', 'database_password');
  let database = getEnvValue('DB_NAME', 'db_name', 'DB_name', 'DB_DATABASE', 'db_database', 'DATABASE_NAME', 'database_name');

  const dbUrl = getEnvValue('DB_URL', 'db_url', 'DATABASE_URL', 'database_url');

  // Only parse connection URL for missing fields; explicit individual environment variables take top priority
  if (dbUrl) {
    try {
      const urlToParse = dbUrl.includes('://') ? dbUrl : `mysql://${dbUrl}`;
      const parsed = new URL(urlToParse);
      if (!host && parsed.hostname) host = parsed.hostname;
      if (!port && parsed.port) port = parsed.port;
      if (!user && parsed.username) user = decodeURIComponent(parsed.username);
      if (!password && parsed.password) password = decodeURIComponent(parsed.password);
      if (!database && parsed.pathname && parsed.pathname.length > 1) {
        database = parsed.pathname.substring(1);
      }
    } catch {
      if (!host && dbUrl.length > 0 && !dbUrl.includes(' ')) {
        host = dbUrl;
      }
    }
  }

  const finalPort = port ? Number(port) : 3306;

  return {
    host,
    port: finalPort,
    user,
    password,
    database
  };
}

export function resetDbPool() {
  if (pool) {
    try {
      pool.end();
    } catch (_) {}
    pool = null;
  }
  poolFailed = false;
  tablesInitialized = false;
}

export function getDbPool(): mysql.Pool | null {
  if (poolFailed) return null;
  if (pool) return pool;

  const { host, port, user, password, database } = getDbConfig();

  if (!host || !user || !database) {
    console.log(`[MySQL] Credentials incomplete. Provided host: "${host}", user: "${user}", database: "${database}".`);
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 25,
      maxIdle: 20,
      idleTimeout: 60000,
      queueLimit: 0,
      connectTimeout: 8000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      namedPlaceholders: true,
      decimalNumbers: true,
      charset: 'utf8mb4'
    });
    console.log(`[MySQL] Connection pool initialized -> Host: ${host}:${port} | Database: ${database} | User: ${user}`);
    ensureTablesExist(pool).catch((err) => {
      console.warn('[MySQL] Background schema verification warning:', err?.message || err);
    });
    return pool;
  } catch (err: any) {
    poolFailed = true;
    console.warn(`[MySQL] Connection pool creation failed for host "${host}", database "${database}":`, err?.message || err);
    return null;
  }
}

export async function testDbConnection(overrideConfig?: { host?: string; port?: number | string; user?: string; password?: string; database?: string }) {
  const baseConfig = getDbConfig();
  const config = {
    host: overrideConfig?.host || baseConfig.host,
    port: overrideConfig?.port ? Number(overrideConfig.port) : baseConfig.port,
    user: overrideConfig?.user || baseConfig.user,
    password: overrideConfig?.password !== undefined ? overrideConfig.password : baseConfig.password,
    database: overrideConfig?.database || baseConfig.database
  };

  if (!config.host || !config.user || !config.database) {
    return {
      connected: false,
      error: `Missing database connection parameters. Required: host, user, database. Host: "${config.host}", User: "${config.user}", Database: "${config.database}"`,
      host: config.host,
      database: config.database
    };
  }

  let tempPool: mysql.Pool | null = null;
  try {
    tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 2,
      connectTimeout: 5000
    });

    const [rows]: any = await tempPool.query('SELECT NOW() AS server_time, DATABASE() AS current_db');
    const serverTime = rows && rows[0] ? rows[0].server_time : new Date().toISOString();
    const currentDb = rows && rows[0] ? rows[0].current_db : config.database;

    await tempPool.end();

    // Reset global connection pool so app uses newly verified credentials
    resetDbPool();

    return {
      connected: true,
      message: `Successfully connected to MySQL database '${currentDb}' on host '${config.host}:${config.port}' as user '${config.user}'`,
      serverTime,
      host: config.host,
      database: currentDb
    };
  } catch (err: any) {
    if (tempPool) {
      try { await tempPool.end(); } catch (_) {}
    }
    return {
      connected: false,
      error: err?.message || 'Failed to connect to MySQL database',
      host: config.host,
      database: config.database
    };
  }
}

let tablesInitialized = false;

async function ensureTablesExist(dbPool: mysql.Pool) {
  if (tablesInitialized) return;
  tablesInitialized = true;

  const runQuery = async (sql: string) => {
    try {
      await dbPool.query(sql);
    } catch (e) {
      // Ignore individual table creation errors (e.g. existing tables or permissions)
    }
  };

  // Immediate Users Table & Token Migration
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      phone VARCHAR(32),
      password_hash VARCHAR(255),
      app_auth_token VARCHAR(255) DEFAULT NULL,
      avatar_url VARCHAR(512),
      auth_provider VARCHAR(32) DEFAULT 'email',
      google_id VARCHAR(128),
      truecaller_id VARCHAR(128),
      role VARCHAR(32) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_app_auth_token (app_auth_token)
    )
  `);
  await runQuery(`ALTER TABLE users ADD COLUMN app_auth_token VARCHAR(255) DEFAULT NULL`).catch(() => {});
  await runQuery(`CREATE INDEX idx_users_app_auth_token ON users (app_auth_token)`).catch(() => {});

  await runQuery(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(128) PRIMARY KEY,
      setting_value JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(255),
      product_slug VARCHAR(255),
      customer_name VARCHAR(128) NOT NULL,
      customer_email VARCHAR(128),
      user_id VARCHAR(64),
      rating INT NOT NULL,
      title VARCHAR(255),
      comment TEXT,
      is_verified BOOLEAN DEFAULT TRUE,
      status VARCHAR(32) DEFAULT 'pending',
      admin_reply TEXT,
      admin_replied_at TIMESTAMP NULL,
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reviews_product (product_id),
      INDEX idx_reviews_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(128) UNIQUE NOT NULL,
      name VARCHAR(128) NOT NULL,
      tagline VARCHAR(255),
      description TEXT,
      image VARCHAR(512),
      product_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    ALTER TABLE categories ADD COLUMN tagline VARCHAR(255)
  `).catch(() => {});

  await runQuery(`
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    ALTER TABLE products ADD COLUMN combo_images JSON
  `).catch(() => {});

  await runQuery(`
    ALTER TABLE products ADD COLUMN profit DECIMAL(10,2) DEFAULT 0
  `).catch(() => {});

  await runQuery(`
    CREATE TABLE IF NOT EXISTS product_images (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      url VARCHAR(512) NOT NULL,
      alt VARCHAR(255),
      is_primary BOOLEAN DEFAULT FALSE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      weight VARCHAR(64) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      mrp DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 100
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS seo_metadata (
      id VARCHAR(64) PRIMARY KEY,
      page_key VARCHAR(128) UNIQUE NOT NULL,
      page_name VARCHAR(128) NOT NULL,
      seo_title VARCHAR(255) NOT NULL,
      seo_description TEXT NOT NULL,
      keywords VARCHAR(255),
      og_image VARCHAR(512),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS cloudinary_assets (
      id VARCHAR(64) PRIMARY KEY,
      url VARCHAR(512) UNIQUE NOT NULL,
      public_id VARCHAR(128),
      name VARCHAR(255),
      bytes INT,
      format VARCHAR(32),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      phone VARCHAR(32),
      password_hash VARCHAR(255),
      app_auth_token VARCHAR(255) DEFAULT NULL,
      avatar_url VARCHAR(512),
      auth_provider VARCHAR(32) DEFAULT 'email',
      google_id VARCHAR(128),
      truecaller_id VARCHAR(128),
      role VARCHAR(32) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_app_auth_token (app_auth_token)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      email VARCHAR(128),
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      landmark VARCHAR(255),
      city VARCHAR(128) NOT NULL,
      state VARCHAR(128) NOT NULL,
      pincode VARCHAR(32) NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id)
    )
  `);

  await runQuery(`
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
      status VARCHAR(64) DEFAULT 'Pending',
      payment_status VARCHAR(64) DEFAULT 'Pending',
      payment_method VARCHAR(64) DEFAULT 'COD',
      cod_advance_fee_paid DECIMAL(10,2) DEFAULT 0,
      cod_remaining_balance DECIMAL(10,2) DEFAULT 0,
      awb_number VARCHAR(128),
      courier_name VARCHAR(128) DEFAULT 'DTDC',
      tracking_url VARCHAR(512),
      payment_details_json JSON,
      notes TEXT,
      is_fake TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`ALTER TABLE orders ADD COLUMN is_fake TINYINT(1) DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN cod_advance_fee_paid DECIMAL(10,2) DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN cod_remaining_balance DECIMAL(10,2) DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN payment_details_json JSON`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN awb_number VARCHAR(128)`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN courier_name VARCHAR(128) DEFAULT 'DTDC'`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN tracking_url VARCHAR(512)`).catch(() => {});
  await runQuery(`ALTER TABLE orders ADD COLUMN referral_partner_code VARCHAR(64)`).catch(() => {});

  await runQuery(`
    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(128) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      profit DECIMAL(10,2) DEFAULT 0,
      variant_info VARCHAR(128)
    )
  `);

  await runQuery(`ALTER TABLE order_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0`).catch(() => {});

  await runQuery(`
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
      is_auto_apply TINYINT(1) DEFAULT 0,
      auto_apply_title VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`ALTER TABLE coupons ADD COLUMN id VARCHAR(100)`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN description VARCHAR(255)`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN is_store_wide TINYINT(1) DEFAULT 1`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN applicable_categories TEXT`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN applicable_product_ids TEXT`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN usage_limit INT DEFAULT NULL`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN usage_count INT DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN is_auto_apply TINYINT(1) DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN auto_apply_title VARCHAR(255) DEFAULT NULL`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN first_time_user_only TINYINT(1) DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN payment_method_restriction VARCHAR(32) DEFAULT 'all'`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN min_item_quantity INT DEFAULT NULL`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN usage_limit_per_user INT DEFAULT 1`).catch(() => {});
  await runQuery(`ALTER TABLE coupons ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).catch(() => {});

  await runQuery(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(32) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS stock_notifications (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(128) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_slug VARCHAR(255),
      product_image VARCHAR(512),
      email VARCHAR(128) NOT NULL,
      status VARCHAR(32) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notified_at TIMESTAMP NULL,
      INDEX idx_stock_notif_product (product_id),
      INDEX idx_stock_notif_email (email)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS gallery_media (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(128),
      category_label VARCHAR(128),
      img_url VARCHAR(512) NOT NULL,
      caption TEXT,
      date VARCHAR(64),
      location VARCHAR(128),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS video_media (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      duration VARCHAR(64),
      thumbnail VARCHAR(512),
      video_url VARCHAR(512) NOT NULL,
      description TEXT,
      category VARCHAR(128),
      speaker VARCHAR(128),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS owners (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      title VARCHAR(128),
      bio TEXT,
      photo_url VARCHAR(512),
      location VARCHAR(128),
      quote TEXT,
      role VARCHAR(128),
      socials JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS app_logs (
      id VARCHAR(64) PRIMARY KEY,
      level VARCHAR(20) NOT NULL DEFAULT 'error',
      error_type VARCHAR(128) NOT NULL,
      message TEXT NOT NULL,
      module VARCHAR(128),
      function_name VARCHAR(128),
      status_code INT DEFAULT 500,
      request_method VARCHAR(16),
      request_path VARCHAR(512),
      request_ip VARCHAR(64),
      user_agent VARCHAR(512),
      user_id VARCHAR(64),
      metadata JSON,
      stack_trace MEDIUMTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_logs_level (level),
      INDEX idx_logs_created_at (created_at),
      INDEX idx_logs_module (module)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS business_partners (
      id VARCHAR(64) PRIMARY KEY,
      partner_code VARCHAR(64) UNIQUE NOT NULL,
      full_name VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      email VARCHAR(128) NOT NULL,
      city VARCHAR(128) NOT NULL,
      state VARCHAR(128) NOT NULL,
      social_platform VARCHAR(64),
      social_handle VARCHAR(128),
      bank_account_name VARCHAR(128) NOT NULL,
      bank_name VARCHAR(128) NOT NULL,
      bank_account_number VARCHAR(64) NOT NULL,
      ifsc_code VARCHAR(32) NOT NULL,
      upi_id VARCHAR(128),
      aadhaar_pan_number VARCHAR(64),
      document_url VARCHAR(512),
      status VARCHAR(32) DEFAULT 'pending',
      payment_status VARCHAR(32) DEFAULT 'paid',
      payment_ref VARCHAR(128) NULL,
      transaction_id VARCHAR(128) NULL,
      razorpay_payment_id VARCHAR(128) NULL,
      razorpay_order_id VARCHAR(128) NULL,
      payment_amount DECIMAL(10,2) DEFAULT 0.00,
      payment_date TIMESTAMP NULL,
      commission_rate DECIMAL(5,2) DEFAULT 12.00,
      customer_discount_rate DECIMAL(5,2) DEFAULT 4.00,
      total_orders_count INT DEFAULT 0,
      total_sales_amount DECIMAL(10,2) DEFAULT 0.00,
      total_commission_earned DECIMAL(10,2) DEFAULT 0.00,
      total_commission_paid DECIMAL(10,2) DEFAULT 0.00,
      pending_commission DECIMAL(10,2) DEFAULT 0.00,
      referred_by_partner_code VARCHAR(64) DEFAULT NULL,
      referral_bonus_earned DECIMAL(10,2) DEFAULT 0.00,
      notes TEXT,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_partner_code (partner_code),
      INDEX idx_partner_status (status),
      INDEX idx_partner_payment_status (payment_status),
      INDEX idx_partner_phone (phone)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS partner_referrals (
      id VARCHAR(64) PRIMARY KEY,
      partner_id VARCHAR(64) NOT NULL,
      partner_code VARCHAR(64) NOT NULL,
      partner_name VARCHAR(128),
      order_id VARCHAR(64) NOT NULL,
      order_number VARCHAR(64) NOT NULL,
      order_date VARCHAR(64),
      customer_name VARCHAR(128),
      customer_city VARCHAR(128),
      order_total DECIMAL(10,2) NOT NULL,
      customer_discount DECIMAL(10,2) DEFAULT 0.00,
      partner_commission DECIMAL(10,2) NOT NULL,
      status VARCHAR(32) DEFAULT 'eligible',
      settlement_id VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_referral_partner (partner_code),
      INDEX idx_referral_order (order_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await runQuery(`ALTER TABLE partner_referrals CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).catch(() => {});

  await runQuery(`
    CREATE TABLE IF NOT EXISTS partner_settlements (
      id VARCHAR(64) PRIMARY KEY,
      partner_id VARCHAR(64) NOT NULL,
      partner_code VARCHAR(64) NOT NULL,
      partner_name VARCHAR(128) NOT NULL,
      settlement_date VARCHAR(64) NOT NULL,
      settlement_week VARCHAR(128) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(64) DEFAULT 'Bank Transfer',
      account_or_upi VARCHAR(128) NOT NULL,
      transaction_reference VARCHAR(128) NOT NULL,
      orders_count INT DEFAULT 0,
      notes TEXT,
      status VARCHAR(32) DEFAULT 'Completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_settlement_partner (partner_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await runQuery(`ALTER TABLE partner_settlements CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).catch(() => {});

  await runQuery(`
    CREATE TABLE IF NOT EXISTS site_sessions (
      id VARCHAR(64) PRIMARY KEY,
      session_id VARCHAR(64) UNIQUE NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NULL,
      user_agent VARCHAR(512) NULL,
      device_type VARCHAR(32) DEFAULT 'desktop',
      browser VARCHAR(64) NULL,
      city VARCHAR(128) NULL,
      country VARCHAR(64) DEFAULT 'India',
      referrer VARCHAR(512) NULL,
      referrer_domain VARCHAR(128) NULL,
      landing_page VARCHAR(255) DEFAULT '/',
      exit_page VARCHAR(255) NULL,
      page_views_count INT DEFAULT 1,
      events_count INT DEFAULT 0,
      duration_seconds INT DEFAULT 0,
      is_bounce TINYINT(1) DEFAULT 1,
      has_checkout TINYINT(1) DEFAULT 0,
      has_converted TINYINT(1) DEFAULT 0,
      order_id VARCHAR(64) NULL,
      order_amount DECIMAL(10,2) DEFAULT 0.00,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_session_visitor (visitor_id),
      INDEX idx_session_started (started_at),
      INDEX idx_session_last_active (last_active_at)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS site_pageviews (
      id VARCHAR(64) PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      path VARCHAR(255) NOT NULL,
      title VARCHAR(255) NULL,
      referrer VARCHAR(512) NULL,
      duration_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pageviews_session (session_id),
      INDEX idx_pageviews_path (path),
      INDEX idx_pageviews_created (created_at)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS site_events (
      id VARCHAR(64) PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      event_name VARCHAR(128) NOT NULL,
      event_category VARCHAR(64) DEFAULT 'engagement',
      path VARCHAR(255) NOT NULL,
      target_id VARCHAR(128) NULL,
      target_name VARCHAR(255) NULL,
      value DECIMAL(10,2) DEFAULT 0.00,
      metadata JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_events_session (session_id),
      INDEX idx_events_name (event_name),
      INDEX idx_events_created (created_at)
    )
  `);

  // Performance Indexes for high-speed queries
  const addIndexQueries = [
    'CREATE INDEX idx_products_category ON products (category_id)',
    'CREATE INDEX idx_products_available ON products (is_available)',
    'CREATE INDEX idx_products_created ON products (created_at)',
    'CREATE INDEX idx_products_slug ON products (slug)',
    'CREATE INDEX idx_product_images_product_id ON product_images (product_id)',
    'CREATE INDEX idx_product_images_primary ON product_images (product_id, is_primary)',
    'CREATE INDEX idx_product_variants_product_id ON product_variants (product_id)',
    'CREATE INDEX idx_order_items_order_id ON order_items (order_id)',
    'CREATE INDEX idx_order_items_product_id ON order_items (product_id)',
    'CREATE INDEX idx_orders_created ON orders (created_at)',
    'CREATE INDEX idx_orders_status ON orders (status)',
    'CREATE INDEX idx_orders_customer_email ON orders (customer_email)',
    'CREATE INDEX idx_orders_customer_phone ON orders (customer_phone)',
    'CREATE INDEX idx_categories_slug ON categories (slug)',
    'CREATE INDEX idx_coupons_code ON coupons (code)',
    'CREATE INDEX idx_coupons_active ON coupons (is_active)',
    'CREATE INDEX idx_seo_page_key ON seo_metadata (page_key)'
  ];

  for (const idxSql of addIndexQueries) {
    await runQuery(idxSql).catch(() => {});
  }

  // Convert tables to support UTF8 Unicode (Marathi / Devanagari characters)
  const convertCharsetQueries = [
    'ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE order_items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE customers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE business_partners CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE inquiries CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE user_addresses CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'ALTER TABLE product_reviews CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  ];

  for (const convertSql of convertCharsetQueries) {
    await runQuery(convertSql).catch((err: any) => {
      console.warn(`[MySQL] Charset conversion warning:`, err?.message || err);
    });
  }

  // Schema Alterations for Woman Partner Payment Tracking & Referral Program & User Auth Token
  const schemaAlters = [
    'ALTER TABLE users ADD COLUMN app_auth_token VARCHAR(255) DEFAULT NULL',
    'CREATE INDEX idx_users_app_auth_token ON users (app_auth_token)',
    'ALTER TABLE business_partners ADD COLUMN referred_by_partner_code VARCHAR(64) DEFAULT NULL',
    'ALTER TABLE business_partners ADD COLUMN referral_bonus_earned DECIMAL(10,2) DEFAULT 0.00',
    "ALTER TABLE business_partners ADD COLUMN payment_status VARCHAR(32) DEFAULT 'paid'",
    'ALTER TABLE business_partners ADD COLUMN payment_ref VARCHAR(128) DEFAULT NULL',
    'ALTER TABLE business_partners ADD COLUMN transaction_id VARCHAR(128) DEFAULT NULL',
    'ALTER TABLE business_partners ADD COLUMN razorpay_payment_id VARCHAR(128) DEFAULT NULL',
    'ALTER TABLE business_partners ADD COLUMN razorpay_order_id VARCHAR(128) DEFAULT NULL',
    'ALTER TABLE business_partners ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00',
    'ALTER TABLE business_partners ADD COLUMN payment_date TIMESTAMP NULL',
    'ALTER TABLE products ADD COLUMN _is_fake TINYINT(1) DEFAULT 0'
  ];

  for (const alterSql of schemaAlters) {
    await runQuery(alterSql).catch(() => {});
  }

  // Auto-convert existing Cloudinary image URLs in MySQL tables to include fl_original
  const autoConvertCloudinaryQueries = [
    "UPDATE categories SET name = 'Banana Chips' WHERE name LIKE '%Banana Chipss%'",
    "UPDATE cloudinary_assets SET url = REPLACE(url, '/pl_original/', '/fl_original/') WHERE url LIKE '%/pl_original/%'",
    "UPDATE product_images SET url = REPLACE(url, '/pl_original/', '/fl_original/') WHERE url LIKE '%/pl_original/%'",
    "UPDATE categories SET image = REPLACE(image, '/pl_original/', '/fl_original/') WHERE image LIKE '%/pl_original/%'",
    "UPDATE gallery_media SET img_url = REPLACE(img_url, '/pl_original/', '/fl_original/') WHERE img_url LIKE '%/pl_original/%'",
    "UPDATE woman_graphics SET image_url = REPLACE(image_url, '/pl_original/', '/fl_original/') WHERE image_url LIKE '%/pl_original/%'",
    "UPDATE cloudinary_assets SET url = REPLACE(url, '/image/upload/v', '/image/upload/fl_original/v') WHERE url LIKE '%/image/upload/v%' AND url NOT LIKE '%/upload/fl_original/%'",
    "UPDATE product_images SET url = REPLACE(url, '/image/upload/v', '/image/upload/fl_original/v') WHERE url LIKE '%/image/upload/v%' AND url NOT LIKE '%/upload/fl_original/%'",
    "UPDATE categories SET image = REPLACE(image, '/image/upload/v', '/image/upload/fl_original/v') WHERE image LIKE '%/image/upload/v%' AND image NOT LIKE '%/upload/fl_original/%'",
    "UPDATE gallery_media SET img_url = REPLACE(img_url, '/image/upload/v', '/image/upload/fl_original/v') WHERE img_url LIKE '%/image/upload/v%' AND img_url NOT LIKE '%/upload/fl_original/%'",
    "UPDATE woman_graphics SET image_url = REPLACE(image_url, '/image/upload/v', '/image/upload/fl_original/v') WHERE image_url LIKE '%/image/upload/v%' AND image_url NOT LIKE '%/upload/fl_original/%'"
  ];

  for (const updateSql of autoConvertCloudinaryQueries) {
    await runQuery(updateSql).catch(() => {});
  }
}

export function markPoolFailed() {
  poolFailed = true;
  pool = null;
}

export function resetDbPoolFailure() {
  poolFailed = false;
  pool = null;
}

export async function initDatabase(): Promise<mysql.Pool | null> {
  const p = getDbPool();
  if (!p) {
    throw new Error('Database pool could not be created. Ensure DB_HOST, DB_USER, and DB_NAME are correctly set in .env');
  }
  // Execute a test query to verify live connection to MySQL on startup
  await p.query('SELECT 1');
  return p;
}
