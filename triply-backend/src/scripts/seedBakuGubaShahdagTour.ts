import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Azerbaijan 4 Nights / 5 Days – "Baku, Guba & Shahdag"
 * 3 Nights Baku → 1 Night Guba
 * Seeds a single destination (upserts by slug).
 */
const bakuGubaShahdagTour = {
  name: '4 Nights / 5 Days – Baku, Guba & Shahdag',
  slug: '4-nights-5-days-baku-guba-shahdag',
  shortDescription: 'Baku city tour, Guba (Beshbarmag, Candy Mountains, Qecresh Forest, Red Settlement), Shahdag Mountain Resort, Gobustan & Absheron. 3 nights Baku, 1 night Guba.',
  description: `Day 1 – Arrival & Baku City Tour: Airport meet & greet, Highland Park (Parliament, Flame Towers, Alley of Martyrs), Little Venice boat tour, Daniz Mall or Carpet Museum, Old City (Maiden Tower, Shirvanshahs), Nizami Street. Overnight Baku.

Day 2 – Baku → Guba (~2.5h): Beshbarmag Mountains (Caspian views), Candy Mountains, Qecresh Forest, Chanlibel Lake, Red Settlement (Qırmızı Qəsəbə), Honey House degustation. Overnight Guba.

Day 3 – Shahdag Mountain Resort (day trip from Guba, ~45min drive): Cable car (Caucasus views), Roller coaster, Zip-line, Buggy tours, Parachuting (optional). Transfer back to Baku. Overnight Baku.

Day 4 – Gobustan & Absheron Peninsula: Mud Volcanoes, Gobustan National Park (rock carvings, nature museum), Bibi Heybat Mosque, First Drilled Oil Well, Ateshgah Fire Temple, Yanar Dag (Burning Mountain), Heydar Aliyev Center. Overnight Baku.

Day 5 – Transfer to airport (3 hours before flight).

Pricing: From 180 USD (Budget) or 228 USD (Comfortable) per person for 8 pax. Optional entry fees ~66 USD. Emergency: +994556007323 / +994515832804 (WhatsApp).`,
  country: 'Azerbaijan',
  region: 'Baku, Guba',
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
    'Baku: Highland Park, Flame Towers, Old City, Little Venice, Nizami Street',
    'Guba: Beshbarmag, Candy Mountains, Qecresh Forest, Red Settlement, Honey House',
    'Shahdag Resort: Cable car, zip-line, roller coaster, buggy, parachuting',
    'Gobustan & Absheron: Mud Volcanoes, Fire Temple, Yanar Dag, Heydar Aliyev Center',
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
      day: 'Day 2 – Baku → Guba City Tour',
      route: 'Transfer ~2.5 hours',
      highlights: [
        'Beshbarmag Mountains (en route)',
        'Candy Mountains',
        'Qecresh Forest',
        'Chanlibel Lake',
        'Red Settlement (Qırmızı Qəsəbə)',
        'Honey House',
      ],
      subHighlights: [
        'Caspian Sea views',
        'Honey degustation',
      ],
      overnight: 'Guba',
    },
    {
      day: 'Day 3 – Shahdag Mountain Resort (Day Trip from Guba)',
      route: 'Drive from Guba ~45 minutes',
      highlights: [
        'Cable Car',
        'Roller Coaster',
        'Zip-Line',
        'Buggy Tours',
        'Parachuting (optional)',
      ],
      subHighlights: ['Panoramic views of the Caucasus Mountains'],
      overnight: 'Transfer back · Baku',
    },
    {
      day: 'Day 4 – Gobustan & Absheron Peninsula Tour',
      highlights: [
        'Mud Volcanoes',
        'Gobustan National Park',
        'Bibi Heybat Mosque',
        'First Drilled Oil Well',
        'Ateshgah Fire Temple',
        'Yanar Dag (Burning Mountain)',
        'Heydar Aliyev Center',
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

async function seedBakuGubaShahdagTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: bakuGubaShahdagTour.slug });
    if (existing) {
      await Destination.updateOne({ slug: bakuGubaShahdagTour.slug }, bakuGubaShahdagTour);
      console.log('Updated existing destination: Baku, Guba & Shahdag');
    } else {
      await Destination.create(bakuGubaShahdagTour);
      console.log('Successfully inserted: 4 Nights / 5 Days – Baku, Guba & Shahdag');
    }

    console.log('\nBaku, Guba & Shahdag tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Baku, Guba & Shahdag tour:', error);
    process.exit(1);
  }
}

seedBakuGubaShahdagTour();
