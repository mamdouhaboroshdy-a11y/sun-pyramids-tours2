import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, UserRole } from './AuthContext';
import { TourPackage, SpecialOffer } from '../types';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../lib/api';

// Extended Interfaces for Database Dynamic entries
export interface CategoryModel {
  id: string; // e.g. recommended, one_day, nile_cruises
  name: string;
  slug: string;
  icon: string;
}

export type { SpecialOffer } from '../types';

export interface TourModel extends TourPackage {
  description?: string;
  category?: string;
  isEasterSpecial?: boolean;
  isPopular?: boolean;
  isOnline?: boolean; // false = hidden from customers; undefined/true = visible
  sortOrder?: number | null; // stable grid position (assigned server-side)
}

// One of the 5 fixed cards in the homepage "Gallery of Exciting journeys" section
export interface GalleryItemModel {
  id: string;
  title: string;
  category: string;
  image: string;
  videoUrl: string;
  mediaType: string;
  position: number;
}

export interface BookingModel {
  id: string;
  tourId: string;
  tourTitle: string;
  fullName: string;
  email: string;
  phone: string;
  date: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  priceTotal: number;
  createdAt: string;
  tripType?: 'make' | 'find' | 'rent';
  fromDate?: string;
  toDate?: string;
  fromLocation?: string;
  toLocation?: string;
}

export interface RegistrationModel {
  id: string;
  tripId: string;
  tripTitle: string;
  tripType: 'tour' | 'offer';
  fullName: string;
  phone: string;
  email: string;
  preferredDate?: string;
  preferredTime?: string;
  createdAt: string;
}

export interface ActivityLogModel {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface MediaModel {
  id: string;
  url: string;
  name: string;
  type?: 'image' | 'video';
  uploadedBy: string;
  createdAt: string;
}

export interface SettingModel {
  siteName: string;
  phone: string;
  email: string;
  whatsapp: string;
  location: string;
  facebook: string;
  instagram: string;
  promoBannerText: string;
}

interface DbContextType {
  categories: CategoryModel[];
  tours: TourModel[];
  offers: SpecialOffer[];
  galleryItems: GalleryItemModel[];
  bookings: BookingModel[];
  registrations: RegistrationModel[];
  activityLogs: ActivityLogModel[];
  media: MediaModel[];
  settings: SettingModel;
  dbLoaded: boolean;
  isDbEmpty: boolean;

  // Seeder / refresh
  seedDatabase: () => Promise<void>;
  refresh: () => Promise<void>;

