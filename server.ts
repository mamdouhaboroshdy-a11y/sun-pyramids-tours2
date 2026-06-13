import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { sql, eq, desc } from 'drizzle-orm';
import { db, client } from './src/db/db';
import * as schema from './src/db/schema';

async function startServer() {
  const app = express();
  // Railway (and most PaaS) inject the port to listen on via process.env.PORT.
  // Falling back to 3000 for local development.
  const PORT = Number(process.env.PORT) || 3000;

  // Body Parsing Middlewares. Raised limits so base64 / large JSON payloads and
  // multi-item media arrays go through without hitting the default 100kb cap.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Helper check to see if database URL is configured
  const isPostgresConfigured = () => {
    return !!process.env.DATABASE_URL;
  };

  // -----------------------------------------------------------------
  // FILE UPLOAD STORAGE (Railway Volume)
  // -----------------------------------------------------------------
  // Files (images + videos) are written to a persistent directory. On Railway
  // this should be a mounted Volume — set UPLOAD_DIR to the volume mount path
  // (e.g. /data/uploads). Without a Volume the directory still works but its
  // contents are wiped on every redeploy.
  const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error('[UPLOAD] Could not create upload directory:', e);
  }

  const sanitize = (name: string) =>
    name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').slice(-60);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const base = sanitize(path.basename(file.originalname, ext)) || 'file';
      const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}_${unique}${ext.toLowerCase()}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 250 * 1024 * 1024 }, // 250 MB per file (videos)
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed.'));
      }
    },
  });

  // Serve uploaded media with long-lived caching.
  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      maxAge: '7d',
      setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
    })
  );

  // -----------------------------------------------------------------
  // SCHEMA BOOTSTRAP — create tables / add new columns if missing.
  // Additive and idempotent: never drops anything. Runs once at startup
  // when Postgres is configured.
  // -----------------------------------------------------------------
  const ensureSchema = async () => {
    if (!isPostgresConfigured()) return;
    const ddl = `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tours (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        cities TEXT NOT NULL,
        location TEXT NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        duration TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        description TEXT,
        category TEXT,
        is_easter_special BOOLEAN NOT NULL DEFAULT FALSE,
        is_popular BOOLEAN NOT NULL DEFAULT FALSE
      );
      ALTER TABLE tours ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE tours ADD COLUMN IF NOT EXISTS videos JSONB NOT NULL DEFAULT '[]'::jsonb;
      CREATE TABLE IF NOT EXISTS special_offers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        cities TEXT NOT NULL,
        location TEXT NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        duration TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        original_price DOUBLE PRECISION NOT NULL,
        badge TEXT NOT NULL,
        countdown_days INTEGER NOT NULL
      );
      ALTER TABLE special_offers ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE special_offers ADD COLUMN IF NOT EXISTS videos JSONB NOT NULL DEFAULT '[]'::jsonb;
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        tour_id TEXT NOT NULL,
        tour_title TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        guests INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        price_total DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        trip_type TEXT,
        from_date TEXT,
        to_date TEXT,
        from_location TEXT,
        to_location TEXT
      );
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        name TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE media ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'image';
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY DEFAULT 'general',
        site_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        location TEXT NOT NULL,
        facebook TEXT NOT NULL,
        instagram TEXT NOT NULL,
        promo_banner_text TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        trip_title TEXT NOT NULL,
        trip_type TEXT NOT NULL DEFAULT 'tour',
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        preferred_date TEXT,
        preferred_time TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await client.unsafe(ddl);
      console.log('[SCHEMA] Tables verified / created successfully.');
    } catch (e) {
      console.error('[SCHEMA] ensureSchema failed:', e);
    }
  };

  await ensureSchema();

  // Static Local Data for Fallbacks / first-run seeding
  const { EASTER_TOURS, CATEGORIZED_TOURS, SPECIAL_OFFERS, GALLERY_ITEMS } = await import('./src/data');

  const DEFAULT_CATEGORIES = [
    { id: 'recommended', name: 'Recommended', slug: 'recommended', icon: 'Compass' },
    { id: 'one_day', name: 'One Day', slug: 'one_day', icon: 'Sun' },
    { id: 'multi_days', name: 'Multi-Day', slug: 'multi_days', icon: 'CalendarDays' },
    { id: 'nile_cruises', name: 'Nile Cruises', slug: 'nile_cruises', icon: 'Ship' },
    { id: 'shore_excursions', name: 'Shore Excursions', slug: 'shore_excursions', icon: 'Anchor' }
  ];

  const DEFAULT_SETTINGS = {
    key: 'general',
    siteName: 'Sun Pyramids Tours',
    phone: '+20 123 456 7890',
    email: 'info@sunpyramidstours.com',
    whatsapp: '201207300811',
    location: 'Giza, Pyramids Street, Egypt',
    facebook: 'https://facebook.com/sunpyramids',
    instagram: 'https://instagram.com/sunpyramids',
    promoBannerText: 'Book any tour and get another day excursion completely free of charge!'
  };

  // Coerce a possibly-stringified / single value into a clean string[] of URLs.
  const toUrlArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v)).filter(Boolean);
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
      } catch { /* not JSON, treat as single url */ }
      return [s];
    }
    return [];
  };

  // -----------------------------------------------------------------
  // 1. HEALTH AND STATUS ENDPOINTS
  // -----------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: isPostgresConfigured() ? 'PostgreSQL (Active)' : 'PostgreSQL (Not Configured, falling back gracefully)',
      uploadDir: UPLOAD_DIR,
      timestamp: new Date().toISOString()
    });
  });

  // -----------------------------------------------------------------
  // 1b. TRANSLATION API (dynamic content -> RU / IT / AR)
  // -----------------------------------------------------------------
  // Translates DB-sourced strings (tour titles, locations, descriptions...)
  // on demand via Google Gemini. Results are cached in-memory so each unique
  // (text, language) pair is translated only once per server lifetime.
  // Gracefully falls back to returning the original text when no
  // GEMINI_API_KEY is configured or the provider errors — the site never
  // breaks, it just shows the source language until a key is added.
  const LANG_NAMES: Record<string, string> = {
    ru: 'Russian', it: 'Italian', ar: 'Arabic', en: 'English',
  };
  const translationCache = new Map<string, string>(); // key: `${target}::${text}`
  let genaiClient: any = null;
  let genaiInitTried = false;

  const getGenAI = async () => {
    if (genaiInitTried) return genaiClient;
    genaiInitTried = true;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.warn('[TRANSLATE] No GEMINI_API_KEY set — dynamic translation disabled (falling back to source text).');
      return null;
    }
    try {
      const mod: any = await import('@google/genai');
      const GoogleGenAI = mod.GoogleGenAI || mod.default?.GoogleGenAI;
      genaiClient = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error('[TRANSLATE] Failed to initialise @google/genai:', e);
      genaiClient = null;
    }
    return genaiClient;
  };

  app.post('/api/translate', async (req, res) => {
    try {
      const target = String(req.body?.target || '').toLowerCase();
      const texts: string[] = Array.isArray(req.body?.texts) ? req.body.texts.map((t: any) => String(t ?? '')) : [];
      if (!LANG_NAMES[target] || target === 'en' || texts.length === 0) {
        return res.json({ translations: texts, translated: false });
      }

      // `translated` tells the client whether these are REAL translations. When
      // false (no API key / provider error), the client must NOT cache them so
      // it retries once a key becomes available.
      let translated = true;

      // Resolve from cache first; only translate the misses.
      const result: string[] = new Array(texts.length);
      const missIdx: number[] = [];
      texts.forEach((tx, i) => {
        const cached = translationCache.get(`${target}::${tx}`);
        if (cached !== undefined) result[i] = cached;
        else { missIdx.push(i); }
      });

      if (missIdx.length > 0) {
        const ai = await getGenAI();
        if (!ai) {
          // No provider — echo originals for the misses.
          translated = false;
          missIdx.forEach((i) => { result[i] = texts[i]; });
        } else {
          const toTranslate = missIdx.map((i) => texts[i]);
          const prompt =
            `You are a professional translator for a travel/tourism website. ` +
            `Translate each string in the following JSON array into ${LANG_NAMES[target]}. ` +
            `Keep it natural, concise and suitable for tourism marketing. ` +
            `Preserve any emojis, numbers, and proper nouns/place names appropriately. ` +
            `Return ONLY a JSON array of the translated strings, in the same order, with the same length. ` +
            `Input: ${JSON.stringify(toTranslate)}`;
          try {
            const response: any = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' },
            });
            const raw = (response?.text ?? '').trim();
            let parsed: string[] = [];
            try {
              parsed = JSON.parse(raw);
            } catch {
              const m = raw.match(/\[[\s\S]*\]/);
              parsed = m ? JSON.parse(m[0]) : [];
            }
            missIdx.forEach((origIdx, k) => {
              const translated = (Array.isArray(parsed) && typeof parsed[k] === 'string') ? parsed[k] : texts[origIdx];
              result[origIdx] = translated;
              translationCache.set(`${target}::${texts[origIdx]}`, translated);
            });
          } catch (e) {
            console.error('[TRANSLATE] Gemini request failed (falling back to source):', e);
            translated = false;
            missIdx.forEach((i) => { result[i] = texts[i]; });
          }
        }
      }

      res.json({ translations: result, translated });
    } catch (e: any) {
      console.error('[TRANSLATE] error:', e);
      // Never break the client — return originals if anything goes wrong.
      res.json({ translations: Array.isArray(req.body?.texts) ? req.body.texts : [], translated: false });
    }
  });

  // -----------------------------------------------------------------
  // 2. FILE UPLOAD API
  // -----------------------------------------------------------------
  app.post('/api/upload', (req, res) => {
    upload.array('files', 20)(req, res, async (err: any) => {
      if (err) {
        console.error('[UPLOAD] error:', err);
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        return res.status(400).json({ error: 'No files received.' });
      }
      const uploadedBy = (req.body?.uploadedBy as string) || 'Admin';
      const results = files.map((f) => ({
        url: `/uploads/${f.filename}`,
        name: f.originalname,
        type: f.mimetype.startsWith('video/') ? 'video' : 'image',
        size: f.size,
      }));

      // Best-effort: register each uploaded asset in the media catalog.
      if (isPostgresConfigured()) {
        try {
          for (const r of results) {
            await db.insert(schema.media).values({
              id: `media_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
              url: r.url,
              name: r.name,
              type: r.type as 'image' | 'video',
              uploadedBy,
            }).onConflictDoNothing();
          }
        } catch (e) {
          console.error('[UPLOAD] media catalog insert failed (non-fatal):', e);
        }
      }
      res.json({ files: results });
    });
  });

  // -----------------------------------------------------------------
  // 3. CATEGORIES API
  // -----------------------------------------------------------------
  app.get('/api/categories', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json(DEFAULT_CATEGORIES);
      }
      const list = await db.select().from(schema.categories);
      if (list.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await db.insert(schema.categories).values(cat).onConflictDoNothing();
        }
        return res.json(DEFAULT_CATEGORIES);
      }
      res.json(list);
    } catch (error: any) {
      console.error('[DATABASE_ERROR] categories list failed:', error);
      res.json(DEFAULT_CATEGORIES);
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const { id, name, slug, icon } = req.body;
      const catId = id || slug || `cat_${Date.now()}`;
      const catSlug = slug || catId;
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.categories)
          .values({ id: catId, name, slug: catSlug, icon: icon || 'Compass' })
          .onConflictDoUpdate({ target: schema.categories.id, set: { name, slug: catSlug, icon: icon || 'Compass' } })
          .returning();
        return res.json(result[0]);
      }
      res.json({ id: catId, name, slug: catSlug, icon });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      const { name, slug, icon } = req.body;
      if (isPostgresConfigured()) {
        const set: any = {};
        if (name !== undefined) set.name = name;
        if (slug !== undefined) set.slug = slug;
        if (icon !== undefined) set.icon = icon;
        const result = await db.update(schema.categories).set(set).where(eq(schema.categories.id, req.params.id)).returning();
        return res.json(result[0] || {});
      }
      res.json({ id: req.params.id, ...req.body });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      if (isPostgresConfigured()) {
        await db.delete(schema.categories).where(eq(schema.categories.id, req.params.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 4. TOURS API
  // -----------------------------------------------------------------
  const buildFallbackTours = () => {
    const fallbackList: any[] = [];
    EASTER_TOURS.forEach(t => fallbackList.push({ ...t, images: [t.image], videos: [], isEasterSpecial: true, isPopular: false, description: '' }));
    Object.entries(CATEGORIZED_TOURS).forEach(([catKey, items]) => {
      items.forEach(t => fallbackList.push({ ...t, images: [t.image], videos: [], category: catKey, isEasterSpecial: false, isPopular: catKey === 'recommended', description: '' }));
    });
    return fallbackList;
  };

  app.get('/api/tours', async (req, res) => {
    try {
      const fallbackList = buildFallbackTours();
      if (!isPostgresConfigured()) {
        return res.json(fallbackList);
      }
      const list = await db.select().from(schema.tours);
      if (list.length === 0) {
        for (const tour of fallbackList) {
          await db.insert(schema.tours).values({
            id: tour.id,
            title: tour.title,
            image: tour.image,
            images: tour.images || [tour.image],
            videos: tour.videos || [],
            cities: String(tour.cities),
            location: tour.location,
            tags: tour.tags || [],
            duration: tour.duration,
            price: tour.price,
            description: tour.description || '',
            category: tour.category || 'recommended',
            isEasterSpecial: tour.isEasterSpecial || false,
            isPopular: tour.isPopular || false
          }).onConflictDoNothing();
        }
        return res.json(fallbackList);
      }
      res.json(list);
    } catch (error: any) {
      console.error('[DATABASE_ERROR] tours list failed:', error);
      res.json(buildFallbackTours());
    }
  });

  const tourValuesFromPayload = (payload: any, id: string) => {
    // `images` is the source of truth. Fall back to a standalone `image` only when
    // no gallery array was sent (older payloads). Never re-inject a stale primary —
    // doing so makes a removed main image reappear on save.
    const images = toUrlArray(payload.images);
    if (images.length === 0 && payload.image) images.push(payload.image);
    const primary = images[0] || '';
    return {
      id,
      title: payload.title,
      image: primary,
      images,
      videos: toUrlArray(payload.videos),
      cities: String(payload.cities ?? ''),
      location: payload.location ?? '',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      duration: payload.duration ?? '',
      price: Number(payload.price) || 0,
      description: payload.description || '',
      category: payload.category || 'recommended',
      isEasterSpecial: !!payload.isEasterSpecial,
      isPopular: !!payload.isPopular
    };
  };

  app.post('/api/tours', async (req, res) => {
    try {
      const payload = req.body;
      const id = payload.id || `tour_${Date.now()}`;
      const values = tourValuesFromPayload(payload, id);
      if (isPostgresConfigured()) {
        const { id: _omit, ...rest } = values;
        const result = await db.insert(schema.tours).values(values)
          .onConflictDoUpdate({ target: schema.tours.id, set: rest })
          .returning();
        return res.json(result[0]);
      }
      res.json(values);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/tours/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const values = tourValuesFromPayload({ ...req.body, id }, id);
      const { id: _omit, ...rest } = values;
      if (isPostgresConfigured()) {
        const result = await db.update(schema.tours).set(rest).where(eq(schema.tours.id, id)).returning();
        return res.json(result[0] || {});
      }
      res.json(values);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/tours/:id', async (req, res) => {
    try {
      if (isPostgresConfigured()) {
        await db.delete(schema.tours).where(eq(schema.tours.id, req.params.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 5. OFFERS API
  // -----------------------------------------------------------------
  const buildFallbackOffers = () => SPECIAL_OFFERS.map((o) => ({ ...o, images: [o.image], videos: [] }));

  app.get('/api/offers', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json(buildFallbackOffers());
      }
      const list = await db.select().from(schema.specialOffers);
      if (list.length === 0) {
        for (const offer of SPECIAL_OFFERS) {
          await db.insert(schema.specialOffers).values({
            id: offer.id,
            title: offer.title,
            image: offer.image,
            images: [offer.image],
            videos: [],
            cities: String(offer.cities),
            location: offer.location,
            tags: offer.tags || [],
            duration: offer.duration,
            price: offer.price,
            originalPrice: offer.originalPrice,
            badge: offer.badge || 'Special Offer',
            countdownDays: offer.countdownDays || 193
          }).onConflictDoNothing();
        }
        return res.json(buildFallbackOffers());
      }
      res.json(list);
    } catch (error: any) {
      console.error('[DATABASE_ERROR] specialOffers list failed:', error);
      res.json(buildFallbackOffers());
    }
  });

  const offerValuesFromPayload = (payload: any, id: string) => {
    // See tourValuesFromPayload: images array is authoritative so removals persist.
    const images = toUrlArray(payload.images);
    if (images.length === 0 && payload.image) images.push(payload.image);
    const primary = images[0] || '';
    return {
      id,
      title: payload.title,
      image: primary,
      images,
      videos: toUrlArray(payload.videos),
      cities: String(payload.cities ?? ''),
      location: payload.location ?? '',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      duration: payload.duration ?? '',
      price: Number(payload.price) || 0,
      originalPrice: Number(payload.originalPrice) || 0,
      badge: payload.badge || 'Special Offer',
      countdownDays: Number(payload.countdownDays) || 193
    };
  };

  app.post('/api/offers', async (req, res) => {
    try {
      const payload = req.body;
      const id = payload.id || `offer_${Date.now()}`;
      const values = offerValuesFromPayload(payload, id);
      if (isPostgresConfigured()) {
        const { id: _omit, ...rest } = values;
        const result = await db.insert(schema.specialOffers).values(values)
          .onConflictDoUpdate({ target: schema.specialOffers.id, set: rest })
          .returning();
        return res.json(result[0]);
      }
      res.json(values);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/offers/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const values = offerValuesFromPayload({ ...req.body, id }, id);
      const { id: _omit, ...rest } = values;
      if (isPostgresConfigured()) {
        const result = await db.update(schema.specialOffers).set(rest).where(eq(schema.specialOffers.id, id)).returning();
        return res.json(result[0] || {});
      }
      res.json(values);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/offers/:id', async (req, res) => {
    try {
      if (isPostgresConfigured()) {
        await db.delete(schema.specialOffers).where(eq(schema.specialOffers.id, req.params.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 6. BOOKINGS API
  // -----------------------------------------------------------------
  app.get('/api/bookings', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json([]);
      }
      const list = await db.select().from(schema.bookings).orderBy(desc(schema.bookings.createdAt));
      res.json(list);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const payload = req.body;
      const id = `booking_${Date.now()}`;
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.bookings).values({
          id,
          tourId: payload.tourId,
          tourTitle: payload.tourTitle,
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          date: payload.date || new Date().toISOString().split('T')[0],
          guests: Number(payload.guests) || 1,
          status: 'pending',
          priceTotal: Number(payload.priceTotal) || 0,
          tripType: payload.tripType || 'make',
          fromDate: payload.fromDate || '',
          toDate: payload.toDate || '',
          fromLocation: payload.fromLocation || '',
          toLocation: payload.toLocation || ''
        }).returning();
        return res.json(result[0]);
      }
      res.json({ id, ...payload, status: 'pending', createdAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/bookings/:id', async (req, res) => {
    try {
      const { status } = req.body;
      if (isPostgresConfigured()) {
        const result = await db.update(schema.bookings).set({ status }).where(eq(schema.bookings.id, req.params.id)).returning();
        return res.json(result[0] || {});
      }
      res.json({ id: req.params.id, status });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/bookings/:id', async (req, res) => {
    try {
      if (isPostgresConfigured()) {
        await db.delete(schema.bookings).where(eq(schema.bookings.id, req.params.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 7. MEDIA GALLERY API
  // -----------------------------------------------------------------
  app.get('/api/media', async (req, res) => {
    try {
      const defaultMedia = GALLERY_ITEMS.map((g) => ({
        id: g.id,
        url: g.image,
        name: g.title,
        type: 'image',
        uploadedBy: 'System Seeder',
        createdAt: new Date().toISOString()
      }));

      if (!isPostgresConfigured()) {
        return res.json(defaultMedia);
      }
      const list = await db.select().from(schema.media).orderBy(desc(schema.media.createdAt));
      if (list.length === 0) {
        for (const med of defaultMedia) {
          await db.insert(schema.media).values({
            id: med.id,
            url: med.url,
            name: med.name,
            type: 'image',
            uploadedBy: med.uploadedBy,
            createdAt: new Date(med.createdAt)
          }).onConflictDoNothing();
        }
        return res.json(defaultMedia);
      }
      res.json(list);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post('/api/media', async (req, res) => {
    try {
      const payload = req.body;
      const id = payload.id || `media_${Date.now()}`;
      const item = {
        id,
        url: payload.url,
        name: payload.name || 'Untitled',
        type: (payload.type === 'video' ? 'video' : 'image') as 'image' | 'video',
        uploadedBy: payload.uploadedBy || 'Admin',
      };
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.media).values(item).onConflictDoNothing().returning();
        return res.json(result[0] || item);
      }
      res.json({ ...item, createdAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/media/:id', async (req, res) => {
    try {
      if (isPostgresConfigured()) {
        await db.delete(schema.media).where(eq(schema.media.id, req.params.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 8. SETTINGS API
  // -----------------------------------------------------------------
  app.get('/api/settings', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json(DEFAULT_SETTINGS);
      }
      const result = await db.select().from(schema.settings).where(eq(schema.settings.key, 'general'));
      if (result.length === 0) {
        await db.insert(schema.settings).values(DEFAULT_SETTINGS).onConflictDoNothing();
        return res.json(DEFAULT_SETTINGS);
      }
      res.json(result[0]);
    } catch (error: any) {
      res.json(DEFAULT_SETTINGS);
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const payload = req.body;
      if (isPostgresConfigured()) {
        const values = {
          key: 'general',
          siteName: payload.siteName || DEFAULT_SETTINGS.siteName,
          phone: payload.phone || DEFAULT_SETTINGS.phone,
          email: payload.email || DEFAULT_SETTINGS.email,
          whatsapp: payload.whatsapp || DEFAULT_SETTINGS.whatsapp,
          location: payload.location || DEFAULT_SETTINGS.location,
          facebook: payload.facebook || DEFAULT_SETTINGS.facebook,
          instagram: payload.instagram || DEFAULT_SETTINGS.instagram,
          promoBannerText: payload.promoBannerText || DEFAULT_SETTINGS.promoBannerText
        };
        const result = await db.insert(schema.settings).values(values)
          .onConflictDoUpdate({ target: schema.settings.key, set: values }).returning();
        return res.json(result[0]);
      }
      res.json({ key: 'general', ...payload });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 9. USERS API (admin management)
  // -----------------------------------------------------------------
  app.get('/api/users', async (req, res) => {
    try {
      if (!isPostgresConfigured()) return res.json([]);
      const list = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
      res.json(list);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const payload = req.body;
      const id = payload.id || `user_${Date.now()}`;
      const values = {
        id,
        email: payload.email || '',
        name: payload.name || 'New User',
        role: (payload.role || 'user') as 'super_admin' | 'admin' | 'editor' | 'user',
      };
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.users).values(values)
          .onConflictDoUpdate({ target: schema.users.id, set: { email: values.email, name: values.name, role: values.role } })
          .returning();
        return res.json(result[0]);
      }
      res.json({ ...values, createdAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const { role } = req.body;
      if (isPostgresConfigured()) {
        const result = await db.update(schema.users).set({ role }).where(eq(schema.users.id, req.params.id)).returning();
        return res.json(result[0] || {});
      }
      res.json({ id: req.params.id, role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 10. ACTIVITY LOGS API
  // -----------------------------------------------------------------
  app.get('/api/logs', async (req, res) => {
    try {
      if (!isPostgresConfigured()) return res.json([]);
      const list = await db.select().from(schema.activityLogs).orderBy(desc(schema.activityLogs.createdAt));
      res.json(list);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post('/api/logs', async (req, res) => {
    try {
      const payload = req.body;
      const id = `log_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
      const values = {
        id,
        userId: payload.userId || 'system',
        userEmail: payload.userEmail || '',
        userName: payload.userName || 'System',
        action: payload.action || '',
        details: payload.details || ''
      };
      if (isPostgresConfigured()) {
        await db.insert(schema.activityLogs).values(values).onConflictDoNothing();
      }
      res.json({ ...values, createdAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 11. REGISTRATIONS API (public "Register Now" + admin tracking)
  // -----------------------------------------------------------------
  app.get('/api/registrations', async (req, res) => {
    try {
      if (!isPostgresConfigured()) return res.json([]);
      const list = await db.select().from(schema.registrations).orderBy(desc(schema.registrations.createdAt));
      res.json(list);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post('/api/registrations', async (req, res) => {
    try {
      const payload = req.body;
      const id = `reg_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
      const values = {
        id,
        tripId: payload.tripId || '',
        tripTitle: payload.tripTitle || '',
        tripType: (payload.tripType === 'offer' ? 'offer' : 'tour') as 'tour' | 'offer',
        fullName: payload.fullName || '',
        phone: payload.phone || '',
        email: payload.email || '',
        preferredDate: payload.preferredDate || '',
        preferredTime: payload.preferredTime || '',
      };
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.registrations).values(values).returning();
        return res.json(result[0]);
      }
      res.json({ ...values, createdAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/registrations/:id', async (req, res) => {
    try {
      if (isPostgresConfigured()) {
        await db.delete(schema.registrations).where(eq(schema.registrations.id, req.params.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // VITE DEVELOPMENT ENGINE / PRODUCTION BUILD STATIC INTEGRANT
  // -----------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SYSTEM_INFO] Under development mode: server running as integrated Express + Vite.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[SYSTEM_INFO] Under production mode: serving static files from dist directory.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SYSTEM_SUCCESS] Express server running at URL: http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SYSTEM_ECLIPSE] Failed to initialize backend server:', err);
});
