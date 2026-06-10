/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import EasterTours from './components/EasterTours';
import FilteredTours from './components/FilteredTours';
import OffersSection from './components/OffersSection';
import SustainabilitySection from './components/SustainabilitySection';
import GallerySection from './components/GallerySection';
import BookingWizard from './components/BookingWizard';
import WhatsAppChat from './components/WhatsAppChat';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { DbProvider } from './context/DbContext';
import { BookingState, TourPackage } from './types';
import { Scale } from 'lucide-react';

export default function App() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  
  // Custom Accessibility Features state
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);

  const [bookingFormState, setBookingFormState] = useState<BookingState>({
    tripType: 'make',
    travelTimeType: 'exact',
    fromDate: '',
    toDate: '',
    fromLocation: 'Cairo, Egypt',
    toLocation: ''
  });

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenBookingWizard = (tour: TourPackage | null = null) => {
    // Cast to any for model compatibility
    setSelectedTour(tour as any);
    setIsWizardOpen(true);
  };

  return (
    <AuthProvider>
      <DbProvider>
        <div className={`min-h-screen bg-white transition-all duration-300 font-sans ${
          highContrast ? 'invert saturate-150 bg-black text-white' : ''
        } ${
          largeText ? 'text-lg [&_p]:text-base [&_span]:text-sm [&_h3]:text-xl [&_h2]:text-4xl' : 'text-sm'
        }`}>
          
          {/* Header component with authentic Admin Dashboard opener */}
          <Header 
            onScrollToSection={handleScrollToSection} 
            onOpenBooking={() => handleOpenBookingWizard(null)} 
            onOpenDashboard={() => setIsAdminDashboardOpen(true)}
          />

          {/* Hero with dynamic search bars and accessibility toggle */}
          <Hero 
            onOpenBooking={() => handleOpenBookingWizard(null)}
            onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
            onToggleAccessibility={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
            bookingFormState={bookingFormState}
            setBookingFormState={setBookingFormState}
          />

          {/* Egypt Easter Tours carousel list */}
          <EasterTours onBook={handleOpenBookingWizard} />

          {/* Horizontal categories list (Recommended, Nile cruises, etc) */}
          <FilteredTours onBook={handleOpenBookingWizard} />

          {/* Special Offers ticking discount timers section */}
          <OffersSection onBook={handleOpenBookingWizard} />

          {/* Ecological certification banner section */}
          <SustainabilitySection />

          {/* Social-integrated Media Gallery Section */}
          <GallerySection />

          {/* Footer information section */}
          <Footer />

          {/* Multi-step responsive trip-builder wizard form */}
          <BookingWizard 
            isOpen={isWizardOpen} 
            onClose={() => setIsWizardOpen(false)} 
            selectedTour={selectedTour}
          />

          {/* Realistic interactive WhatsApp support */}
          <WhatsAppChat 
            isOpen={isWhatsAppOpen} 
            onClose={() => setIsWhatsAppOpen(false)} 
            onOpen={() => setIsWhatsAppOpen(true)} 
          />

          {/* Full Screen integrated Management System */}
          <AdminDashboard 
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
          />

          {/* Accessible Helper float trigger */}
          <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 font-sans select-none">
            
            {/* Toggle Wheel Accessibility details */}
            {showAccessibilityMenu && (
              <div className="bg-zinc-950 text-white rounded-2xl p-4.5 shadow-2.5xl shadow-black/40 border border-zinc-800 space-y-3.5 w-64 animate-fade-in text-xs font-semibold">
                <h4 className="font-bold text-amber-500 uppercase tracking-widest text-[10px]">Accessibility Helpers</h4>
                <div className="h-[1px] bg-zinc-800" />
                
                <button 
                  onClick={() => setHighContrast(!highContrast)}
                  className="flex items-center justify-between w-full hover:text-amber-400 transition cursor-pointer"
                >
                  <span>High Contrast Mode</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] ${highContrast ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}>
                    {highContrast ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button 
                  onClick={() => setLargeText(!largeText)}
                  className="flex items-center justify-between w-full hover:text-amber-400 transition cursor-pointer"
                >
                  <span>Enlarged Text Font</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] ${largeText ? 'bg-amber-500 text-black' : 'bg-zinc-800'}`}>
                    {largeText ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
              className="bg-[#123da5] hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl relative transition hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center border border-amber-300"
              title="Toggle Accessibility Assistant"
            >
              <Scale className="w-5 h-5 text-amber-400" />
            </button>
          </div>

        </div>
      </DbProvider>
    </AuthProvider>
  );
}
