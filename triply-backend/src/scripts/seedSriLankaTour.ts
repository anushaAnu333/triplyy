import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Sri Lanka 4 Days / 3 Nights – "Romantic Essence of Sri Lanka"
 * Colombo → Kandy → Nuwara Eliya
 * Seeds a single destination (upserts by slug).
 */
const sriLankaTour = {
  name: '4 Days / 3 Nights – Romantic Essence of Sri Lanka',
  slug: '4-days-3-nights-romantic-essence-sri-lanka',
  shortDescription: 'Colombo, Kandy and Nuwara Eliya: Galle Face, Temple of the Tooth, Pinnawala Elephant Orphanage, tea country and Gregory Lake.',
  description: 'Colombo → Kandy → Nuwara Eliya. Hotels: Best Western Elyon Colombo, King\'s Ridge Kandy, Hotel Ashford. Total from 384 USD per person (double).',
  country: 'Sri Lanka',
  region: 'Colombo, Kandy, Nuwara Eliya',
  duration: { days: 4, nights: 3 },
  depositAmount: 199,
  currency: 'AED',
  thumbnailImage:
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  images: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
  ],
  highlights: [
    'Colombo: Galle Face Green, Independence Square, Gangaramaya Temple',
    'Pinnawala Elephant Orphanage',
    'Kandy: Temple of the Sacred Tooth Relic, Cultural Dance Show',
    'Tea Factory & Tea Plantation, Ramboda Waterfall',
    "Nuwara Eliya: Gregory Lake, Victoria Park, St. Clair's Viewpoint",
  ],
  itinerary: [
    {
      day: 'Day 1 – Arrival in Sri Lanka / Colombo Stay',
      route: 'Airport → Colombo',
      highlights: [
        'Meet & greet at Bandaranaike International Airport',
        'Transfer to Colombo',
        'Check-in at Best Western Elyon Colombo',
        'Evening Colombo city tour',
      ],
      subHighlights: [
        'Galle Face Green',
        'Independence Square',
        'Gangaramaya Temple',
        'Old Parliament & Lotus Tower (exterior view)',
      ],
      extra: 'Shopping: Odel / Marino Mall / Colombo City Centre',
      overnight: 'Best Western Elyon Colombo',
    },
    {
      day: 'Day 2 – Colombo → Pinnawala → Kandy',
      route: 'Colombo → Pinnawala Elephant Orphanage → Kandy',
      highlights: [
        'Breakfast at hotel',
        'Transfer to Kandy',
        'Visit Pinnawala Elephant Orphanage',
        'Visit Spice Garden (optional)',
        'Kandy city tour',
      ],
      subHighlights: [
        'Temple of the Sacred Tooth Relic',
        'Upper Lake Drive',
        'Kandy Viewpoint',
        'Traditional Cultural Dance Show',
      ],
      checkin: "King's Ridge Kandy",
      overnight: "King's Ridge Kandy",
    },
    {
      day: 'Day 3 – Kandy → Nuwara Eliya',
      highlights: [
        'Breakfast at hotel',
        'Visit Bahirawakanda Buddha Statue',
        'Visit a Tea Factory & Tea Plantation',
        'Stop at Ramboda Waterfall',
        'Scenic drive into Nuwara Eliya',
      ],
      subHighlights: [
        'Gregory Lake',
        'Victoria Park',
        'Nuwara Eliya Post Office',
        "St. Clair's Viewpoint (optional)",
      ],
      checkin: 'Hotel Ashford, Nuwara Eliya',
      overnight: 'Hotel Ashford',
    },
    {
      day: 'Day 4 – Nuwara Eliya → Airport Departure',
      highlights: [
        'Breakfast at hotel',
        'Checkout from Hotel Ashford',
        'Drive back to Colombo Airport (approx. 5 hours)',
        'Transfer to Bandaranaike International Airport for departure',
      ],
    },
  ],
  inclusions: [
    "03 nights’ accommodation at mentioned hotels",
    'Daily breakfast at all hotels',
    'Private transfers in an air-conditioned vehicle',
    'English-speaking chauffeur driver guide',
    'All sightseeing mentioned in the itinerary',
    'Airport pick-up & drop-off',
    'Fuel, parking tickets & highway charges',
    '24/7 on-call travel assistance',
  ],
  exclusions: [
    'Entrance fees: Pinnawala Elephant Orphanage, Temple of the Tooth, Cultural Dance Show, Tea Factory tours, Gregory Lake activities',
    'Lunch & dinner throughout the tour',
    'Early check-in / late check-out',
    'Tips to guides / drivers',
    'Expenses of personal nature',
    'Optional tours not mentioned',
    'Air tickets & travel insurance',
  ],
  isActive: true,
};

async function seedSriLankaTour() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Destination.findOne({ slug: sriLankaTour.slug });
    if (existing) {
      await Destination.updateOne({ slug: sriLankaTour.slug }, sriLankaTour);
      console.log('Updated existing destination: Romantic Essence of Sri Lanka');
    } else {
      await Destination.create(sriLankaTour);
      console.log('Successfully inserted: 4 Days / 3 Nights – Romantic Essence of Sri Lanka');
    }

    console.log('\nSri Lanka tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Sri Lanka tour:', error);
    process.exit(1);
  }
}

seedSriLankaTour();
