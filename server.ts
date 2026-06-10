import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/db';
import * as schema from './src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function startServer() {
  const app = express();
  // Railway (and most PaaS) inject the port to listen on via process.env.PORT.
  // Falling back to 3000 for local development.
  const PORT = Number(process.env.PORT) || 3000;

  // Body Parsing Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper check to see if database URL is configured
  const isPostgresConfigured = () => {
    return !!process.env.DATABASE_URL;
  };

  // Static Local Data for Fallbacks if PostgreSQL is not active
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

  // -----------------------------------------------------------------
  // 1. HEALTH AND STATUS ENDPOINTS
  // -----------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: isPostgresConfigured() ? 'PostgreSQL (Active)' : 'PostgreSQL (Not Configured, falling back gracefully)',
      timestamp: new Date().toISOString()
    });
  });

  // -----------------------------------------------------------------
  // 2. CATEGORIES API
  // -----------------------------------------------------------------
  app.get('/api/categories', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json(DEFAULT_CATEGORIES);
      }
      const list = await db.select().from(schema.categories);
      if (list.length === 0) {
        // Seed categories table if empty
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
      const { name, slug, icon } = req.body;
      const id = slug || `cat_${Date.now()}`;
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.categories).values({ id, name, slug: slug || id, icon }).returning();
        return res.json(result[0]);
      }
      res.json({ id, name, slug: slug || id, icon });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 3. TOURS API
  // -----------------------------------------------------------------
  app.get('/api/tours', async (req, res) => {
    try {
      const fallbackList: any[] = [];
      EASTER_TOURS.forEach(t => fallbackList.push({ ...t, isEasterSpecial: true, isPopular: false, description: '' }));
      Object.entries(CATEGORIZED_TOURS).forEach(([catKey, items]) => {
        items.forEach(t => fallbackList.push({ ...t, category: catKey, isEasterSpecial: false, isPopular: catKey === 'recommended', description: '' }));
      });

      if (!isPostgresConfigured()) {
        return res.json(fallbackList);
      }

      const list = await db.select().from(schema.tours);
      if (list.length === 0) {
        // Seed default tours
        for (const tour of fallbackList) {
          await db.insert(schema.tours).values({
            id: tour.id,
            title: tour.title,
            image: tour.image,
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
      res.json([]);
    }
  });

  app.post('/api/tours', async (req, res) => {
    try {
      const payload = req.body;
      const id = payload.id || `tour_${Date.now()}`;
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.tours).values({
          id,
          title: payload.title,
          image: payload.image,
          cities: String(payload.cities),
          location: payload.location,
          tags: payload.tags || [],
          duration: payload.duration,
          price: Number(payload.price) || 0,
          description: payload.description || '',
          category: payload.category || 'recommended',
          isEasterSpecial: payload.isEasterSpecial || false,
          isPopular: payload.isPopular || false
        }).returning();
        return res.json(result[0]);
      }
      res.json({ id, ...payload });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 4. OFFERS API
  // -----------------------------------------------------------------
  app.get('/api/offers', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json(SPECIAL_OFFERS);
      }
      const list = await db.select().from(schema.specialOffers);
      if (list.length === 0) {
        // Seed default offers
        for (const offer of SPECIAL_OFFERS) {
          await db.insert(schema.specialOffers).values({
            id: offer.id,
            title: offer.title,
            image: offer.image,
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
        return res.json(SPECIAL_OFFERS);
      }
      res.json(list);
    } catch (error: any) {
      console.error('[DATABASE_ERROR] specialOffers list failed:', error);
      res.json(SPECIAL_OFFERS);
    }
  });

  app.post('/api/offers', async (req, res) => {
    try {
      const payload = req.body;
      const id = payload.id || `offer_${Date.now()}`;
      if (isPostgresConfigured()) {
        const result = await db.insert(schema.specialOffers).values({
          id,
          title: payload.title,
          image: payload.image,
          cities: String(payload.cities),
          location: payload.location,
          tags: payload.tags || [],
          duration: payload.duration,
          price: Number(payload.price) || 0,
          originalPrice: Number(payload.originalPrice) || 0,
          badge: payload.badge || 'Special Promo',
          countdownDays: Number(payload.countdownDays) || 193
        }).returning();
        return res.json(result[0]);
      }
      res.json({ id, ...payload });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // 5. BOOKINGS API
  // -----------------------------------------------------------------
  app.get('/api/bookings', async (req, res) => {
    try {
      if (!isPostgresConfigured()) {
        return res.json([]);
      }
      const list = await db.select().from(schema.bookings).orderBy(desc(schema.bookings.createdAt));
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  // -----------------------------------------------------------------
  // 6. MEDIA GALLERY API
  // -----------------------------------------------------------------
  app.get('/api/media', async (req, res) => {
    try {
      const defaultMedia = GALLERY_ITEMS.map((g) => ({
        id: g.id,
        url: g.image,
        name: g.title,
        uploadedBy: 'System Seeder',
        createdAt: new Date().toISOString()
      }));

      if (!isPostgresConfigured()) {
        return res.json(defaultMedia);
      }
      const list = await db.select().from(schema.media);
      if (list.length === 0) {
        for (const med of defaultMedia) {
          await db.insert(schema.media).values({
            id: med.id,
            url: med.url,
            name: med.name,
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

  // -----------------------------------------------------------------
  // 7. SETTINGS API
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
        const result = await db.insert(schema.settings).values({
          key: 'general',
          siteName: payload.siteName || DEFAULT_SETTINGS.siteName,
          phone: payload.phone || DEFAULT_SETTINGS.phone,
          email: payload.email || DEFAULT_SETTINGS.email,
          whatsapp: payload.whatsapp || DEFAULT_SETTINGS.whatsapp,
          location: payload.location || DEFAULT_SETTINGS.location,
          facebook: payload.facebook || DEFAULT_SETTINGS.facebook,
          instagram: payload.instagram || DEFAULT_SETTINGS.instagram,
          promoBannerText: payload.promoBannerText || DEFAULT_SETTINGS.promoBannerText
        }).onConflictDoUpdate({
          target: schema.settings.key,
          set: payload
        }).returning();
        return res.json(result[0]);
      }
      res.json({ key: 'general', ...payload });
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
