import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Share2, Youtube, Instagram, Facebook, Tv, X, Video } from 'lucide-react';
import { GALLERY_ITEMS } from '../data';
import { useDb } from '../context/DbContext';
import { useLanguage } from '../context/LanguageContext';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  videoUrl: string;
  mediaType: string;
}

export default function GallerySection() {
  const { t } = useLanguage();
  const { galleryItems } = useDb();

  // Admin-managed cards from the database; static seed data until they load.
  const items: GalleryItem[] = galleryItems.length >= GALLERY_ITEMS.length ? galleryItems : GALLERY_ITEMS;
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [likes, setLikes] = useState<{ [key: string]: number }>({
    g1: 1845,
    g2: 3942,
    g3: 8840,
    g4: 12430,
    g5: 2315
  });
  const [hasLiked, setHasLiked] = useState<{ [key: string]: boolean }>({});

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked[id]) {
      setLikes(prev => ({ ...prev, [id]: prev[id] - 1 }));
      setHasLiked(prev => ({ ...prev, [id]: false }));
    } else {
      setLikes(prev => ({ ...prev, [id]: prev[id] + 1 }));
      setHasLiked(prev => ({ ...prev, [id]: true }));
    }
  };

  return (
    <section id="gallery" className="py-20 bg-gray-50/50 relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Gallery Title with subtext from screenshot 5 */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3.5xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            {t('gallery.title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium mt-2 max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        {/* Dynamic Masonry-like Grid mapping Screenshot 5 layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Card 1: Kebab Skewers (Lg display left col 3 rows height) */}
          <div 
            onClick={() => setSelectedItem(items[0])}
            className="lg:col-span-4 relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 min-h-[300px] h-full"
          >
            <img 
              src={items[0].image} 
              alt={items[0].title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-6">
              
              {/* Media badge top left */}
              <div className="bg-red-650 bg-red-600 text-white w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 shadow-md">
                <Youtube className="w-3.5 h-3.5" />
                <span>YOUTUBE RESORT</span>
              </div>

              {/* Centered Large Red Play Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/95 hover:bg-red-600 p-4 rounded-full shadow-2xl transition duration-250 hover:scale-110 active:scale-95 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>

              {/* Bot title & status count */}
              <div className="space-y-2 mt-auto">
                <p className="text-xs font-black text-[#f08c1c] tracking-widest uppercase">Cuisine</p>
                <h4 className="text-white font-bold text-sm sm:text-base tracking-tight leading-snug">{items[0].title}</h4>
                <div className="flex items-center gap-4 text-white/80 text-xs">
                  <span onClick={(e) => toggleLike(items[0].id, e)} className="flex items-center gap-1 hover:text-red-400">
                    <Heart className={`w-4 h-4 ${hasLiked[items[0].id] ? 'text-red-500 fill-red-500' : ''}`} />
                    {likes[items[0].id]}
                  </span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 45</span>
                </div>
              </div>

            </div>
          </div>

          {/* Center Column: Card 2 (Flamingos) top + Card 5 (Fayoum Lake) below */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
            
            {/* Card 2: Flamingos */}
            <div 
              onClick={() => setSelectedItem(items[1])}
              className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition flex-grow min-h-[190px]"
            >
              <img 
                src={items[1].image} 
                alt={items[1].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-5">
                <div className="bg-[#f08c1c] text-white w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>VIDEO BLOG</span>
                </div>
                
                {/* Red YouTube Button overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 p-3.5 rounded-2xl shadow-xl transition duration-200 group-hover:scale-105 flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-white fill-white" />
                </div>

                <div className="mt-auto">
                  <h4 className="text-white font-bold text-xs sm:text-sm tracking-tight">{items[1].title}</h4>
                  <div className="flex items-center gap-3 text-white/70 text-[10px] sm:text-xs mt-1.5">
                    <span onClick={(e) => toggleLike(items[1].id, e)} className="flex items-center gap-0.5 hover:text-red-400">
                      <Heart className={`w-3.5 h-3.5 ${hasLiked[items[1].id] ? 'text-red-500 fill-red-500' : ''}`} /> {likes[items[1].id]}
                    </span>
                    <span>💬 89</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Fayoum Lake */}
            <div 
              onClick={() => setSelectedItem(items[4])}
              className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition flex-grow min-h-[190px]"
            >
              <img 
                src={items[4].image} 
                alt={items[4].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-5">
                <div className="bg-[#1877f2] text-white w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                  <Facebook className="w-3.5 h-3.5 fill-white" />
                  <span>FACEBOOK ADVENTURE</span>
                </div>

                <div className="mt-auto">
                  <h4 className="text-white font-bold text-xs sm:text-sm tracking-tight">{items[4].title}</h4>
                  <div className="flex items-center gap-3 text-white/70 text-[10px] sm:text-xs mt-1.5">
                    <span onClick={(e) => toggleLike(items[4].id, e)} className="flex items-center gap-0.5 hover:text-red-400">
                      <Heart className={`w-3.5 h-3.5 ${hasLiked[items[4].id] ? 'text-red-500 fill-red-500' : ''}`} /> {likes[items[4].id]}
                    </span>
                    <span>💬 12</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Column 3: Card 3 (Festivals of Egypt - TikTok style) */}
          <div 
            onClick={() => setSelectedItem(items[2])}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition min-h-[300px]"
          >
            <img 
              src={items[2].image} 
              alt={items[2].title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-5">
              
              <div className="bg-black border border-gray-800 text-white w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                <span>TIKTOK SPECIAL</span>
              </div>

              {/* Stylized rounded black TikTok music overlay circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black h-12 w-12 rounded-full border border-gray-700 shadow-xl flex items-center justify-center transition duration-200 group-hover:scale-105 active:scale-95">
                <span className="text-cyan-400 font-extrabold text-xs">🎵</span>
              </div>

              <div className="mt-auto">
                <h4 className="text-white font-extrabold text-xs tracking-tight line-clamp-3 leading-snug">{items[2].title}</h4>
                <div className="flex items-center gap-2 text-white/70 text-[10px] mt-2">
                  <span onClick={(e) => toggleLike(items[2].id, e)} className="hover:text-red-550">
                    ❤️ {likes[items[2].id]}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Column 4: Card 4 (Red Sea - Instagram style) */}
          <div 
            onClick={() => setSelectedItem(items[3])}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition min-h-[300px]"
          >
            <img 
              src={items[3].image} 
              alt={items[3].title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-5">
              
              <div className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5" />
                <span>INSTA REEL</span>
              </div>

              {/* Instagram video/reel style visual ring icon inside */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-3.5 rounded-full border border-white/20 transition group-hover:scale-110">
                <Instagram className="w-5 h-5 text-white" />
              </div>

              <div className="mt-auto">
                <h4 className="text-white font-bold text-xs tracking-tight line-clamp-3 leading-snug">{items[3].title}</h4>
                <div className="flex items-center gap-2 text-white/70 text-[10px] mt-2">
                  <span onClick={(e) => toggleLike(items[3].id, e)} className="hover:text-red-550">
                    ❤️ {likes[items[3].id]}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Interactive Floating Video Media Player Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#18181b] rounded-3xl w-full max-w-4xl overflow-hidden relative shadow-2xl border border-zinc-800 grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Col: Player Screen */}
            <div className="md:col-span-8 bg-black relative aspect-video flex items-center justify-center">
              
              {/* Closing flag floating */}
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-4 left-4 z-40 bg-black/65 text-white hover:bg-black p-2 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Rich Simulated Egyptian Travel Video with live overlay feedback */}
              <div className="absolute inset-x-0 bottom-4 px-6 z-20 flex items-center justify-between text-white select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-amber-500 overflow-hidden bg-zinc-900 flex items-center justify-center font-bold text-xs">
                    SP
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm">Sun Pyramids Tours Official</h5>
                    <p className="text-[10px] text-gray-300">Cairo SpecialistsSince 1970</p>
                  </div>
                </div>
                <span className="bg-red-650 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Video className="w-3.5 h-3.5" /> LIVE STREAM
                </span>
              </div>

              {/* Beautiful, authentic Egyptian Desert Oasis illustration screen / mock video playback */}
              <div className="w-full h-full relative group">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90 filter brightness-95" 
                />
                
                {/* Simulated playback controls feedback */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="p-5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl animate-ping opacity-60">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div className="absolute p-4 bg-[#f08c1c] rounded-full shadow-lg z-10 hover:scale-105 transition cursor-pointer">
                    <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Live comments / Feed details */}
            <div className="md:col-span-4 p-6 sm:p-7 flex flex-col justify-between bg-zinc-900 text-white h-full min-h-[300px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-amber-500 uppercase tracking-widest">{selectedItem.category}</span>
                  <button 
                    onClick={() => setSelectedItem(null)} 
                    className="md:hidden text-gray-400 hover:text-white p-1 rounded-full bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-md sm:text-base font-black leading-snug tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  {selectedItem.title}
                </h3>

                <div className="h-[1.5px] bg-zinc-805 bg-zinc-800" />

                {/* Simulated live feedback commentary */}
                <div className="space-y-3.5 text-xs">
                  <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Traveler Chats (12)</span>
                  
                  <div className="space-y-2 max-h-[120px] sm:max-h-[160px] overflow-y-auto scrollbar-none pr-1">
                    <div className="bg-zinc-850 bg-zinc-800/40 p-2.5 rounded-2xl border border-zinc-800/10">
                      <span className="font-extrabold text-[#f08c1c] block">Sarah K.</span>
                      <p className="text-gray-300 mt-0.5">Oh my God, that looks incredible! We went to El Fayoum with them last year. Highly recommend the magic waterfalls!</p>
                    </div>
                    <div className="bg-zinc-850 bg-zinc-800/40 p-2.5 rounded-2xl border border-zinc-800/10">
                      <span className="font-extrabold text-teal-400 block">mmodohgiko@gmail.com</span>
                      <p className="text-gray-300 mt-0.5">I need to book the 4-Day desert escape! The Siwa oasis is on my absolute bucket list.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed CTAs */}
              <div className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <button 
                    onClick={(e) => toggleLike(selectedItem.id, e)} 
                    className="flex items-center gap-1 hover:text-red-400 transition"
                  >
                    <Heart className={`w-4 L-4 ${hasLiked[selectedItem.id] ? 'text-red-500 fill-red-500' : ''}`} />
                    <span>{likes[selectedItem.id]} likes</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-white transition">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setSelectedItem(null);
                    window.location.hash = 'home';
                  }}
                  className="w-full bg-[#f08c1c] hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition text-xs tracking-wider"
                >
                  INQUIRE THIS PACKAGE
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
