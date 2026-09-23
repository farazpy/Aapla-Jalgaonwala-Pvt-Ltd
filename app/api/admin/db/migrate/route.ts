import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { resetDbPoolFailure } from '@/server/database/connection';
import { initialProducts } from '@/data/products';
import { initialCategories } from '@/data/categories';
import { initialSiteSettings } from '@/data/settings';
import { initialOwners } from '@/data/owners';
import { initialGalleryItems, initialVideoItems } from '@/data/media';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const host = body.host || process.env.DATABASE_HOST;
    const port = Number(body.port || process.env.DATABASE_PORT || 3306);
    const user = body.user || process.env.DATABASE_USER;
    const password = body.password !== undefined ? body.password : (process.env.DATABASE_PASSWORD || '');
    const database = body.database || process.env.DATABASE_NAME || 'aaplajalgaonwala';

    if (!host || !user) {
      return NextResponse.json({
        success: false,
        error: 'Host and User are required to run MySQL migrations'
      }, { status: 400 });
    }

    // 1. Connect without database first to ensure database exists
    const rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 4000
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await rootConn.end();

    // 2. Connect with target database
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
      connectTimeout: 4000
    });

    // 3. Read schema.sql
    const schemaPath = path.join(process.cwd(), 'server', 'database', 'schema.sql');
    let sqlContent = '';
    if (fs.existsSync(schemaPath)) {
      sqlContent = fs.readFileSync(schemaPath, 'utf8');
    }

    if (sqlContent) {
      // Remove CREATE DATABASE statements as we already created it
      const cleanSql = sqlContent
        .replace(/CREATE DATABASE IF NOT EXISTS.*;/gi, '')
        .replace(/USE .*;`?/gi, '');
      
      await conn.query(cleanSql);
    }

    // 4. Seed Categories
    for (const cat of initialCategories) {
      await conn.query(
        `INSERT INTO categories (id, slug, name, description, image, product_count)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [cat.id, cat.slug, cat.name, cat.description, cat.image, cat.productCount || 0]
      );
    }

    // 5. Seed Products
    for (const p of initialProducts) {
      await conn.query(
        `INSERT INTO products (id, slug, name, category_id, description, short_description, price, mrp, discount, net_quantity, flavour, tags, is_featured, is_best_seller, is_new, is_available, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          p.id,
          p.slug,
          p.name,
          p.category,
          p.description,
          p.shortDescription || p.description.slice(0, 100),
          p.price,
          p.mrp,
          p.discount || 0,
          p.netQuantity,
          p.flavour,
          JSON.stringify(p.tags || []),
          p.isFeatured ? 1 : 0,
          p.isBestSeller ? 1 : 0,
          p.isNew ? 1 : 0,
          p.isAvailable ? 1 : 0,
          p.stock || 100
        ]
      );

      // Seed Primary Image
      if (p.images && p.images.length > 0) {
        for (let i = 0; i < p.images.length; i++) {
          await conn.query(
            `INSERT INTO product_images (id, product_id, url, alt, is_primary)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id=id`,
            [`${p.id}_img_${i}`, p.id, p.images[i], p.name, i === 0 ? 1 : 0]
          );
        }
      }
    }

    // 6. Seed Site Settings
    await conn.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('general_settings', ?)
       ON DUPLICATE KEY UPDATE setting_key=setting_key`,
      [JSON.stringify(initialSiteSettings)]
    );

    // 7. Seed Owners
    for (const o of initialOwners) {
      await conn.query(
        `INSERT INTO owners (id, name, title, bio, photo_url, location, quote, role, socials)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [o.id, o.name, o.title, o.bio, o.photoUrl, o.location || '', o.quote || '', o.role || '', JSON.stringify(o.socials || {})]
      );
    }

    // 8. Seed Media
    for (const g of initialGalleryItems) {
      await conn.query(
        `INSERT INTO gallery_media (id, title, category, category_label, img_url, caption, date, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [g.id, g.title, g.category, g.categoryLabel || '', g.imgUrl, g.caption, g.date || '', g.location || '']
      );
    }

    for (const v of initialVideoItems) {
      await conn.query(
        `INSERT INTO video_media (id, title, duration, thumbnail, video_url, description, category, speaker)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
         [v.id, v.title, v.duration, v.thumbnail, v.videoUrl, v.description, v.category, v.speaker]
      );
    }

    await conn.end();

    resetDbPoolFailure();

    return NextResponse.json({
      success: true,
      message: `MySQL Database '${database}' successfully migrated and seeded with initial products, settings, owners, and gallery media!`,
      database
    });
  } catch (err: any) {
    console.error('MySQL Migration error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to migrate MySQL database'
    }, { status: 500 });
  }
}
