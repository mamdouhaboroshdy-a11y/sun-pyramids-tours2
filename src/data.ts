import { TourPackage, SpecialOffer } from './types';

export const EASTER_TOURS: TourPackage[] = [
  {
    id: 'e1',
    title: 'Pyramids & Nile Cruise By Train During Easter',
    image: 'https://images.unsplash.com/photo-1503177119275-0aa32b31d458?auto=format&fit=crop&w=800&q=80',
    cities: '4 Cities',
    location: 'Cairo, Giza, Luxor, Aswan',
    tags: ['Multi Days Tours', 'Easter Specials'],
    duration: '8 Days / 7 Night',
    price: 1940.00
  },
  {
    id: 'e2',
    title: '4-Day Nile Cruise on the Royal Beau Rivage: Easter Sail',
    image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80',
    cities: 'Cairo & Nile',
    location: 'Cairo, Luxor, Aswan',
    tags: ['Easter Tours', 'Nile Cruise'],
    duration: '4 Days',
    price: 1130.00
  },
  {
    id: 'e3',
    title: 'Easter Escape: 4-Day White Desert & Bahariya Oasis Adventure',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    cities: 'Cairo & Desert',
    location: 'Cairo, Bahariya, White Desert',
    tags: ['Easter Tours', 'Safari Adventure'],
    duration: '4 Days',
    price: 230.00
  },
  {
    id: 'e4',
    title: '5-Day Private Tour: Easter Holiday Escape to Siwa Oasis',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    cities: 'Cairo & Siwa',
    location: 'Cairo, Siwa Oasis, Alexandria',
    tags: ['Easter Tours', 'Private Experience'],
    duration: '5 Days',
    price: 890.00
  }
];

export const CATEGORIZED_TOURS: { [key: string]: TourPackage[] } = {
  recommended: [
    {
      id: 'c1',
      title: 'From Cairo: 6 Days Package to El Fayoum Oasis & Waterfalls',
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      cities: 'Cairo',
      location: 'Desert Tours',
      tags: ['Desert Tours', 'Nature'],
      duration: '6 Days',
      price: 667.00
    },
    {
      id: 'c2',
      title: 'Package 4 Days El-Fayoum Oasis, White Desert & Magic Lake',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
      cities: 'Egypt',
      location: 'Desert Tours',
      tags: ['Desert Tours', 'Safari'],
      duration: '4 Days',
      price: 360.00
    },
    {
      id: 'c3',
      title: '5 Days Trip to Siwa and Bahariya Oasis Turquoise Springs',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
      cities: 'Egypt',
      location: 'Desert Tours',
      tags: ['Desert Tours', 'Oasis Life'],
      duration: '5 Days',
      price: 505.00
    },
    {
      id: 'c4',
      title: 'Classic 8 Days Egypt Tour Package To Pyramids & Valley of Kings',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80',
      cities: '4 Cities',
      location: 'Egypt Classic Tours',
      tags: ['Egypt Classic Tours', 'Pharaonic'],
      duration: '8 Days',
      price: 975.00
    },
    {
      id: 'c5',
      title: '2-Day White Desert, Bahariya Oasis & Fayoum Camping Safari',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
      cities: '3 Cities',
      location: 'Multi Days Tours',
      tags: ['Multi Days Tours', 'Safari'],
      duration: '2 Days',
      price: 315.00
    },
    {
      id: 'c6',
      title: '8 Day: Luxor Nile Cruise & Cairo Holiday of a Lifetime',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      cities: '4 Cities',
      location: 'Culture Tours',
      tags: ['Culture Tours', 'Cruising'],
      duration: '8 Days',
      price: 1605.00
    },
    {
      id: 'c7',
      title: '7 Day Package For Cairo, Luxor, Aswan and Abu Simbel by Flight',
      image: 'https://images.unsplash.com/photo-1543157148-f68f2ea427a4?auto=format&fit=crop&w=800&q=80',
      cities: '4 Cities',
      location: 'Culture Tours',
      tags: ['Culture Tours', 'Historic'],
      duration: '7 Days',
      price: 387.00
    },
    {
      id: 'c8',
      title: 'Package 8 Days 7 Nights to Pyramids, Luxor and Red Sea Fun',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      cities: '4 Cities',
      location: 'Egypt Classic Tours',
      tags: ['Egypt Classic Tours', 'Adventure'],
      duration: '8 Days',
      price: 2095.00
    }
  ],
  one_day: [
    {
      id: 'od1',
      title: 'Day Tour To Pyramids, Sphinx & Egyptian Museum Cairo',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80',
      cities: 'Cairo',
      location: 'One Day Tours',
      tags: ['One Day', 'Cairo Essentials'],
      duration: 'About 8 Hours',
      price: 65.00
    },
    {
      id: 'od2',
      title: 'Luxor East and West Banks Day Tour with Private Guide',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      cities: 'Luxor',
      location: 'One Day Tours',
      tags: ['One Day', 'Historical'],
      duration: 'About 6 Hours',
      price: 55.00
    },
    {
      id: 'od3',
      title: 'Alexandria Day Trip from Cairo: Citadel, Amphitheater & Library',
      image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
      cities: '2 Cities',
      location: 'One Day Tours',
      tags: ['One Day', 'Coastal'],
      duration: '10 Hours',
      price: 75.00
    }
  ],
  multi_days: [
    {
      id: 'md1',
      title: '4 Days Cairo & Alexandria Highlights Tour with Guided Service',
      image: 'https://images.unsplash.com/photo-1503177119275-0aa32b31d458?auto=format&fit=crop&w=800&q=80',
      cities: '2 Cities',
      location: 'Multi Days Tours',
      tags: ['Multi Days', 'Standard Packages'],
      duration: '4 Days / 3 Nights',
      price: 420.00
    },
    {
      id: 'md2',
      title: '6 Days Holiday In Cairo & Sharm El Sheikh Red Sea Package',
      image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80',
      cities: '2 Cities',
      location: 'Multi Days Tours',
      tags: ['Multi Days', 'Resort & Beach'],
      duration: '6 Days / 5 Nights',
      price: 780.00
    }
  ],
  nile_cruises: [
    {
      id: 'nc1',
      title: '5 Days Luxor to Aswan 5-Star Nile Cruise on Full Board',
      image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80',
      cities: '3 Cities',
      location: 'Nile Cruise',
      tags: ['Nile Cruises', 'Luxury'],
      duration: '5 Days / 4 Nights',
      price: 520.00
    },
    {
      id: 'nc2',
      title: '4 Days Aswan to Luxor Nile Cruise Adventure on Dahabiya',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      cities: '3 Cities',
      location: 'Nile Cruise',
      tags: ['Nile Cruises', 'Traditional Sail'],
      duration: '4 Days / 3 Nights',
      price: 680.00
    }
  ],
  shore_excursions: [
    {
      id: 'se1',
      title: 'Port Said Shore Excursion: Pyramids Giza and Sakkara Day Trip',
      image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80',
      cities: 'Cairo',
      location: 'Shore Excursions',
      tags: ['Shore Excursion', 'Cruisers Only'],
      duration: '12 Hours',
      price: 135.00
    },
    {
      id: 'se2',
      title: 'Safaga Port Shore Excursion: High-Value Luxor Overnight Cruise Tour',
      image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80',
      cities: 'Luxor',
      location: 'Shore Excursions',
      tags: ['Shore Excursion', 'Overnight'],
      duration: '2 Days',
      price: 240.00
    }
  ]
};

