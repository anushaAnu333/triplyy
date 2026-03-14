import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Armenia Mini Tour – 4 Days / 3 Nights
 * Yerevan city tour, Garni, Geghard, Tsaghkadzor, Lake Sevan
 * Seeds a single destination (upserts by slug).
 */
const armeniaMiniTour = {
  name: 'Armenia Mini Tour – 4 Days / 3 Nights',
  slug: 'armenia-mini-tour-4d3n',
  shortDescription:
    '4 Days / 3 Nights · 🏛️ Yerevan, Garni, Geghard · 🏔️ Tsaghkadzor & Lake Sevan · 🚐 Individual transport & English-speaking guide',
  description: `Armenia Mini Tour — 4 days / 3 nights

Yerevan city tour, Cascade Complex, Garni Temple, Symphony of Stones, Geghard Monastery (UNESCO), Tsaghkadzor Ropeway, Lake Sevan.

Pricing per person varies by group size (2, 4, 12 or 20 pax) and hotel category (4* or 5*). From approx. $260–$580 per pax. Accommodation on BB basis; individual transfers and tours; entrance to Garni Temple and Tsaghkadzor Ropeway; visa included.`,
  country: 'Armenia',
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
    '3 Nights Yerevan',
    'Cascade Complex & Republic Square',
    'Garni Temple & Geghard Monastery (UNESCO)',
    'Tsaghkadzor Ropeway & Lake Sevan',
    'Individual transport & English-speaking guide',
  ],
  itinerary: [
    {
      day: '01 — Arrival Yerevan & City Tour',
      highlights: [
        'Victory Park',
        'Cascade Complex',
        'North Avenue',
        'Republic Square',
        'Matenadaran',
        'Blue Mosque',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Arrival at Zvartnots International Airport in Yerevan. Meet and greet by representative. Transfer to the hotel. Then start city tour.',
          subPoints: [],
        },
        {
          text: 'Cascade Complex',
          subPoints: [
            'A giant limestone stairway housing one of the most interesting and vast contemporary art collections.',
          ],
        },
        {
          text: 'Opera House & North Avenue',
          subPoints: [],
        },
        {
          text: 'Republic Square',
          subPoints: ['In the heart of Yerevan.'],
        },
        {
          text: 'Matenadaran',
          subPoints: [],
        },
        {
          text: 'Blue Mosque',
          subPoints: ['Dating back to the 18th century.'],
        },
        {
          text: 'Return to the hotel. Overnight at the hotel in Yerevan.',
          subPoints: [],
        },
      ],
      overnight: 'Yerevan',
    },
    {
      day: '02 — Yerevan – Garni – Geghard – Yerevan',
      highlights: [
        'Arch of Charents',
        'Garni Fortress & Temple',
        'Symphony of Stones',
        'Geghard Monastery (UNESCO)',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'After breakfast at the hotel, first stop near the Arch of Charents for a beautiful panoramic view.',
          subPoints: [],
        },
        {
          text: 'Garni Fortress & Pagan Temple of Garni',
          subPoints: [
            'Fortress dates to 3rd century BC; the temple to 1st century AD.',
          ],
        },
        {
          text: 'Symphony of Stones',
          subPoints: [
            'Nature-created sightseeing in Garni village — a natural monument from the collapse of volcanic rocks.',
          ],
        },
        {
          text: 'Geghard Monastery',
          subPoints: [
            'Dating to 4th century AD, reaching its glory in the 13th century. UNESCO World Heritage site. One of the jewels of Armenian medieval architecture. Contains churches and tombs cut into solid rock, illustrating the peak of Armenian medieval craftsmanship.',
          ],
        },
        {
          text: 'Return to Yerevan. Overnight at the hotel in Yerevan.',
          subPoints: [],
        },
      ],
      overnight: 'Yerevan',
    },
    {
      day: '03 — Yerevan – Tsaghkadzor – Lake Sevan – Yerevan',
      highlights: [
        'Kecharis Monastery',
        'Tsaghkadzor Ropeway',
        'Lake Sevan (Pearl of Armenia)',
      ],
      subHighlights: [],
      pointGroups: [
        {
          text: 'After breakfast at the hotel, head to Gegharkhunik region. Visit Kecharis Monastery, founded in the 11th century by Armenian Pahlavuni princes.',
          subPoints: [],
        },
        {
          text: 'Tsaghkadzor Ropeway',
          subPoints: [
            'Enjoy the view of beautiful Armenian landscapes. Optional activities such as zip line available.',
          ],
        },
        {
          text: 'Lake Sevan',
          subPoints: [
            'Referred to as the Pearl of Armenia. The largest lake in the Caucasus and one of the largest freshwater high-altitude lakes in the world.',
          ],
        },
        {
          text: 'In the evening, return to Yerevan. Overnight at the hotel in Yerevan.',
          subPoints: [],
        },
      ],
      overnight: 'Yerevan',
    },
    {
      day: '04 — Transfer to the Airport',
      highlights: ['Breakfast', 'Check out', 'Transfer to Zvartnots Airport'],
      subHighlights: [],
      pointGroups: [
        {
          text: 'Breakfast at the hotel. Check out from the hotel. Transfer to Zvartnots International Airport. Departure.',
          subPoints: [],
        },
      ],
    },
  ],
  inclusions: [
    'Accommodation in chosen hotel (DBL/TWN occupancy) on BB basis',
    'Individual transfer airport–hotel–airport',
    'Individual tours',
    'Individual transportation and English-speaking guide throughout the tour',
    'Entrance tickets to Garni Temple and Tsaghkadzor Ropeway',
    'Visa',
  ],
  exclusions: [
    'Air ticket',
    'Optional entertainments',
    'Insurance',
    'Lunch ($20 per lunch)',
    'Dinner ($30 per dinner)',
    'Gala dinner ($70 per gala dinner)',
  ],
  isActive: true,
};

async function seedArmeniaMiniTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: armeniaMiniTour.slug });
    if (existing) {
      await Destination.updateOne({ _id: existing._id }, { $set: armeniaMiniTour });
      console.log('Updated existing destination: Armenia Mini Tour');
    } else {
      await Destination.create(armeniaMiniTour);
      console.log('Successfully inserted: Armenia Mini Tour – 4 Days / 3 Nights');
    }

    console.log('\nArmenia Mini Tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Armenia Mini Tour:', error);
    process.exit(1);
  }
}

seedArmeniaMiniTour();
