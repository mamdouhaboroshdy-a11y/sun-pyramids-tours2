import React, { useState, useEffect } from 'react';
import { Percent, Clock, MapPin, Heart, Flame } from 'lucide-react';
import { useDb, SpecialOffer } from '../context/DbContext';

interface OffersSectionProps {
  onBook: (offer: SpecialOffer) => void;
}

export default function OffersSection({ onBook }: OffersSectionProps) {
  const { offers } = useDb();
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>({});

  const [secondsLeft, setSecondsLeft] = useState<number>(3 * 24 * 3600 + 12 * 3600 + 44 * 60 + 55);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return {
      days: days.toString().padStart(2, '0'),
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    };
  };

  const { days, hours, minutes, seconds } = formatTime(secondsLeft);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedStatus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="offers" className="py-20 sm:py-24 bg-gray-50/50 relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block with Orange Percentage Icon */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full border border-orange-200/40 mb-3 animate-bounce">
            <Percent className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-orange-850 uppercase tracking-widest font-mono">Flash Discounts / Hot Deals</span>
          </div>
          <h2 className="text-3.5xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight flex items-center justify-center gap-2">
            ✨ Special Offers For You
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium max-w-2xl mx-auto mt-2 font-sans">
            Save massive value now; we have applied a limited discount on top boutique hotels, day-excursions, and custom Spring itineraries!
          </p>
        </div>

        {/* Special Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {offers.map((offer) => {
            const isSaved = savedStatus[offer.id] || false;
            return (
              <div 
                key={offer.id} 
                onClick={() => onBook(offer as any)}
                className="bg-white rounded-[28px] border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-200 overflow-hidden flex flex-col justify-between group h-full relative cursor-pointer"
              >
                
                {/* Visual Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
                  <img 
                    src={offer.image} 
                    alt={offer.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Red/Orange Special Offer pill banner */}
                  <div className="absolute top-3.5 left-3.5 bg-red-500 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
                    <Flame className="w-3.5 h-3.5 text-orange-200 fill-orange-200" />
                    <span>{offer.badge || 'Special Offer'}</span>
                  </div>

                  {/* Floating heart save */}
                  <button 
                    onClick={(e) => toggleSave(offer.id, e)}
                    className="absolute top-3.5 right-3.5 bg-white/95 p-2 rounded-full shadow-md hover:scale-105 transition active:scale-95 cursor-pointer z-10"
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug tracking-tight hover:text-[#123da5] transition line-clamp-2">
                      {offer.title}
                    </h3>

                    {/* Meta labels */}
                    <div className="flex flex-wrap gap-1.5">
                      {offer.cities && (
                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-[10px] sm:text-[11px] font-extrabold px-3 py-1 rounded-full">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          {offer.cities}
                        </span>
                      )}
                      {offer.location && (
                        <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] sm:text-[11px] font-extrabold px-3 py-1 rounded-full">
                          {offer.location}
                        </span>
                      )}
                    </div>

                    {/* Ticking split countdown boxes matching design */}
                    <div className="bg-red-50/70 border border-red-100 rounded-2xl p-2.5 flex items-center justify-around text-center select-none shadow-xs font-sans">
                      <div className="flex flex-col">
                        <span className="text-[13px] sm:text-[14px] font-black text-red-600 leading-none">{offer.countdownDays || days}</span>
                        <span className="text-[8.5px] font-extrabold text-[#f16c6c] uppercase py-0.5 tracking-wider font-mono">Days</span>
                      </div>
                      <div className="text-red-200 font-bold">:</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] sm:text-[14px] font-black text-red-600 leading-none">{hours}</span>
                        <span className="text-[8.5px] font-extrabold text-[#f16c6c] uppercase py-0.5 tracking-wider font-mono">Hrs</span>
                      </div>
                      <div className="text-red-200 font-bold">:</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] sm:text-[14px] font-black text-red-650 leading-none">{minutes}</span>
                        <span className="text-[8.5px] font-extrabold text-[#f16c6c] uppercase py-0.5 tracking-wider font-mono">Mins</span>
                      </div>
                      <div className="text-red-200 font-bold">:</div>
                      <div className="flex flex-col">
                        <span className="text-[13px] sm:text-[14px] font-black text-red-700 leading-none">{seconds}</span>
                        <span className="text-[8.5px] font-extrabold text-[#f16c6c] uppercase py-0.5 tracking-wider font-mono">Secs</span>
                      </div>
                    </div>
                  </div>

                  {/* Price display with crossed out initial value */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Start From</span>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[#123da5] font-black text-base sm:text-lg">
                          ${offer.price}
                        </span>
                        {offer.originalPrice > 0 && (
                          <span className="text-red-400 text-xs line-through font-semibold leading-none">
                            ${offer.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border border-gray-150 px-3 py-1.5 rounded-full text-xs font-bold text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-[#123da5]" />
                      <span>{offer.duration || 'Flexible'}</span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
          {offers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 text-xs font-semibold">
              No active promotional offers are currently available. Enjoy exploring other sections!
            </div>
          )}
        </div>

        <div className="relative mt-16 flex items-center justify-center">
          <div className="absolute inset-x-0 h-[1.5px] bg-gray-200/80 z-0" />
          <div className="absolute left-0 w-3 h-3 rounded-full bg-gray-300 z-10 hidden sm:block" />
          <div className="absolute right-0 w-3 h-3 rounded-full bg-gray-300 z-10 hidden sm:block" />
          <div className="bg-white px-4 relative z-10 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
            Sun Pyramids Flash Escape Deals
          </div>
        </div>

      </div>
    </section>
  );
}
