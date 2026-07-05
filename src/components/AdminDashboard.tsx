import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Compass, DollarSign, Calendar, Users,
  Image, FileText, Settings, Plus, Edit2, Trash2, Check,
  AlertTriangle, Play, RefreshCw, Key, ChevronDown, ChevronUp, ChevronsUp, UserCheck, Eye, EyeOff, LogOut
} from 'lucide-react';
import { useDb, CategoryModel, TourModel, BookingModel, MediaModel, SpecialOffer, SettingModel, GalleryItemModel } from '../context/DbContext';
import { useAuth, UserRole } from '../context/AuthContext';
import MediaUploader from './MediaUploader';
import { uploadFiles } from '../lib/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'tours' | 'offers' | 'categories' | 'bookings' | 'registrations' | 'users' | 'media' | 'gallery' | 'logs' | 'settings';

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const { profile, logout } = useAuth();
  const {
    categories, tours, offers, bookings, registrations, activityLogs, media, settings,
    galleryItems, updateGalleryItem,
    seedDatabase, isDbEmpty, dbLoaded,
    addCategory, updateCategory, deleteCategory,
    addTour, updateTour, deleteTour, moveTour, moveTourToCategory,
    addOffer, updateOffer, deleteOffer,
    updateBookingStatus, deleteBooking,
    deleteRegistration,
    addMediaAsset, deleteMediaAsset,
    updateSettings, refresh,
    allUsers, loadAllUsers, updateUserRoleInDb
  } = useDb();

  const [activeTab, setActiveTab] = useState<TabType>('tours');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Forms state
  // 1. Tour Form
  const [tourForm, setTourForm] = useState<Partial<TourModel>>({
    title: '', category: '', duration: '', price: 0, image: '', images: [], videos: [],
    cities: '', location: '', tags: [], isEasterSpecial: false, isPopular: false, description: ''
  });
  const [editingTourId, setEditingTourId] = useState<string | null>(null);

  // 2. Offer Form
  const [offerForm, setOfferForm] = useState<Partial<SpecialOffer>>({
    title: '', image: '', images: [], videos: [], price: 0, originalPrice: 0, cities: '',
    location: '', tags: [], duration: '', badge: 'Special Offer', countdownDays: 10
  });
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // 3. Category Form
  const [categoryForm, setCategoryForm] = useState<Partial<CategoryModel>>({
    name: '', slug: '', icon: 'Compass'
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // 4. Media Form
  const [mediaForm, setMediaForm] = useState({ name: '', url: '' });
  const [mediaUploading, setMediaUploading] = useState(false);

  // 4b. Homepage Gallery Forms (one per fixed slot g1..g5)
  const [galleryForms, setGalleryForms] = useState<{ [id: string]: Partial<GalleryItemModel> }>({});
  const [galleryFormsReady, setGalleryFormsReady] = useState(false);
  const [galleryUploadingId, setGalleryUploadingId] = useState<string | null>(null);

  // 5. Settings Form
  const [settingsForm, setSettingsForm] = useState<SettingModel>({
    siteName: '', phone: '', email: '', whatsapp: '', location: '', facebook: '', instagram: '', promoBannerText: ''
  });

  // Load registered users when clicking on users tab
  useEffect(() => {
    if (activeTab === 'users' && (profile?.role === 'super_admin' || profile?.role === 'admin')) {
      loadAllUsers();
    }
  }, [activeTab, profile]);

  // Sync settings form when settings doc loads
  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  // Populate the gallery slot forms once when the items first load, so the
  // 20s background refresh never overwrites what the admin is typing.
  useEffect(() => {
    if (!galleryFormsReady && galleryItems.length > 0) {
      const forms: { [id: string]: Partial<GalleryItemModel> } = {};
      galleryItems.forEach(g => { forms[g.id] = { title: g.title, category: g.category, image: g.image, videoUrl: g.videoUrl }; });
      setGalleryForms(forms);
      setGalleryFormsReady(true);
    }
  }, [galleryItems, galleryFormsReady]);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Check roles/permissions
  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdminOrSuper = profile?.role === 'super_admin' || profile?.role === 'admin';
  const isEditorOrHigher = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'editor';

  // Every tour on the system, grouped by section — including tours whose
  // section was deleted or never set — so nothing can hide from this list.
  // `tours` is already sorted by display position.
  const adminTourGroups = (() => {
    const groups = categories.map(c => ({ key: c.slug, name: c.name, tours: [] as TourModel[] }));
    const orphans: TourModel[] = [];
    tours.forEach(t => {
      const g = groups.find(gr => gr.key === t.category);
      if (g) g.tours.push(t); else orphans.push(t);
    });
    if (orphans.length > 0) {
      groups.push({ key: '__none__', name: '⚠ No Section — not visible in the category tabs', tours: orphans });
    }
    return groups.filter(g => g.tours.length > 0);
  })();

  // Handler Actions
  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedDatabase();
      showToast('success', 'Sample demo datasets have been successfully seeded with one click!');
    } catch (e: any) {
      showToast('error', e.message || 'Seeding database failed');
    } finally {
      setLoading(false);
    }
  };

  // 1. Tour Operations
  const handleTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    setLoading(true);
    try {
      const tourImages = Array.isArray(tourForm.images) ? tourForm.images : [];
      const tourPayload = {
        title: tourForm.title || '',
        category: tourForm.category || 'recommended',
        duration: tourForm.duration || '',
        price: Number(tourForm.price) || 0,
        image: tourForm.image || tourImages[0] || '',
        images: tourImages,
        videos: Array.isArray(tourForm.videos) ? tourForm.videos : [],
        cities: tourForm.cities || '',
        location: tourForm.location || '',
        tags: Array.isArray(tourForm.tags) ? tourForm.tags : (tourForm.tags as string || '').split(',').map(s => s.trim()).filter(Boolean),
        isEasterSpecial: !!tourForm.isEasterSpecial,
        isPopular: !!tourForm.isPopular,
        description: tourForm.description || '',
        // Preserve visibility when editing; new tours start online
        isOnline: tourForm.isOnline !== false
      };

      if (editingTourId) {
        await updateTour(editingTourId, tourPayload);
        showToast('success', 'Tour package details updated successfully.');
        setEditingTourId(null);
      } else {
        await addTour(tourPayload);
        showToast('success', 'New tour package added to the database successfully.');
      }
      setTourForm({ title: '', category: '', duration: '', price: 0, image: '', images: [], videos: [], cities: '', location: '', tags: [], isEasterSpecial: false, isPopular: false, description: '' });
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTourEdit = (tour: TourModel) => {
    setEditingTourId(tour.id);
    setTourForm(tour);
  };

  const handleTourToggleOnline = async (tour: TourModel) => {
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    const goingOnline = tour.isOnline === false;
    try {
      await updateTour(tour.id, { ...tour, isOnline: goingOnline });
      showToast('success', goingOnline
        ? 'Tour is back ONLINE — customers can see and book it again.'
        : 'Tour is now OFFLINE — hidden from customers until you re-enable it.');
    } catch (e: any) {
      showToast('error', e.message);
    }
  };

  // Homepage Gallery slot operations
  const handleGallerySlotSave = async (id: string) => {
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    const form = galleryForms[id];
    if (!form) return;
    setLoading(true);
    try {
      await updateGalleryItem(id, form);
      showToast('success', 'Homepage gallery card updated successfully.');
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryImageUpload = async (id: string, file: File | null) => {
    if (!file) return;
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    setGalleryUploadingId(id);
    try {
      const uploaded = await uploadFiles([file], profile?.name || 'Admin');
      if (uploaded[0]?.url) {
        setGalleryForms(prev => ({ ...prev, [id]: { ...prev[id], image: uploaded[0].url } }));
        showToast('success', 'Image uploaded — press Save Card to publish it on the site.');
      }
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setGalleryUploadingId(null);
    }
  };

  const handleTourMove = async (id: string, direction: 'up' | 'down' | 'top') => {
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    try {
      await moveTour(id, direction);
      showToast('success', direction === 'top'
        ? '✅ Tour moved to the top of its section.'
        : '✅ Tour order updated successfully.');
    } catch (e: any) {
      showToast('error', `Reorder failed: ${e.message}`);
    }
  };

  const handleTourMoveCategory = async (tour: TourModel, slug: string) => {
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    try {
      await moveTourToCategory(tour.id, slug);
      const target = categories.find(c => c.slug === slug);
      showToast('success', `Tour moved to the "${target?.name || slug}" section.`);
    } catch (e: any) {
      showToast('error', e.message);
    }
  };

  const handleTourDelete = async (id: string) => {
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have permissions to delete resources.');
      return;
    }
    if (window.confirm('Are you sure you want to permanently delete this tour package?')) {
      try {
        await deleteTour(id);
        showToast('success', 'Tour package deleted successfully.');
      } catch (e: any) {
        showToast('error', e.message);
      }
    }
  };

  // 2. Offer Operations
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditorOrHigher) {
      showToast('error', 'Insufficient privileges to add or edit special offers.');
      return;
    }
    setLoading(true);
    try {
      const offerImages = Array.isArray(offerForm.images) ? offerForm.images : [];
      const offerPayload = {
        title: offerForm.title || '',
        image: offerForm.image || offerImages[0] || '',
        images: offerImages,
        videos: Array.isArray(offerForm.videos) ? offerForm.videos : [],
        price: Number(offerForm.price) || 0,
        originalPrice: Number(offerForm.originalPrice) || 0,
        cities: offerForm.cities || '',
        location: offerForm.location || '',
        tags: Array.isArray(offerForm.tags) ? offerForm.tags : (offerForm.tags as string || '').split(',').map(s => s.trim()).filter(Boolean),
        duration: offerForm.duration || '',
        badge: offerForm.badge || 'Special Promo',
        countdownDays: Number(offerForm.countdownDays) || 10
      };

      if (editingOfferId) {
        await updateOffer(editingOfferId, offerPayload);
        showToast('success', 'Special offer details updated successfully.');
        setEditingOfferId(null);
      } else {
        await addOffer(offerPayload);
        showToast('success', 'New special promotional offer added successfully.');
      }
      setOfferForm({ title: '', image: '', images: [], videos: [], price: 0, originalPrice: 0, cities: '', location: '', tags: [], duration: '', badge: 'Special Offer', countdownDays: 10 });
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferEdit = (offer: SpecialOffer) => {
    setEditingOfferId(offer.id);
    setOfferForm(offer);
  };

  // Copy a special deal into the tours catalog so it also appears (and can be
  // reordered / sectioned) like any regular tour.
  const handleAddOfferAsTour = async (offer: SpecialOffer) => {
    if (!isEditorOrHigher) {
      showToast('error', 'You do not have editor permissions to perform this operation.');
      return;
    }
    if (tours.some(t => t.title.trim().toLowerCase() === offer.title.trim().toLowerCase())) {
      showToast('error', 'A tour with this exact title already exists in the tours catalog.');
      return;
    }
    setLoading(true);
    try {
      await addTour({
        title: offer.title,
        image: offer.image,
        images: offer.images && offer.images.length > 0 ? offer.images : [offer.image],
        videos: offer.videos || [],
        cities: offer.cities,
        location: offer.location,
        tags: offer.tags || [],
        duration: offer.duration,
        price: offer.price,
        description: '',
        category: 'recommended',
        isEasterSpecial: false,
        isPopular: false,
        isOnline: true
      });
      showToast('success', `"${offer.title}" was added to the tours catalog (Recommended section). Use the section dropdown to move it anywhere.`);
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferDelete = async (id: string) => {
    if (!isEditorOrHigher) return;
    if (window.confirm('Delete this special offer?')) {
      try {
        await deleteOffer(id);
        showToast('success', 'Special offer deleted successfully.');
      } catch (e: any) {
        showToast('error', e.message);
      }
    }
  };

  // 3. Category Operations
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrSuper) {
      showToast('error', 'You must be an administrator to manage categories.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: categoryForm.name || '',
        slug: categoryForm.slug || '',
        icon: categoryForm.icon || 'Compass'
      };

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        showToast('success', 'Category details updated successfully.');
        setEditingCategoryId(null);
      } else {
        await addCategory(payload);
        showToast('success', 'New category created successfully.');
      }
      setCategoryForm({ name: '', slug: '', icon: 'Compass' });
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!isAdminOrSuper) return;
    if (window.confirm('Delete this category? Associated tour packages may lose their categories.')) {
      try {
        await deleteCategory(id);
        showToast('success', 'Category removed successfully.');
      } catch (e: any) {
        showToast('error', e.message);
      }
    }
  };

  // 4. Media operations
  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditorOrHigher) return;
    if (!mediaForm.name || !mediaForm.url) {
      showToast('error', 'Please enter a valid image name and correct image URL.');
      return;
    }
    setLoading(true);
    try {
      await addMediaAsset(mediaForm);
      showToast('success', 'New media asset registered in the catalog.');
      setMediaForm({ name: '', url: '' });
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaDeviceUpload = async (files: FileList | null) => {
    if (!isEditorOrHigher || !files || files.length === 0) return;
    setMediaUploading(true);
    try {
      // Files are stored on the server and auto-registered in the media catalog.
      await uploadFiles(Array.from(files), profile?.name || 'Admin');
      await refresh();
      showToast('success', `${files.length} file(s) uploaded to the gallery successfully.`);
    } catch (e: any) {
      showToast('error', e.message || 'Upload failed');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleMediaDelete = async (id: string) => {
    if (!isEditorOrHigher) return;
    if (window.confirm('Remove this image from the gallery?')) {
      try {
        await deleteMediaAsset(id);
        showToast('success', 'Image asset removed successfully.');
      } catch (e: any) {
        showToast('error', e.message);
      }
    }
  };

  // 5. Booking operations
  const handleBookingStatusChange = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    if (!isEditorOrHigher) return;
    try {
      await updateBookingStatus(id, status);
      showToast('success', `Booking request status updated to: ${status === 'confirmed' ? 'Confirmed' : status === 'cancelled' ? 'Cancelled' : 'Pending'}`);
    } catch (e: any) {
      showToast('error', e.message);
    }
  };

  const handleBookingDelete = async (id: string) => {
    if (!isSuperAdmin) {
      showToast('error', 'Only Super Admin can permanently delete booking records.');
      return;
    }
    if (window.confirm('Permanently delete this booking record? This action is irreversible!')) {
      try {
        await deleteBooking(id);
        showToast('success', 'Booking record deleted.');
      } catch (e: any) {
        showToast('error', e.message);
      }
    }
  };

  // 6. Settings operations
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrSuper) return;
    setLoading(true);
    try {
      await updateSettings(settingsForm);
      showToast('success', 'Global system settings saved and applied instantly.');
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. Users management
  const handleRoleChange = async (targetId: string, role: UserRole) => {
    if (!isSuperAdmin) {
      showToast('error', 'Only Super Admin holds privileges to update administrative roles.');
      return;
    }
    try {
      await updateUserRoleInDb(targetId, role);
      showToast('success', 'User role upgraded/modified successfully.');
    } catch (e: any) {
      showToast('error', e.message);
    }
  };

  // No backdrop-blur on this overlay: blurring the whole page behind a
  // fullscreen scrollable panel forces constant repaints and makes scrolling heavy.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-slate-900/90 font-sans text-left" dir="ltr">
      <div className="bg-white w-full h-full md:max-w-7xl md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-900 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Sun Pyramids Comprehensive Dashboard</h2>
              <div className="flex items-center gap-2 text-xs text-amber-300 mt-0.5">
                <span>Active Administrator: {profile?.name}</span>
                <span>•</span>
                <span className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-bold uppercase text-[10px]">
                  {profile?.role === 'super_admin' ? 'Super Admin' :
                   profile?.role === 'admin' ? 'Admin' :
                   profile?.role === 'editor' ? 'Editor' : 'User/Client'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {profile && (
              <button 
                onClick={logout} 
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inner Content Split Screen */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-slate-850 text-slate-300 border-r border-slate-200 p-4 space-y-1.5 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto scrollbar-none gap-2 md:gap-0">
            <div className="hidden md:block text-slate-500 uppercase text-[10px] font-bold tracking-wider px-3 mb-3">Tools & Modules</div>
            
            <button 
              onClick={() => setActiveTab('tours')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'tours' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Tours & Products</span>
            </button>

            <button 
              onClick={() => setActiveTab('offers')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'offers' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Special Deals</span>
            </button>

            <button 
              onClick={() => setActiveTab('categories')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'categories' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Categories</span>
            </button>

            <button 
              onClick={() => setActiveTab('bookings')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'bookings' ? 'bg-amber-500 text-slate-950 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap flex items-center justify-between w-full">
                <span>Bookings</span>
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] scale-90">
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('registrations')}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'registrations' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap flex items-center justify-between w-full">
                <span>Registrations</span>
                {registrations.length > 0 && (
                  <span className="bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] scale-90">
                    {registrations.length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'users' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Permissions & Roles</span>
            </button>

            <button 
              onClick={() => setActiveTab('media')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'media' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Image className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Media Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'gallery' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Play className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Homepage Gallery</span>
            </button>

            <button 
              onClick={() => setActiveTab('logs')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'logs' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Audit Logs</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')} 
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'settings' ? 'bg-amber-500 text-slate-900 shadow-md' : 'hover:bg-slate-800 text-slate-300'}`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">General Settings</span>
            </button>

            <div className="hidden md:block pt-6">
              <div className="h-[1px] bg-slate-800 my-4" />
              <div className="p-4 bg-amber-500/5 text-amber-500 border border-amber-500/20 rounded-2xl text-xs space-y-2">
                <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Quick Setup</span>
                <p className="text-[10.5px] leading-relaxed text-amber-105 text-amber-100/70">If your Firestore database setup is empty, seed pre-configured demo tours instantly:</p>
                <button 
                  onClick={handleSeed}
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-slate-900 font-bold py-1.5 rounded-lg text-[11px] transition cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Seed Database'}
                </button>
              </div>
            </div>
          </aside>

          {/* Tab Work Panel View */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            
            {/* Status alerts — fixed to the screen so they are always visible,
                no matter how far down the admin has scrolled. */}
            {(successMsg || errorMsg) && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-md space-y-2 pointer-events-none">
                {successMsg && (
                  <div className="p-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs sm:text-sm shadow-2xl flex items-center gap-2">
                    <Check className="w-5 h-5 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-4 bg-rose-600 text-white rounded-2xl font-semibold text-xs sm:text-sm shadow-2xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: TOURS */}
            {activeTab === 'tours' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-4">
                  <div className="w-full text-left">
                    <h3 className="text-xl font-bold text-slate-900">Tours & Travel Packages ({tours.length})</h3>
                    <p className="text-xs text-gray-500 mt-1">Add, update, or remove tourism catalogs displayed on your homepage catalog directly.</p>
                  </div>
                </div>

                {isEditorOrHigher ? (
                  <form onSubmit={handleTourSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                    <h4 className="font-bold text-sm text-[#123da5] border-b border-gray-100 pb-2">
                      {editingTourId ? '✍️ Edit Existing Tour Details' : '➕ Create New Tour Package'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-650 text-gray-500 mb-1">Tour Package Title (e.g. Cairo Pyramids & Egyptian Museum Guided Tour)</label>
                        <input 
                          type="text" 
                          required
                          value={tourForm.title || ''}
                          onChange={(e) => setTourForm({...tourForm, title: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Starting Price (USD $)</label>
                        <input 
                          type="number" 
                          required
                          value={tourForm.price || ''}
                          onChange={(e) => setTourForm({...tourForm, price: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Category / Classification</label>
                        <select 
                          value={tourForm.category || ''}
                          onChange={(e) => setTourForm({...tourForm, category: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Duration Statement (e.g. 5 Days / 4 Nights)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 4 Days"
                          value={tourForm.duration || ''}
                          onChange={(e) => setTourForm({...tourForm, duration: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Covered Destinations (e.g. Cairo, Giza, Luxor)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Cairo, Luxor, Aswan"
                          value={tourForm.cities || ''}
                          onChange={(e) => setTourForm({...tourForm, cities: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Primary Image URL (optional — auto-filled from your first upload)</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={tourForm.image || ''}
                          onChange={(e) => setTourForm({...tourForm, image: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Photos & Videos (upload multiple from your device)</label>
                        <MediaUploader
                          images={tourForm.images || []}
                          videos={tourForm.videos || []}
                          onImagesChange={(urls) => setTourForm({ ...tourForm, images: urls, image: urls[0] || '' })}
                          onVideosChange={(urls) => setTourForm({ ...tourForm, videos: urls })}
                          uploadedBy={profile?.name || 'Admin'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Primary Route Location Label (e.g. Giza Pyramids)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Cairo"
                          value={tourForm.location || ''}
                          onChange={(e) => setTourForm({...tourForm, location: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tags (Comma-separated variables: Private, Luxury, Desert Safari)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Private Guide, Classic, Hot Balloon, 5-Star"
                          value={Array.isArray(tourForm.tags) ? tourForm.tags.join(', ') : tourForm.tags || ''}
                          onChange={(e) => setTourForm({...tourForm, tags: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-3 flex flex-wrap gap-6 py-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700">
                          <input 
                            type="checkbox" 
                            checked={!!tourForm.isEasterSpecial}
                            onChange={(e) => setTourForm({...tourForm, isEasterSpecial: e.target.checked})}
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>Include in Happy Easter / Spring Special promotional campaigns?</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700">
                          <input 
                            type="checkbox" 
                            checked={!!tourForm.isPopular}
                            onChange={(e) => setTourForm({...tourForm, isPopular: e.target.checked})}
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>Highlight as Highly Recommended / Popular Bundle choice?</span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Complete Itinerary descriptions & program highlights</label>
                        <textarea 
                          rows={3}
                          value={tourForm.description || ''}
                          onChange={(e) => setTourForm({...tourForm, description: e.target.value})}
                          placeholder="Enter daily excursions plan details, inclusions, exclusions..."
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 justify-end">
                      {editingTourId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingTourId(null);
                            setTourForm({ title: '', category: '', duration: '', price: 0, image: '', images: [], videos: [], cities: '', location: '', tags: [], isEasterSpecial: false, isPopular: false, description: '' });
                          }}
                          className="px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-100 font-semibold text-xs text-gray-700 transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#123da5] hover:bg-blue-800 text-white font-extrabold px-8 py-2 rounded-full text-xs transition h-10 shadow-xs cursor-pointer"
                      >
                        {loading ? 'Saving...' : editingTourId ? 'Update Tour Package' : 'Publish Tour Package'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-xl text-xs text-orange-850 font-semibold">
                    * You are logged in with reader permissions. Content creation is restricted to Super Admin or Editor levels.
                  </div>
                )}

                {/* Listing of Existing Tours */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-800">Published Travel Catalogs ({tours.length})</div>
                  <div>
                    {adminTourGroups.map((group) => (
                      <div key={group.key}>
                        <div className="px-6 py-2.5 bg-slate-100/90 border-y border-gray-200 text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between sticky top-0 z-10">
                          <span>{group.name}</span>
                          <span className="text-slate-400 normal-case tracking-normal">{group.tours.length} tours</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                    {group.tours.map((t, tIdx) => (
                      <div key={t.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[10.5px] font-black flex items-center justify-center shrink-0" title="Position inside this section">
                            {tIdx + 1}
                          </span>
                          <img
                            src={t.image}
                            alt={t.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 shadow-inner"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="text-left">
                            <h5 className="font-bold text-slate-950 text-sm leading-snug">{t.title}</h5>
                            <div className="flex flex-wrap gap-2 items-center mt-1 text-xs">
                              <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[10.5px]">💰 ${t.price}</span>
                              <span className="bg-[#123da5]/10 text-[#123da5] font-bold px-2 py-0.5 rounded-md text-[10.5px]">{categories.find(c => c.slug === t.category)?.name || t.category}</span>
                              <span className="text-gray-400 font-medium">⏱️ {t.duration}</span>
                              {t.isEasterSpecial && <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md text-[9.5px]">🌸 Spring Special</span>}
                              {t.isPopular && <span className="bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded-md text-[9.5px]">🔥 Recommended Choice</span>}
                              {t.isOnline === false
                                ? <span className="bg-gray-200 text-gray-600 font-extrabold px-2 py-0.5 rounded-md text-[9.5px]">🚫 Offline — hidden from customers</span>
                                : <span className="bg-green-100 text-green-700 font-extrabold px-2 py-0.5 rounded-md text-[9.5px]">🟢 Online</span>}
                            </div>
                          </div>
                        </div>

                        {isEditorOrHigher && (
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <select
                              value={t.category || ''}
                              onChange={(e) => handleTourMoveCategory(t, e.target.value)}
                              title="Move this tour to another section"
                              className="text-[11px] font-semibold border border-gray-200 bg-white rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[130px]"
                            >
                              {categories.map(c => (
                                <option key={c.id} value={c.slug}>{c.name}</option>
                              ))}
                            </select>
                            <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white">
                              <button
                                onClick={() => handleTourMove(t.id, 'top')}
                                className="p-2 hover:bg-blue-50 text-[#123da5] transition cursor-pointer"
                                title="Move to the top of its section"
                              >
                                <ChevronsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTourMove(t.id, 'up')}
                                className="p-2 hover:bg-blue-50 text-slate-600 transition cursor-pointer border-l border-gray-100"
                                title="Move one step up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTourMove(t.id, 'down')}
                                className="p-2 hover:bg-blue-50 text-slate-600 transition cursor-pointer border-l border-gray-100"
                                title="Move one step down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleTourToggleOnline(t)}
                              className={`p-2 border rounded-full transition cursor-pointer ${t.isOnline === false
                                ? 'border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200'
                                : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                              title={t.isOnline === false ? 'Bring tour back online (visible to customers)' : 'Take tour offline (hide from customers)'}
                            >
                              {t.isOnline === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleTourEdit(t)}
                              className="p-2 border border-amber-200 rounded-full hover:bg-amber-50 text-amber-600 transition cursor-pointer"
                              title="Edit package specifications"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleTourDelete(t.id)}
                              className="p-2 border border-red-200 rounded-full hover:bg-red-50 text-red-600 transition cursor-pointer"
                              title="Delete package catalog"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                        </div>
                      </div>
                    ))}
                    {tours.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-xs">No tours configured. Use Quick Setup to populate template files.</div>
                    )}
                  </div>
                </div>

                {/* Special Deals shown here too, so every trip on the system is
                    visible and controllable from this single page. */}
                {offers.length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 text-sm text-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-bold">💰 Special Deals — Promotional Trips ({offers.length})</span>
                      <span className="text-[10.5px] text-amber-700 font-semibold">These live in the Special Deals tab · listed here so no trip is ever out of sight</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {offers.map((o, oIdx) => (
                        <div key={o.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-[10.5px] font-black flex items-center justify-center shrink-0">
                              {oIdx + 1}
                            </span>
                            <img
                              src={o.image}
                              alt={o.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 shadow-inner"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="text-left">
                              <h5 className="font-bold text-slate-950 text-sm leading-snug">{o.title}</h5>
                              <div className="flex flex-wrap gap-2 items-center mt-1 text-xs">
                                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md text-[10.5px]">💰 ${o.price} <s className="text-emerald-600/60">${o.originalPrice}</s></span>
                                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10.5px]">🏷 {o.badge}</span>
                                <span className="text-gray-400 font-medium">⏱️ {o.duration}</span>
                              </div>
                            </div>
                          </div>

                          {isEditorOrHigher && (
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <button
                                onClick={() => handleAddOfferAsTour(o)}
                                disabled={loading}
                                className="px-3 py-2 text-[11px] font-bold border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50 disabled:opacity-50 transition cursor-pointer"
                                title="Create a copy of this deal inside the tours catalog"
                              >
                                ➕ Add to Tours
                              </button>
                              <button
                                onClick={() => { handleOfferEdit(o); setActiveTab('offers'); }}
                                className="p-2 border border-amber-200 rounded-full hover:bg-amber-50 text-amber-600 transition cursor-pointer"
                                title="Edit this deal (opens the Special Deals tab)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOfferDelete(o.id)}
                                className="p-2 border border-red-200 rounded-full hover:bg-red-50 text-red-600 transition cursor-pointer"
                                title="Delete this deal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1b: HOMEPAGE GALLERY (the 5 "Gallery of Exciting journeys" cards) */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-bold text-slate-900">Homepage Gallery Cards ({galleryItems.length})</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Replace the images and texts of the 5 cards shown in the &quot;Gallery of Exciting journeys&quot; section. Upload a new photo or paste an image URL, then press Save Card.
                  </p>
                </div>

                {!isEditorOrHigher && (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-xs font-semibold">
                    * You are logged in with reader permissions. Content editing is restricted to Super Admin or Editor levels.
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {[...galleryItems].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((g, idx) => {
                    const form = galleryForms[g.id] || {};
                    const slotNames = [
                      'Slot 1 — Large left card (YouTube Resort)',
                      'Slot 2 — Top middle card (Video Blog)',
                      'Slot 3 — TikTok column card',
                      'Slot 4 — Instagram Reel column card',
                      'Slot 5 — Bottom middle card (Facebook Adventure)'
                    ];
                    return (
                      <div key={g.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#123da5]">{slotNames[idx] || `Slot ${idx + 1}`}</h4>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{g.mediaType}</span>
                        </div>

                        <div className="flex items-start gap-4">
                          <img
                            src={form.image || g.image}
                            alt={form.title || g.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            className="w-28 h-28 rounded-2xl object-cover border border-gray-100 shadow-inner shrink-0"
                          />
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Card Title</label>
                              <input
                                type="text"
                                value={form.title ?? g.title}
                                onChange={(e) => setGalleryForms(prev => ({ ...prev, [g.id]: { ...prev[g.id], title: e.target.value } }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Category Label</label>
                              <input
                                type="text"
                                value={form.category ?? g.category}
                                onChange={(e) => setGalleryForms(prev => ({ ...prev, [g.id]: { ...prev[g.id], category: e.target.value } }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Image URL (or upload below)</label>
                          <input
                            type="text"
                            value={form.image ?? g.image}
                            onChange={(e) => setGalleryForms(prev => ({ ...prev, [g.id]: { ...prev[g.id], image: e.target.value } }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Social / Video Link (opens from the card)</label>
                          <input
                            type="text"
                            value={form.videoUrl ?? g.videoUrl}
                            onChange={(e) => setGalleryForms(prev => ({ ...prev, [g.id]: { ...prev[g.id], videoUrl: e.target.value } }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                          />
                        </div>

                        {isEditorOrHigher && (
                          <div className="flex items-center gap-3 pt-1">
                            <label className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition ${galleryUploadingId === g.id ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {galleryUploadingId === g.id ? 'Uploading…' : '📤 Upload New Image'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={galleryUploadingId === g.id}
                                onChange={(e) => { handleGalleryImageUpload(g.id, e.target.files?.[0] || null); e.target.value = ''; }}
                              />
                            </label>
                            <button
                              onClick={() => handleGallerySlotSave(g.id)}
                              disabled={loading}
                              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-xl text-xs transition cursor-pointer"
                            >
                              💾 Save Card
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {galleryItems.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs col-span-full">Gallery cards are loading… open the homepage once if this list stays empty.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: OFFERS */}
            {activeTab === 'offers' && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900">Promotions, Discounts & Campaign Offers ({offers.length})</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure flash campaigns, original vs discount price stamps, and interactive ticking timers.</p>
                </div>

                {isEditorOrHigher && (
                  <form onSubmit={handleOfferSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 hover:shadow-xs space-y-4 text-left">
                    <h4 className="font-bold text-sm text-[#123da5] border-b border-gray-100 pb-2">
                      {editingOfferId ? '✍️ Update Campaign Offer Specifications' : '➕ Create New Flash Deal'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-550 mb-1">Deal Headline (e.g. Luxurious 4-Day Luxor Cruise Discount)</label>
                        <input 
                          type="text" 
                          required
                          value={offerForm.title || ''}
                          onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-550 mb-1">Pill Badge Label (e.g. Save 40%)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Save 35%"
                          value={offerForm.badge || ''}
                          onChange={(e) => setOfferForm({...offerForm, badge: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-550 mb-1">Slashed Discount Price (USD $)</label>
                        <input 
                          type="number" 
                          required
                          value={offerForm.price || ''}
                          onChange={(e) => setOfferForm({...offerForm, price: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-550 mb-1">Raw Original Price (crossed-out stamp; USD $)</label>
                        <input 
                          type="number" 
                          required
                          value={offerForm.originalPrice || ''}
                          onChange={(e) => setOfferForm({...offerForm, originalPrice: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-550 mb-1">Ticking Timer Day Counter (e.g. 5 days remaining)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 15"
                          value={offerForm.countdownDays || ''}
                          onChange={(e) => setOfferForm({...offerForm, countdownDays: Number(e.target.value)})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-550 mb-1">Primary Campaign Image URL (optional — auto-filled from your first upload)</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={offerForm.image || ''}
                          onChange={(e) => setOfferForm({...offerForm, image: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-550 mb-1.5">Campaign Photos & Videos (upload multiple from your device)</label>
                        <MediaUploader
                          images={offerForm.images || []}
                          videos={offerForm.videos || []}
                          onImagesChange={(urls) => setOfferForm({ ...offerForm, images: urls, image: urls[0] || '' })}
                          onVideosChange={(urls) => setOfferForm({ ...offerForm, videos: urls })}
                          uploadedBy={profile?.name || 'Admin'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-550 mb-1">Excursion Schedule duration (e.g. 3 Days / 2 Nights)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 3 Days"
                          value={offerForm.duration || ''}
                          onChange={(e) => setOfferForm({...offerForm, duration: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 justify-end">
                      {editingOfferId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingOfferId(null);
                            setOfferForm({ title: '', image: '', images: [], videos: [], price: 0, originalPrice: 0, cities: '', location: '', tags: [], duration: '', badge: 'Special Offer', countdownDays: 10 });
                          }}
                          className="px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-100 font-semibold text-xs text-gray-700 transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-slate-900 font-bold px-8 py-2 rounded-full text-xs transition h-10 shadow-xs cursor-pointer"
                      >
                        {loading ? 'Saving...' : editingOfferId ? 'Save Changes' : 'Broadcast Campaign'}
                      </button>
                    </div>
                  </form>
                )}

                {/* List offers */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-800">Active Flash Sales & Promotional Listings ({offers.length})</div>
                  <div className="divide-y divide-gray-100">
                    {offers.map((o) => (
                      <div key={o.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <img src={o.image} alt={o.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 shadow-inner" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                          <div className="text-left">
                            <h5 className="font-bold text-slate-950 text-sm leading-snug">{o.title}</h5>
                            <div className="flex flex-wrap gap-2.5 mt-1 text-xs items-center">
                              <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">Campaign: {o.badge}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-slate-900 font-black">Offer Price: ${o.price}</span>
                              <span className="text-gray-400 line-through">List: ${o.originalPrice}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-red-500 font-bold">🕒 {o.countdownDays} days left</span>
                            </div>
                          </div>
                        </div>

                        {isEditorOrHigher && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleOfferEdit(o)} className="p-2 border border-amber-200 rounded-full hover:bg-amber-50 text-amber-600 transition cursor-pointer">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOfferDelete(o.id)} className="p-2 border border-red-200 rounded-full hover:bg-red-50 text-red-600 transition cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900">Manage Categories & Travel Themes ({categories.length})</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure categories to generate dynamic filter pills instantly on the home navigation bar.</p>
                </div>

                {isAdminOrSuper ? (
                  <form onSubmit={handleCategorySubmit} className="bg-white p-6 rounded-3xl border border-gray-200 hover:shadow-xs space-y-4 text-left">
                    <h4 className="font-bold text-sm text-[#123da5] border-b border-gray-100 pb-2">
                      {editingCategoryId ? '✍️ Update Selected Category' : '➕ Create New System Category'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Category Human Title (e.g. Desert Safaris)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Nile Cruises"
                          value={categoryForm.name || ''}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Identifier Slug string (lowercase, no spaces)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. nile_cruises"
                          value={categoryForm.slug || ''}
                          onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Lucide Icon Class</label>
                        <select 
                          value={categoryForm.icon || 'Compass'}
                          onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        >
                          <option value="Compass">Compass (Orienteering)</option>
                          <option value="Sun">Sun (Desert & Daytime Adventures)</option>
                          <option value="Ship">Ship (Nile Ferries & Cruises)</option>
                          <option value="CalendarDays">CalendarDays (Multi-Day Packages)</option>
                          <option value="Anchor">Anchor (Red Sea Coasts & Yachting)</option>
                          <option value="Ticket">Ticket (Sightseeing & Day Passes)</option>
                          <option value="Map">Map (Historical Circuit Tours)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2.5 justify-end">
                      {editingCategoryId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingCategoryId(null);
                            setCategoryForm({ name: '', slug: '', icon: 'Compass' });
                          }}
                          className="px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-100 font-semibold text-xs text-gray-700 transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-slate-900 font-bold px-8 py-2 rounded-full text-xs transition h-10 shadow-xs cursor-pointer"
                      >
                        {loading ? 'Saving...' : editingCategoryId ? 'Save Changes' : 'Publish Category'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-orange-50 rounded-xl text-xs text-orange-850 font-bold">
                    * Category management and structure removal is restricted to Super Admin & Admin profiles.
                  </div>
                )}

                {/* List categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((c) => (
                    <div key={c.id} className="bg-white p-4 rounded-3xl border border-gray-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl font-bold font-mono text-xs">
                          {c.slug}
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-slate-900 text-sm">{c.name}</h5>
                          <span className="text-[10px] text-gray-400 font-mono">Icon: {c.icon}</span>
                        </div>
                      </div>

                      {isAdminOrSuper && (
                        <button 
                          onClick={() => handleCategoryDelete(c.id)} 
                          className="p-1.5 border border-red-100 rounded-full hover:bg-red-50 text-red-600 transition cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: BOOKINGS */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-[#123da5] text-slate-900">Clients Booking Requests & Travel Inquiries ({bookings.length})</h3>
                  <p className="text-xs text-gray-500 mt-1">Review traveler submissions, update verification status, or confirm custom itinerary designs.</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-800 text-left">Incoming Travel Reservations Logs</div>
                  <div className="divide-y divide-gray-100 overflow-x-auto">
                    <table className="w-full text-left divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50 text-slate-700 uppercase text-xs font-bold">
                        <tr>
                          <th className="px-4 py-3">Client Traveler Account</th>
                          <th className="px-4 py-3">Chosen Program / Destination</th>
                          <th className="px-4 py-3 text-center font-mono">Dates</th>
                          <th className="px-4 py-3 text-center">Party Size</th>
                          <th className="px-4 py-3 text-center">Inquiry Flow State</th>
                          {isEditorOrHigher && <th className="px-4 py-3 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white text-left">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-4.5 whitespace-nowrap">
                              <div className="font-bold text-slate-950 text-sm">{b.fullName}</div>
                              <div className="text-gray-400 text-xs mt-0.5">{b.email} | {b.phone}</div>
                            </td>
                            <td className="px-4 py-4.5">
                              <div className="font-bold text-[#123da5] max-w-[240px] truncate">{b.tourTitle || 'Tailored Plan Inquired'}</div>
                              {b.tripType && (
                                <span className="bg-[#123da5]/10 text-[#123da5] font-extrabold px-2 py-0.5 rounded text-[9.5px] mt-1 inline-block">
                                  {b.tripType === 'make' ? 'Tailored Itinerary Request' : b.tripType === 'find' ? 'Bespoke Package Catalog' : 'Luxury Concierge'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4.5 text-center whitespace-nowrap font-sans text-xs">
                              <div className="font-semibold text-slate-800">{b.date || `${b.fromDate} ➡ ${b.toDate}`}</div>
                              {b.fromLocation && <div className="text-[10px] text-gray-400 mt-1">Starting point: {b.fromLocation}</div>}
                            </td>
                            <td className="px-4 py-4.5 text-center font-bold text-slate-900 whitespace-nowrap text-xs">
                              {b.guests} Guests
                            </td>
                            <td className="px-4 py-4.5 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                b.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.status === 'confirmed' ? 'Confirmed' :
                                 b.status === 'cancelled' ? 'Cancelled' : 'Pending Review'}
                              </span>
                            </td>
                            {isEditorOrHigher && (
                              <td className="px-4 py-4.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleBookingStatusChange(b.id, 'confirmed')}
                                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10.5px] font-black transition cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={() => handleBookingStatusChange(b.id, 'cancelled')}
                                    className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10.5px] font-black transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  {isSuperAdmin && (
                                    <button 
                                      onClick={() => handleBookingDelete(b.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition cursor-pointer"
                                      title="Delete record permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">No traveler reservation records available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TRIP REGISTRATIONS */}
            {activeTab === 'registrations' && (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Trip Registrations ({registrations.length})</h3>
                    <p className="text-xs text-gray-500 mt-1">Customers who registered interest per trip — with their contact details and preferred schedule.</p>
                  </div>
                </div>

                {registrations.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center text-gray-400 text-sm shadow-xs">
                    No registrations yet. They will appear here automatically when a customer clicks “Register Now”.
                  </div>
                ) : (
                  (() => {
                    // Group registrations by trip.
                    const groups: { [key: string]: typeof registrations } = {};
                    registrations.forEach((r) => {
                      const key = `${r.tripType}:${r.tripId}`;
                      (groups[key] = groups[key] || []).push(r);
                    });
                    return (
                      <div className="space-y-6">
                        {Object.entries(groups).map(([key, regs]) => {
                          const sample = regs[0];
                          const trip: any = sample.tripType === 'offer'
                            ? offers.find(o => o.id === sample.tripId)
                            : tours.find(t => t.id === sample.tripId);
                          return (
                            <div key={key} className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                              {/* Trip header */}
                              <div className="px-5 py-4 bg-slate-50 border-b border-gray-100 flex items-center gap-4">
                                {trip?.image && (
                                  <img src={trip.image} alt={sample.tripTitle} className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-sm text-slate-900 truncate">{sample.tripTitle}</h4>
                                  <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
                                    <span className="bg-[#123da5]/10 text-[#123da5] font-bold px-2 py-0.5 rounded-md uppercase">{sample.tripType}</span>
                                    {trip?.price != null && <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">💰 ${trip.price}</span>}
                                    {trip?.duration && <span className="text-gray-400 font-medium">⏱️ {trip.duration}</span>}
                                    <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md">{regs.length} registered</span>
                                  </div>
                                </div>
                              </div>

                              {/* Registrations table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase text-[10px] tracking-wider">
                                    <tr>
                                      <th className="px-4 py-3 font-bold">Customer Name</th>
                                      <th className="px-4 py-3 font-bold">Mobile</th>
                                      <th className="px-4 py-3 font-bold">Email</th>
                                      <th className="px-4 py-3 font-bold">Preferred Date</th>
                                      <th className="px-4 py-3 font-bold">Preferred Time</th>
                                      <th className="px-4 py-3 font-bold">Registered On</th>
                                      <th className="px-4 py-3 font-bold text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {regs.map((r) => (
                                      <tr key={r.id} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-bold text-slate-900">{r.fullName}</td>
                                        <td className="px-4 py-3">
                                          <a href={`tel:${r.phone}`} className="text-[#123da5] font-semibold hover:underline">{r.phone}</a>
                                        </td>
                                        <td className="px-4 py-3">
                                          <a href={`mailto:${r.email}`} className="text-[#123da5] font-semibold hover:underline">{r.email}</a>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 font-medium">{r.preferredDate || '—'}</td>
                                        <td className="px-4 py-3 text-slate-700 font-medium">{r.preferredTime || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                          {isEditorOrHigher && (
                                            <button
                                              onClick={async () => {
                                                if (window.confirm('Delete this registration record?')) {
                                                  try { await deleteRegistration(r.id); showToast('success', 'Registration removed.'); }
                                                  catch (e: any) { showToast('error', e.message); }
                                                }
                                              }}
                                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer"
                                              title="Delete registration"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* TAB 5: USERS & PERMISSIONS */}
            {activeTab === 'users' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">User Management & Permissions Panel (RBAC)</h3>
                  <p className="text-xs text-gray-500 mt-1">Super Admins can grant or restrict privileges directly for editors and coordinators safely.</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-800">System Users Account Credentials</div>
                  <div className="divide-y divide-gray-100">
                    {allUsers.map((u: any) => (
                      <div key={u.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            u.role === 'super_admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'editor' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {u.email.slice(0, 2)}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{u.name || 'Sun Pyramids Member'}</span>
                              <span className="text-[10px] text-gray-405 text-gray-400 font-mono font-medium">{u.email}</span>
                            </h5>
                            <span className="text-xs text-gray-400 mt-0.5 inline-block font-medium">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-650 text-gray-500">Configure Role:</span>
                          {isSuperAdmin ? (
                            <select 
                              value={u.role || 'user'}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="px-3 py-1.5 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-semibold text-slate-800 cursor-pointer"
                            >
                              <option value="user">User/Traveler (Read only)</option>
                              <option value="editor">Editor (Can create content)</option>
                              <option value="admin">Admin (Manage Categories/Tours)</option>
                              <option value="super_admin">Super Admin (Full controller)</option>
                            </select>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider scale-95">
                              {u.role === 'super_admin' ? 'Super Admin' :
                               u.role === 'admin' ? 'Admin' :
                               u.role === 'editor' ? 'Editor' : 'User'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {allUsers.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
                        <span>Loading catalog identities...</span>
                        <button onClick={loadAllUsers} className="bg-[#123da5] text-white px-4 py-1.5 rounded-full font-bold text-[11px] hover:bg-blue-700 transition cursor-pointer">Refresh Users List</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: MEDIA MANAGER */}
            {activeTab === 'media' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Media Asset Management Library ({media.length})</h3>
                  <p className="text-xs text-gray-500 mt-1">Upload images & videos from your device, or register a public URL.</p>
                </div>

                {isEditorOrHigher && (
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-3 shadow-xs">
                    <h4 className="font-bold text-sm text-[#123da5] border-b border-gray-100 pb-2">⬆️ Upload Images & Videos From Device</h4>
                    <label
                      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 px-4 text-center transition ${mediaUploading ? 'opacity-60 cursor-wait border-amber-300 bg-amber-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer'}`}
                    >
                      <span className="text-xs font-bold text-slate-700">
                        {mediaUploading ? 'Uploading…' : 'Click to select images & videos (multiple allowed)'}
                      </span>
                      <span className="text-[10px] text-gray-400">Stored on your Railway server · images & videos up to 250MB each</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={mediaUploading}
                        className="hidden"
                        onChange={(e) => { handleMediaDeviceUpload(e.target.files); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                )}

                {isEditorOrHigher && (
                  <form onSubmit={handleMediaSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-xs">
                    <h4 className="font-bold text-sm text-[#123da5] border-b border-gray-100 pb-2">➕ Register New Custom Image Link</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Image Asset Label / Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Nile Cruise Golden Deck View"
                          value={mediaForm.name}
                          onChange={(e) => setMediaForm({...mediaForm, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Direct Web Image Link (URL)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="https://images.unsplash.com/photo-..."
                          value={mediaForm.url}
                          onChange={(e) => setMediaForm({...mediaForm, url: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-slate-900 font-extrabold px-8 py-2 rounded-full text-xs transition shadow-xs cursor-pointer"
                      >
                        {loading ? 'Processing...' : 'Save Media Asset'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Media grid list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {media.map((img) => (
                    <div key={img.id} className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xs flex flex-col relative group">
                      {img.type === 'video' ? (
                        <video src={img.url} className="w-full h-40 object-cover border-b border-gray-100 bg-black" controls muted />
                      ) : (
                        <img src={img.url} alt={img.name} className="w-full h-40 object-cover border-b border-gray-100 bg-gray-50" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                      )}
                      
                      <div className="p-3 text-left flex-1 flex flex-col justify-between">
                        <div>
                          <h6 className="font-bold text-xs text-slate-850 truncate">{img.name}</h6>
                          <div className="text-[10px] text-gray-400 mt-1 truncate font-mono select-all text-left" title="Click to copy image path">
                            {img.url}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 border-t border-gray-50 pt-2 shrink-0 font-medium font-sans">
                          <span>Uploaded by: {img.uploadedBy}</span>
                          {isEditorOrHigher && (
                            <button 
                              onClick={() => handleMediaDelete(img.id)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded transition cursor-pointer"
                              title="Delete media"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: ACTIVITY LOG */}
            {activeTab === 'logs' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Administrative Operations & Audit Activity Logs ({activityLogs.length})</h3>
                  <p className="text-xs text-gray-500 mt-1">Audit administrative actions, setting updates, and catalog changes chronologically.</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-slate-800">Cumulative System Activity Logs</div>
                  <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition text-xs text-left">
                        <div className="bg-[#123da5]/10 text-indigo-700 p-2 rounded-xl shrink-0 font-bold uppercase w-8 h-8 flex items-center justify-center">
                          {log.userName.slice(0, 1)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-slate-950">{log.userName} ({log.userEmail})</span>
                            <span className="text-[10px] text-gray-400 font-mono font-semibold">{log.createdAt}</span>
                          </div>
                          <div className="font-bold text-indigo-700 text-[11px]">{log.action}</div>
                          <p className="text-gray-500 leading-relaxed text-[11px] bg-slate-50 p-2 rounded-lg font-medium">{log.details}</p>
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="p-12 text-center text-gray-400">No events registered in audit logs yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: GENERAL SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Global Settings & Brand configuration</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure metadata strings, promotional coupon headers, support hotlines, and social addresses dynamically.</p>
                </div>

                {isAdminOrSuper ? (
                  <form onSubmit={handleSettingsSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 space-y-6 shadow-xs">
                    <h4 className="font-bold text-sm text-[#123da5] border-b border-gray-100 pb-2">📂 Brand Properties & Contact Coordinates</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Brand Name (Site Name)</label>
                        <input 
                          type="text" 
                          required
                          value={settingsForm.siteName}
                          onChange={(e) => setSettingsForm({...settingsForm, siteName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Direct Support Phone Line</label>
                        <input 
                          type="text" 
                          required
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Corporate Contact Email</label>
                        <input 
                          type="email" 
                          required
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">WhatsApp phone target (Numeric, country code first, e.g. 201207300811)</label>
                        <input 
                          type="text" 
                          required
                          value={settingsForm.whatsapp}
                          onChange={(e) => setSettingsForm({...settingsForm, whatsapp: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Physical Office Address Address</label>
                        <input 
                          type="text" 
                          required
                          value={settingsForm.location}
                          onChange={(e) => setSettingsForm({...settingsForm, location: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Promo Top Banner Coupon text</label>
                        <input 
                          type="text" 
                          required
                          value={settingsForm.promoBannerText}
                          onChange={(e) => setSettingsForm({...settingsForm, promoBannerText: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Facebook Social Profile path</label>
                        <input 
                          type="text" 
                          value={settingsForm.facebook}
                          onChange={(e) => setSettingsForm({...settingsForm, facebook: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Instagram Social Handle path</label>
                        <input 
                          type="text" 
                          value={settingsForm.instagram}
                          onChange={(e) => setSettingsForm({...settingsForm, instagram: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#123da5] hover:bg-blue-800 text-white font-extrabold px-10 py-2.5 rounded-full text-xs transition shadow-md h-12 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>Save Settings Configuration</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-orange-50 rounded-xl text-xs text-slate-850 font-bold">
                    * Modifying structural configuration parameters is restricted to Administrators only.
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
