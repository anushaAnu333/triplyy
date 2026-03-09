import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Azerbaijan 4 Nights / 5 Days – "Baku, Gabala & Beyond"
 * 3 Nights Baku → 1 Night Gabala
 * Seeds a single destination (upserts by slug).
 */
const bakuGabalaBeyondTour = {
  name: '4 Nights / 5 Days – Baku, Gabala & Beyond',
  slug: '4-nights-5-days-baku-gabala-beyond',
  shortDescription: 'Baku city tour, Gabala (Tufandag, Seven Beauties, Nohur Lake), Gobustan & Absheron (mud volcanoes, Fire Temple, Heydar Aliyev). 3 nights Baku, 1 night Gabala.',
  description: `Day 1 – Arrival & Baku City Tour: Airport meet & greet, Highland Park (Parliament, Flame Towers, Alley of Martyrs), Little Venice, Daniz Mall or Carpet Museum, Old City (Maiden Tower, Shirvanshahs), Nizami Street. Overnight Baku.

Day 2 – Baku → Gabala (~3.5h): Shamakhi Juma Mosque, Local Winery, Seven Beauties Waterfall, Nohur Lake, Tufandag Mountain Resort (cable cars, skiing seasonal Dec 20 – Mar 1), Honey House. Overnight Gabala.

Day 3 – Gabala → Baku: Scenic drive back to Baku (~3.5 hours). Overnight Baku.

Day 4 – Gobustan & Absheron Peninsula: Mud Volcanoes, Gobustan National Park (rock carvings, nature museum), Bibi Heybat Mosque, First Drilled Oil Well, Ateshgah Fire Temple, Yanar Dag (Burning Mountain), Heydar Aliyev Center. Overnight Baku.

Day 5 – Transfer to airport (3 hours before flight).

Pricing: From 174 USD (Budget) or 220 USD (Comfortable) per person for 8 pax. Optional entry fees ~66 USD. Emergency: +994556007323 / +994515832804 (WhatsApp).`,
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
    'Gabala: Tufandag Resort, Seven Beauties Waterfall, Nohur Lake, Honey House',
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
      day: 'Day 2 – Baku → Gabala City Tour',
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
        'Skiing (seasonal Dec 20 – Mar 1)',
        'Honey degustation',
      ],
      overnight: 'Gabala',
    },
    {
      day: 'Day 3 – Gabala → Baku Transfer',
      highlights: ['Scenic drive back to Baku (~3.5 hours)'],
      overnight: 'Baku',
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
        pricePerPerson: 174,
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
            location: 'Gabala Hotels (choose one)',
            choices: ['Tufandag City Hotel (3★)', 'Bliss Hotel (3★)'],
          },
        ],
      },
      {
        name: 'Option 2 – Comfortable',
        starLabel: '4-Star Hotels',
        pricePerPerson: 220,
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
            location: 'Gabala Hotels (choose one)',
            choices: [
              'Gabala Karvansaray Hotel (4★)',
              'Nohur Hotel (4★)',
              'Yeddi Gozel Hotel (4★)',
            ],
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

async function seedBakuGabalaBeyondTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: bakuGabalaBeyondTour.slug });
    if (existing) {
      await Destination.updateOne({ slug: bakuGabalaBeyondTour.slug }, bakuGabalaBeyondTour);
      console.log('Updated existing destination: Baku, Gabala & Beyond');
    } else {
      await Destination.create(bakuGabalaBeyondTour);
      console.log('Successfully inserted: 4 Nights / 5 Days – Baku, Gabala & Beyond');
    }

    console.log('\nBaku, Gabala & Beyond tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Baku, Gabala & Beyond tour:', error);
    process.exit(1);
  }
}

seedBakuGabalaBeyondTour();
