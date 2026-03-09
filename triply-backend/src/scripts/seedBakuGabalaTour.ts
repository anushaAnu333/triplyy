import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Azerbaijan 4 Nights / 5 Days – "Baku & Gabala Explorer"
 * 2 Nights Baku → 2 Nights Gabala
 * Seeds a single destination (upserts by slug).
 */
const bakuGabalaTour = {
  name: '4 Nights / 5 Days – Baku & Gabala Explorer',
  slug: '4-nights-5-days-baku-gabala-explorer',
  shortDescription: 'Baku city tour, Highland Park, Old City, Gabala, Shaki, Gobustan & mud volcanoes. 2 nights Baku, 2 nights Gabala.',
  description: `Day 1 – Arrival & Baku City Tour: Airport meet & greet, Highland Park (panoramic views, Parliament, Flame Towers, Alley of Martyrs), Little Venice boat tour, Daniz Mall or Carpet Museum, Old City (Maiden Tower, Shirvanshahs Palace), Nizami Street. Overnight Baku.

Day 2 – Baku → Gabala (~3.5h): Shamakhi Juma Mosque, Local Winery, Seven Beauties Waterfall, Nohur Lake, Tufandag Mountain Resort (cable cars, skiing), Honey House. Overnight Gabala.

Day 3 – Shaki City Tour: Bio Garden, Khanland, Shaki Karvansaray, Albanian Church, Shaki Khan Palace. Overnight Gabala.

Day 4 – Gobustan & Mud Volcanoes (transfer to Baku): Gobustan National Park & rock carvings, Mud Volcanoes, Bibi Heybat Mosque, First Drilled Oil Well. Overnight Baku.

Day 5 – Transfer to airport (3 hours before flight).

Pricing: From 186 USD (Budget) or 225 USD (Comfortable) per person for 8 pax. Optional entry fees ~66 USD. Emergency: +994556007323 / +994515832804 (WhatsApp).`,
  country: 'Azerbaijan',
  region: 'Baku, Gabala',
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
    'Gabala: Tufandag Resort, Seven Beauties Waterfall, Nohur Lake',
    'Shaki: Khan Palace, Karvansaray, Albanian Church',
    'Gobustan National Park & Mud Volcanoes',
  ],
  itinerary: [
    {
      day: 'Day 1 – Arrival & Baku City Tour',
      highlights: [
        'Airport meet & greet',
        'Highland Park',
        'Little Venice',
        'Daniz Mall or Carpet Museum',
        'Old City (Inner City) — İçərişəhər',
        'Nizami Street (Fountain Square)',
      ],
      subHighlights: [
        'Panoramic views over Baku',
        'Parliament Building',
        'Flame Towers',
        'Alley of Martyrs',
        'Scenic boat tour',
        'Shopping or explore Azerbaijan carpet heritage',
        'Maiden Tower',
        'Palace of the Shirvanshahs',
        'Cafés, Shops, Evening city atmosphere',
      ],
      overnight: 'Baku',
    },
    {
      day: 'Day 2 – Baku → Gabala & Gabala City Tour',
      route: 'Transfer ~3.5 hours',
      highlights: [
        'Shamakhi Juma Mosque',
        'Local Winery',
        'Seven Beauties Waterfall',
        'Nohur Lake',
        'Tufandag Mountain Resort',
        'Honey House',
      ],
      subHighlights: [
        'Cable cars',
        'Skiing (season: 20 Dec – 1 Mar)',
        'Free honey degustation',
      ],
      overnight: 'Gabala',
    },
    {
      day: 'Day 3 – Shaki City Tour (Day Trip from Gabala)',
      highlights: [
        'Bio Garden',
        'Khanland Entertainment Center',
        'Shaki Karvansaray',
        'Shaki Albanian Church',
        'Shaki Khan Palace',
      ],
      overnight: 'Gabala',
    },
    {
      day: 'Day 4 – Gobustan & Mud Volcanoes Tour',
      route: 'Transfer back to Baku',
      highlights: [
        'Gobustan National Park & Nature Museum',
        'Mud Volcanoes',
        'Bibi Heybat Mosque',
        'First Drilled Oil Well',
      ],
      subHighlights: ['40,000-year-old rock carvings'],
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
  pricingHotel: {
    validFrom: '1 Jan 2026',
    validTo: '15 Mar 2026',
    note: 'Rates are per person for 8 passengers',
    options: [
      {
        name: 'Option 1 – Budget Friendly',
        starLabel: '3-Star Hotels',
        pricePerPerson: 180,
        currency: 'USD',
        hotels: [
          {
            location: 'Baku Hotels (choose one)',
            choices: [
              'Atlas Hotel (4★)',
              'Innab Inn Hotel (4★)',
              'Art Passage Hotel',
              'Ammar Grand Hotel (4★)',
            ],
          },
          {
            location: 'Guba Hotels (choose one)',
            choices: ['Gold Hotel (3★)', 'North Hotel (3★)'],
          },
        ],
      },
      {
        name: 'Option 2 – Comfortable',
        starLabel: '4-Star Hotels',
        pricePerPerson: 228,
        currency: 'USD',
        hotels: [
          {
            location: 'Baku Hotels (choose one)',
            choices: [
              'Grand Midway Hotel (4★)',
              'Parkside Hotel (4★)',
              'Arion Hotel (5★)',
            ],
          },
          {
            location: 'Guba Hotels (choose one)',
            choices: ['Alma Bagi Hotel (4★)', 'Ilk Inn Hotel (4★)'],
          },
        ],
      },
    ],
    optionalEntryFees: {
      totalEstimated: 66,
      currency: 'USD',
      items: [
        'Fire Temple & Fire Mountain',
        'Funicular',
        'Cable Car',
        'Roller Coaster',
        'Carpet Museum',
        'Haydar Aliyev Museum',
        'Taxi for Mud Volcano',
        'Bottled Water (per day)',
      ],
    },
    emergencyContact: '+994556007323 / +994515832804 (WhatsApp available)',
  },
  isActive: true,
};

async function seedBakuGabalaTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: bakuGabalaTour.slug });
    if (existing) {
      await Destination.updateOne({ slug: bakuGabalaTour.slug }, bakuGabalaTour);
      console.log('Updated existing destination: Baku & Gabala Explorer');
    } else {
      await Destination.create(bakuGabalaTour);
      console.log('Successfully inserted: 4 Nights / 5 Days – Baku & Gabala Explorer');
    }

    console.log('\nBaku & Gabala tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Baku & Gabala tour:', error);
    process.exit(1);
  }
}

seedBakuGabalaTour();
