import { pgTable, text, integer, boolean, timestamp, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// 1. Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(), // e.g., 'recommended', 'one_day'
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
});

// 2. Tours Table
export const tours = pgTable('tours', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  image: text('image').notNull(), // Primary thumbnail (kept = images[0] for backward compat)
  images: jsonb('images').$type<string[]>().notNull().default([]), // Gallery image URLs
  videos: jsonb('videos').$type<string[]>().notNull().default([]), // Video URLs
  cities: text('cities').notNull(), // E.g. 'Cairo', '4 Cities'
  location: text('location').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]), // Postgres JSONB array
  duration: text('duration').notNull(),
  price: doublePrecision('price').notNull(),
  description: text('description'),
  category: text('category').references(() => categories.slug),
  isEasterSpecial: boolean('is_easter_special').default(false).notNull(),
  isPopular: boolean('is_popular').default(false).notNull(),
});

// 3. Special Offers Table
export const specialOffers = pgTable('special_offers', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  image: text('image').notNull(), // Primary thumbnail (kept = images[0] for backward compat)
  images: jsonb('images').$type<string[]>().notNull().default([]), // Gallery image URLs
  videos: jsonb('videos').$type<string[]>().notNull().default([]), // Video URLs
  cities: text('cities').notNull(),
  location: text('location').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  duration: text('duration').notNull(),
  price: doublePrecision('price').notNull(),
  originalPrice: doublePrecision('original_price').notNull(),
  badge: text('badge').notNull(),
  countdownDays: integer('countdown_days').notNull(),
});

// 4. Bookings Table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  tourId: text('tour_id').notNull(),
  tourTitle: text('tour_title').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  date: text('date').notNull(), // Format YYYY-MM-DD
  guests: integer('guests').notNull(),
  status: text('status').$type<'pending' | 'confirmed' | 'cancelled'>().default('pending').notNull(),
  priceTotal: doublePrecision('price_total').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  tripType: text('trip_type'), // 'make' | 'find' | 'rent'
  fromDate: text('from_date'),
  toDate: text('to_date'),
  fromLocation: text('from_location'),
  toLocation: text('to_location'),
});

// 5. Activity Logs Table
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Media Table
export const media = pgTable('media', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  name: text('name').notNull(),
  type: text('type').$type<'image' | 'video'>().default('image').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Users Table (admin/editor accounts shown in the User Management tab)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').$type<'super_admin' | 'admin' | 'editor' | 'user'>().default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Settings Table
export const settings = pgTable('settings', {
  key: text('key').primaryKey().default('general'), // Always 'general' for our single config
  siteName: text('site_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  whatsapp: text('whatsapp').notNull(),
  location: text('location').notNull(),
  facebook: text('facebook').notNull(),
  instagram: text('instagram').notNull(),
  promoBannerText: text('promo_banner_text').notNull(),
});
