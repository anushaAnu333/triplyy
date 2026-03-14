import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * VN Travel Tours – Da Nang – Ba Na Hills – Hoi An
 * 4 Days / 3 Nights | My Khe Beach, Golden Bridge, Coconut Forest, Hoi An Ancient Town
 * Seeds a single destination (upserts by slug).
 */
const daNangHoiAnTour = {
  name: 'Da Nang – Ba Na Hills – Golden Bridge – Hoi An',
  slug: 'da-nang-ba-na-hills-hoi-an',
  shortDescription:
    '4 Days / 3 Nights · 🏖️ My Khe Beach · 🌉 Golden Bridge & Ba Na Hills · 🏮 Hoi An Ancient Town · 4-Star Da Nang · VN Travel Tours',
  description: `VN Travel Tours — Da Nang – Ba Na Hills – Hoi An

4 Days / 3 Nights | 3 nights in 4-star hotel in Da Nang (Twin/Double)

Transport: air-conditioned; English-speaking guide. Entrance fees: Ba Na Hills cable car (2 ways), attractions per program. Meals: 3 breakfasts + 3 main meals (250,000 VND/pax) + lunch buffet at Ba Na Hills. Travel insurance 100,000,000 VND/pax. Note: 15% surcharge on peak dates (New Year, Lunar New Year, Liberation Day, Firework Festival, Christmas, etc.).

Tour price in USD S.I.C: 2 pax from 290 USD; from 10 pax from 171 USD. Private tour on request. Child policy: under 3 free; 4–9 years 65%; 10+ as adult. Tip: 3 USD/pax/day.`,
  country: 'Vietnam',
  region: 'Central Vietnam',
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
    '3 Nights in 4-Star Da Nang',
    'My Khe Beach · Ba Na Hills & Golden Bridge',
    'Hoi An Ancient Town & Bay Mau Coconut Forest',
    'Linh Ung Pagoda & Lady Buddha (67 m)',
    'English-speaking guide · Meals & entrance fees',
  ],
  itinerary: [
    {
      day: '01 — Da Nang Arrival – Beach Relax',
      highlights: [
        'Airport pick-up & lunch',
        '4★ hotel check-in',
        'My Khe Beach',
        'Da Nang by night',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: '12:00: Pick up at Da Nang Airport, transfer to a local restaurant for lunch. Check in at 4★ hotel, rest.',
          subPoints: [],
        },
        {
          text: 'Free time to swim at My Khe Beach – voted one of the most beautiful beaches on the planet by Forbes.',
          subPoints: [],
        },
        {
          text: 'Evening: free time for Da Nang specialties (Mi Quang noodles, pork rice paper rolls, fresh seafood). Explore Da Nang at night: sparkling bridges and riverside promenade. Overnight in Da Nang.',
          subPoints: [],
        },
      ],
      overnight: 'Da Nang',
    },
    {
      day: '02 — Ba Na Hills – Golden Bridge',
      highlights: [
        'World-record cable car',
        'Golden Bridge',
        'French Village, Flower Garden',
        'Fantasy Park & Nui Chua Peak',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Buffet breakfast at hotel. 08:00: Pick up for Ba Na Hills tour (join group). Take the world-record cable car with panoramic mountain and sea views.',
          subPoints: [],
        },
        {
          text: 'Visit the iconic Golden Bridge with giant hands lifting the walkway in the sky. Explore French Village, Le Jardin d’Amour Flower Garden, Debay Wine Cellar, Linh Ung Pagoda.',
          subPoints: [],
        },
        {
          text: '11:30: Buffet lunch with more than 100 Asian & Western dishes. 13:00: Free time at Fantasy Park (climbing wall, drop tower, 3D–4D–5D cinemas, bumper cars…). Visit Nui Chua Peak (1,487 m) – rooftop of Central Vietnam.',
          subPoints: [],
        },
        {
          text: '15:00: Cable car down, return to Da Nang. Evening free for nightlife; optional: Dragon Bridge fire & water show (weekends) or Han River cruise. Overnight in Da Nang.',
          subPoints: [],
        },
      ],
      overnight: 'Da Nang',
    },
    {
      day: '03 — Bay Mau Coconut Forest – Hoi An Ancient Town',
      highlights: [
        'Bay Mau Coconut Forest',
        'Basket boat & fishing',
        'Japanese Covered Bridge',
        'Hoi An lanterns',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Buffet breakfast at hotel. 10:00: Depart to Bay Mau Coconut Forest – basket boat ride and fishing experience. 12:00: Lunch at restaurant.',
          subPoints: [],
        },
        {
          text: '14:00: Walking tour in Hoi An: Japanese Covered Bridge, Phuc Kien Assembly Hall, Tan Ky Old House. Shopping for lanterns and handicrafts.',
          subPoints: [],
        },
        {
          text: 'Dinner at your own expense. Option: enjoy Hoi An at night with lanterns and floating candles. Overnight in Da Nang.',
          subPoints: [],
        },
      ],
      overnight: 'Da Nang',
    },
    {
      day: '04 — Linh Ung Pagoda – Son Tra – Departure',
      highlights: [
        'Linh Ung Pagoda – Son Tra',
        'Lady Buddha (67 m)',
        'Local specialties shopping',
        'Transfer to airport',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Buffet breakfast at hotel, check out. Visit Linh Ung Pagoda on Son Tra Peninsula: tallest Lady Buddha statue in Vietnam (67 m) and panoramic view of Da Nang coastline.',
          subPoints: [],
        },
        {
          text: 'Shopping for local specialties: dried seafood, sesame candy, beef sausage. Afternoon: transfer to Da Nang Airport for departure flight (e.g. 15:45).',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Transportation with air conditioning',
    'English-speaking local guide',
    '3 nights in 4-star hotel in Da Nang (Twin/Double)',
    'Entrance fees: Hue citadel and Khai Dinh King tomb; Ba Na Hills cable car (2 ways); all attractions in the program',
    'Meals: 3 breakfasts + 3 main meals (250,000 VND/pax) + lunch buffet at Ba Na Hills',
    'Travel insurance 100,000,000 VND/pax',
    'Aquafina bottled water',
    'Vietnam gift and hat',
  ],
  exclusions: [
    'Personal expenses: laundry, phone calls, drinks outside the program',
    'Tip for guide & driver (3 USD/pax/day)',
    'Chargeable attractions at Ba Na Hills (e.g. Wax Museum, Debay Wine Cellar)',
    'Round-trip airfare',
  ],
  isActive: true,
};

async function seedDaNangHoiAnTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: daNangHoiAnTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: daNangHoiAnTour });
      console.log('Updated existing destination: Da Nang – Ba Na Hills – Hoi An');
    } else {
      await Destination.create(daNangHoiAnTour);
      console.log('Successfully inserted: Da Nang – Ba Na Hills – Golden Bridge – Hoi An');
    }

    console.log('\nDa Nang Hoi An tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Da Nang Hoi An tour:', error);
    process.exit(1);
  }
}

seedDaNangHoiAnTour();
