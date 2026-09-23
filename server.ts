import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api';
import { initDatabase } from './server/database/connection';
import { UserRepository } from './server/repositories/UserRepository';
import { initOrderCleanupJob } from './server/utils/orderCleanup';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure favicons directory exists in public
const faviconsDir = path.join(process.cwd(), 'public', 'favicons');
if (!fs.existsSync(faviconsDir)) {
  fs.mkdirSync(faviconsDir, { recursive: true });
}

// Global middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.text({ limit: '20mb', type: ['text/*', 'application/x-ndjson', 'application/octet-stream'] }));

// Static uploads & favicons serving
app.use('/uploads', express.static(uploadsDir));
app.use('/favicons', express.static(faviconsDir, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webmanifest') || filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    }
  }
}));

// API Routes
app.use('/api', apiRouter);
app.use('/woman', (req, res, next) => {
  req.url = '/woman' + req.url;
  apiRouter(req, res, next);
});
app.use('/women', (req, res, next) => {
  req.url = '/women' + req.url;
  apiRouter(req, res, next);
});

// Prevent search engines from indexing private iframe and tracking pages
app.use(['/iframe', '/tracking'], (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  next();
});

// Dynamic Robots.txt for Search Engines
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protoHeader = (req.headers['x-forwarded-proto'] as string || '').split(',')[0].trim();
  const protocol = protoHeader || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = host.includes('localhost') ? `${protocol}://${host}` : 'https://aaplajalgaonwala.com';

  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout/
Disallow: /account/
Disallow: /iframe/
Disallow: /tracking/
Disallow: /api/
Disallow: /ref/

Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml
`);
});

// Dynamic XML Sitemap for Search Indexing
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const host = req.get('host') || 'localhost:3000';
    const protoHeader = (req.headers['x-forwarded-proto'] as string || '').split(',')[0].trim();
    const protocol = protoHeader || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = host.includes('localhost') ? `${protocol}://${host}` : 'https://aaplajalgaonwala.com';

    const staticRoutes = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/categories', priority: '0.8', changefreq: 'weekly' },
      { url: '/upwas-special', priority: '0.8', changefreq: 'weekly' },
      { url: '/our-story', priority: '0.7', changefreq: 'monthly' },
      { url: '/franchise', priority: '0.8', changefreq: 'weekly' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/faq', priority: '0.6', changefreq: 'monthly' },
      { url: '/instagram', priority: '0.6', changefreq: 'weekly' },
      { url: '/women-business-partners', priority: '0.7', changefreq: 'monthly' },
      { url: '/referral', priority: '0.6', changefreq: 'monthly' }
    ];

    let productsXml = '';
    try {
      const { ProductRepository } = await import('./server/repositories/ProductRepository');
      const products = await ProductRepository.getAll();
      productsXml = products.map(p => `
  <url>
    <loc>${baseUrl.replace(/\/$/, '')}/product/${p.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');
    } catch (e) {
      console.warn('[Sitemap] Product XML build notice:', e);
    }

    const staticXml = staticRoutes.map(r => `
  <url>
    <loc>${baseUrl.replace(/\/$/, '')}${r.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${productsXml}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (err: any) {
    console.error('[Sitemap] Error generating sitemap.xml:', err);
    return res.status(500).send('Error generating XML sitemap');
  }
});

// ----------------------------------------------------
// GOOGLE OAUTH CALLBACK ROUTE
// ----------------------------------------------------
const oauthCallbackHandler = async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Authentication Cancelled</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #FAF6ED; color: #1c1917;">
            <h3 style="color: #9B111E;">Authentication Cancelled</h3>
            <p style="font-size: 14px;">${error || 'Google sign-in was not completed.'}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
                setTimeout(() => window.close(), 1500);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code || typeof code !== 'string') {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #FAF6ED;">
            <h3>No authorization code received</h3>
            <script>
              if (window.opener) { window.close(); } else { window.location.href = '/'; }
            </script>
          </body>
        </html>
      `);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || '';
    
    // Extract state if passed from auth URL
    let stateRedirectUri = '';
    if (req.query.state && typeof req.query.state === 'string') {
      try {
        const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
        if (decodedState && decodedState.redirectUri) {
          stateRedirectUri = decodedState.redirectUri;
        }
      } catch {
        // Ignored if state is not base64 JSON
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const protoHeader = (req.headers['x-forwarded-proto'] as string || '').split(',')[0].trim();
    const protocol = protoHeader || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = stateRedirectUri || `${baseUrl.replace(/\/$/, '')}/auth/callback`;

    let googleUser: any = null;

    if (clientId && clientSecret) {
      // Exchange code for token with Google
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        // Fetch user profile from Google UserInfo endpoint
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        if (userInfoRes.ok) {
          googleUser = await userInfoRes.json();
        }
      }

      // Fallback: decode id_token JWT if userinfo request failed
      if ((!googleUser || !googleUser.email) && tokenData.id_token) {
        try {
          const payloadBase64 = tokenData.id_token.split('.')[1];
          if (payloadBase64) {
            const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
            if (decodedPayload && decodedPayload.email) {
              googleUser = {
                id: decodedPayload.sub,
                email: decodedPayload.email,
                name: decodedPayload.name,
                picture: decodedPayload.picture
              };
            }
          }
        } catch (err) {
          console.warn('[Google OAuth Callback] Error decoding id_token JWT:', err);
        }
      }
    }

    if (!googleUser || !googleUser.email) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #FAF6ED;">
            <h3 style="color: #9B111E;">Could not fetch Google profile</h3>
            <p>Please ensure Google OAuth credentials are provided and authorization succeeded.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Could not fetch Google profile' }, '*');
                setTimeout(() => window.close(), 2000);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 2000);
              }
            </script>
          </body>
        </html>
      `);
    }

    const email = String(googleUser.email).trim().toLowerCase();
    const name = googleUser.name || email.split('@')[0];
    const picture = googleUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=9B111E`;
    const googleId = googleUser.id || `g_${Date.now()}`;

    // Create or update in MySQL Database
    let user = await UserRepository.findByEmail(email);
    if (user) {
      user = await UserRepository.update(user.id, {
        name,
        avatarUrl: picture,
        googleId,
        authProvider: 'google'
      }) || user;
    } else {
      user = await UserRepository.create({
        name,
        email,
        avatarUrl: picture,
        googleId,
        authProvider: 'google',
        role: 'customer'
      });
    }

    const token = `token_${user.id}_${Date.now()}`;
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    res.cookie('ajw_auth_token', token, { maxAge: THIRTY_DAYS, path: '/', sameSite: 'lax' });
    res.cookie('ajw_user_id', user.id, { maxAge: THIRTY_DAYS, path: '/', sameSite: 'lax' });

    const addresses = await UserRepository.getAddresses(user.id);
    const { passwordHash: _, ...safeUser } = user;
    const fullUser = { ...safeUser, addresses };

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aapla Jalgaonwala | Connecting Google Account...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAF6ED; color: #1c1917;">
          <div style="background: white; padding: 32px; border-radius: 24px; border: 1px solid rgba(0,0,0,0.08); text-align: center; max-width: 360px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #9B111E; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-weight: bold; font-size: 20px;">
              AJ
            </div>
            <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #9B111E;">Namaskar, ${safeUser.name}!</h3>
            <p style="margin: 0 0 16px; font-size: 13px; color: #78716c;">Signing you in to Aapla Jalgaonwala...</p>
            <div style="width: 24px; height: 24px; border: 3px solid #9B111E; border-top-color: transparent; border-radius: 50%; margin: 0 auto; animation: spin 0.8s linear infinite;"></div>
          </div>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  provider: 'google',
                  token: '${token}',
                  user: ${JSON.stringify(fullUser)}
                }, '*');
                setTimeout(() => { window.close(); }, 800);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1000);
              }
            } catch (e) {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[OAuth Callback] Error processing Google login:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #FAF6ED;">
          <h3 style="color: #9B111E;">Authentication Encountered an Issue</h3>
          <p>${err.message || 'Please close this window and try again.'}</p>
          <script>
            if (window.opener) { setTimeout(() => window.close(), 2500); }
          </script>
        </body>
      </html>
    `);
  }
};

