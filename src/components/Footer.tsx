import React from 'react';
import { Mail, Phone, MapPin, Youtube, Facebook, Instagram, BadgeCheck } from 'lucide-react';
import { useDb } from '../context/DbContext';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { settings } = useDb();
  const { t } = useLanguage();

  const FOOTER_LINKS = [
    { name: 'Home', labelKey: 'footer.link.home', sectionId: 'home', action: 'scroll' },
    { name: 'One Day Tours', labelKey: 'footer.link.oneDay', sectionId: 'filtered-tours', action: 'filter', filterVal: 'one_day' },
    { name: 'Multi Days Tours', labelKey: 'footer.link.multiDays', sectionId: 'filtered-tours', action: 'filter', filterVal: 'multi_days' },
    { name: 'Nile Cruises', labelKey: 'footer.link.nileCruises', sectionId: 'filtered-tours', action: 'filter', filterVal: 'nile_cruises' },
    { name: 'Shore Excursion', labelKey: 'footer.link.shore', sectionId: 'filtered-tours', action: 'filter', filterVal: 'shore_excursions' },
    { name: 'Special Offer', labelKey: 'footer.link.specialOffer', sectionId: 'offers', action: 'scroll', hasVerifiedBadge: true },
    { name: 'Rent Car', labelKey: 'footer.link.rentCar', action: 'whatsapp', text: 'Hello, I would like to inquire about Renting a Car in Egypt.' },
    { name: 'About Us', labelKey: 'footer.link.about', sectionId: 'sustainability', action: 'scroll' },
    { name: 'Contact Us', labelKey: 'footer.link.contact', sectionId: 'footer', action: 'scroll' },
    { name: 'Egypt Travel Guide', labelKey: 'footer.link.guide', action: 'guide' },
    { name: 'faqs', labelKey: 'footer.link.faqs', action: 'faqs' },
    { name: 'Events', labelKey: 'footer.link.events', sectionId: 'easter-tours', action: 'scroll' },
    { name: 'Accessible Travel', labelKey: 'footer.link.accessible', action: 'accessibility' },
  ];

  const handleLinkClick = (link: typeof FOOTER_LINKS[0]) => {
    if (link.action === 'scroll' && link.sectionId) {
      document.getElementById(link.sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else if (link.action === 'filter' && link.sectionId && link.filterVal) {
      window.dispatchEvent(new CustomEvent('setCategoryFilter', { detail: link.filterVal }));
      document.getElementById(link.sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else if (link.action === 'whatsapp') {
      const waNumber = settings?.whatsapp || '201207300811';
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(link.text || '')}`, '_blank');
    } else if (link.action === 'guide') {
      const waNumber = settings?.whatsapp || '201207300811';
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent('Hello Sun Pyramids Tours, I am interested in receiving the Egypt Travel Guide!')}`, '_blank');
    } else if (link.action === 'faqs') {
      const waNumber = settings?.whatsapp || '201207300811';
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent('Hello Sun Pyramids Tours, I have some FAQ questions about the tours in Egypt.')}`, '_blank');
    } else if (link.action === 'accessibility') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const helperBtn = document.querySelector('button[title="Toggle Accessibility Assistant"]') as HTMLButtonElement;
      if (helperBtn) helperBtn.click();
    }
  };

  return (
    <footer id="footer" className="relative bg-[#0d0d0d] text-zinc-400 pt-16 pb-6 select-none font-sans overflow-hidden border-t border-zinc-900"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M0 0 L40 40 L80 0 Z M40 40 L80 80 L0 80 Z' fill='%23ffffff' fill-opacity='0.007' stroke='%23ffffff' stroke-opacity='0.012' stroke-width='1'/%3E%3C/svg%3E\")" }}
    >
      {/* Decorative ambient spots */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Column 1 - Brand, Help & Travelife Badge */}
          <div className="md:col-span-4 space-y-7">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 shadow-inner">
                {/* Custom highly polished Sun Pyramids vector logo */}
                <svg viewBox="0 0 100 100" className="w-11 h-11">
                  {/* Radiant Sun in Orange/Yellow */}
                  <circle cx="50" cy="40" r="16" fill="#f08c1c" />
                  <path d="M 50 15 L 50 21 M 26 27 L 31 32 M 74 27 L 69 32 M 20 40 L 26 40 M 80 40 L 74 40 M 30 52 L 35 48 M 70 52 L 65 48" stroke="#f08c1c" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Majestic Egypt Golden-Orange Pyramids */}
                  <polygon points="15,75 50,30 85,75" fill="#f08c1c" opacity="0.95" />
                  <polygon points="50,75 75,44 100,75" fill="#e27c15" opacity="0.85" />
                  {/* Majestic Teal wave base */}
                  <path d="M 5 75 Q 50 82 95 75 C 80 88, 20 88, 5 75 Z" fill="#00a896" />
                </svg>
              </div>
              
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-widest italic text-[#38bdf8] uppercase">
                  SUN PYRAMIDS
                </span>
                <span className="text-[8px] uppercase tracking-wider font-black text-teal-400">
                  SINCE <span className="text-[#f08c1c]">TOURS</span> <span className="text-sky-400">1970</span>
                </span>
              </div>
            </div>

            {/* Help Prompt */}
            <div className="space-y-2">
              <h4 id="help-heading" className="text-white font-extrabold text-base tracking-tight">
                {t('footer.needHelp')}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                {t('footer.happyHelp')}
              </p>
            </div>

            {/* Social media icons matching screenshot square rounded outlines */}
            <div className="flex items-center gap-3">
              <a href="https://youtube.com" target="_blank" rel="noreferrer" 
                 className="w-11 h-11 border border-zinc-800 hover:border-[#f08c1c] active:scale-95 bg-zinc-900/50 hover:bg-[#ff0000]/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-[#ff0000] transition duration-300">
                <Youtube className="w-4.5 h-4.5" />
              </a>
              <a href="https://google.com" target="_blank" rel="noreferrer" 
                 className="w-11 h-11 border border-zinc-800 hover:border-sky-450 active:scale-95 bg-zinc-900/50 hover:bg-sky-500/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-sky-400 transition duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.285-2.82-6.285-6.285 0-3.465 2.82-6.285 6.285-6.285 1.583 0 3.02.583 4.135 1.55l3.228-3.228C19.123 2.148 15.932 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.8 0 12.44-5.204 12.44-12.24 0-.776-.08-1.5-.236-2.185l-12.204-.77z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" 
                 className="w-11 h-11 border border-zinc-800 hover:border-blue-500 active:scale-95 bg-zinc-900/50 hover:bg-blue-600/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-blue-500 transition duration-300">
                <Facebook className="w-4.5 h-4.5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" 
                 className="w-11 h-11 border border-zinc-800 hover:border-pink-500 active:scale-95 bg-zinc-900/50 hover:bg-pink-600/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-pink-500 transition duration-300">
                <Instagram className="w-4.5 h-4.5" />
              </a>
            </div>

            {/* Travelife Certification representation */}
            <div className="border border-zinc-800/80 rounded-2xl p-5 bg-zinc-900/10 backdrop-blur-xs flex items-center gap-4 max-w-[300px]">
              <div className="space-y-1.5 select-none">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-extrabold tracking-tight text-white font-sans flex items-center">
                    Travel<span className="font-light text-zinc-400">life</span>
                  </span>
                  
                  {/* Clean green Travelife leaf symbol */}
                  <svg className="w-6 h-6 text-emerald-500 fill-emerald-500/20" viewBox="0 0 24 24">
                    <path d="M12 3a9 9 0 0 0-9 9c0 4.14 2.8 7.6 6.6 8.6L12 21l2.4-.4c3.8-1 6.6-4.46 6.6-8.6a9 9 0 0 0-9-9zm0 15a6 6 0 0 1-4.7-2.3 8.35 8.35 0 0 0 9.4 0A6 6 0 0 1 12 18z" />
                  </svg>
                </div>
                
                <span className="text-[10px] tracking-[0.22em] font-extrabold text-zinc-300 block uppercase">
                  {t('footer.certified')}
                </span>

                <span className="text-[9.5px] text-zinc-500 font-medium tracking-normal block pt-0.5">
                  {t('footer.sustainabilityExcellence')}
                </span>
              </div>
            </div>

          </div>

          {/* Column 2 - Links list */}
          <div className="md:col-span-4 space-y-6">
            <div>
              <h4 className="text-zinc-400 font-extrabold text-sm sm:text-base uppercase tracking-wider">
                {t('footer.links')}
              </h4>
              <div className="h-[2px] w-12 bg-[#f08c1c] mt-2.5" />
            </div>

            <ul className="grid grid-cols-1 gap-2.5 text-xs sm:text-[13px] text-zinc-400 font-semibold">
              {FOOTER_LINKS.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleLinkClick(link)}
                    className="hover:text-amber-400 transition-all duration-200 flex items-center gap-1.5 text-left cursor-pointer relative group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-amber-400 transition-all shrink-0" />
                    <span>{t(link.labelKey)}</span>
                    {link.hasVerifiedBadge && (
                      <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 inline" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Contact Info */}
          <div className="md:col-span-4 space-y-6">
            <div>
              <h4 className="text-zinc-400 font-extrabold text-sm sm:text-base uppercase tracking-wider">
                {t('footer.contactInfo')}
              </h4>
              <div className="h-[2px] w-12 bg-[#f08c1c] mt-2.5" />
            </div>

            <div className="space-y-4.5 text-xs sm:text-[13px] font-medium leading-relaxed">
              
              {/* Phone item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <Phone className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="flex flex-col text-zinc-300 font-semibold space-y-0.5">
                  <span>+20 109 588 8830</span>
                  <span>+20 109 588 8831</span>
                  <span>+20 109 588 8835</span>
                </div>
              </div>

              {/* WhatsApp item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-zinc-300">
                    <path d="M.015 23.957l1.688-6.155C.665 16.002.118 13.962.119 11.87.124 5.334 5.437.016 11.954.016c3.16.001 6.126 1.23 8.353 3.46C22.54 5.707 23.774 8.673 23.77 11.83c-.005 6.536-5.318 11.854-11.84 11.854-1.998-.001-3.959-.51-5.7-1.477L0 23.957zm6.575-4.836c1.597.948 3.094 1.452 4.683 1.453 5.374-.002 9.742-4.361 9.744-9.736A9.59 9.59 0 0 0 18.18 4.02C15.997 1.838 14.053 1.176 11.931 1.175c-5.375 0-9.741 4.36-9.744 9.734-.001 1.701.451 3.363 1.311 4.79l-.296 1.083.3 1.089.997-.273z" />
                  </svg>
                </div>
                <div className="flex flex-col text-zinc-300 font-semibold py-2">
                  <span>+20 109 588 8830</span>
                </div>
              </div>

              {/* Email item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <Mail className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="flex flex-col text-zinc-300 font-semibold space-y-0.5">
                  <a href="mailto:info@sunpyramidstours.com" className="hover:text-[#f08c1c] transition">info@sunpyramidstours.com</a>
                  <a href="mailto:sales@sunpyramidstours.com" className="hover:text-[#f08c1c] transition">sales@sunpyramidstours.com</a>
                  <a href="mailto:sustainability@sunpyramidstours.com" className="hover:text-[#f08c1c] transition">sustainability@sunpyramidstours.com</a>
                </div>
              </div>

              {/* Address MapPin item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <MapPin className="w-4 h-4 text-zinc-300" />
                </div>
                <p className="text-zinc-350 p-1 font-semibold leading-relaxed">
                  Pyramids View Tower - Mansourieh Intersection with Faisal - Above Tseppas Pastry - Fourth Floor
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Line Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-zinc-800/70 w-full" />
      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 text-zinc-500 font-semibold text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>{t('footer.rights')}</span>

        <div className="flex gap-6 sm:gap-10">
          <a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">{t('footer.terms')}</a>
        </div>
      </div>

      {/* Floating vertical 'Excellent Reviews' tab on the left border */}
      <div id="excellent-reviews-tab" className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 px-2 rounded-r-xl shadow-2xl flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all duration-300 border border-l-0 border-emerald-400 group"
           onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
           title="Excellent Reviews"
      >
        <div className="flex items-center gap-0.5 text-[8px] text-amber-300 animate-pulse">
          ★
        </div>
        <span className="text-[10px] tracking-wide font-black uppercase [writing-mode:vertical-lr] rotate-180 flex items-center justify-center gap-1">
          {t('footer.excellentReviews')}
        </span>
      </div>

    </footer>
  );
}
