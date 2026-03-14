import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * VN Travel Tours – Mekong Delta 8 Provinces Discovery
 * Saigon – My Tho – Can Tho – Ca Mau – Saigon | 4 Days / 3 Nights
 * Seeds a single destination (upserts by slug).
 */
const mekongDeltaTour = {
  name: 'Mekong Delta 8 Provinces Discovery',
  slug: 'mekong-delta-8-provinces-discovery',
  shortDescription:
    '4 Days / 3 Nights · 🚌 Saigon – My Tho – Can Tho – Ca Mau · 🚣 Boat trips & floating market · 🏨 3-Star · VN Travel Tours',
  description: `VN Travel Tours — Mekong Delta 8 Provinces Discovery
Saigon – My Tho – Ben Tre – Chau Doc – Can Tho – Ca Mau – Saigon

Duration: 4 Days / 3 Nights
Hotel: 3-Star (Full Package) | Transportation: Air-conditioned bus & boat
Departure: Monday, Thursday, Saturday

Tour price in USD on S.I.C (join group) basis. From 2 pax; from 10 pax onwards rate on request. Private tour: contact for full itinerary and rate. Child policy: under 3 free; 4–9 years 75% of adult; 10+ as adult.`,
  country: 'Vietnam',
  region: 'Mekong Delta',
  duration: { days: 4, nights: 3 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  images: [
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200',
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
  ],
  highlights: [
    '4 Days / 3 Nights',
    'My Tho, Ben Tre, Chau Doc, Can Tho, Ca Mau',
    'Cai Rang Floating Market & Tra Su Forest',
    '3-Star hotels · Air-conditioned bus & boat',
    'English-speaking guide · Meals & entrance fees',
  ],
  itinerary: [
    {
      day: '01 — Saigon – My Tho – Ben Tre – Chau Doc',
      highlights: [
        'Vinh Trang Pagoda',
        'Tien River boat trip',
        'Thoi Son Islet',
        'Ben Tre coconut candy & rice paper',
        'Transfer to Chau Doc',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Depart Saigon via Trung Luong Expressway.',
          subPoints: [],
        },
        {
          text: 'Visit Vinh Trang Pagoda. Boat trip on Tien River with view of four sacred islets.',
          subPoints: [],
        },
        {
          text: 'Thoi Son Islet',
          subPoints: [
            'Village walk, fruit garden, honey tea, traditional folk music, sampan ride.',
          ],
        },
        {
          text: 'Ben Tre',
          subPoints: [
            'Coconut candy workshop, rice paper village, horse-cart ride. Lunch at eco-tourism area.',
          ],
        },
        {
          text: 'Afternoon transfer to Chau Doc. Overnight in Chau Doc.',
          subPoints: [],
        },
      ],
      overnight: 'Chau Doc',
    },
    {
      day: '02 — Chau Doc – Tra Su Cajuput Forest – Can Tho',
      highlights: [
        'Ba Chua Xu Temple, Tay An Pagoda',
        'Tra Su Cajuput Forest',
        'Can Tho cruise dinner',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Visit Ba Chua Xu Temple, Tay An Pagoda, Thoai Ngoc Hau Tomb.',
          subPoints: [],
        },
        {
          text: 'Explore Tra Su Cajuput Forest by motorboat and rowing boat. Observation tower with panoramic view. Lunch at Tra Su.',
          subPoints: [],
        },
        {
          text: 'Transfer to Can Tho. Dinner on Can Tho cruise with traditional music. Overnight in Can Tho.',
          subPoints: [],
        },
      ],
      overnight: 'Can Tho',
    },
    {
      day: '03 — Can Tho – Cai Rang Floating Market – Ca Mau – Cape Ca Mau',
      highlights: [
        'Cai Rang Floating Market',
        'Soc Trang, Bac Lieu',
        'Cape Ca Mau National Park',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Early morning visit Cai Rang Floating Market.',
          subPoints: [],
        },
        {
          text: 'Travel to Soc Trang – visit Som Rong Pagoda. Bac Lieu: visit Tac Say Church (Father Diep). Lunch in Ca Mau.',
          subPoints: [],
        },
        {
          text: 'Visit Cape Ca Mau National Park: GPS 0001, Flag Tower, Mangrove Forest. Overnight in Ca Mau.',
          subPoints: [],
        },
      ],
      overnight: 'Ca Mau',
    },
    {
      day: '04 — Ca Mau – Bac Lieu – Soc Trang – Saigon',
      highlights: [
        'Bac Lieu Wind Farm',
        'Bac Lieu Prince House',
        'Quan Am Phat Dai',
        'Pia Cake Factory',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Visit Bac Lieu Wind Farm, Bac Lieu Prince House, Quan Am Phat Dai (Lady Buddha of the South Sea).',
          subPoints: [],
        },
        {
          text: 'Visit Pia Cake Factory – Soc Trang. Lunch in Hau Giang. Return to Saigon.',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Transportation: air-conditioned join group tour',
    'English-speaking local guide',
    '3 nights in 3-star hotels (Chau Doc, Can Tho, Ca Mau) – Twin/Double',
    'All entrance fees for attractions in the program',
    'Meals: 3 breakfasts + 3 main meals (250,000 VND/pax for lunch or dinner)',
    'Travel insurance 100,000,000 VND/pax',
    'Aquafina bottled water',
    'Vietnam gift and hat',
  ],
  exclusions: [
    'Personal expenses: laundry, phone calls, drinks outside the program',
    'Tip for guide & driver (3 USD/pax/day)',
    'Round-trip airfare',
  ],
  isActive: true,
};

async function seedMekongDeltaTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: mekongDeltaTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: mekongDeltaTour });
      console.log('Updated existing destination: Mekong Delta 8 Provinces');
    } else {
      await Destination.create(mekongDeltaTour);
      console.log('Successfully inserted: Mekong Delta 8 Provinces Discovery');
    }

    console.log('\nMekong Delta tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Mekong Delta tour:', error);
    process.exit(1);
  }
}

seedMekongDeltaTour();