app.get(['/auth/callback', '/auth/callback/', '/api/auth/google/callback'], oauthCallbackHandler);

// Database initialization
initDatabase()
  .then(async () => {
    console.log('[Server] Database initialized successfully.');
    await UserRepository.purgeDummyUsers().catch(() => {});
  })
  .catch((err) => {
    console.warn('[Server] Database connection notice (using JSON fallback):', err?.message || err);
    UserRepository.purgeDummyUsers().catch(() => {});
  });

// Setup background hourly tracking synchronization
const ONE_HOUR_MS = 60 * 60 * 1000;
setTimeout(() => {
  import('./server/routes/tracking').then(({ handleCronTrackingSync }) => {
    handleCronTrackingSync({} as any, {
      json: (data: any) => console.log(`[Auto Background Cron] Initial check: ${data.totalOrdersUpdated} updated.`),
      status: () => ({ json: (err: any) => console.warn('[Auto Background Cron] Initial check error:', err) })
    } as any).catch(err => console.warn('[Auto Background Cron] Sync notice:', err));
  }).catch(() => {});
}, 30000); // 30 seconds after boot

setInterval(() => {
  import('./server/routes/tracking').then(({ handleCronTrackingSync }) => {
    handleCronTrackingSync({} as any, {
      json: (data: any) => console.log(`[Auto Background Cron] Hourly sync done: ${data.totalOrdersUpdated} updated.`),
      status: () => ({ json: (err: any) => console.warn('[Auto Background Cron] Hourly sync error:', err) })
    } as any).catch(err => console.warn('[Auto Background Cron] Sync notice:', err));
  }).catch(() => {});
}, ONE_HOUR_MS);

// Setup background clean up job for pending unpaid orders (after 10 minutes)
initOrderCleanupJob();

async function startServer() {
  if (!isProduction) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/server/data/**',
            '**/server/repositories/**',
            '**/uploads/**',
            '**/public/favicons/**'
          ]
        }
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve built Vite assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    app.get(/.*/, (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Aapla Jalgaonwala app running on http://localhost:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});
