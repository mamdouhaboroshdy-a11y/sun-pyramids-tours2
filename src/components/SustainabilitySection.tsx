import React, { useState } from 'react';
import { Target, Leaf, Sparkles, X, Globe, Trees } from 'lucide-react';

export default function SustainabilitySection() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section id="sustainability" className="py-20 sm:py-24 bg-white relative overflow-hidden font-sans border-y border-gray-150/10">
      
      {/* Decorative ambient background rings */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-40 -translate-y-1/2 -z-10" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-amber-50 rounded-full blur-[100px] opacity-40 -translate-y-1/2 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Details Block */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-250/30">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest font-mono">Certified Eco Agency</span>
            </div>

            <h2 className="text-3.5xl sm:text-5.5xl font-black text-gray-900 tracking-tight leading-tight">
              Tailored <span className="text-[#f08c1c]">guidance</span> for your <span className="text-[#f08c1c]">sustainability</span> journey
            </h2>

            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Sustainability is not an add-on – it is integrated into how we design, operate, and deliver travel experiences across Egypt. We care deeply about community empowerment and preserving Egypt's monuments for thousands more years.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => setShowInfo(true)}
                className="bg-[#f08c1c] hover:bg-orange-500 font-extrabold text-white text-sm px-8 py-4 rounded-full shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all cursor-pointer text-center"
              >
                See more
              </button>

              <a 
                href="#footer"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300 text-gray-700 font-semibold px-8 py-4 rounded-full hover:bg-emerald-50/20 transition text-sm"
              >
                <span>Read ESG Statement</span>
              </a>
            </div>
          </div>

          {/* Right Travelife Certificate Logo Block corresponding to Screenshot 5 */}
          <div className="lg:col-span-5 flex justify-center">
            <div 
              onClick={() => setShowInfo(true)}
              className="bg-gray-50 hover:bg-emerald-50/15 border border-gray-150/80 p-8 sm:p-11 rounded-[36px] shadow-2xl transition-all duration-300 hover:scale-102 cursor-pointer max-w-sm flex flex-col items-center select-none text-center"
            >
              <div className="relative w-40 h-40 mb-6">
                {/* Stunning Travelife Inspired Vector SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <gradient id="travelifeLeaf" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </gradient>
                    <gradient id="travelifeOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#f08c1c" />
                    </gradient>
                  </defs>

                  {/* Outer circle layout */}
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f08c1c" strokeWidth="1" opacity="0.4" />

                  {/* Elegant Supportive Hands holding the leaf */}
                  <path d="M 18 55 Q 32 82 50 82 Q 68 82 82 55 Q 65 72 50 72 Q 35 72 18 55" fill="url(#travelifeOrange)" opacity="0.9" />

                  {/* Two Leaves forming the hands */}
                  <path d="M 50 20 Q 75 35 70 65 Q 50 50 50 20" fill="url(#travelifeLeaf)" />
                  <path d="M 50 20 Q 25 35 30 65 Q 50 50 50 20" fill="#15803d" opacity="0.85" />

                  {/* Inner Details */}
                  <circle cx="50" cy="55" r="5" fill="#ffffff" />
                </svg>
              </div>

              <div className="space-y-2">
                <span className="text-2xl font-black text-gray-800 tracking-tight block">
                  Travelife
                </span>
                <span className="text-xs font-black tracking-widest text-[#f08c1c] uppercase block">
                  CERTIFIED
                </span>
                <div className="h-[1.5px] w-24 bg-emerald-500/40 mx-auto my-3" />
                <span className="text-xs font-extrabold text-[#22c55e] uppercase tracking-wide block">
                  Excellence in sustainability
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sustainability Detail Drawer modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden relative shadow-2xl">
            <div className="bg-emerald-850 bg-[#123da5] text-white p-6 relative">
              <button 
                onClick={() => setShowInfo(false)} 
                className="absolute top-4 right-4 text-white hover:bg-white/10 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold mb-1">Our Sustainability Credentials</h3>
              <p className="text-xs text-emerald-200">Proudly certified by Travelife's international tourism standard.</p>
            </div>

            <div className="p-6 space-y-4 text-sm text-gray-600 max-h-[400px] overflow-y-auto">
              <div className="flex gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 h-fit">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Carbon-Balanced Transport</h4>
                  <p className="text-xs text-gray-500 mt-0.5">We participate in carbon offsets for all private road transfers, including safaris to Siwa, Magic Lake, Fayoum, and Bahariya.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-800 h-fit">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Empowering Local Bedouin Communities</h4>
                  <p className="text-xs text-gray-500 mt-0.5">15% of our desert safari profits goes directly toward funding micro-schools and clean irrigation systems in the Western desert oases.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-800 h-fit">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Waste-Free Nile Sailing</h4>
                  <p className="text-xs text-gray-500 mt-0.5">We have strictly eliminated single-use plastic cups and straws on the Nile Cruisers. Complimentary reusable filtration flasks are supplied to our travelers.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 text-right">
              <button 
                onClick={() => setShowInfo(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-full text-xs"
              >
                Acknowledged
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
