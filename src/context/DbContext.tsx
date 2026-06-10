import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth, UserRole } from './AuthContext';
import { TourPackage, SpecialOffer } from '../types';
import { EASTER_TOURS, CATEGORIZED_TOURS, SPECIAL_OFFERS, GALLERY_ITEMS } from '../data';

// Extended Interfaces for Database Dynamic entries
export interface CategoryModel {
  id: string; // e.g. recommended, one_day, nile_cruises
  name: string; // Dynamic arabic name
  slug: string;
  icon: string;
}

export type { SpecialOffer } from '../types';

export interface TourModel extends TourPackage {
  description?: string;
  category?: string;
  isEasterSpecial?: boolean;
  isPopular?: boolean;
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
  bookings: BookingModel[];
  activityLogs: ActivityLogModel[];
  media: MediaModel[];
  settings: SettingModel;
  dbLoaded: boolean;
  isDbEmpty: boolean;
  
  // Seeder
  seedDatabase: () => Promise<void>;

  // Category CRUD
  addCategory: (category: Omit<CategoryModel, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<CategoryModel>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Tour CRUD
  addTour: (tour: Omit<TourModel, 'id'>) => Promise<void>;
  updateTour: (id: string, tour: Partial<TourModel>) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;

  // Offer CRUD
  addOffer: (offer: Omit<SpecialOffer, 'id'>) => Promise<void>;
  updateOffer: (id: string, offer: Partial<SpecialOffer>) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;

  // Booking CRUD
  addBooking: (booking: Omit<BookingModel, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  updateBookingStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  // Media CRUD
  addMediaAsset: (media: Omit<MediaModel, 'id' | 'uploadedBy' | 'createdAt'>) => Promise<void>;
  deleteMediaAsset: (id: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<SettingModel>) => Promise<void>;

  // Activity Logger
  logAdminAction: (action: string, details: string) => Promise<void>;

  // Users management in Admin Dashboard
  allUsers: any[];
  loadAllUsers: () => Promise<void>;
  updateUserRoleInDb: (targetUserId: string, role: UserRole) => Promise<void>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

// Initial Fallbacks to display if Firestore not yet seeded
const DEFAULT_CATEGORIES: CategoryModel[] = [
  { id: 'recommended', name: 'Recommended', slug: 'recommended', icon: 'Compass' },
  { id: 'one_day', name: 'One Day', slug: 'one_day', icon: 'Sun' },
  { id: 'multi_days', name: 'Multi-Day', slug: 'multi_days', icon: 'CalendarDays' },
  { id: 'nile_cruises', name: 'Nile Cruises', slug: 'nile_cruises', icon: 'Ship' },
  { id: 'shore_excursions', name: 'Shore Excursions', slug: 'shore_excursions', icon: 'Anchor' }
];

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

export function DbProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  
  const [categories, setCategories] = useState<CategoryModel[]>(DEFAULT_CATEGORIES);
  const [tours, setTours] = useState<TourModel[]>([]);
  const [offers, setOffers] = useState<SpecialOffer[]>(SPECIAL_OFFERS);
  const [bookings, setBookings] = useState<BookingModel[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogModel[]>([]);
  const [media, setMedia] = useState<MediaModel[]>([]);
  const [settings, setSettings] = useState<SettingModel>(DEFAULT_SETTINGS);
  
  const [dbLoaded, setDbLoaded] = useState(false);
  const [isDbEmpty, setIsDbEmpty] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Set up Firebase Real-time listeners
  useEffect(() => {
    // 1. Dynamic loaders for public collections (always open)
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      if (!snap.empty) {
        const catList = snap.docs.map(doc => {
          const data = doc.data() as CategoryModel;
          let name = data.name || '';
          
          // Map category IDs or slugs directly to clean English versions
          const slugKey = data.slug || doc.id;
          if (slugKey === 'recommended') name = 'Recommended';
          else if (slugKey === 'one_day' || slugKey === 'one_days') name = 'One Day';
          else if (slugKey === 'multi_days' || slugKey === 'multi_day') name = 'Multi-Day';
          else if (slugKey === 'nile_cruises' || slugKey === 'nile_cruise') name = 'Nile Cruises';
          else if (slugKey === 'shore_excursions' || slugKey === 'shore_excursion') name = 'Shore Excursions';
          else {
            // Strip any Arabic text from dynamic names if they have leftovers
            name = name.replace(/[\u0600-\u06FF]+/g, '').trim();
            name = name.replace(/^\(|\)$/g, '').replace(/\s*\(\s*\)\s*/g, '').trim();
            name = name.replace(/\s*\((.*?)\)/g, '$1').trim();
            if (!name) name = slugKey;
          }
          
          return { ...data, id: doc.id, name };
        });
        setCategories(catList);
        setIsDbEmpty(false);
      } else {
        // Self-heal/Auto-seed empty categories
        DEFAULT_CATEGORIES.forEach(async (cat) => {
          await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
        });
        setCategories(DEFAULT_CATEGORIES);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    const fixImageUrl = (url: string): string => {
      if (!url) return url;
      if (url.includes('photo-1547127796-06bb04e3b3c4')) {
        return 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80';
      }
      if (url.includes('photo-1568292850551-4c7268d98c0d')) {
        return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';
      }
      return url;
    };

    const unsubTours = onSnapshot(collection(db, 'tours'), (snap) => {
      const staticList: TourModel[] = [];
      EASTER_TOURS.forEach(t => staticList.push({ ...t, isEasterSpecial: true }));
      Object.entries(CATEGORIZED_TOURS).forEach(([catKey, items]) => {
        items.forEach(t => staticList.push({ ...t, category: catKey, isEasterSpecial: false }));
      });

      const tourList = snap.docs.map(doc => {
        const data = doc.data() as TourModel;
        return {
          ...data,
          id: doc.id,
          image: fixImageUrl(data.image)
        } as TourModel;
      });

      if (!snap.empty) {
        setIsDbEmpty(false);
        // Find any default tours that are missing from Firestore and write them
        const loadedIds = new Set(tourList.map(t => t.id));
        const missingTours = staticList.filter(t => !loadedIds.has(t.id));
        
        if (missingTours.length > 0) {
          missingTours.forEach(async (tour) => {
            await setDoc(doc(db, 'tours', tour.id), tour, { merge: true });
          });
        }
        
        const combined = [...tourList, ...missingTours];
        setTours(combined);
      } else {
        // Build fallback list from static data and auto-seed
        staticList.forEach(async (tour) => {
          await setDoc(doc(db, 'tours', tour.id), tour, { merge: true });
        });
        setTours(staticList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tours');
    });

    const unsubOffers = onSnapshot(collection(db, 'offers'), (snap) => {
      const offerList = snap.docs.map(doc => {
        const data = doc.data() as SpecialOffer;
        return {
          ...data,
          id: doc.id,
          image: fixImageUrl(data.image)
        } as SpecialOffer;
      });

      if (!snap.empty) {
        // Find any default offers that are missing from Firestore and write them
        const loadedIds = new Set(offerList.map(o => o.id));
        const missingOffers = SPECIAL_OFFERS.filter(o => !loadedIds.has(o.id));
        
        if (missingOffers.length > 0) {
          missingOffers.forEach(async (offer) => {
            await setDoc(doc(db, 'offers', offer.id), offer, { merge: true });
          });
        }
        
        const combined = [...offerList, ...missingOffers];
        // Sort to preserve original order o1, o2...
        combined.sort((a, b) => a.id.localeCompare(b.id));
        setOffers(combined);
      } else {
        // Self-heal/Auto-seed empty offers
        SPECIAL_OFFERS.forEach(async (offer) => {
          await setDoc(doc(db, 'offers', offer.id), offer, { merge: true });
        });
        setOffers(SPECIAL_OFFERS);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'offers');
    });

    const unsubMedia = onSnapshot(collection(db, 'media'), (snap) => {
      if (!snap.empty) {
        const mediaList = snap.docs.map(doc => {
          const data = doc.data() as MediaModel;
          return {
            ...data,
            id: doc.id,
            url: fixImageUrl(data.url)
          } as MediaModel;
        });
        setMedia(mediaList);
      } else {
        // Pre-fill and auto-seed media list from gallery items
        const defaultMediaList: MediaModel[] = GALLERY_ITEMS.map((g) => ({
          id: g.id,
          url: g.image,
          name: g.title,
          uploadedBy: 'System Seeder',
          createdAt: new Date().toISOString()
        }));
        defaultMediaList.forEach(async (med) => {
          await setDoc(doc(db, 'media', med.id), med, { merge: true });
        });
        setMedia(defaultMediaList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'media');
    });

    const unsubSettings = onSnapshot(collection(db, 'settings'), (snap) => {
      if (!snap.empty) {
        const settDoc = snap.docs[0];
        const data = settDoc.data() as SettingModel;
        let promo = data.promoBannerText || '';
        // If it contains Arabic, replace it with English
        if (/[\u0600-\u06FF]/.test(promo)) {
          promo = 'Book any tour and get another day excursion completely free of charge!';
        }
        setSettings({ ...DEFAULT_SETTINGS, ...data, promoBannerText: promo } as SettingModel);
      } else {
        setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS, { merge: true }).catch(console.error);
        setSettings(DEFAULT_SETTINGS);
      }
      setDbLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    // 2. Dynamic loaders for administrative data (only loaded when authorized)
    let unsubBookings = () => {};
    let unsubLogs = () => {};

    const isAdmin = profile && (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'editor');
    if (isAdmin) {
      unsubBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
        const bookList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingModel));
        setBookings(bookList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      });

      unsubLogs = onSnapshot(query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc')), (snap) => {
        const logList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogModel));
        setActivityLogs(logList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'activityLogs');
      });
    } else {
      setBookings([]);
      setActivityLogs([]);
    }

    return () => {
      unsubCategories();
      unsubTours();
      unsubOffers();
      unsubMedia();
      unsubSettings();
      unsubBookings();
      unsubLogs();
    };
  }, [profile?.role]);

  // Auto-seed if database is empty on load
  useEffect(() => {
    if (dbLoaded && isDbEmpty) {
      console.log('Firebase database is empty. Auto-seeding default collections...');
      seedDatabase().catch((e) => {
        console.error('Auto-seeding failed on empty database:', e);
      });
    }
  }, [dbLoaded, isDbEmpty]);

  // System Action Logger
  const logAdminAction = async (action: string, details: string) => {
    if (!profile) return;
    const logId = `log_${Date.now()}`;
    const path = `activityLogs/${logId}`;
    try {
      await setDoc(doc(db, 'activityLogs', logId), {
        id: logId,
        userId: profile.id,
        userEmail: profile.email,
        userName: profile.name,
        action,
        details,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // Seeder
  const seedDatabase = async () => {
    try {
      // 1. Seed Categories
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
      }

      // 2. Seed Tours
      const staticTours: TourModel[] = [];
      EASTER_TOURS.forEach(t => staticTours.push({ ...t, isEasterSpecial: true }));
      Object.entries(CATEGORIZED_TOURS).forEach(([catKey, items]) => {
        items.forEach(t => staticTours.push({ ...t, category: catKey, isEasterSpecial: false }));
      });
      for (const tour of staticTours) {
        await setDoc(doc(db, 'tours', tour.id), tour, { merge: true });
      }

      // 3. Seed Offers
      for (const offer of SPECIAL_OFFERS) {
        await setDoc(doc(db, 'offers', offer.id), offer, { merge: true });
      }

      // 4. Seed Settings
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS, { merge: true });

      // 5. Seed Media list
      await Promise.all(GALLERY_ITEMS.map(async (g) => {
        await setDoc(doc(db, 'media', g.id), {
          id: g.id,
          url: g.image,
          name: g.title,
          uploadedBy: 'System Seeder',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }));

      // Log success
      await logAdminAction('Initialize Database', 'Database has been successfully initialized and seeded with demo data packages.');
      setIsDbEmpty(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'all_collections');
    }
  };

  // Category CRUD
  const addCategory = async (category: Omit<CategoryModel, 'id'>) => {
    const id = `cat_${Date.now()}`;
    const path = `categories/${id}`;
    const newCat = { id, ...category };
    try {
      await setDoc(doc(db, 'categories', id), newCat);
      await logAdminAction('Add New Category', `Successfully added category: ${category.name}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const updateCategory = async (id: string, category: Partial<CategoryModel>) => {
    const path = `categories/${id}`;
    try {
      await setDoc(doc(db, 'categories', id), category, { merge: true });
      await logAdminAction('Update Category', `Successfully updated category: ${category.name || id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteCategory = async (id: string) => {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
      await logAdminAction('Delete Category', `Successfully deleted category with ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Tour CRUD
  const addTour = async (tour: Omit<TourModel, 'id'>) => {
    const id = `tour_${Date.now()}`;
    const path = `tours/${id}`;
    const newTour = { id, ...tour };
    try {
      await setDoc(doc(db, 'tours', id), newTour);
      await logAdminAction('Add New Tour', `Successfully added tour: ${tour.title}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const updateTour = async (id: string, tour: Partial<TourModel>) => {
    const path = `tours/${id}`;
    try {
      await setDoc(doc(db, 'tours', id), tour, { merge: true });
      await logAdminAction('Update Tour Details', `Successfully updated details of tour: ${tour.title || id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteTour = async (id: string) => {
    const path = `tours/${id}`;
    try {
      await deleteDoc(doc(db, 'tours', id));
      await logAdminAction('Delete Tour Package', `Successfully deleted tour package catalog under ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Offer CRUD
  const addOffer = async (offer: Omit<SpecialOffer, 'id'>) => {
    const id = `offer_${Date.now()}`;
    const path = `offers/${id}`;
    const newOffer = { id, ...offer };
    try {
      await setDoc(doc(db, 'offers', id), newOffer);
      await logAdminAction('Add Special Offer', `Successfully added flash campain offer: ${offer.title}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const updateOffer = async (id: string, offer: Partial<SpecialOffer>) => {
    const path = `offers/${id}`;
    try {
      await setDoc(doc(db, 'offers', id), offer, { merge: true });
      await logAdminAction('Update Special Offer', `Successfully updated promotional details of offer: ${offer.title || id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteOffer = async (id: string) => {
    const path = `offers/${id}`;
    try {
      await deleteDoc(doc(db, 'offers', id));
      await logAdminAction('Delete Special Offer', `Successfully deleted promotional campaign under ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Booking CRUD
  const addBooking = async (booking: Omit<BookingModel, 'id' | 'status' | 'createdAt'>) => {
    const id = `booking_${Date.now()}`;
    const path = `bookings/${id}`;
    const newBooking: BookingModel = {
      id,
      ...booking,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'bookings', id), newBooking);
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const updateBookingStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    const path = `bookings/${id}`;
    try {
      await setDoc(doc(db, 'bookings', id), { status }, { merge: true });
      await logAdminAction('Update Booking Status', `Successfully modified status of booking request ${id} to ${status}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteBooking = async (id: string) => {
    const path = `bookings/${id}`;
    try {
      await deleteDoc(doc(db, 'bookings', id));
      await logAdminAction('Delete Booking Record', `Successfully cleared booking record under ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Media CRUD
  const addMediaAsset = async (newMedia: Omit<MediaModel, 'id' | 'uploadedBy' | 'createdAt'>) => {
    const id = `media_${Date.now()}`;
    const path = `media/${id}`;
    const item = {
      id,
      ...newMedia,
      uploadedBy: profile?.name || 'Anonymous',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'media', id), item);
      await logAdminAction('Add Media Asset', `Successfully registered a new gallery media image: ${newMedia.name}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteMediaAsset = async (id: string) => {
    const path = `media/${id}`;
    try {
      await deleteDoc(doc(db, 'media', id));
      await logAdminAction('Delete Media Asset', `Successfully deleted gallery media image with ID: ${id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<SettingModel>) => {
    const path = 'settings/general';
    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings, { merge: true });
      await logAdminAction('Update System Settings', 'Successfully saved new global administrative configurations.');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // Load all user profiles for Super Admin
  const loadAllUsers = async () => {
    try {
      if (profile && profile.id === 'admin_virtual_super') {
        const mockUsersList = [
          {
            id: 'admin_virtual_super',
            email: 'admin@sunpyramidstours.com',
            name: 'System Leader (Super Admin)',
            role: 'super_admin' as UserRole,
            createdAt: new Date().toISOString()
          }
        ];
        setAllUsers(mockUsersList);
        return;
      }
      const snap = await getDocs(collection(db, 'users'));
      const usrs = snap.docs.map(doc => doc.data());
      setAllUsers(usrs);
    } catch (e) {
      if (profile) {
        setAllUsers([profile]);
      } else {
        setAllUsers([]);
      }
    }
  };

  const updateUserRoleInDb = async (targetUserId: string, role: UserRole) => {
    const path = `users/${targetUserId}`;
    try {
      await setDoc(doc(db, 'users', targetUserId), { role }, { merge: true });
      await logAdminAction('Modify User Role', `Successfully modified administrative role status of user ${targetUserId} to: ${role}`);
      await loadAllUsers(); // Reload lists
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  return (
    <DbContext.Provider value={{
      categories,
      tours,
      offers,
      bookings,
      activityLogs,
      media,
      settings,
      dbLoaded,
      isDbEmpty,
      seedDatabase,
      addCategory,
      updateCategory,
      deleteCategory,
      addTour,
      updateTour,
      deleteTour,
      addOffer,
      updateOffer,
      deleteOffer,
      addBooking,
      updateBookingStatus,
      deleteBooking,
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
