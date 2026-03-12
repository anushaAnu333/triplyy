import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Georgia 4 Days / 3 Nights – "Discover Georgia"
 * Seeds a single destination (upserts by slug).
 */
const georgiaTour = {
  name: 'Discover Georgia',
  slug: 'discover-georgia',
  shortDescription:
    '4 Days / 3 Nights · 👥 Group of 8 Pax · 🏨 3 Nights Accommodation (BB) · 🚐 Private Mini-Bus · 🗣️ English-Speaking Guide',
  description: `Discover Georgia
4 Days / 3 Nights — Georgia Tour Program

👥 Group of 8 Pax
🏨 3 Nights Accommodation (BB)
🚐 Private Mini-Bus
🗣️ English-Speaking Guide

Booking & Payment: Full tour payment is required 4 days before arrival. Tour package price is for 8 pax (total). Better pricing may be available upon confirmed reservation request. Prices may vary depending on travel season and group size.`,
  country: 'Georgia',
  region: 'Caucasus',
  duration: { days: 4, nights: 3 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
  images: [
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
  ],
  highlights: [
    'Group of 8 Pax',
    '3 Nights Accommodation (BB)',
    'Private Mini-Bus',
    'English-Speaking Guide',
  ],
  itinerary: [
    {
      day: '01 — Arrival & Tbilisi City Tour',
      highlights: [
        'Rike Park & European Square',
        'Bridge of Peace',
        'Lunch Break',
        'Cable Car Ride to Narikala Fortress',
        'Mother of Georgia Statue',
        'Abanotubani – Sulfur Baths District',
        'Shardeni Street',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Upon arrival in Tbilisi, transfer from the airport and begin your city exploration. Duration: 3 – 4 hours.',
          subPoints: [],
        },
        {
          text: 'Rike Park & European Square',
          subPoints: ['A blend of modern architecture and historic charm — including remains of the Berlin Wall.'],
        },
        {
          text: 'Bridge of Peace',
          subPoints: ['Iconic glass pedestrian bridge arching over the Kura River.'],
        },
        {
          text: 'Lunch Break',
          subPoints: ['Not included in the tour price.'],
        },
        {
          text: 'Cable Car Ride to Narikala Fortress',
          subPoints: ['Breathtaking panoramic views across the old city.'],
        },
        {
          text: 'Mother of Georgia Statue',
          subPoints: ['The beloved symbol of Georgian hospitality and national identity.'],
        },
        {
          text: 'Abanotubani – Sulfur Baths District',
          subPoints: ['The beating heart of old Tbilisi; centuries of tradition.'],
        },
        {
          text: 'Shardeni Street',
          subPoints: ['Charming cafés, local shops, and vibrant nightlife.'],
        },
      ],
      overnight: 'Tbilisi',
    },
    {
      day: '02 — Caucasus Mountains – Gudauri & Kazbegi',
      highlights: [
        'Zhinvali Reservoir',
        'Ananuri Fortress',
        'Friendship Monument – Gudauri Viewpoint',
        'Lunch Break',
        'Kazbegi Village & Gergeti Trinity Church',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: "A full-day journey into Georgia's stunning mountain landscapes along the Georgian Military Highway. Duration: 7 – 8 hours.",
          subPoints: [],
        },
        {
          text: 'Zhinvali Reservoir',
          subPoints: ['A breathtaking turquoise lake nestled between majestic mountain ranges.'],
        },
        {
          text: 'Ananuri Fortress',
          subPoints: ['A medieval castle complex with sweeping views over the Aragvi River valley.'],
        },
        {
          text: 'Friendship Monument – Gudauri Viewpoint',
          subPoints: ['Panoramic views of snow-capped Caucasian peaks at 2,395 m altitude.'],
        },
        {
          text: 'Lunch Break',
          subPoints: ['Not included in the tour price.'],
        },
        {
          text: 'Kazbegi Village & Gergeti Trinity Church',
          subPoints: ['The iconic 14th-century church perched at 2,170 m with Mount Kazbek (5,047 m) as a backdrop.'],
        },
      ],
      overnight: 'Tbilisi',
    },
    {
      day: '03 — Kakheti Wine Region Tour',
      highlights: [
        'Bodbe Monastery',
        'Sighnaghi – City of Love',
        'Lunch Break',
        'Wine Tasting (KTW)',
        'Churchkhela Making Masterclass',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: "Discover Georgia's legendary wine country, home to 8,000 years of winemaking tradition. Duration: 6 – 7 hours.",
          subPoints: [],
        },
        {
          text: 'Bodbe Monastery',
          subPoints: ['Stroll through beautiful gardens overlooking the lush Alazani Valley.'],
        },
        {
          text: 'Sighnaghi – City of Love',
          subPoints: ['The picturesque hilltop town encircled by ancient walls; charming streets and local artisans.'],
        },
        {
          text: 'Lunch Break',
          subPoints: ['Not included in the tour price.'],
        },
        {
          text: 'Wine Tasting (KTW)',
          subPoints: ["Sample Georgia's world-renowned amber and red wines, made using traditional Qvevri clay vessels."],
        },
        {
          text: 'Churchkhela Making Masterclass',
          subPoints: ['Hands-on experience making the traditional Georgian walnut-and-grape sweet.'],
        },
      ],
      overnight: 'Tbilisi',
    },
    {
      day: '04 — Transfer to the Airport',
      highlights: ['Private departure transfer to Tbilisi International Airport. Safe travels!'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Private departure transfer to Tbilisi International Airport. Safe travels!',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Hotel accommodation with breakfast (BB)',
    'Private airport transfers (arrival & departure)',
    'Private mini-bus for all tours',
    'English-speaking professional guide & driver',
    '0.5 L bottled water per person per day',
    'Cable car tickets (2-way)',
    'Wine tasting & Churchkhela masterclass',
  ],
  exclusions: [
    'Lunches and dinners',
    'Personal expenses',
    'Additional activities (paragliding, snowmobiling, skiing, ATV, jeep tours, horse riding, rafting, etc.)',
  ],
  isActive: true,
};

async function seedGeorgiaTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: georgiaTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: georgiaTour });
      console.log('Updated existing destination: Discover Georgia');
    } else {
      await Destination.create(georgiaTour);
      console.log('Successfully inserted: Discover Georgia');
    }

    console.log('\nGeorgia tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Georgia tour:', error);
    process.exit(1);
  }
}

seedGeorgiaTour();