export const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: 'o1',
    title: 'Package 12 Days 11 Nights Luxury Cairo, Luxor, Aswan & Hurghada',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
    cities: '5 Cities',
    location: 'Luxury Packages',
    tags: ['Luxury Packages', 'Special Offer'],
    duration: '12 Days / 11 Nights',
    price: 3918.80,
    originalPrice: 4040.00,
    badge: 'Special Offer',
    countdownDays: 193
  },
  {
    id: 'o2',
    title: 'Package 13 Days 12 Nights To Cairo, Luxor, Aswan, Desert Camp & Oasis',
    image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=800&q=80',
    cities: '5 Cities',
    location: 'Luxury Packages',
    tags: ['Luxury Packages', 'Special Offer'],
    duration: '13 Days',
    price: 4413.50,
    originalPrice: 4550.00,
    badge: 'Special Offer',
    countdownDays: 193
  },
  {
    id: 'o3',
    title: 'Tour To Pyramids and The Egyptian Museum with Felucca Ride',
    image: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80',
    cities: '3 Cities',
    location: 'Day Tour',
    tags: ['Day Tour', 'Special Offer'],
    duration: 'About 6 Hours',
    price: 75.33,
    originalPrice: 81.00,
    badge: 'Special Offer',
    countdownDays: 193
  },
  {
    id: 'o4',
    title: 'Package 7 Days 6 Nights to Egypt and Jordan: Petra and Pyramids Combo',
    image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80',
    cities: '3 Cities',
    location: 'Egypt Classic Tours',
    tags: ['Egypt Classic Tours', 'Special Offer'],
    duration: '7 Days / 6 Nights',
    price: 1333.75,
    originalPrice: 1375.00,
    badge: 'Special Offer',
    countdownDays: 193
  }
];

export const GALLERY_ITEMS = [
  {
    id: 'g1',
    title: 'Traditional Egyptian Kabab and Skewers',
    category: 'Cuisine',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder video
    mediaType: 'youtube'
  },
  {
    id: 'g2',
    title: 'Flamingos Gathering in Egyptian Lakes',
    category: 'Wildlife',
    image: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    mediaType: 'youtube'
  },
  {
    id: 'g3',
    title: 'Festivals of Egypt',
    category: 'Festivals',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://www.tiktok.com/@sun_pyramids_tours',
    mediaType: 'tiktok'
  },
  {
    id: 'g4',
    title: 'Discovering Underwater Marine Coral Reefs in Sinai',
    category: 'Red Sea Marine Life',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://www.instagram.com/sunpyramids/',
    mediaType: 'instagram'
  },
  {
    id: 'g5',
    title: 'El Fayoum Lake Magic Views',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://www.facebook.com/sunpyramids',
    mediaType: 'facebook'
  }
];
