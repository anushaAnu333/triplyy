import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

/**
 * Georgia 4 Days / 3 Nights Tour Program
 * Seeds a single destination into the database (does not clear existing destinations).
 */
const georgiaTour = {
  name: '4 Days / 3 Nights Georgia Tour',
  slug: '4-days-3-nights-georgia-tour',
  shortDescription: 'Tbilisi city tour, Caucasus mountains (Gudauri & Kazbegi), and Kakheti wine region with wine tasting and Churchkhela masterclass.',
  description: `Day 1: Arrival & Tbilisi City Tour (3–4 hours)
Upon arrival in Tbilisi, transfer from the airport to start your city exploration:
• Rike Park & European Square – a blend of modern architecture and historic charm. See the remains of the Berlin Wall.
• Bridge of Peace – iconic glass pedestrian bridge over the Kura River.
• Lunch Break (not included)
• Cable Car Ride to Narikala Fortress – enjoy stunning panoramic views of the city.
• Mother of Georgia Statue – the symbol of Georgian hospitality.
• Abanotubani (Sulfur Baths District) – the heart of old Tbilisi.
• Shardeni Street – charming cafes, shops, and vibrant nightlife.
Transfer back to the hotel. Overnight in Tbilisi.

Day 2: Caucasus Mountains – Gudauri & Kazbegi (7–8 hours)
Explore Georgia's stunning mountain landscapes:
• Zhinvali Reservoir – a breathtaking turquoise lake surrounded by majestic mountains.
• Ananuri Fortress – a medieval castle complex with views over the Aragvi River.
• Friendship Monument (Gudauri Viewpoint) – panoramic views of snow-capped peaks.
• Lunch break (not included in the price)
• Kazbegi Village – visit Gergeti Trinity Church, with Mount Kazbek as a backdrop.
Transfer back to Tbilisi. Overnight in Tbilisi.

Day 3: Kakheti Wine Region Tour (6–7 hours)
Discover Georgia's famous wine region:
• Bodbe Monastery – stroll through beautiful gardens overlooking the Alazani Valley.
• Sighnaghi – the picturesque "City of Love".
• Lunch break (not included in the price)
• Wine Tasting – sample Georgia's renowned wines. (KTW)
• Masterclass: Churchkhela Making – learn how to make the traditional Georgian sweet.
Transfer back to Tbilisi. Overnight in Tbilisi.

Day 4: Transfer to the airport.

Payment Policy: The tour price should be paid 4 days before arrival.

Note: Tour package price with accommodations is quoted for 8 pax. Once we have a request for reservation we will be able to offer you better prices depending on season and amount of people in the group.`,
  country: 'Georgia',
  region: 'Caucasus',
  duration: { days: 4, nights: 3 },
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
    'Tbilisi: Rike Park, Bridge of Peace, Narikala Fortress',
    'Cable car ride with panoramic city views',
    'Caucasus Mountains: Zhinvali, Ananuri, Gudauri, Kazbegi',
    'Gergeti Trinity Church with Mount Kazbek backdrop',
    'Kakheti: Bodbe Monastery, Sighnaghi (City of Love)',
    'Wine tasting & Churchkhela making masterclass',
  ],
  inclusions: [
    'Hotel accommodation with breakfast (BB)',
    'Private airport transfers',
    'Private mini-bus for all tours',
    'English-speaking professional guide and driver',
    '0.5 L bottled water per person per day',
    'Cable car tickets (2-way)',
    'Wine tasting & Churchkhela making masterclass',
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
      await Destination.updateOne({ slug: georgiaTour.slug }, georgiaTour);
      console.log('Updated existing destination: 4 Days / 3 Nights Georgia Tour');
    } else {
      await Destination.create(georgiaTour);
      console.log('Successfully inserted: 4 Days / 3 Nights Georgia Tour');
    }

    console.log('\nGeorgia tour seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Georgia tour:', error);
    process.exit(1);
  }
}

seedGeorgiaTour();
