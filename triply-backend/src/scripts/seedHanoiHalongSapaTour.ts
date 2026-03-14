import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * VN Travel Tours – Hanoi – Halong Bay – Sapa – Fansipan
 * 4 Days / 3 Nights
 * Seeds a single destination (upserts by slug).
 */
const hanoiHalongSapaTour = {
  name: 'Hanoi – Halong Bay – Sapa – Fansipan',
  slug: 'hanoi-halong-sapa-fansipan',
  shortDescription:
    '4 Days / 3 Nights · 🚢 Halong Bay cruise · 🏔️ Sapa & Fansipan Peak · 🚌 Sleeper bus · VN Travel Tours',
  description: `VN Travel Tours — Hanoi – Halong Bay – Sapa – Fansipan

4 Days / 3 Nights | 1 night Halong City, 1 night Hanoi, 1 night Sapa

Transport: shuttle bus with A/C; cabin sleeper bus Hanoi–Sapa–Hanoi (surcharge for solo travelers). 3-star hotels; sightseeing boat in Halong Bay; English-speaking guides. Entrance fees per program (cable car return ticket not included).

Tour price in USD on S.I.C (join group) basis. From 2 pax: 225 USD; from 10 pax onwards on request. Private tour: contact for full itinerary and rate. Child policy: under 3 free; 4–9 years 75%; 10+ as adult. Tip for driver and guide: compulsory, at least 3 USD/passenger/day.`,
  country: 'Vietnam',
  region: 'North Vietnam',
  duration: { days: 4, nights: 3 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  images: [
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200',
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
  ],
  highlights: [
    '4 Days / 3 Nights',
    'Halong Bay cruise & Surprising Cave',
    'Sapa & Cat Cat Village',
    'Fansipan Peak (3,143 m) – Roof of Indochina',
    'Sleeper bus · 3-star hotels · English-speaking guides',
  ],
  itinerary: [
    {
      day: '01 — Hanoi – Halong Bay',
      highlights: [
        'Scenic drive to Halong Bay',
        'Cruise past limestone islets',
        'Surprising Cave, Luon Cave kayak',
        'Titov Island',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Morning pick-up from Hanoi Old Quarter (08:00–08:30) and scenic drive to Halong Bay. Board the cruise at Halong Harbor.',
          subPoints: [],
        },
        {
          text: 'Lunch onboard while cruising past iconic limestone islets: Cock Fighting and Thumb Islets.',
          subPoints: [],
        },
        {
          text: 'Afternoon: visit Surprising Cave; kayaking or bamboo boat at Luon Cave; leisure time at Titov Island (beach relaxation or panoramic viewpoint).',
          subPoints: [],
        },
        {
          text: 'Late afternoon cruise back to harbor. Transfer to hotel in Halong City. Evening free to explore Night Market and local food streets.',
          subPoints: [],
        },
      ],
      overnight: 'Halong City',
    },
    {
      day: '02 — Halong Park – Hanoi',
      highlights: ['Halong Park Complex', 'Queen Cable Car & Sun Wheel', 'Return to Hanoi'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Breakfast at hotel. Free time at Halong Park Complex (self-paid entrance): Queen Cable Car & Sun Wheel, Dragon Park or Typhoon Water Park.',
          subPoints: [],
        },
        {
          text: 'Late morning check-out and transfer back to Hanoi. Arrival in Hanoi in the late afternoon. Evening free to explore Hanoi Old Quarter independently.',
          subPoints: [],
        },
      ],
      overnight: 'Hanoi',
    },
    {
      day: '03 — Hanoi – Sapa – Cat Cat Village',
      highlights: [
        'Sleeper bus to Sapa',
        'Terraced rice fields',
        'Cat Cat Village – Black H’Mong culture',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Early morning departure by sleeper bus via Noi Bai – Lao Cai Expressway. Scenic journey through northwestern mountains and terraced rice fields. Arrival in Sapa around midday.',
          subPoints: [],
        },
        {
          text: 'Lunch and hotel check-in. Afternoon visit Cat Cat Village: Black H’Mong culture, traditional crafts, waterfall and rice terraces.',
          subPoints: [],
        },
        {
          text: 'Evening free to explore Sapa Night Market or local cafés. Overnight in Sapa.',
          subPoints: [],
        },
      ],
      overnight: 'Sapa',
    },
    {
      day: '04 — Sapa – Fansipan Mountain – Hanoi',
      highlights: [
        'Fansipan Cable Car',
        'Fansipan Peak (3,143 m) – Roof of Indochina',
        'Return to Hanoi',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Breakfast at hotel. Transfer to Fansipan Cable Car Station. Ride the modern cable car system to Fansipan Peak (3,143 m) – the Roof of Indochina. Enjoy breathtaking mountain views.',
          subPoints: [],
        },
        {
          text: 'Return to Sapa town for lunch. Afternoon transfer back to Hanoi. Arrival in Hanoi in the evening. End of services.',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Shuttle bus with A/C for transfers; cabin sleeper bus Hanoi–Sapa–Hanoi (surcharge for solo travelers)',
    '3 nights accommodation (2 persons per room): 1 night 2–3 star Hanoi, 1 night 3 star Halong (breakfast buffet), 1 night 3 star Sapa (breakfast buffet)',
    '4 main meals per program; breakfasts per hotel standard',
    'Sightseeing boat for Halong Bay (3-star standard, route 2)',
    'Local English-speaking guides for each phase',
    'Entrance fees per program (single use; cable car return ticket not included)',
    'One bottle of water per day on the bus',
  ],
  exclusions: [
    'Single room surcharge (on request or when travelling solo)',
    'Dinners in Hanoi (so you can explore local cuisine freely)',
    'Surcharge 50,000 VND for foreigner ticket difference in Hanoi',
    'Beverages during meals',
    'Excursions outside the program and other personal expenses',
    'Tip for driver and tour guide: compulsory, at least 3 USD/passenger/day',
  ],
  isActive: true,
};

async function seedHanoiHalongSapaTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: hanoiHalongSapaTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: hanoiHalongSapaTour });
      console.log('Updated existing destination: Hanoi – Halong – Sapa – Fansipan');
    } else {
      await Destination.create(hanoiHalongSapaTour);
      console.log('Successfully inserted: Hanoi – Halong Bay – Sapa – Fansipan');
    }

    console.log('\nHanoi Halong Sapa tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Hanoi Halong Sapa tour:', error);
    process.exit(1);
  }
}

seedHanoiHalongSapaTour();
