import React from 'react';
import { useDb } from '../context/DbContext';
import { TourPackage } from '../types';
import TourCard from './TourCard';

interface EasterToursProps {
  onBook: (tour: TourPackage) => void;
}

export default function EasterTours({ onBook }: EasterToursProps) {
  const { tours } = useDb();

  // Filter tours where isEasterSpecial is true
  const easterToursFiltered = tours.filter(t => t.isEasterSpecial);
  
  // If no tour is explicitly marked, fallback to first 4 as demo
  const displayTours = easterToursFiltered.length > 0 ? easterToursFiltered : tours.slice(0, 4);

  return (
    <section id="easter-tours" className="py-16 sm:py-24 bg-gray-50/40 relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f08c1c]" />
            <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Seasonal Holiday / Spring Specials</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Egypt Easter & Spring Tours
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium max-w-2xl mx-auto mt-3 font-sans">
            Experience the ultimate historical adventure during Spring. Enjoy curated packages covering the Pyramids, magnificent Pharaonic temples, and luxury Nile cruises.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTours.map((tour) => (
            <div key={tour.id} className="animate-fade-in">
              <TourCard tour={tour} onBook={onBook} />
            </div>
          ))}
        </div>

        {/* Custom progress visual timeline from screenshot with See More button */}
        <div className="relative mt-16 flex items-center justify-center">
          <div className="absolute inset-x-0 h-[1.5px] bg-gray-200/80 z-0" />
          <div className="absolute left-0 w-3 h-3 rounded-full bg-gray-300 z-10 hidden sm:block" />
          <div className="absolute right-0 w-3 h-3 rounded-full bg-gray-300 z-10 hidden sm:block" />
          <div className="bg-white px-4 relative z-10 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Sun Pyramids Seasonal Handcrafted Specials
          </div>
        </div>

      </div>
    </section>
  );
}