  // Category CRUD
  addCategory: (category: Omit<CategoryModel, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<CategoryModel>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Tour CRUD
  addTour: (tour: Omit<TourModel, 'id'>) => Promise<void>;
  updateTour: (id: string, tour: Partial<TourModel>) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
  moveTour: (id: string, direction: 'up' | 'down' | 'top') => Promise<void>;
  moveTourToCategory: (id: string, category: string) => Promise<void>;

  // Offer CRUD
  addOffer: (offer: Omit<SpecialOffer, 'id'>) => Promise<void>;
  updateOffer: (id: string, offer: Partial<SpecialOffer>) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;

  // Booking CRUD
  addBooking: (booking: Omit<BookingModel, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  updateBookingStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  // Registration CRUD
  addRegistration: (registration: Omit<RegistrationModel, 'id' | 'createdAt'>) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;

  // Homepage gallery slots
  updateGalleryItem: (id: string, patch: Partial<GalleryItemModel>) => Promise<void>;

  // Media CRUD
  addMediaAsset: (media: Omit<MediaModel, 'id' | 'uploadedBy' | 'createdAt'>) => Promise<void>;
  deleteMediaAsset: (id: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<SettingModel>) => Promise<void>;

  // Activity Logger
  logAdminAction: (action: string, details: string) => Promise<void>;

  // Users management
  allUsers: any[];
  loadAllUsers: () => Promise<void>;
  updateUserRoleInDb: (targetUserId: string, role: UserRole) => Promise<void>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SettingModel = {
  siteName: 'Sun Pyramids Tours',
  phone: '+20 123 456 7890',
  email: 'info@sunpyramidstours.com',
  whatsapp: '201207300811',
  location: 'Giza, Pyramids Street, Egypt',
  facebook: 'https://facebook.com/sunpyramids',
  instagram: 'https://instagram.com/sunpyramids',
  promoBannerText: 'Book any tour and get another day excursion completely free of charge!'
};

const POLL_INTERVAL_MS = 20000;

export function DbProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [tours, setTours] = useState<TourModel[]>([]);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItemModel[]>([]);
  const [bookings, setBookings] = useState<BookingModel[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationModel[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogModel[]>([]);
  const [media, setMedia] = useState<MediaModel[]>([]);
  const [settings, setSettings] = useState<SettingModel>(DEFAULT_SETTINGS);

  const [dbLoaded, setDbLoaded] = useState(false);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const isAdminRef = useRef(false);
  isAdminRef.current = !!profile && (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'editor');

  // The 20s polling refresh used to replace every collection with a fresh
  // array reference even when nothing changed, re-rendering the whole app
  // (and making the admin dashboard feel heavy). Only push state when the
  // payload actually differs.
  const lastJsonRef = useRef<{ [key: string]: string }>({});
  const setIfChanged = <T,>(key: string, value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    const json = JSON.stringify(value);
    if (lastJsonRef.current[key] !== json) {
      lastJsonRef.current[key] = json;
      setter(value);
    }
  };

  // Normalise rows coming back from Postgres into the shapes the UI expects.
  const normaliseTour = (t: any): TourModel => ({
    ...t,
    images: Array.isArray(t.images) ? t.images : (t.image ? [t.image] : []),
    videos: Array.isArray(t.videos) ? t.videos : [],
  });
  const normaliseOffer = (o: any): SpecialOffer => ({
    ...o,
    images: Array.isArray(o.images) ? o.images : (o.image ? [o.image] : []),
    videos: Array.isArray(o.videos) ? o.videos : [],
  });

  // --- Fetchers -----------------------------------------------------
  const fetchPublic = async () => {
    try {
      const [cats, trs, ofs, med, setg, gal] = await Promise.all([
        apiGet<CategoryModel[]>('/categories').catch(() => []),
        apiGet<any[]>('/tours').catch(() => []),
        apiGet<any[]>('/offers').catch(() => []),
        apiGet<MediaModel[]>('/media').catch(() => []),
        apiGet<SettingModel>('/settings').catch(() => DEFAULT_SETTINGS),
        apiGet<GalleryItemModel[]>('/gallery').catch(() => []),
      ]);
      setIfChanged('categories', cats || [], setCategories);
      // Defensive stable sort — keeps the grid order fixed even if the API
      // ever returns rows in a different order (e.g. after a tour is updated).
      const sortedTours = (trs || []).map(normaliseTour).sort((a: any, b: any) =>
        ((a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)) ||
        String(a.id).localeCompare(String(b.id))
      );
      setIfChanged('tours', sortedTours, setTours);
      setIfChanged('offers', (ofs || []).map(normaliseOffer), setOffers);
      setIfChanged('media', med || [], setMedia);
      setIfChanged('gallery', ([...(gal || [])]).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), setGalleryItems);
      setIfChanged('settings', { ...DEFAULT_SETTINGS, ...(setg || {}) }, setSettings);
      setIsDbEmpty((trs || []).length === 0 && (ofs || []).length === 0);
    } catch (e) {
      console.error('Failed to load public data:', e);
    } finally {
      setDbLoaded(true);
    }
  };

  const fetchAdmin = async () => {
    if (!isAdminRef.current) {
      setIfChanged('bookings', [] as BookingModel[], setBookings);
      setIfChanged('registrations', [] as RegistrationModel[], setRegistrations);
      setIfChanged('activityLogs', [] as ActivityLogModel[], setActivityLogs);
      return;
    }
    try {
      const [bks, regs, lgs] = await Promise.all([
        apiGet<BookingModel[]>('/bookings').catch(() => []),
        apiGet<RegistrationModel[]>('/registrations').catch(() => []),
        apiGet<ActivityLogModel[]>('/logs').catch(() => []),
      ]);
      setIfChanged('bookings', bks || [], setBookings);
      setIfChanged('registrations', regs || [], setRegistrations);
      setIfChanged('activityLogs', lgs || [], setActivityLogs);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchPublic(), fetchAdmin()]);
  };

  // Initial load + light polling to approximate real-time updates.
  useEffect(() => {
    fetchPublic();
    fetchAdmin();
    const timer = setInterval(() => {
      fetchPublic();
      fetchAdmin();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role]);

  // --- Logger -------------------------------------------------------
  const logAdminAction = async (action: string, details: string) => {
    if (!profile) return;
    try {
      await apiPost('/logs', {
        userId: profile.id,
        userEmail: profile.email,
        userName: profile.name,
        action,
        details,
      });
    } catch (e) {
      console.error('Failed to write activity log:', e);
    }
  };

  // Kept for the "Quick Setup" button — the server auto-seeds empty tables, so
  // this just forces a refresh of every collection.
  const seedDatabase = async () => {
    await refreshAll();
    setIsDbEmpty(false);
  };

  // --- Category CRUD ------------------------------------------------
  const addCategory = async (category: Omit<CategoryModel, 'id'>) => {
    await apiPost('/categories', category);
    await logAdminAction('Add New Category', `Successfully added category: ${category.name}`);
    await fetchPublic();
  };
  const updateCategory = async (id: string, category: Partial<CategoryModel>) => {
    await apiPut(`/categories/${id}`, category);
    await logAdminAction('Update Category', `Successfully updated category: ${category.name || id}`);
    await fetchPublic();
  };
  const deleteCategory = async (id: string) => {
    await apiDelete(`/categories/${id}`);
    await logAdminAction('Delete Category', `Successfully deleted category with ID: ${id}`);
    await fetchPublic();
  };

  // --- Tour CRUD ----------------------------------------------------
  const addTour = async (tour: Omit<TourModel, 'id'>) => {
    await apiPost('/tours', tour);
    await logAdminAction('Add New Tour', `Successfully added tour: ${tour.title}`);
    await fetchPublic();
  };
  const updateTour = async (id: string, tour: Partial<TourModel>) => {
    await apiPut(`/tours/${id}`, tour);
    await logAdminAction('Update Tour Details', `Successfully updated details of tour: ${tour.title || id}`);
    await fetchPublic();
  };
  const deleteTour = async (id: string) => {
    await apiDelete(`/tours/${id}`);
    await logAdminAction('Delete Tour Package', `Successfully deleted tour package catalog under ID: ${id}`);
    await fetchPublic();
  };

  // Reorder a tour inside its own section. We rearrange the section's tours,
  // then remap the SAME set of sort_order values onto the new arrangement —
  // so the section order changes while global interleaving stays intact.
  // The new order is applied to the UI instantly (optimistic), then persisted.
  const moveTour = async (id: string, direction: 'up' | 'down' | 'top') => {
    const tour = tours.find(t => t.id === id);
    if (!tour) return;
    const siblings = tours.filter(t => t.category === tour.category); // `tours` is already sorted
    const idx = siblings.findIndex(t => t.id === id);
    const newIdx = direction === 'top' ? 0 : direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || newIdx < 0 || newIdx >= siblings.length || newIdx === idx) return;

    // Collect stable slot values (coerce to numbers; fill gaps after the max).
    let maxSeen = 0;
    siblings.forEach(t => {
      const so = Number(t.sortOrder);
      if (Number.isFinite(so) && so > maxSeen) maxSeen = so;
    });
    const slotValues = siblings
      .map(t => {
        const so = Number(t.sortOrder);
        return Number.isFinite(so) ? so : ++maxSeen;
      })
      .sort((a, b) => a - b);

    const arranged = [...siblings];
    arranged.splice(idx, 1);
    arranged.splice(newIdx, 0, tour);
    const withValues = arranged.map((t, i) => ({ ...t, sortOrder: slotValues[i] }));

    // Optimistic: show the new order immediately, before the server round-trip.
    let k = 0;
    const optimistic = tours.map(t => (t.category === tour.category ? withValues[k++] : t));
    setIfChanged('tours', optimistic, setTours);

    try {
      await Promise.all(withValues.map((t, i) => {
        const original = siblings.find(s => s.id === t.id);
        return Number(original?.sortOrder) === slotValues[i]
          ? Promise.resolve(null)
          : apiPatch(`/tours/${t.id}`, { sortOrder: slotValues[i] });
      }));
    } catch (e) {
      // Roll back to server truth and let the caller surface the error.
      lastJsonRef.current['tours'] = '';
      await fetchPublic();
      throw e;
    }
    await logAdminAction('Reorder Tour', `Moved tour ${tour.title} ${direction === 'top' ? 'to the top of' : direction} its section`);
    await fetchPublic();
  };

  // Move a tour to a different section (category); it is appended at the end
  // of the destination section so it never displaces existing ordering there.
  const moveTourToCategory = async (id: string, category: string) => {
    const tour = tours.find(t => t.id === id);
    if (!tour || tour.category === category) return;
    let maxSort = 0;
    tours.forEach(t => {
      const so = Number(t.sortOrder);
      if (Number.isFinite(so) && so > maxSort) maxSort = so;
    });
    // Optimistic: the tour shows up under its new section immediately.
    const optimistic = tours.map(t => (t.id === id ? { ...t, category, sortOrder: maxSort + 1 } : t));
    setIfChanged('tours', optimistic, setTours);
    try {
      await apiPatch(`/tours/${id}`, { category, sortOrder: maxSort + 1 });
    } catch (e) {
      lastJsonRef.current['tours'] = '';
      await fetchPublic();
      throw e;
    }
    await logAdminAction('Move Tour Section', `Moved tour ${tour.title} to section: ${category}`);
    await fetchPublic();
  };

  // --- Offer CRUD ---------------------------------------------------
  const addOffer = async (offer: Omit<SpecialOffer, 'id'>) => {
    await apiPost('/offers', offer);
    await logAdminAction('Add Special Offer', `Successfully added flash campaign offer: ${offer.title}`);
    await fetchPublic();
  };
  const updateOffer = async (id: string, offer: Partial<SpecialOffer>) => {
    await apiPut(`/offers/${id}`, offer);
    await logAdminAction('Update Special Offer', `Successfully updated promotional details of offer: ${offer.title || id}`);
    await fetchPublic();
  };
  const deleteOffer = async (id: string) => {
    await apiDelete(`/offers/${id}`);
    await logAdminAction('Delete Special Offer', `Successfully deleted promotional campaign under ID: ${id}`);
    await fetchPublic();
  };

  // --- Booking CRUD -------------------------------------------------
  const addBooking = async (booking: Omit<BookingModel, 'id' | 'status' | 'createdAt'>) => {
    const created = await apiPost<{ id: string }>('/bookings', booking);
    await fetchAdmin();
    return created?.id || '';
  };
  const updateBookingStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    await apiPatch(`/bookings/${id}`, { status });
    await logAdminAction('Update Booking Status', `Successfully modified status of booking request ${id} to ${status}`);
    await fetchAdmin();
  };
  const deleteBooking = async (id: string) => {
    await apiDelete(`/bookings/${id}`);
    await logAdminAction('Delete Booking Record', `Successfully cleared booking record under ID: ${id}`);
    await fetchAdmin();
  };

  // --- Registration CRUD -------------------------------------------
  // Public: any visitor can register for a trip (no admin/auth required).
  const addRegistration = async (registration: Omit<RegistrationModel, 'id' | 'createdAt'>) => {
    await apiPost('/registrations', registration);
    await fetchAdmin();
  };
  const deleteRegistration = async (id: string) => {
    await apiDelete(`/registrations/${id}`);
    await logAdminAction('Delete Registration', `Successfully removed trip registration under ID: ${id}`);
    await fetchAdmin();
  };

  // --- Homepage gallery slots ---------------------------------------
  const updateGalleryItem = async (id: string, patch: Partial<GalleryItemModel>) => {
    await apiPut(`/gallery/${id}`, patch);
    await logAdminAction('Update Gallery Card', `Successfully updated homepage gallery card: ${patch.title || id}`);
    await fetchPublic();
  };

  // --- Media CRUD ---------------------------------------------------
  const addMediaAsset = async (newMedia: Omit<MediaModel, 'id' | 'uploadedBy' | 'createdAt'>) => {
    await apiPost('/media', { ...newMedia, uploadedBy: profile?.name || 'Anonymous' });
    await logAdminAction('Add Media Asset', `Successfully registered a new gallery media asset: ${newMedia.name}`);
    await fetchPublic();
  };
  const deleteMediaAsset = async (id: string) => {
    await apiDelete(`/media/${id}`);
    await logAdminAction('Delete Media Asset', `Successfully deleted gallery media asset with ID: ${id}`);
    await fetchPublic();
  };

  // --- Settings -----------------------------------------------------
  const updateSettings = async (newSettings: Partial<SettingModel>) => {
    await apiPost('/settings', { ...settings, ...newSettings });
    await logAdminAction('Update System Settings', 'Successfully saved new global administrative configurations.');
    await fetchPublic();
  };

  // --- Users --------------------------------------------------------
  const loadAllUsers = async () => {
    try {
      const list = await apiGet<any[]>('/users');
      if (list && list.length > 0) {
        setAllUsers(list);
      } else if (profile) {
        setAllUsers([profile]);
      } else {
        setAllUsers([]);
      }
    } catch {
      setAllUsers(profile ? [profile] : []);
    }
  };
  const updateUserRoleInDb = async (targetUserId: string, role: UserRole) => {
    await apiPatch(`/users/${targetUserId}`, { role });
    await logAdminAction('Modify User Role', `Successfully modified administrative role status of user ${targetUserId} to: ${role}`);
    await loadAllUsers();
  };

  return (
    <DbContext.Provider value={{
      categories,
      tours,
      offers,
      galleryItems,
      bookings,
      registrations,
      activityLogs,
      media,
      settings,
      dbLoaded,
      isDbEmpty,
      seedDatabase,
      refresh: refreshAll,
      addCategory,
      updateCategory,
      deleteCategory,
      addTour,
      updateTour,
      deleteTour,
      moveTour,
      moveTourToCategory,
      addOffer,
      updateOffer,
      deleteOffer,
      addBooking,
      updateBookingStatus,
      deleteBooking,
      addRegistration,
      deleteRegistration,
      updateGalleryItem,
      addMediaAsset,
      deleteMediaAsset,
      updateSettings,
      logAdminAction,
      allUsers,
      loadAllUsers,
      updateUserRoleInDb
    }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
}
