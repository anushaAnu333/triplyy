import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Azerbaijan 4 Nights / 5 Days – "Baku, Gabala & Beyond"
 * 3 Nights Baku → 1 Night Gabala
 * Seeds a single destination (upserts by slug).
 */
const bakuGabalaBeyondTour = {
  name: 'Baku, Gabala & Beyond',
  slug: 'baku-gabala-beyond',
  shortDescription:
    '4 Nights / 5 Days · 🏙️ 3 Nights Baku · 🏔️ 1 Night Gabala · 🚐 Private Transport · 🍳 Breakfast Included · 👤 Not a Group Tour',
  description: `MB Travel Azerbaijan · Private Tour
4 Nights / 5 Days — Baku, Gabala & Beyond

Contact: MB Travel Azerbaijan | +994515832804 | mbtravelaz.com

🏙️ 3 Nights Baku
🏔️ 1 Night Gabala
🚐 Private Transport
🍳 Breakfast Included
👤 Not a Group Tour

Emergency contact: +994556007323 / +994515832804 (WhatsApp available).`,
  country: 'Azerbaijan',
  region: 'Baku, Gabala',
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
    '1 Night Gabala',
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
          subPoints: ['Panoramic city views — Parliament Building, Flame Towers, and the Alley of Martyrs.'],
        },
        {
          text: 'Little Venice',
          subPoints: ['Charming canal district with a scenic boat tour.'],
        },
        {
          text: 'Daniz Mall or Carpet Museum',
          subPoints: ["Modern shopping or Azerbaijan's legendary carpet-weaving heritage — your choice."],
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
      day: '02 — Baku → Gabala City Tour',
      highlights: [
        'Shamakhi Juma Mosque',
        'Local Winery',
        'Seven Beauties Waterfall',
        'Nohur Lake',
        'Tufandag Mountain Resort',
        'Honey House',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: "Drive northwest into the lush Caucasus foothills to reach Gabala — Azerbaijan's mountain jewel. Transfer: ~3.5 hours.",
          subPoints: [],
        },
        {
          text: 'Shamakhi Juma Mosque',
          subPoints: ['One of the oldest and most beautiful mosques in the South Caucasus.'],
        },
        {
          text: 'Local Winery',
          subPoints: ['Visit a traditional Azerbaijani wine yard along the scenic route.'],
        },
        {
          text: 'Seven Beauties Waterfall',
          subPoints: ['A spectacular series of waterfalls in the Gabala mountains — a natural wonder.'],
        },
        {
          text: 'Nohur Lake',
          subPoints: ['Serene alpine lake surrounded by forested mountains — stunning reflections.'],
        },
        {
          text: 'Tufandag Mountain Resort',
          subPoints: ['Cable cars and (seasonal Dec 20 – Mar 1) skiing in the Great Caucasus.'],
        },
        {
          text: 'Honey House',
          subPoints: ["Free degustation of Azerbaijan's famous mountain honey varieties."],
        },
      ],
      overnight: 'Gabala',
    },
    {
      day: '03 — Gabala → Baku Transfer',
      highlights: ['Scenic return drive to Baku (~3.5 hours). Rest and enjoy the city in the evening.'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Scenic return drive to Baku (~3.5 hours). Rest and enjoy the city in the evening.',
          subPoints: [],
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
          text: 'A full day of ancient geology, sacred fire temples, and iconic modern architecture around Baku. Full-day Baku highlights.',
          subPoints: [],
        },
        {
          text: 'Mud Volcanoes',
          subPoints: ['Azerbaijan holds one-third of the world\'s mud volcanoes — an otherworldly landscape.'],
        },
        {
          text: 'Gobustan National Park',
          subPoints: ['UNESCO World Heritage Site with 40,000-year-old rock carvings and a nature museum.'],
        },
        {
          text: 'Bibi Heybat Mosque',
          subPoints: ['Beautiful historic mosque on the shores of the Caspian Sea.'],
        },
        {
          text: 'First Drilled Oil Well',
          subPoints: ["The world's first industrially drilled oil well — Azerbaijan's landmark contribution to history."],
        },
        {
          text: 'Ateshgah Fire Temple',
          subPoints: ['Medieval fire-worshippers\' temple fueled by natural gas — a UNESCO-nominated site.'],
        },
        {
          text: 'Yanar Dag (Burning Mountain)',
          subPoints: ['A hillside continuously ablaze for decades — one of Azerbaijan\'s iconic natural wonders.'],
        },
        {
          text: 'Heydar Aliyev Center',
          subPoints: ["Zaha Hadid's breathtaking architectural masterpiece — premier cultural exhibitions."],
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

async function seedBakuGabalaBeyondTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: bakuGabalaBeyondTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: bakuGabalaBeyondTour });
      console.log('Updated existing destination: Baku, Gabala & Beyond');
    } else {
      await Destination.create(bakuGabalaBeyondTour);
      console.log('Successfully inserted: Baku, Gabala & Beyond');
    }

    console.log('\nBaku, Gabala & Beyond tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Baku, Gabala & Beyond tour:', error);
    process.exit(1);
  }
}

seedBakuGabalaBeyondTour();
