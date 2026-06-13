import React, { useState } from 'react';
import { Calendar, CheckCircle2, Accessibility, MessageSquare, Compass, ShieldCheck } from 'lucide-react';
import { BookingState } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenWhatsApp: () => void;
  onToggleAccessibility: () => void;
  bookingFormState: BookingState;
  setBookingFormState: React.Dispatch<React.SetStateAction<BookingState>>;
}

export default function Hero({ 
  onOpenBooking, 
  onOpenWhatsApp, 
  onToggleAccessibility,
  bookingFormState,
  setBookingFormState
}: HeroProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'make' | 'find' | 'rent'>('make');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const handleTabChange = (tab: 'make' | 'find' | 'rent') => {
    setActiveTab(tab);
    setBookingFormState(prev => ({ ...prev, tripType: tab }));
  };

  const handleTimeTypeChange = (timeType: 'exact' | 'approximate' | 'sure_yet') => {
    setBookingFormState(prev => ({ ...prev, travelTimeType: timeType }));
  };

  const toggleCitySelection = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const popularDestinations = ['Cairo', 'Giza Pyramids', 'Nile Cruise (Luxor/Aswan)', 'White Desert', 'Hurghada Red Sea', 'Siwa Oasis'];

  return (
    <section id="home" className="relative font-sans overflow-hidden">
      
      {/* Giza Pyramids Immersive Hero Background */}
      <div 
        className="h-[520px] sm:h-[620px] w-full bg-cover bg-center relative flex flex-col justify-center items-center px-4"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.45)), url('https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1920&q=80')`,
          backgroundPosition: '50% 35%'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/10 via-transparent to-black/30" />

        {/* Hero Headlines */}
        <div className="relative text-center text-white max-w-4xl w-full z-10 animate-fade-in mb-8">
          <span 
            className="block text-2xl sm:text-3.5xl font-extrabold tracking-wide drop-shadow-md text-amber-300 font-sans mb-1"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.45)' }}
          >
            {t('hero.getStarted')}
          </span>
          <h1
            className="text-4xl sm:text-6.5xl font-black tracking-tight leading-tight uppercase font-sans select-none drop-shadow-lg"
            style={{ textShadow: '2px 3px 12px rgba(0,0,0,0.6)' }}
          >
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-gray-200/90 font-medium max-w-2xl mx-auto drop-shadow-md tracking-wider">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Carousel indicator dots */}
        <div className="absolute bottom-28 flex gap-2.5 z-10">
          <button className="w-2.5 h-2.5 rounded-full bg-orange-500 transition-all duration-300 transform scale-110" />
          <button className="w-2.5 h-2.5 rounded-full bg-white/70 hover:bg-white transition-all" />
          <button className="w-2.5 h-2.5 rounded-full bg-white/70 hover:bg-white transition-all" />
          <button className="w-2.5 h-2.5 rounded-full bg-white/70 hover:bg-white transition-all" />
        </div>
      </div>

      {/* Floating Left "Excellent Reviews" Widget from the screenshot */}
      <div 
        className="fixed left-0 top-1/3 z-40 bg-zinc-950 text-white rounded-r-xl border-y border-r border-[#123da5]/40 py-3.5 px-2.5 flex flex-col items-center gap-2 shadow-2xl font-mono text-[10px] origin-left hover:scale-105 transition cursor-pointer select-none"
        style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
      >
        <span className="flex items-center gap-1.5 font-bold tracking-widest text-emerald-400">
          ★ EXCELLENT
        </span>
        <span className="text-gray-300 uppercase tracking-wider font-sans">Reviews</span>
      </div>

      {/* Booking Form Overlay Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-30 pb-6">
        
        {/* Navigation Tabs corresponding to screenshot 1 */}
        <div className="flex items-center gap-1 pl-4 sm:pl-8">
          <button 
            onClick={() => handleTabChange('make')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-bold rounded-t-2xl transition-all shadow-sm ${
              activeTab === 'make' 
                ? 'bg-white text-[#123da5]' 
                : 'bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white'
            }`}
          >
            {t('hero.makeTrip')}
          </button>
          
          <button 
            onClick={() => handleTabChange('find')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-bold rounded-t-2xl transition-all shadow-sm ${
              activeTab === 'find' 
                ? 'bg-white text-[#123da5]' 
                : 'bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white'
            }`}
          >
            {t('hero.findTrip')}
          </button>

          <button 
            onClick={() => handleTabChange('rent')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-bold rounded-t-2xl transition-all shadow-sm ${
              activeTab === 'rent' 
                ? 'bg-white text-[#123da5]' 
                : 'bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white'
            }`}
          >
            {t('hero.rentCar')}
          </button>
        </div>

        {/* Active Tab Panel - Round White Box */}
        <div className="bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border border-gray-100 p-6 sm:p-9">
          {activeTab === 'make' && (
            <div className="space-y-6 animate-fade-in">
              {/* Question & Time Radios */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <span className="text-sm sm:text-base font-bold text-gray-500 font-sans">
                  {t('hero.whenTraveling')}
                </span>
                
                {/* Custom radio buttons matching image */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="travelTime" 
                      checked={bookingFormState.travelTimeType === 'exact'} 
                      onChange={() => handleTimeTypeChange('exact')}
                      className="sr-only text-[#f08c1c]" 
                    />
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      bookingFormState.travelTimeType === 'exact' 
                        ? 'border-[#f08c1c]' 
                        : 'border-gray-300'
                    }`}>
                      {bookingFormState.travelTimeType === 'exact' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f08c1c]" />
                      )}
                    </span>
                    <span className={bookingFormState.travelTimeType === 'exact' ? 'text-[#f08c1c]' : 'text-gray-700'}>
                      {t('hero.exactTime')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="travelTime" 
                      checked={bookingFormState.travelTimeType === 'approximate'} 
                      onChange={() => handleTimeTypeChange('approximate')}
                      className="sr-only text-[#f08c1c]" 
                    />
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      bookingFormState.travelTimeType === 'approximate' 
                        ? 'border-[#f08c1c]' 
                        : 'border-gray-300'
                    }`}>
                      {bookingFormState.travelTimeType === 'approximate' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f08c1c]" />
                      )}
                    </span>
                    <span className={bookingFormState.travelTimeType === 'approximate' ? 'text-[#f08c1c]' : 'text-gray-700'}>
                      {t('hero.approxTime')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="travelTime" 
                      checked={bookingFormState.travelTimeType === 'sure_yet'} 
                      onChange={() => handleTimeTypeChange('sure_yet')}
                      className="sr-only text-[#f08c1c]" 
                    />
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      bookingFormState.travelTimeType === 'sure_yet' 
                        ? 'border-[#f08c1c]' 
                        : 'border-gray-300'
                    }`}>
                      {bookingFormState.travelTimeType === 'sure_yet' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f08c1c]" />
                      )}
                    </span>
                    <span className={bookingFormState.travelTimeType === 'sure_yet' ? 'text-[#f08c1c]' : 'text-gray-700'}>
                      {t('hero.notSure')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Date Inputs Grid & CTA Action */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* From Date */}
                <div className="md:col-span-5 relative group">
                  <div className="border border-gray-200 focus-within:border-[#123da5] rounded-2xl px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                      {t('hero.from')}
                    </label>
                    <div className="flex items-center justify-between">
                      <input 
                        type="date" 
                        value={bookingFormState.fromDate}
                        onChange={(e) => setBookingFormState(prev => ({ ...prev, fromDate: e.target.value }))}
                        className="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                        placeholder="Select the start date of the trip"
                      />
                      <Calendar className="w-4 h-4 text-gray-400 group-focus-within:text-[#123da5]" />
                    </div>
                  </div>
                </div>

                {/* To Date */}
                <div className="md:col-span-5 relative group">
                  <div className="border border-gray-200 focus-within:border-[#123da5] rounded-2xl px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                      {t('hero.to')}
                    </label>
                    <div className="flex items-center justify-between">
                      <input 
                        type="date" 
                        value={bookingFormState.toDate}
                        onChange={(e) => setBookingFormState(prev => ({ ...prev, toDate: e.target.value }))}
                        className="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
                      />
                      <Calendar className="w-4 h-4 text-gray-400 group-focus-within:text-[#123da5]" />
                    </div>
                  </div>
                </div>

                {/* Submit button Make Trip matching the exact visual style */}
                <div className="md:col-span-2 pt-2 md:pt-0">
                  <button 
                    onClick={onOpenBooking}
                    className="w-full h-14 bg-[#f08c1c] hover:bg-orange-500 active:scale-95 text-white font-extrabold rounded-2xl shadow-xl hover:shadow-orange-500/20 transition-all duration-200 text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t('hero.makeTrip')}
                  </button>
                </div>
              </div>

              {/* Destination selector chips to improve dynamic interactivity */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 font-mono">
                  Popular destinations requested by client:
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularDestinations.map(city => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <button 
                        key={city}
                        onClick={() => toggleCitySelection(city)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-semibold border transition duration-150 flex items-center gap-1 ${
                          isSelected 
                            ? 'bg-blue-50 border-[#123da5] text-[#123da5]' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-[#123da5]/30'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#123da5]" />}
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'find' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-[#123da5] font-bold text-lg mb-2">Find Your Ideal Egyptian Escape</h4>
              <p className="text-sm text-gray-600">Search 150+ pre-designed itineraries. Enter major Egyptian cities you want to see:</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-10">
                  <input 
                    type="text" 
                    placeholder="e.g. Pyramids, Luxor Cruise, Red Sea reefs..."
                    className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#123da5]/20 text-sm font-semibold"
                  />
                </div>
                <button 
                  onClick={onOpenBooking}
                  className="sm:col-span-2 h-14 bg-[#123da5] hover:bg-blue-800 text-white font-bold rounded-2xl tracking-wider text-sm shadow-md transition"
                >
                  {t('hero.search')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rent' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-[#123da5] font-bold text-lg mb-2">Luxury Car Rental & Private Driver Egypt</h4>
              <p className="text-sm text-gray-600">Explore Egypt securely with private, climate-controlled, top-tier vehicles and certified tourist drivers.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-100 hover:border-amber-300 rounded-2xl p-4 bg-gray-50/50 hover:bg-orange-50/20 cursor-pointer transition">
                  <span className="font-bold text-gray-800 block text-sm">Sedan Class (3 Passengers)</span>
                  <span className="text-xs text-gray-500">Perfect for Cairo tours & business trips starting at $45/day.</span>
                </div>
                <div className="border border-gray-100 hover:border-amber-300 rounded-2xl p-4 bg-gray-50/50 hover:bg-orange-50/20 cursor-pointer transition">
                  <span className="font-bold text-gray-800 block text-sm">Luxury SUV / Jeep 4x4</span>
                  <span className="text-xs text-gray-500">Ideal for Sahara, Fayoum, and Bahariya oasis roads starting at $95/day.</span>
                </div>
                <button 
                  onClick={onOpenBooking} 
                  className="h-full min-h-[72px] bg-[#f08c1c] hover:bg-orange-500 text-white font-extrabold rounded-2xl flex items-center justify-center p-4 transition shadow-md"
                >
                  Select & Inquire Rates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
