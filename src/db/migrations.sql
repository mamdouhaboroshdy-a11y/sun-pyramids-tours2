-- ==========================================
-- PostgreSQL Database Schema Migration Script
-- For Sun Pyramids Tours
-- ==========================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL
);

-- 2. Create Tours Table
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
    category TEXT REFERENCES categories(slug) ON DELETE SET NULL,
    is_easter_special BOOLEAN NOT NULL DEFAULT FALSE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order DOUBLE PRECISION
);

-- Existing databases: add the online/offline visibility flag
ALTER TABLE tours ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT TRUE;
-- Existing databases: add the stable display-order column (backfilled by the server on startup)
ALTER TABLE tours ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION;

-- 2b. Create Homepage Gallery Slots Table
CREATE TABLE IF NOT EXISTS gallery_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    video_url TEXT NOT NULL DEFAULT '',
    media_type TEXT NOT NULL DEFAULT 'youtube',
    position INTEGER NOT NULL DEFAULT 0
);

-- 3. Create Special Offers Table
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

-- 4. Create Bookings Table
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

-- 5. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Media Table
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Settings Table
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


-- ==========================================
-- Initial Database Seeding Queries
-- ==========================================

-- Seed Categories
INSERT INTO categories (id, name, slug, icon) VALUES
('recommended', 'Recommended', 'recommended', 'Compass'),
('one_day', 'One Day', 'one_day', 'Sun'),
('multi_days', 'Multi-Day', 'multi_days', 'CalendarDays'),
('nile_cruises', 'Nile Cruises', 'nile_cruises', 'Ship'),
('shore_excursions', 'Shore Excursions', 'shore_excursions', 'Anchor')
ON CONFLICT (id) DO NOTHING;

-- Seed Settings Default
INSERT INTO settings (key, site_name, phone, email, whatsapp, location, facebook, instagram, promo_banner_text) VALUES
('general', 'Sun Pyramids Tours', '+20 123 456 7890', 'info@sunpyramidstours.com', '201207300811', 'Giza, Pyramids Street, Egypt', 'https://facebook.com/sunpyramids', 'https://instagram.com/sunpyramids', 'Book any tour and get another day excursion completely free of charge!')
ON CONFLICT (key) DO NOTHING;
