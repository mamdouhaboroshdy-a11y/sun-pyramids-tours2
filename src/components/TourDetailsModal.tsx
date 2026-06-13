import React from 'react';
import { X, MapPin, Clock, Tag, CalendarCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface TourDetailsData {
  title: string;
  description?: string | null;
  image?: string;
  cities?: number | string;
  location?: string;
  duration?: string;
  tags?: string[];
  price?: number;
}

interface TourDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: TourDetailsData | null;
  /** Optional primary action (e.g. open booking wizard). */
  onBook?: () => void;
}

export default function TourDetailsModal({ isOpen, onClose, tour, onBook }: TourDetailsModalProps) {
  const { t, tt, dir } = useLanguage();
  if (!isOpen || !tour) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans animate-fade-in"
      dir={dir}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <div className="relative h-44 sm:h-56 w-full bg-gray-100 shrink-0">
          {tour.image && (
            <img
              src={tour.image}
              alt={tt(tour.title)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 end-4 text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition cursor-pointer"
            aria-label={t('booking.close')}
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="absolute bottom-4 start-5 end-5 text-white text-lg sm:text-2xl font-black leading-snug drop-shadow-md">
            {tt(tour.title)}
          </h2>
        </div>

        {/* Scrollable body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            {tour.cities != null && tour.cities !== '' && (
              <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-xs font-extrabold px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                {tt(String(tour.cities))}
              </span>
            )}
            {tour.location && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 text-xs font-extrabold px-3 py-1.5 rounded-full">
                {tt(tour.location)}
              </span>
            )}
            {tour.duration && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 text-xs font-extrabold px-3 py-1.5 rounded-full border border-gray-100">
                <Clock className="w-3.5 h-3.5 text-[#123da5]" />
                {tt(tour.duration)}
              </span>
            )}
          </div>

          {/* Tags */}
          {tour.tags && tour.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tour.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  {tt(tag)}
                </span>
              ))}
            </div>
          )}

          {/* Overview / full description */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#123da5]" />
              {t('tour.overview')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {tour.description ? tt(tour.description) : t('tour.noDescription')}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 p-4 flex items-center justify-between gap-3 shrink-0 bg-white">
          {tour.price != null && (
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">{t('tour.from')}</span>
              <span className="text-[#123da5] font-black text-lg">
                ${tour.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 ms-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              {t('booking.close')}
            </button>
            {onBook && (
              <button
                onClick={() => { onBook(); onClose(); }}
                className="px-6 py-2.5 rounded-full text-sm font-extrabold text-white bg-[#123da5] hover:bg-blue-800 transition shadow-sm cursor-pointer"
              >
                {t('tour.bookNow')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
