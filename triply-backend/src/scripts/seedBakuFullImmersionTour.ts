import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Azerbaijan 4 Nights / 5 Days – "Baku Full Immersion"
 * 4 Nights Baku
 * Seeds a single destination (upserts by slug).
 */
const bakuFullImmersionTour = {
  name: '4 Nights / 5 Days – Baku Full Immersion',
  slug: '4-nights-5-days-baku-full-immersion',
  shortDescription: 'Four nights in Baku: city tour, Guba & Shahdag, Absheron (Fire Temple, Burning Mountain), Gobustan & mud volcanoes.',
  description: `Day 1 – Arrival & Baku City Tour: Airport meet & greet, Highland Park (Parliament, Flame Towers, Alley of Martyrs), Little Venice boat tour, Daniz Mall or Carpet Museum, Old City (Maiden Tower, Shirvanshahs Palace), Nizami Street. Overnight Baku.

Day 2 – Guba & Shahdag Tour: Candy Mountains (Khizi Village), Beshbarmag (Caspian views), Shahdag Mountain Resort (cable car, roller coaster, buggy, zip-line), Honey House degustation. Overnight Baku.

Day 3 – Absheron Peninsula: Ateshgah Fire Temple, Yanar Dag (Burning Mountain), Heydar Aliyev Center. Overnight Baku.

Day 4 – Gobustan & Mud Volcanoes: Mud Volcanoes, Gobustan National Park (rock carvings, nature museum), 3D Museum, Bibi Heybat Mosque, First Drilled Oil Well. Overnight Baku.

Day 5 – Transfer to airport (3 hours before flight).

Pricing: From 175 USD (Budget) or 227 USD (Comfortable) per person for 8 pax. Optional entry fees ~66 USD.`,
  country: 'Azerbaijan',
  region: 'Baku',
  duration: { days: 5, nights: 4 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage:
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
  images: [
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
  ],
  highlights: [
    'Baku: Highland Park, Flame Towers, Old City (Maiden Tower, Shirvanshahs)',
    'Little Venice & Nizami Street',
    'Guba & Shahdag: Candy Mountains, Beshbarmag, cable car, zip-line',
    'Absheron: Fire Temple, Yanar Dag, Heydar Aliyev Center',
    'Gobustan & Mud Volcanoes, Bibi Heybat Mosque',
  ],
  itinerary: [
    {
      day: 'Day 1 – Arrival & Baku City Tour',
      highlights: [
        'Airport meet & greet',
        'Highland Park',
        'Little Venice',
        'Daniz Mall or Carpet Museum',
        'Old City (İçərişəhər)',
        'Nizami Street (Fountain Square)',
      ],
      subHighlights: [
        'Parliament Building',
        'Flame Towers',
        'Alley of Martyrs',
        'Scenic boat tour',
        'Shopping',
        'Azerbaijan carpet heritage',
        'Maiden Tower',
        'Palace of the Shirvanshahs',
        'Cafés',
        'Boutiques',
        'Evening atmosphere',
      ],
      overnight: 'Baku',
    },
    {
      day: 'Day 2 – Guba & Shahdag Tour',
      highlights: [
        'Candy Mountains (Khizi Village)',
        'Beshbarmag Mountains',
        'Shahdag Mountain Resort',
        'Honey House',
      ],
      subHighlights: [
        'Caspian Sea views',
        'Cable car',
        'Roller coaster',
        'Buggy tours',
        'Zip-line',
        'Honey degustation',
      ],
      overnight: 'Baku',
    },
    {
      day: 'Day 3 – Absheron Peninsula Tour',
      highlights: [
        'Ateshgah Fire Temple',
        'Yanar Dag (Burning Mountain)',
        'Heydar Aliyev Center',
      ],
      overnight: 'Baku',
    },
    {
      day: 'Day 4 – Gobustan & Mud Volcanoes Tour',
      highlights: [
        'Mud Volcanoes',
        'Gobustan National Park',
        '3D Museum',
        'Bibi Heybat Mosque',
        'First Drilled Oil Well',
      ],
      subHighlights: [
        '40,000-year-old rock carvings',
        'Nature museum',
      ],
      overnight: 'Baku',
    },
    {
      day: 'Day 5 – Baku → Airport Transfer',
      highlights: [
        'Hotel pickup',
        'Transfer to airport (3 hours before flight)',
      ],
    },
  ],
  inclusions: [
    'Hotel accommodation (options: Budget 3★ or Comfort 4★)',
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

async function seedBakuFullImmersionTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: bakuFullImmersionTour.slug });
    if (existing) {
      await Destination.updateOne({ slug: bakuFullImmersionTour.slug }, bakuFullImmersionTour);
      console.log('Updated existing destination: Baku Full Immersion');
    } else {
      await Destination.create(bakuFullImmersionTour);
      console.log('Successfully inserted: 4 Nights / 5 Days – Baku Full Immersion');
    }

    console.log('\nBaku Full Immersion tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Baku Full Immersion tour:', error);
    process.exit(1);
  }
}

seedBakuFullImmersionTour();
