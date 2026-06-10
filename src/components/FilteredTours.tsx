import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { TourPackage } from '../types';
import TourCard from './TourCard';

interface FilteredToursProps {
  onBook: (tour: TourPackage) => void;
}

export default function FilteredTours({ onBook }: FilteredToursProps) {
  const { categories, tours } = useDb();
  const [activeTab, setActiveTab] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Initialize active tab when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].slug);
    }
  }, [categories, activeTab]);

  useEffect(() => {
    const handleCategoryEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
        setVisibleCount(8);
      }
    };
    window.addEventListener('setCategoryFilter', handleCategoryEvent);
    return () => window.removeEventListener('setCategoryFilter', handleCategoryEvent);
  }, []);

  const handleTabChange = (slug: string) => {
    setActiveTab(slug);
    setVisibleCount(8);
  };

  // Filter tours matching current category slug (or id)
  const currentToursList = tours.filter(t => t.category === activeTab);
  const displayedTours = currentToursList.slice(0, visibleCount);

  const loadMore = () => {
    if (visibleCount >= currentToursList.length) {
      setVisibleCount(8);
    } else {
      setVisibleCount(prev => prev + 4);
    }
  };

  return (
    <section id="filtered-tours" className="py-20 bg-white relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic Category Nav Pills Bar */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <div className="bg-gray-100/90 p-1.5 rounded-[22px] flex flex-wrap gap-1 shadow-inner max-w-full overflow-x-auto scrollbar-none justify-center">
            {categories.map((cat) => {
              const isActive = activeTab === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleTabChange(cat.slug)}
                  className={`text-xs sm:text-sm font-bold px-5 sm:px-7 py-3 rounded-full transition-all duration-350 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-[#123da5] text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {displayedTours.map((tour) => (
            <div key={tour.id} className="animate-fade-in duration-300">
              <TourCard tour={tour} onBook={onBook} />
            </div>
          ))}
        </div>

        {/* Handle Empty State gracefully */}
        {currentToursList.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm font-semibold">There are no active tour packages available in this category at the moment.</p>
            <p className="text-xs text-gray-500 mt-1">Please contact the administrator or add a new tour to this category in the Admin Dashboard.</p>
          </div>
        )}

        {/* See more orange button with slider from the mockup */}
        {currentToursList.length > 8 && (
          <div className="relative mt-16 flex items-center justify-center">
            <div className="absolute inset-x-0 h-[1.5px] bg-gray-200/80 z-0" />
            <div className="absolute left-0 w-3 h-3 rounded-full bg-gray-300 z-10 hidden sm:block" />
            <div className="absolute right-0 w-3 h-3 rounded-full bg-gray-300 z-10 hidden sm:block" />

            <button 
              onClick={loadMore}
              className="relative z-10 bg-[#f08c1c] hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>{visibleCount >= currentToursList.length ? 'Show Less' : 'See More'}</span>
              <span className={`transform transition duration-300 ${visibleCount >= currentToursList.length ? 'rotate-180' : 'rotate-0'}`}>
                ▼
              </span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
