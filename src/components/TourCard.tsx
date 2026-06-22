import React, { useState } from 'react';
import { Heart, Clock, MapPin, Sparkles, Images, Maximize2 } from 'lucide-react';
import { TourPackage } from '../types';
import { useLanguage } from '../context/LanguageContext';
import MediaGalleryModal from './MediaGalleryModal';
import RegistrationModal from './RegistrationModal';
import TourDetailsModal from './TourDetailsModal';

interface TourCardProps {
  tour: TourPackage;
  onBook: (tour: TourPackage) => void;
}

export default function TourCard({ tour, onBook }: TourCardProps) {
  const { t, tt } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // `description` lives on TourModel (DB) but not the base TourPackage type.
  const description = (tour as { description?: string }).description;

  const galleryImages = (tour.images && tour.images.length > 0) ? tour.images : (tour.image ? [tour.image] : []);
  const galleryVideos = tour.videos || [];
  const mediaCount = galleryImages.length + galleryVideos.length;
  const hasGallery = mediaCount > 1 || galleryVideos.length > 0;

  return (
    <>
    <div
      onClick={() => setDetailsOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') setDetailsOpen(true); }}
      className="bg-white rounded-[26px] border border-gray-100/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group h-full font-sans cursor-pointer">
      
      {/* Image container with floating widgets */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img 
          src={tour.image} 
          alt={tour.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Easter specific stamp as seen in Screenshot 2 */}
        {tour.tags.some(tag => tag.toLowerCase().includes('easter')) && (
          <div className="absolute right-3 bottom-3 bg-[#f08c1c]/90 text-white backdrop-blur-xs text-[10px] sm:text-xs font-black tracking-widest px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            HAPPY EASTER 🥚
          </div>
        )}

        {/* Floating Heart Icon for saving */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          className="absolute top-3.5 right-3.5 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-lg transition duration-200 cursor-pointer active:scale-90"
        >
          <Heart
            className={`w-4 h-4 transition ${
              isSaved
                ? 'text-red-500 fill-red-500 scale-110'
                : 'text-gray-400 hover:text-red-500'
            }`}
          />
        </button>

        {/* View all photos & videos */}
        {hasGallery && (
          <button
            onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}
            className="absolute bottom-3 left-3 bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            <Images className="w-3.5 h-3.5" />
            {t('tour.viewDetails')}
          </button>
        )}
      </div>

      {/* Content wrapper */}
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div className="space-y-3.5">
          {/* Header Title + expand-details icon */}
          <div className="flex items-start gap-1.5">
            <h3
              onClick={() => setDetailsOpen(true)}
              title={tt(tour.title)}
              className="flex-1 text-base font-black text-gray-900 leading-snug tracking-tight hover:text-[#123da5] transition cursor-pointer line-clamp-2"
            >
              {tt(tour.title)}
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); setDetailsOpen(true); }}
              title={t('tour.fullDetails')}
              aria-label={t('tour.fullDetails')}
              className="shrink-0 mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-[#123da5] hover:bg-gray-50 transition cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Location and Category badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-[11px] font-extrabold px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {tt(String(tour.cities))}
            </span>
            {tour.tags.slice(0, 1).map((tag, i) => (
              <span key={i} className="inline-flex bg-amber-50 text-amber-800 text-[11px] font-extrabold px-3 py-1.5 rounded-full">
                {tt(tag)}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing and duration footer */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">
              {t('tour.from')}
            </span>
            <span className="text-[#123da5] font-black text-lg">
              ${tour.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-1 border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-600">
            <Clock className="w-3.5 h-3.5 text-[#123da5]" />
            <span>{tt(tour.duration)}</span>
          </div>
        </div>

        {/* Register Now CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); setRegisterOpen(true); }}
          className="mt-4 w-full bg-[#123da5] hover:bg-blue-800 text-white font-extrabold py-2.5 rounded-full text-xs transition active:scale-[0.99] cursor-pointer shadow-sm"
        >
          {t('tour.registerNow')}
        </button>
      </div>

    </div>

      <RegistrationModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        trip={{ id: tour.id, title: tour.title, type: 'tour' }}
      />

      <MediaGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title={tour.title}
        images={galleryImages}
        videos={galleryVideos}
      />

      <TourDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        tour={{
          title: tour.title,
          description,
          image: tour.image,
          images: galleryImages,
          videos: galleryVideos,
          cities: tour.cities,
          location: tour.location,
          duration: tour.duration,
          tags: tour.tags,
          price: tour.price,
        }}
        onBook={() => onBook(tour)}
      />
    </>
  );
}
