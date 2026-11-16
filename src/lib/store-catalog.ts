export type ItemKind = "good" | "service";

export type CategoryId =
  | "all"
  | "groceries"
  | "cleaning"
  | "utensils"
  | "errands"
  | "parcels"
  | "organising"
  | "decoration"
  | "events"
  | "excel"
  | "tutoring"
  | "pets"
  | "moving"
  | "repairs"
  | "queueing"
  | "sports";

export interface CatalogItem {
  id: string;
  name: string;
  kind: ItemKind;
  category: Exclude<CategoryId, "all">;
  price: number;
  mrp?: number;
  unit: string;
  eta: string;
  rating: number;
  reviews: string;
  badge?: string;
  description: string;
  inclusions?: string[];
  exclusions?: string[];
  iconName: string;
}

export interface ServicePack {
  id: string;
  name: string;
  description: string;
  services: string[];
  originalPrice: number;
  packPrice: number;
  duration: string;
}

export interface LocationPreset {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  etaMins: number;
}

export const CATEGORIES: { id: CategoryId; label: string; iconName: string }[] = [
  { id: "all", label: "All", iconName: "LayoutGrid" },
  { id: "groceries", label: "Groceries", iconName: "ShoppingBag" },
  { id: "cleaning", label: "Home Cleaning", iconName: "Sparkles" },
  { id: "utensils", label: "Utensils & Kitchen", iconName: "Utensils" },
  { id: "errands", label: "Errands", iconName: "ShoppingBasket" },
  { id: "parcels", label: "Parcel Pickup", iconName: "Package" },
  { id: "organising", label: "Wardrobe & Organising", iconName: "FolderKanban" },
  { id: "decoration", label: "Decoration", iconName: "PartyPopper" },
  { id: "events", label: "Event Help", iconName: "Users" },
  { id: "excel", label: "Excel & Data", iconName: "FileSpreadsheet" },
  { id: "tutoring", label: "Tutoring", iconName: "BookOpen" },
  { id: "pets", label: "Pet Walking", iconName: "Dog" },
  { id: "moving", label: "Moving Help", iconName: "Truck" },
  { id: "repairs", label: "Small Repairs", iconName: "Wrench" },
  { id: "queueing", label: "Queueing", iconName: "Clock" },
  { id: "sports", label: "Sports Partner", iconName: "Trophy" },
];

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: "dwarka-12",
    name: "Dwarka Sector 12, Metro View Apartments",
    area: "Dwarka, New Delhi",
    lat: 28.5921,
    lng: 77.046,
    etaMins: 12,
  },
  {
    id: "dwarka-6",
    name: "Dwarka Sector 6, Golf Link Residency",
    area: "Dwarka, New Delhi",
    lat: 28.5875,
    lng: 77.0585,
    etaMins: 14,
  },
  {
    id: "dwarka-10",
    name: "Dwarka Sector 10, Harmony Apartments",
    area: "Dwarka, New Delhi",
    lat: 28.5812,
    lng: 77.0532,
    etaMins: 15,
  },
];

export const SERVICE_PACKS: ServicePack[] = [
  {
    id: "pack-guests",
    name: "Guests Coming Over",
    description: "Living room, bathroom & kitchen reset plus utensil cleanup.",
    services: ["Bathroom Cleaning", "Kitchen Cleanup", "Living Room Tidy"],
    originalPrice: 1297,
    packPrice: 999,
    duration: "2 hrs",
  },
  {
    id: "pack-movein",
    name: "Move-In Ready",
    description: "Full 2BHK deep clean, wardrobe wipe-down & unpacking help.",
    services: ["Full Home Deep Clean", "Wardrobe Organising", "Moving Help"],
    originalPrice: 2497,
    packPrice: 1999,
    duration: "4 hrs",
  },
  {
    id: "pack-festival",
    name: "Festival Ready",
    description: "Deep clean, balcony wash, and festive home decoration.",
    services: ["Full Home Clean", "Balcony Wash", "Festival Decoration"],
    originalPrice: 1897,
    packPrice: 1499,
    duration: "3 hrs",
  },
  {
    id: "pack-exam",
    name: "Exam Week Support",
    description: "Quiet study desk organising, tutoring & daily grocery run.",
    services: ["Room Organising", "Tutoring (1 hr)", "Grocery Run"],
    originalPrice: 947,
    packPrice: 749,
    duration: "2 hrs",
  },
  {
    id: "pack-weekend",
    name: "Weekend Reset",
    description: "Bathroom clean, utensil wash, and laundry folding.",
    services: ["Bathroom Cleaning", "Utensils (1 hr)", "Wardrobe Fold"],
    originalPrice: 1047,
    packPrice: 849,
    duration: "2 hrs",
  },
  {
    id: "pack-newflat",
    name: "New Flat Setup",
    description: "Small repairs coordination, cleaning, and furniture shifting.",
    services: ["Small Repairs", "Deep Cleaning", "Moving Help"],
    originalPrice: 1797,
    packPrice: 1449,
    duration: "3 hrs",
  },
  {
    id: "pack-party",
    name: "Party Prep",
    description: "Birthday/party decoration, serving help, and post-party cleanup.",
    services: ["Party Decoration", "Event Serving", "Post-Party Cleanup"],
    originalPrice: 2197,
    packPrice: 1799,
    duration: "3.5 hrs",
  },
];

