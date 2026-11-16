export type ItemKind = "good" | "service";

export type CategoryId =
  | "all"
  | "groceries"
  | "cleaning"
  | "repairs"
  | "salon"
  | "errands";

export interface CatalogItem {
  id: string;
  name: string;
  kind: ItemKind;
  category: Exclude<CategoryId, "all">;
  price: number;
  mrp?: number;
  unit: string; // e.g., "500 ml", "1 kg", "45 mins", "Per visit"
  eta: string; // e.g., "10 mins", "20 mins"
  rating: number;
  reviews: string;
  badge?: string;
  description: string;
  emoji: string;
  accentBg: string;
}

export interface LocationPreset {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  etaMins: number;
}

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "groceries", label: "Groceries & Daily", emoji: "🥛" },
  { id: "cleaning", label: "Home Cleaning", emoji: "🧹" },
  { id: "repairs", label: "Repairs & Electrician", emoji: "🔧" },
  { id: "salon", label: "Salon & Grooming", emoji: "💇" },
  { id: "errands", label: "Errands & Parcels", emoji: "📦" },
];

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: "dwarka-12",
    name: "Dwarka Sector 12, Metro View",
    area: "Dwarka, New Delhi",
    lat: 28.5921,
    lng: 77.046,
    etaMins: 11,
  },
  {
    id: "dwarka-6",
    name: "Dwarka Sector 6, Market",
    area: "Dwarka, New Delhi",
    lat: 28.5875,
    lng: 77.0585,
    etaMins: 12,
  },
  {
    id: "vasant-kunj",
    name: "Vasant Kunj, Sector B",
    area: "South Delhi",
    lat: 28.5293,
    lng: 77.1536,
    etaMins: 14,
  },
  {
    id: "saket",
    name: "Saket, J-Block",
    area: "South Delhi",
    lat: 28.5245,
    lng: 77.2066,
    etaMins: 15,
  },
  {
    id: "gurugram-dlf",
    name: "DLF Phase 4, Galleria",
    area: "Gurugram",
    lat: 28.4677,
    lng: 77.0815,
    etaMins: 13,
  },
];

