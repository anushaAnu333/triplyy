import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Azerbaijan 4 Nights / 5 Days – "Baku, Guba & Shahdag"
 * 3 Nights Baku → 1 Night Guba
 * Seeds a single destination (upserts by slug).
 */
const bakuGubaShahdagTour = {
  name: 'Baku, Guba & Shahdag',
  slug: 'baku-guba-shahdag',
  shortDescription:
    '4 Nights / 5 Days · 🏙️ 3 Nights Baku · 🏔️ 1 Night Guba · 🚐 Private Transport · 🍳 Breakfast Included · 👤 Not a Group Tour',
  description: `MB Travel Azerbaijan · Private Tour
4 Nights / 5 Days — Baku, Guba & Shahdag

Contact: MB Travel Azerbaijan | +994515832804 | mbtravelaz.com

🏙️ 3 Nights Baku
🏔️ 1 Night Guba
🚐 Private Transport
🍳 Breakfast Included
👤 Not a Group Tour

Emergency contact: +994556007323 / +994515832804 (WhatsApp available).`,
  country: 'Azerbaijan',
  region: 'Baku, Guba',
  duration: { days: 5, nights: 4 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
  images: [
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
  ],
  highlights: [
    '3 Nights Baku',
    '1 Night Guba',
    'Private Transport',
    'Breakfast Included',
    'Not a Group Tour',
  ],
  itinerary: [
    {
      day: '01 — Arrival & Baku City Tour',
      highlights: [
        'Airport meet & greet + city exploration',
        'Highland Park',
        'Little Venice',
        'Daniz Mall or Carpet Museum',
        'Old City (İçərişəhər)',
        'Nizami Street (Fountain Square)',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Airport meet & greet + city exploration. Your driver meets you at the airport with a nameplate. Emergency: +994556007323 / +994515832804 (WhatsApp).',
          subPoints: [],
        },
        {
          text: 'Highland Park',
          subPoints: ['Sweeping panoramas of Baku — Parliament Building, Flame Towers, and Alley of Martyrs.'],
        },
        {
          text: 'Little Venice',
          subPoints: ['Charming canal district with a scenic boat tour.'],
        },
        {
          text: 'Daniz Mall or Carpet Museum',
          subPoints: ["Your choice — modern shopping or Azerbaijan's legendary carpet heritage."],
        },
        {
          text: 'Old City (İçərişəhər)',
          subPoints: ['UNESCO World Heritage Site — Maiden Tower and the Palace of the Shirvanshahs.'],
        },
        {
          text: 'Nizami Street (Fountain Square)',
          subPoints: ["Baku's lively pedestrian boulevard — cafés, boutiques, vibrant evenings."],
        },
      ],
      overnight: 'Baku',
    },
    {
      day: '02 — Baku → Guba City Tour',
      highlights: [
        'Beshbarmag Mountains (En Route)',
        'Candy Mountains',
        'Qecresh Forest',
        'Chanlibel Lake',
        'Red Settlement (Qırmızı Qəsəbə)',
        'Honey House',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Drive north to Guba with a stop at the legendary Beshbarmag area along the Caspian coast. Transfer: ~2.5 hours (with scenic stop).',
          subPoints: [],
        },
        {
          text: 'Beshbarmag Mountains (En Route)',
          subPoints: ['Sacred mountain overlooking the Caspian — a landmark of Azerbaijani mythology.'],
        },
        {
          text: 'Candy Mountains',
          subPoints: ["Surreal multicolored mineral terrain — one of Azerbaijan's most photogenic landscapes."],
        },
        {
          text: 'Qecresh Forest',
          subPoints: ['Ancient beech forest reserve — lush, peaceful, and spectacular in autumn.'],
        },
        {
          text: 'Chanlibel Lake',
          subPoints: ['A serene high-altitude lake with dramatic mountain reflections.'],
        },
        {
          text: 'Red Settlement (Qırmızı Qəsəbə)',
          subPoints: ["A unique Jewish settlement with centuries of history — one of the world's last rural Jewish communities."],
        },
        {
          text: 'Honey House',
          subPoints: ["Free degustation of Guba's famous mountain honey."],
        },
      ],
      overnight: 'Guba',
    },
    {
      day: '03 — Shahdag Mountain Resort (Day Trip from Guba)',
      highlights: ['Cable Car', 'Roller Coaster', 'Zip-Line', 'Buggy Tours', 'Parachuting (optional)'],
      subHighlights: [],
      pointGroups: [
        {
          text: "Azerbaijan's premier mountain adventure resort — packed with activities for all thrill levels. Transfer back to Baku afterwards. Drive from Guba: ~45 minutes.",
          subPoints: [],
        },
        {
          text: 'Cable Car',
          subPoints: ['Ride to the upper mountain for panoramic views of the Great Caucasus range.'],
        },
        {
          text: 'Roller Coaster',
          subPoints: ['An exciting alpine ride with scenic mountain backdrops.'],
        },
        {
          text: 'Zip-Line',
          subPoints: ['Soar over the forested mountain slopes on one of the region\'s top zip-lines.'],
        },
        {
          text: 'Buggy Tours',
          subPoints: ['Off-road buggy rides across the mountain terrain — for all ages.'],
        },
        {
          text: 'Parachuting (optional)',
          subPoints: ['Tandem parachute jumps available for thrill-seekers. See shahdag.az for full activity list.'],
        },
      ],
      overnight: 'Baku',
    },
    {
      day: '04 — Gobustan & Absheron Peninsula Tour',
      highlights: [
        'Mud Volcanoes',
        'Gobustan National Park',
        'Bibi Heybat Mosque',
        'First Drilled Oil Well',
        'Ateshgah Fire Temple',
        'Yanar Dag (Burning Mountain)',
        'Heydar Aliyev Center',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'A full day exploring ancient geology, sacred sites, and iconic modern architecture around Baku. Full-day Baku highlights.',
          subPoints: [],
        },
        {
          text: 'Mud Volcanoes',
          subPoints: ['Azerbaijan holds one-third of all the world\'s mud volcanoes — an unforgettable landscape.'],
        },
        {
          text: 'Gobustan National Park',
          subPoints: ['UNESCO World Heritage Site — 40,000-year-old rock carvings and an excellent nature museum.'],
        },
        {
          text: 'Bibi Heybat Mosque',
          subPoints: ['A historic mosque beautifully situated on the Caspian shoreline.'],
        },
        {
          text: 'First Drilled Oil Well',
          subPoints: ['The site of the world\'s first industrially drilled oil well — a landmark in global history.'],
        },
        {
          text: 'Ateshgah Fire Temple',
          subPoints: ['Medieval fire-worshippers\' temple fueled by natural gas — a UNESCO-nominated site.'],
        },
        {
          text: 'Yanar Dag (Burning Mountain)',
          subPoints: ['A hillside that has burned continuously for decades — one of Azerbaijan\'s iconic natural wonders.'],
        },
        {
          text: 'Heydar Aliyev Center',
          subPoints: ["Zaha Hadid's breathtaking architectural masterpiece — housing premier cultural exhibitions."],
        },
      ],
      overnight: 'Baku',
    },
    {
      day: '05 — Baku to Airport Transfer',
      highlights: ['Your driver collects you from the hotel 3 hours before your flight. Safe travels!'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Your driver collects you from the hotel 3 hours before your flight. Safe travels!',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Hotel accommodation (options below)',
    'Open buffet breakfast daily',
    'Private transport + driver throughout',
    'All transportation costs',
  ],
  exclusions: [
    'International flights',
    'Visa fees',
    'Lunches and dinners',
    'Personal expenses',
    'Entrance tickets to activities & museums',
    'Anything not mentioned under inclusions',
  ],
  isActive: true,
};

async function seedBakuGubaShahdagTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: bakuGubaShahdagTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: bakuGubaShahdagTour });
      console.log('Updated existing destination: Baku, Guba & Shahdag');
    } else {
      await Destination.create(bakuGubaShahdagTour);
      console.log('Successfully inserted: Baku, Guba & Shahdag');
    }

    console.log('\nBaku, Guba & Shahdag tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Baku, Guba & Shahdag tour:', error);
    process.exit(1);
  }
}

seedBakuGubaShahdagTour();
