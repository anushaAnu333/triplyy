import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Genie Tours Kashmir – 4 Nights / 5 Days
 * Srinagar local sightseeing, Gulmarg, Pahalgam & Dal Lake (no Sonmarg)
 * Seeds a single destination (upserts by slug).
 */
const kashmir4N5DTour = {
  name: 'Kashmir 4N/5D – Srinagar, Gulmarg, Pahalgam & Dal Lake',
  slug: 'kashmir-4n5d-srinagar-gulmarg-pahalgam-dal-lake',
  shortDescription:
    '4 Nights / 5 Days · 🏔️ Srinagar, Gulmarg, Pahalgam · 🚣 Dal Lake & Houseboat · 🚐 Private Cab · Genie Tours Kashmir',
  description: `Genie Tours Kashmir (Approved by Department of Tourism, Govt. J&K)
Registration no: JKEA000001995 | Office: Umar colony, Lal bazar, Srinagar, J&K 190011

4 Nights / 5 Days — Srinagar local sightseeing, Gulmarg, Pahalgam & Dal Lake

Package becomes active after initial payment of 30% of total cost. Balance can be paid online or by cash on arrival. Pricing varies by group size (2–10 adults) and hotel category (3-star or 4-star). Child policy: 0–5 years complimentary; 6–12 years 75% of adult; 12+ as adult.`,
  country: 'India',
  region: 'Jammu & Kashmir',
  duration: { days: 5, nights: 4 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
  images: [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
  ],
  highlights: [
    '4 Nights Accommodation',
    'Srinagar · Gulmarg · Pahalgam',
    'Dal Lake Shikara & Houseboat Stay',
    'Private Cab · Meals as per itinerary',
    'Pick-up & drop from Srinagar Airport',
  ],
  itinerary: [
    {
      day: '01 — Arrival Srinagar & Local Sightseeing',
      highlights: [
        'Nishat Garden',
        'Shalimar Garden',
        'Chashme Shahi / Tulip Garden',
        'Pari Mahal',
        'Shankaracharya Temple',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Welcome to Srinagar “The Lake City”. On arrival at Srinagar Airport, meet our representative and transfer to Srinagar. After some rest, if time permits, begin local sightseeing.',
          subPoints: [],
        },
        {
          text: 'Nishat Garden (Garden of Pleasure)',
          subPoints: ['Built in 1633 by Mughal Emperor Asif Khan.'],
        },
        {
          text: 'Shalimar Garden (Garden of Love)',
          subPoints: ['Built in 1619 by Emperor Jahangir for his wife Noor Jehan (Mehr-un-Nissa).'],
        },
        {
          text: 'Chashme Shahi & Tulip Garden',
          subPoints: ['Tulip Garden is open for about one month only (March–April).'],
        },
        {
          text: 'Pari Mahal & Shankaracharya Temple',
          subPoints: ['Temple situated on top of a hill with a view of the whole of Srinagar city.'],
        },
        {
          text: 'Evening at leisure. Overnight at hotel in Srinagar.',
          subPoints: [],
        },
      ],
      overnight: 'Srinagar',
    },
    {
      day: '02 — Srinagar to Gulmarg Day Trip',
      highlights: [
        'Gulmarg – Meadows of Flowers',
        'Ski slopes & highest golf course',
        'Gulmarg Gondola (on your own)',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'After breakfast, transfer to Gulmarg “Meadows of Flowers” — approx. 52 km, 2.5 hrs drive. Gulmarg has one of the best ski slopes in the world and the highest 18-hole golf course in the world.',
          subPoints: [],
        },
        {
          text: 'Gulmarg Gondola (by your own)',
          subPoints: [
            'Highest and largest ropeway in Asia; total aerial distance ~5 km. Two phases: Kongdoori (3,300 m) and Apharwat (4,000 m).',
          ],
        },
        {
          text: 'Evening transfer back to Srinagar. Check in to hotel for dinner and overnight stay.',
          subPoints: [],
        },
      ],
      overnight: 'Srinagar',
    },
    {
      day: '03 — Srinagar to Pahalgam (Valley of Shepherds)',
      highlights: [
        'Saffron fields & dry fruit market',
        'Chandanwadi, Aru, Baisaran',
        'Betaab Valley (on your own)',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'After breakfast, check out and drive to Pahalgam (Valley of Shepherds) — approx. 145 km, 4.5 hrs. En route: saffron fields, famous dry fruit market and bat factory; purchase Kashmir dry fruits (walnut, almonds) and world-class saffron.',
          subPoints: [],
        },
        {
          text: 'Countryside, rice fields, and nearby spots',
          subPoints: [
            'Chandanwadi (~16 km from Pahalgam taxi stand), Aru (~11 km), Baisaran (~5 km), Betaab Valley (on your own).',
          ],
        },
        {
          text: 'Transfer to hotel in Pahalgam. Check in for dinner and overnight stay.',
          subPoints: [],
        },
      ],
      overnight: 'Pahalgam',
    },
    {
      day: '04 — Pahalgam to Srinagar & Dal Lake Shikara',
      highlights: ['Transfer to Srinagar', 'Shikara ride on Dal Lake', 'Houseboat check-in'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'After breakfast, check out and transfer to Srinagar. On arrival, enjoy a Shikara ride on Dal Lake — often compared to Venice.',
          subPoints: [],
        },
        {
          text: 'Views of interesting places around the lake. On arrival, check in to Houseboat/Hotel for a comfortable overnight stay.',
          subPoints: [],
        },
      ],
      overnight: 'Houseboat / Dal or Nigeen Lake',
    },
    {
      day: '05 — Srinagar Airport Departure',
      highlights: ['Check out', 'Transfer to Srinagar Airport'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'After breakfast, check out from the hotel and transfer to Srinagar Airport for your onward flight.',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Accommodation for 4 nights on double sharing basis',
    '2 nights at Srinagar hotel',
    '1 night houseboat stay',
    '1 night at Pahalgam',
    'Meals as per itinerary (4 breakfasts, 4 dinners)',
    'Pick-up & drop from Srinagar Airport',
    'Sightseeing as per itinerary',
    'Private cab',
    'Complimentary Shikara ride for 1 hour once during the tour',
    'Complimentary welcome drink at Srinagar hotel',
  ],
  exclusions: [
    'Expenses of personal nature (tips, laundry, telephone, table drinks, etc.)',
    'Internal air, train or bus fare from/to your city, unless specified',
    'Gondola rides in Gulmarg',
    'Sledge ride & horse ride in Pahalgam / Gulmarg / Sonmarg',
    'Any kind of insurance',
    'Guide services (if required)',
    'Garden entrance fees at Srinagar',
    'Chain jeep in Gulmarg, Sonmarg (if required)',
    'Zero point at Sonmarg',
    'ATV bikes for Drung waterfall',
    'Union taxi for ABC Valley in Pahalgam',
    'Anything not mentioned in inclusions',
  ],
  isActive: true,
};

async function seedKashmir4N5DTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: kashmir4N5DTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: kashmir4N5DTour });
      console.log('Updated existing destination: Kashmir 4N/5D');
    } else {
      await Destination.create(kashmir4N5DTour);
      console.log('Successfully inserted: Kashmir 4N/5D – Srinagar, Gulmarg, Pahalgam & Dal Lake');
    }

    console.log('\nKashmir 4N/5D tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Kashmir 4N/5D tour:', error);
    process.exit(1);
  }
}

seedKashmir4N5DTour();
