import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Service Areas (Dwarka Sectors 6, 10, 12)
  const areas = [
    { name: "Dwarka Sector 12", sector: "Sector 12", minLat: 28.588, maxLat: 28.598, minLng: 77.040, maxLng: 77.052 },
    { name: "Dwarka Sector 10", sector: "Sector 10", minLat: 28.576, maxLat: 28.586, minLng: 77.048, maxLng: 77.060 },
    { name: "Dwarka Sector 6", sector: "Sector 6", minLat: 28.582, maxLat: 28.592, minLng: 77.053, maxLng: 77.065 },
  ];
  for (const a of areas) {
    await prisma.serviceArea.upsert({
      where: { sector: a.sector },
      update: a,
      create: a,
    });
  }

  // 2. Coupons
  const coupons = [
    { code: "WELCOME100", discountType: "FLAT", discountValue: 100, firstOrderOnly: true, weekendOnly: false },
    { code: "FIRST50", discountType: "FLAT", discountValue: 50, firstOrderOnly: true, weekendOnly: false },
    { code: "WEEKEND15", discountType: "PERCENT", discountValue: 15, firstOrderOnly: false, weekendOnly: true },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: c, create: c });
  }

  // 3. Services
  const services = [
    { slug: "full-home-deep-cleaning-2bhk", name: "Full Home Deep Cleaning (2BHK)", category: "cleaning", price: 1499, mrp: 1899, duration: "3 hrs", rating: 4.9, reviewCount: 1400, description: "Complete dusting, mopping, bathroom & kitchen scrubbing." },
    { slug: "bathroom-deep-cleaning", name: "Bathroom Deep Cleaning", category: "cleaning", price: 499, mrp: 699, duration: "45 mins", rating: 4.9, reviewCount: 2100, description: "Tile descaling, tap & mirror polish, floor scrubbing." },
    { slug: "utensils-kitchen-cleanup", name: "Utensils & Kitchen Cleanup", category: "utensils", price: 199, mrp: 249, duration: "1 hr", rating: 4.8, reviewCount: 980, description: "Dishwashing, sink scrub, and kitchen counter wipe-down." },
    { slug: "errands-local-shopping", name: "Errands & Local Shopping", category: "errands", price: 149, mrp: 199, duration: "45 mins", rating: 4.9, reviewCount: 760, description: "Pharmacy, bakery, or stationery pickup with receipt upload." },
    { slug: "parcel-pickup-drop", name: "Parcel Pickup & Drop", category: "parcels", price: 99, mrp: 149, duration: "20 mins", rating: 4.9, reviewCount: 1100, description: "Gate-to-door parcel, laundry, or tiffin pickup & drop." },
    { slug: "wardrobe-home-organising", name: "Wardrobe & Home Organising", category: "organising", price: 399, mrp: 499, duration: "1.5 hrs", rating: 4.8, reviewCount: 540, description: "Fold, sort, and organise one full wardrobe or bookshelf." },
    { slug: "birthday-party-decoration", name: "Birthday & Party Decoration", category: "decoration", price: 699, mrp: 899, duration: "1.5 hrs", rating: 4.9, reviewCount: 430, description: "Balloon arch, backdrop setup, and fairy lights." },
    { slug: "event-help", name: "Event Help (Setup & Serving)", category: "events", price: 599, mrp: 799, duration: "2 hrs", rating: 4.8, reviewCount: 310, description: "Table setup, snack serving, and post-event cleanup." },
    { slug: "excel-data-help", name: "Excel & Data Help", category: "excel", price: 349, mrp: 449, duration: "1 hr", rating: 4.9, reviewCount: 280, description: "Spreadsheets, pivot tables, formatting, and data entry." },
    { slug: "tutoring", name: "Tutoring & Concept Explaining", category: "tutoring", price: 399, mrp: 499, duration: "1 hr", rating: 4.9, reviewCount: 350, description: "1-on-1 concept explanation (never doing homework for anyone)." },
    { slug: "pet-walking", name: "Pet Walking (30 mins)", category: "pets", price: 199, mrp: 249, duration: "30 mins", rating: 4.9, reviewCount: 620, description: "Safe, GPS-tracked society walk for your dog." },
    { slug: "moving-shifting-help", name: "Moving & Shifting Help", category: "moving", price: 499, mrp: 649, duration: "1.5 hrs", rating: 4.8, reviewCount: 470, description: "Box packing, furniture shifting, and loading assistance." },
    { slug: "small-repairs", name: "Small Repairs (Electrician / Plumber)", category: "repairs", price: 249, mrp: 349, duration: "45 mins", rating: 4.8, reviewCount: 1500, description: "Verified technician for switches, fans, taps, or hinges." },
    { slug: "queueing", name: "Queueing for Someone", category: "queueing", price: 179, mrp: 229, duration: "1 hr", rating: 4.8, reviewCount: 190, description: "Stand in line at clinics, banks, or society offices." },
    { slug: "sports-gaming-partner", name: "Sports & Gaming Partner", category: "sports", price: 299, mrp: 399, duration: "1 hr", rating: 4.9, reviewCount: 240, description: "Badminton, table tennis, or chess partner in your society." },
  ];
  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }

  // 4. Groceries
  const groceries = [
    { slug: "toned-fresh-milk", name: "Toned Fresh Milk", aisle: "Dairy & Eggs", price: 27, mrp: 29, unit: "500 ml", rating: 4.9, reviewCount: 1200, description: "Chilled pasteurised toned milk from local dairy." },
    { slug: "whole-wheat-brown-bread", name: "Whole Wheat Brown Bread", aisle: "Dairy & Eggs", price: 45, mrp: 50, unit: "400 g", rating: 4.8, reviewCount: 840, description: "Freshly baked whole wheat sandwich bread." },
    { slug: "farm-fresh-white-eggs", name: "Farm Fresh White Eggs", aisle: "Dairy & Eggs", price: 54, mrp: 65, unit: "6 pcs", rating: 4.8, reviewCount: 620, description: "Hygienically packed protein-rich farm eggs." },
    { slug: "fresh-desi-tomatoes", name: "Fresh Desi Tomatoes", aisle: "Fruits & Vegetables", price: 38, mrp: 48, unit: "500 g", rating: 4.7, reviewCount: 510, description: "Hand-picked ripe red tomatoes." },
    { slug: "aged-basmati-rice", name: "Aged Basmati Rice", aisle: "Staples", price: 215, mrp: 245, unit: "1 kg", rating: 4.9, reviewCount: 930, description: "Long-grain aromatic basmati rice for everyday cooking." },
    { slug: "classic-instant-coffee", name: "Classic Instant Coffee", aisle: "Beverages", price: 165, mrp: 180, unit: "90 g", rating: 4.9, reviewCount: 410, description: "Rich roasted coffee granules." },
    { slug: "matic-liquid-detergent", name: "Matic Liquid Detergent", aisle: "Household", price: 229, mrp: 260, unit: "1 L", rating: 4.8, reviewCount: 580, description: "Stain removal liquid for washing machines." },
    { slug: "shimla-apples", name: "Shimla Apples", aisle: "Fruits & Vegetables", price: 149, mrp: 180, unit: "500 g", rating: 4.8, reviewCount: 390, description: "Crisp, sweet apples sorted for quality." },
  ];
  for (const g of groceries) {
    await prisma.groceryItem.upsert({ where: { slug: g.slug }, update: g, create: g });
  }

  // 5. Packs
  const packs = [
    { slug: "guests-coming-over", name: "Guests Coming Over", description: "Living room, bathroom & kitchen reset plus utensil cleanup.", originalPrice: 1297, packPrice: 999, duration: "2 hrs" },
    { slug: "move-in-ready", name: "Move-In Ready", description: "Full 2BHK deep clean, wardrobe wipe-down & unpacking help.", originalPrice: 2497, packPrice: 1999, duration: "4 hrs" },
    { slug: "festival-ready", name: "Festival Ready", description: "Deep clean, balcony wash, and festive home decoration.", originalPrice: 1897, packPrice: 1499, duration: "3 hrs" },
    { slug: "exam-week-support", name: "Exam Week Support", description: "Quiet study desk organising, tutoring & daily grocery run.", originalPrice: 947, packPrice: 749, duration: "2 hrs" },
    { slug: "weekend-reset", name: "Weekend Reset", description: "Bathroom clean, utensil wash, and laundry folding.", originalPrice: 1047, packPrice: 849, duration: "2 hrs" },
    { slug: "new-flat-setup", name: "New Flat Setup", description: "Small repairs coordination, cleaning, and furniture shifting.", originalPrice: 1797, packPrice: 1449, duration: "3 hrs" },
    { slug: "party-prep", name: "Party Prep", description: "Birthday/party decoration, serving help, and post-party cleanup.", originalPrice: 2197, packPrice: 1799, duration: "3.5 hrs" },
  ];
  for (const p of packs) {
    await prisma.pack.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  // 6. Test Users
  await prisma.user.upsert({
    where: { phone: "+919876543210" },
    update: {},
    create: { phone: "+919876543210", name: "Ananya Sharma", role: Role.CUSTOMER },
  });

  const helperUser = await prisma.user.upsert({
    where: { phone: "+919876543211" },
    update: {},
    create: { phone: "+919876543211", name: "Isha Kapoor", role: Role.HELPER },
  });
  await prisma.helperProfile.upsert({
    where: { userId: helperUser.id },
    update: {},
    create: {
      userId: helperUser.id,
      sector: "Sector 12",
      skills: ["cleaning", "utensils", "organising"],
      verified: true,
      online: true,
      rating: 4.94,
      lat: 28.591,
      lng: 77.048,
    },
  });

  await prisma.user.upsert({
    where: { phone: "+919876543212" },
    update: {},
    create: { phone: "+919876543212", name: "Shell Ops", role: Role.OPS },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