export const STORE_ITEMS: CatalogItem[] = [
  // REAL GOODS (Blinkit-style)
  {
    id: "good-milk",
    name: "Amul Taaza Toned Fresh Milk",
    kind: "good",
    category: "groceries",
    price: 27,
    mrp: 29,
    unit: "500 ml",
    eta: "10 mins",
    rating: 4.9,
    reviews: "12.4k",
    badge: "Bestseller",
    description: "Farm-fresh pasteurised toned milk delivered chilled.",
    emoji: "🥛",
    accentBg: "bg-sky-50",
  },
  {
    id: "good-bread",
    name: "Harvest Gold Brown Bread",
    kind: "good",
    category: "groceries",
    price: 45,
    mrp: 50,
    unit: "400 g",
    eta: "10 mins",
    rating: 4.8,
    reviews: "8.1k",
    description: "Soft whole-wheat brown bread, baked fresh daily.",
    emoji: "🍞",
    accentBg: "bg-amber-50",
  },
  {
    id: "good-eggs",
    name: "Farm Fresh White Eggs (6 pcs)",
    kind: "good",
    category: "groceries",
    price: 54,
    mrp: 65,
    unit: "6 pieces",
    eta: "10 mins",
    rating: 4.8,
    reviews: "5.2k",
    badge: "17% OFF",
    description: "Protein-rich, hygienically packed farm eggs.",
    emoji: "🥚",
    accentBg: "bg-orange-50",
  },
  {
    id: "good-tomatoes",
    name: "Fresh Desi Tomatoes",
    kind: "good",
    category: "groceries",
    price: 38,
    mrp: 48,
    unit: "500 g",
    eta: "10 mins",
    rating: 4.7,
    reviews: "4.6k",
    description: "Hand-picked juicy red tomatoes from local farms.",
    emoji: "🍅",
    accentBg: "bg-red-50",
  },
  {
    id: "good-apples",
    name: "Shimla Royal Gala Apples",
    kind: "good",
    category: "groceries",
    price: 149,
    mrp: 185,
    unit: "4 pcs (500 g)",
    eta: "12 mins",
    rating: 4.8,
    reviews: "3.9k",
    badge: "Fresh",
    description: "Crisp, sweet Himachal apples sorted for quality.",
    emoji: "🍎",
    accentBg: "bg-rose-50",
  },
  {
    id: "good-rice",
    name: "India Gate Classic Basmati Rice",
    kind: "good",
    category: "groceries",
    price: 215,
    mrp: 245,
    unit: "1 kg",
    eta: "12 mins",
    rating: 4.9,
    reviews: "9.8k",
    description: "Aged extra-long grain basmati rice for daily meals.",
    emoji: "🍚",
    accentBg: "bg-stone-100",
  },
  {
    id: "good-coffee",
    name: "Nescafe Classic Instant Coffee",
    kind: "good",
    category: "groceries",
    price: 165,
    mrp: 180,
    unit: "90 g jar",
    eta: "10 mins",
    rating: 4.9,
    reviews: "6.3k",
    description: "Rich, aromatic 100% pure coffee granules.",
    emoji: "☕",
    accentBg: "bg-amber-50",
  },
  {
    id: "good-detergent",
    name: "Surf Excel Matic Liquid Detergent",
    kind: "good",
    category: "groceries",
    price: 229,
    mrp: 260,
    unit: "1 Litre",
    eta: "12 mins",
    rating: 4.8,
    reviews: "7.1k",
    description: "Tough stain removal for front & top load machines.",
    emoji: "🧴",
    accentBg: "bg-blue-50",
  },

  // REAL HOME SERVICES (Urban Company-style)
  {
    id: "srv-bathroom",
    name: "Intense Bathroom Deep Cleaning",
    kind: "service",
    category: "cleaning",
    price: 499,
    mrp: 699,
    unit: "45 mins",
    eta: "25 mins",
    rating: 4.91,
    reviews: "18.2k",
    badge: "Top Rated",
    description: "Tile descaling, tap & mirror polish, floor scrubbing with eco-safe solutions.",
    emoji: "🚿",
    accentBg: "bg-emerald-50",
  },
  {
    id: "srv-kitchen",
    name: "Kitchen Chimney & Grease Clean",
    kind: "service",
    category: "cleaning",
    price: 599,
    mrp: 799,
    unit: "60 mins",
    eta: "30 mins",
    rating: 4.87,
    reviews: "9.4k",
    description: "Deep degreasing of chimney filter, hob, tiles, and exhaust.",
    emoji: "🍳",
    accentBg: "bg-teal-50",
  },
  {
    id: "srv-sofa",
    name: "Sofa & Carpet Shampooing (3-Seater)",
    kind: "service",
    category: "cleaning",
    price: 699,
    mrp: 899,
    unit: "60 mins",
    eta: "35 mins",
    rating: 4.89,
    reviews: "6.8k",
    description: "Dry-vacuuming + foam shampoo extraction for spotless upholstery.",
    emoji: "🛋️",
    accentBg: "bg-indigo-50",
  },
  {
    id: "srv-ac",
    name: "Split AC Foam-Jet Service",
    kind: "service",
    category: "repairs",
    price: 549,
    mrp: 799,
    unit: "45 mins",
    eta: "25 mins",
    rating: 4.92,
    reviews: "24.1k",
    badge: "30-Day Warranty",
    description: "2x cooling boost, indoor & outdoor unit pressure wash, drain check.",
    emoji: "❄️",
    accentBg: "bg-cyan-50",
  },
  {
    id: "srv-electrician",
    name: "Electrician: Fan, Switch & MCB",
    kind: "service",
    category: "repairs",
    price: 199,
    mrp: 299,
    unit: "30 mins",
    eta: "18 mins",
    rating: 4.86,
    reviews: "14.5k",
    badge: "Fastest",
    description: "Verified electrician for ceiling fan, switchboard, or wiring fixes.",
    emoji: "⚡",
    accentBg: "bg-yellow-50",
  },
  {
    id: "srv-plumber",
    name: "Plumber: Tap, Mixer & Leak Fix",
    kind: "service",
    category: "repairs",
    price: 249,
    mrp: 349,
    unit: "30 mins",
    eta: "20 mins",
    rating: 4.84,
    reviews: "11.2k",
    description: "Fix dripping taps, jammed valves, or sink blockages cleanly.",
    emoji: "🚰",
    accentBg: "bg-sky-50",
  },
  {
    id: "srv-haircut",
    name: "Men's Haircut & Beard Grooming",
    kind: "service",
    category: "salon",
    price: 299,
    mrp: 399,
    unit: "40 mins",
    eta: "25 mins",
    rating: 4.9,
    reviews: "15.7k",
    badge: "Hygiene Kit",
    description: "Salon-grade stylist at home with disposable cape & sanitized tools.",
    emoji: "✂️",
    accentBg: "bg-purple-50",
  },
  {
    id: "srv-errand",
    name: "Gate / Parcel Pickup & Errand",
    kind: "service",
    category: "errands",
    price: 99,
    mrp: 149,
    unit: "20 mins",
    eta: "12 mins",
    rating: 4.95,
    reviews: "8.9k",
    badge: "12-Min Hero",
    description: "Verified runner picks up parcels, laundry, or medicines right to your door.",
    emoji: "🏃",
    accentBg: "bg-lime-50",
  },
];