export const STORE_ITEMS: CatalogItem[] = [
  // GROCERIES (Real Everyday Products)
  {
    id: "good-milk",
    name: "Toned Fresh Milk",
    kind: "good",
    category: "groceries",
    price: 27,
    mrp: 29,
    unit: "500 ml",
    eta: "12 mins",
    rating: 4.9,
    reviews: "1.2k",
    badge: "Daily",
    description: "Chilled pasteurised toned milk from local dairy.",
    iconName: "Milk",
  },
  {
    id: "good-bread",
    name: "Whole Wheat Brown Bread",
    kind: "good",
    category: "groceries",
    price: 45,
    mrp: 50,
    unit: "400 g",
    eta: "12 mins",
    rating: 4.8,
    reviews: "840",
    description: "Freshly baked whole wheat sandwich bread.",
    iconName: "Wheat",
  },
  {
    id: "good-eggs",
    name: "Farm Fresh White Eggs",
    kind: "good",
    category: "groceries",
    price: 54,
    mrp: 65,
    unit: "6 pcs",
    eta: "12 mins",
    rating: 4.8,
    reviews: "620",
    description: "Hygienically packed protein-rich farm eggs.",
    iconName: "Egg",
  },
  {
    id: "good-tomatoes",
    name: "Fresh Desi Tomatoes",
    kind: "good",
    category: "groceries",
    price: 38,
    mrp: 48,
    unit: "500 g",
    eta: "12 mins",
    rating: 4.7,
    reviews: "510",
    description: "Hand-picked ripe red tomatoes.",
    iconName: "Apple",
  },
  {
    id: "good-rice",
    name: "Aged Basmati Rice",
    kind: "good",
    category: "groceries",
    price: 215,
    mrp: 245,
    unit: "1 kg",
    eta: "12 mins",
    rating: 4.9,
    reviews: "930",
    description: "Long-grain aromatic basmati rice for everyday cooking.",
    iconName: "Wheat",
  },
  {
    id: "good-coffee",
    name: "Classic Instant Coffee",
    kind: "good",
    category: "groceries",
    price: 165,
    mrp: 180,
    unit: "90 g",
    eta: "12 mins",
    rating: 4.9,
    reviews: "410",
    description: "Rich roasted coffee granules.",
    iconName: "Coffee",
  },
  {
    id: "good-detergent",
    name: "Matic Liquid Detergent",
    kind: "good",
    category: "groceries",
    price: 229,
    mrp: 260,
    unit: "1 L",
    eta: "12 mins",
    rating: 4.8,
    reviews: "580",
    description: "Stain removal liquid for washing machines.",
    iconName: "Droplets",
  },
  {
    id: "good-apples",
    name: "Shimla Apples",
    kind: "good",
    category: "groceries",
    price: 149,
    mrp: 180,
    unit: "500 g",
    eta: "12 mins",
    rating: 4.8,
    reviews: "390",
    description: "Crisp, sweet apples sorted for quality.",
    iconName: "Apple",
  },

  // 15 CORE SERVICES
  {
    id: "srv-home-clean",
    name: "Full Home Deep Cleaning (2BHK)",
    kind: "service",
    category: "cleaning",
    price: 1499,
    mrp: 1899,
    unit: "3 hrs",
    eta: "30 mins",
    rating: 4.9,
    reviews: "1.4k",
    badge: "Popular",
    description: "Complete dusting, mopping, bathroom & kitchen scrubbing.",
    inclusions: ["Floors, fans, windows", "2 bathrooms & kitchen", "Balcony wash"],
    exclusions: ["Exterior glass above reach", "Wall painting"],
    iconName: "Sparkles",
  },
  {
    id: "srv-bathroom-clean",
    name: "Bathroom Deep Cleaning",
    kind: "service",
    category: "cleaning",
    price: 499,
    mrp: 699,
    unit: "45 mins",
    eta: "25 mins",
    rating: 4.9,
    reviews: "2.1k",
    badge: "Top Rated",
    description: "Tile descaling, tap & mirror polish, floor scrubbing.",
    iconName: "Sparkles",
  },
  {
    id: "srv-utensils",
    name: "Utensils & Kitchen Cleanup",
    kind: "service",
    category: "utensils",
    price: 199,
    mrp: 249,
    unit: "1 hr",
    eta: "20 mins",
    rating: 4.8,
    reviews: "980",
    description: "Dishwashing, sink scrub, and kitchen counter wipe-down.",
    iconName: "Utensils",
  },
  {
    id: "srv-errands",
    name: "Errands & Local Shopping",
    kind: "service",
    category: "errands",
    price: 149,
    mrp: 199,
    unit: "45 mins",
    eta: "15 mins",
    rating: 4.9,
    reviews: "760",
    description: "Pharmacy, bakery, or stationery pickup with receipt upload.",
    iconName: "ShoppingBasket",
  },
  {
    id: "srv-parcel",
    name: "Parcel Pickup & Drop",
    kind: "service",
    category: "parcels",
    price: 99,
    mrp: 149,
    unit: "20 mins",
    eta: "12 mins",
    rating: 4.9,
    reviews: "1.1k",
    badge: "Fastest",
    description: "Gate-to-door parcel, laundry, or tiffin pickup & drop.",
    iconName: "Package",
  },
  {
    id: "srv-wardrobe",
    name: "Wardrobe & Home Organising",
    kind: "service",
    category: "organising",
    price: 399,
    mrp: 499,
    unit: "1.5 hrs",
    eta: "30 mins",
    rating: 4.8,
    reviews: "540",
    description: "Fold, sort, and organise one full wardrobe or bookshelf.",
    iconName: "FolderKanban",
  },
  {
    id: "srv-decoration",
    name: "Birthday & Party Decoration",
    kind: "service",
    category: "decoration",
    price: 699,
    mrp: 899,
    unit: "1.5 hrs",
    eta: "45 mins",
    rating: 4.9,
    reviews: "430",
    description: "Balloon arch, backdrop setup, and fairy lights.",
    iconName: "PartyPopper",
  },
  {
    id: "srv-events",
    name: "Event Help (Setup & Serving)",
    kind: "service",
    category: "events",
    price: 599,
    mrp: 799,
    unit: "2 hrs",
    eta: "45 mins",
    rating: 4.8,
    reviews: "310",
    description: "Table setup, snack serving, and post-event cleanup.",
    iconName: "Users",
  },
  {
    id: "srv-excel",
    name: "Excel & Data Help",
    kind: "service",
    category: "excel",
    price: 349,
    mrp: 449,
    unit: "1 hr",
    eta: "30 mins",
    rating: 4.9,
    reviews: "280",
    description: "Spreadsheets, pivot tables, formatting, and data entry.",
    iconName: "FileSpreadsheet",
  },
  {
    id: "srv-tutoring",
    name: "Tutoring & Concept Explaining",
    kind: "service",
    category: "tutoring",
    price: 399,
    mrp: 499,
    unit: "1 hr",
    eta: "45 mins",
    rating: 4.9,
    reviews: "350",
    description: "1-on-1 concept explanation (never doing homework for anyone).",
    iconName: "BookOpen",
  },
  {
    id: "srv-pet",
    name: "Pet Walking (30 mins)",
    kind: "service",
    category: "pets",
    price: 199,
    mrp: 249,
    unit: "30 mins",
    eta: "20 mins",
    rating: 4.9,
    reviews: "620",
    description: "Safe, GPS-tracked society walk for your dog.",
    iconName: "Dog",
  },
  {
    id: "srv-moving",
    name: "Moving & Shifting Help",
    kind: "service",
    category: "moving",
    price: 499,
    mrp: 649,
    unit: "1.5 hrs",
    eta: "35 mins",
    rating: 4.8,
    reviews: "470",
    description: "Box packing, furniture shifting, and loading assistance.",
    iconName: "Truck",
  },
  {
    id: "srv-repairs",
    name: "Small Repairs (Electrician / Plumber)",
    kind: "service",
    category: "repairs",
    price: 249,
    mrp: 349,
    unit: "45 mins",
    eta: "25 mins",
    rating: 4.8,
    reviews: "1.5k",
    badge: "30-Day Warranty",
    description: "Verified technician for switches, fans, taps, or hinges.",
    iconName: "Wrench",
  },
  {
    id: "srv-queueing",
    name: "Queueing for Someone",
    kind: "service",
    category: "queueing",
    price: 179,
    mrp: 229,
    unit: "1 hr",
    eta: "20 mins",
    rating: 4.8,
    reviews: "190",
    description: "Stand in line at clinics, banks, or society offices.",
    iconName: "Clock",
  },
  {
    id: "srv-sports",
    name: "Sports & Gaming Partner",
    kind: "service",
    category: "sports",
    price: 299,
    mrp: 399,
    unit: "1 hr",
    eta: "30 mins",
    rating: 4.9,
    reviews: "240",
    description: "Badminton, table tennis, or chess partner in your society.",
    iconName: "Trophy",
  },
];
