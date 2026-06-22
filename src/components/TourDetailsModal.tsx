import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Star, MapPin, Clock, Users, CalendarCheck, Globe, ChevronDown,
  CheckCircle2, CreditCard, Ticket, Bus, Images,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import MediaGalleryModal from './MediaGalleryModal';

export interface TourDetailsData {
  title: string;
  description?: string | null;
  image?: string;
  images?: string[];
  videos?: string[];
  cities?: number | string;
  location?: string;
  duration?: string;
  tags?: string[];
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  provider?: string;
}

interface TourDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: TourDetailsData | null;
  /** Optional primary action (e.g. open booking wizard). */
  onBook?: () => void;
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80';

/** Deterministic hash so a tour without explicit rating/reviews still shows a
 *  stable, believable value instead of jumping around on every render. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TourDetailsModal({ isOpen, onClose, tour, onBook }: TourDetailsModalProps) {
  const { t, tt, dir } = useLanguage();
  const [galleryOpen, setGalleryOpen] = useState(false);
  if (!isOpen || !tour) return null;

  const images = (tour.images && tour.images.length > 0)
    ? tour.images
    : (tour.image ? [tour.image] : []);
  const videos = tour.videos || [];
  const mainImg = images[0] || tour.image || FALLBACK_IMG;
  const smalls = images.slice(1, 5);
  const totalMedia = images.length + videos.length;

  const h = hashStr(tour.title || 'tour');
  const rating = tour.rating ?? (4.2 + (h % 70) / 100); // 4.20 – 4.89
  const reviews = tour.reviewCount ?? (40 + (h % 860)); // 40 – 899
  const provider = tour.provider || 'Sun Pyramids Tours';

  const hasDiscount = tour.originalPrice != null && tour.price != null && tour.originalPrice > tour.price;

  const onImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMG;
  };

  const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) => (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#123da5]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-gray-900 leading-tight">{title}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>}
      </div>
    </div>
  );

  return createPortal(
    <>
    <div
      className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/70 backdrop-blur-md font-sans animate-fade-in"
      dir={dir}
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-0 sm:p-4">
        <div
          className="bg-white w-full max-w-5xl rounded-none sm:rounded-3xl shadow-2xl border border-gray-100 relative my-0 sm:my-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 end-4 z-10 text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 p-2 rounded-full shadow-sm transition cursor-pointer"
            aria-label={t('booking.close')}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-5 sm:p-8">
            {/* Title */}
            <h1 className="text-2xl sm:text-[2rem] font-black text-[#0a2540] leading-tight tracking-tight pe-12">
              {tt(tour.title)}
            </h1>

            {/* Rating + provider */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1 font-extrabold text-gray-900">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {rating.toFixed(1)}
              </span>
              <span className="underline decoration-gray-300 underline-offset-2 font-semibold">
                {reviews.toLocaleString('en-US')} {t('tour.reviews')}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">
                {t('tour.provider')}: <span className="text-gray-700 font-semibold">{provider}</span>
              </span>
            </div>

            {/* Main grid */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-7">
                {/* Gallery */}
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[260px] sm:h-[380px] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setGalleryOpen(true)}
                    className={`${smalls.length > 0 ? 'col-span-2' : 'col-span-4'} row-span-2 relative group overflow-hidden bg-gray-100 cursor-pointer`}
                  >
                    <img src={mainImg} alt={tt(tour.title)} referrerPolicy="no-referrer" onError={onImg}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                  </button>

                  {smalls.map((src, i) => {
                    const isLast = i === smalls.length - 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setGalleryOpen(true)}
                        className="col-span-1 row-span-1 relative group overflow-hidden bg-gray-100 cursor-pointer"
                      >
                        <img src={src} alt="" referrerPolicy="no-referrer" onError={onImg}
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                        {isLast && totalMedia > 1 && (
                          <span className="absolute bottom-2 end-2 bg-white/95 text-gray-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                            <Images className="w-3.5 h-3.5" />
                            {t('tour.viewAll')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Short description */}
                {(tour.description || true) && (
                  <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                    {tour.description ? tt(tour.description) : t('tour.noDescription')}
                  </p>
                )}

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
                  {(tour.tags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="inline-flex bg-amber-50 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-full">
                      {tt(tag)}
                    </span>
                  ))}
                </div>

                {/* Highlights / feature grid */}
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
                    {t('tour.highlights')}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <Feature icon={<CheckCircle2 className="w-5 h-5" />} title={t('tour.freeCancellation')} desc={t('tour.freeCancellationDesc')} />
                    <Feature icon={<CreditCard className="w-5 h-5" />} title={t('tour.reserveNow')} desc={t('tour.reserveNowDesc')} />
                    {tour.duration && (
                      <Feature icon={<Clock className="w-5 h-5" />} title={`${t('tour.durationLabel')} ${tt(tour.duration)}`} desc={t('tour.viewDetails')} />
                    )}
                    <Feature icon={<Ticket className="w-5 h-5" />} title={t('tour.skipLine')} desc={t('tour.skipLineDesc')} />
                    <Feature icon={<Users className="w-5 h-5" />} title={t('tour.liveTourGuide')} desc={t('tour.liveTourGuideLangs')} />
                    <Feature icon={<Bus className="w-5 h-5" />} title={t('tour.pickupIncluded')} desc={t('tour.pickupDesc')} />
                  </div>
                </div>
              </div>

              {/* Right column — booking sidebar */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-4 border border-gray-200 rounded-2xl p-5 shadow-sm bg-white space-y-4">
                  {/* Price */}
                  <div>
                    {hasDiscount && (
                      <div className="text-sm text-gray-400 font-semibold">
                        {t('tour.from')} <span className="line-through">${fmtPrice(tour.originalPrice!)}</span>
                      </div>
                    )}
                    {tour.price != null && (
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl font-black ${hasDiscount ? 'text-red-600' : 'text-[#123da5]'}`}>
                          ${fmtPrice(tour.price)}
                        </span>
                        <span className="text-sm text-gray-500 font-semibold">{t('tour.perPerson')}</span>
                      </div>
                    )}
                  </div>

                  {/* Selectors (visual, mirror the booking layout) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-700 bg-gray-50/60">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="flex-1 font-semibold">{t('tour.adult')}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-500 bg-gray-50/60">
                      <CalendarCheck className="w-4 h-4 text-gray-500" />
                      <span className="flex-1 font-semibold">{t('tour.selectDate')}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-700 bg-gray-50/60">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="flex-1 font-semibold">English</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => { onBook ? onBook() : undefined; onClose(); }}
                    className="w-full bg-[#123da5] hover:bg-blue-800 text-white font-extrabold py-3.5 rounded-full text-sm transition active:scale-[0.99] cursor-pointer shadow-sm"
                  >
                    {t('tour.checkAvailability')}
                  </button>

                  {/* Trust badges */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">{t('tour.freeCancellation')}</p>
                        <p className="text-[11px] text-gray-500 leading-snug">{t('tour.freeCancellationDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-extrabold text-gray-900">{t('tour.reserveNow')}</p>
                        <p className="text-[11px] text-gray-500 leading-snug">{t('tour.reserveNowDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <MediaGalleryModal
      isOpen={galleryOpen}
      onClose={() => setGalleryOpen(false)}
      title={tour.title}
      images={images}
      videos={videos}
    />
    </>,
    document.body,
  );
}
