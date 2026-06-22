export interface TourPackage {
  id: string;
  title: string;
  image: string;
  images?: string[]; // Gallery image URLs (image = images[0])
  videos?: string[]; // Video URLs
  cities: number | string;
  location: string;
  tags: string[];
  duration: string;
  price: number;
  description?: string | null;
}

export interface SpecialOffer extends TourPackage {
  originalPrice: number;
  badge: string;
  countdownDays: number;
}

export interface BookingState {
  tripType: 'make' | 'find' | 'rent';
  travelTimeType: 'exact' | 'approximate' | 'sure_yet';
  fromDate: string;
  toDate: string;
  fromLocation: string;
  toLocation: string;
}

export interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}
