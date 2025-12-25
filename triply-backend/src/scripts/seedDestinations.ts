import mongoose from 'mongoose';
import Destination from '../models/Destination';
import env from '../config/environment';

const destinations = [
  {
    name: { en: 'Magical Maldives', ar: 'جزر المالديف الساحرة' },
    slug: 'magical-maldives',
    description: {
      en: 'Experience paradise on Earth with crystal-clear waters, pristine white sand beaches, and luxurious overwater villas. The Maldives offers the ultimate tropical escape with world-class diving, spa treatments, and unforgettable sunsets.',
      ar: 'استمتع بالجنة على الأرض مع المياه الكريستالية الصافية والشواطئ الرملية البيضاء النقية والفيلات الفاخرة فوق الماء.',
    },
    country: 'Maldives',
    region: 'South Asia',
    duration: { days: 5, nights: 4 },
    depositAmount: 199,
    currency: 'AED',
    thumbnailImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    images: [
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200',
      'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1200',
    ],
    highlights: [
      { en: 'Stay in overwater villa', ar: 'الإقامة في فيلا فوق الماء' },
      { en: 'Snorkeling with marine life', ar: 'الغطس مع الحياة البحرية' },
      { en: 'Sunset dolphin cruise', ar: 'رحلة الدلافين عند الغروب' },
      { en: 'Private beach dining', ar: 'تناول الطعام على الشاطئ الخاص' },
    ],
    inclusions: [
      { en: 'Return flights', ar: 'رحلات العودة' },
      { en: '4 nights accommodation', ar: 'إقامة 4 ليالي' },
      { en: 'Daily breakfast', ar: 'إفطار يومي' },
      { en: 'Airport transfers', ar: 'خدمة التوصيل من المطار' },
      { en: 'Snorkeling equipment', ar: 'معدات الغطس' },
    ],
    exclusions: [
      { en: 'Travel insurance', ar: 'تأمين السفر' },
      { en: 'Personal expenses', ar: 'النفقات الشخصية' },
      { en: 'Optional activities', ar: 'الأنشطة الاختيارية' },
    ],
    isActive: true,
    isFeatured: true,
  },
  {
    name: { en: 'Enchanting Bali', ar: 'بالي الساحرة' },
    slug: 'enchanting-bali',
    description: {
      en: 'Discover the Island of Gods with ancient temples, lush rice terraces, vibrant culture, and stunning beaches. Bali offers a perfect blend of spirituality, adventure, and relaxation.',
      ar: 'اكتشف جزيرة الآلهة مع المعابد القديمة وتراسات الأرز الخضراء والثقافة النابضة بالحياة والشواطئ المذهلة.',
    },
    country: 'Indonesia',
    region: 'Southeast Asia',
    duration: { days: 7, nights: 6 },
    depositAmount: 199,
    currency: 'AED',
    thumbnailImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200',
    ],
    highlights: [
      { en: 'Visit Ubud Rice Terraces', ar: 'زيارة مدرجات أرز أوبود' },
      { en: 'Temple hopping tour', ar: 'جولة المعابد' },
      { en: 'Traditional Balinese spa', ar: 'سبا بالي التقليدي' },
      { en: 'Sunset at Tanah Lot', ar: 'غروب الشمس في تاناه لوت' },
    ],
    inclusions: [
      { en: 'Return flights', ar: 'رحلات العودة' },
      { en: '6 nights accommodation', ar: 'إقامة 6 ليالي' },
      { en: 'Daily breakfast', ar: 'إفطار يومي' },
      { en: 'Private guided tours', ar: 'جولات خاصة مع مرشد' },
      { en: 'Airport transfers', ar: 'خدمة التوصيل من المطار' },
    ],
    exclusions: [
      { en: 'Visa fees', ar: 'رسوم التأشيرة' },
      { en: 'Travel insurance', ar: 'تأمين السفر' },
      { en: 'Meals not mentioned', ar: 'الوجبات غير المذكورة' },
    ],
    isActive: true,
    isFeatured: true,
  },
  {
    name: { en: 'Swiss Alps Adventure', ar: 'مغامرة جبال الألب السويسرية' },
    slug: 'swiss-alps-adventure',
    description: {
      en: 'Experience breathtaking Alpine scenery with snow-capped peaks, charming villages, and world-class skiing. Switzerland offers pristine nature, luxury accommodations, and unforgettable mountain adventures.',
      ar: 'استمتع بمناظر الألب الخلابة مع القمم المغطاة بالثلوج والقرى الساحرة والتزلج العالمي.',
    },
    country: 'Switzerland',
    region: 'Europe',
    duration: { days: 6, nights: 5 },
    depositAmount: 199,
    currency: 'AED',
    thumbnailImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
    images: [
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200',
      'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=1200',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    ],
    highlights: [
      { en: 'Scenic train journey', ar: 'رحلة القطار ذات المناظر الخلابة' },
      { en: 'Visit Jungfrau peak', ar: 'زيارة قمة يونغفراو' },
      { en: 'Chocolate & cheese tasting', ar: 'تذوق الشوكولاتة والجبن' },
      { en: 'Lucerne lake cruise', ar: 'رحلة بحيرة لوسيرن' },
    ],
    inclusions: [
      { en: 'Return flights', ar: 'رحلات العودة' },
      { en: '5 nights hotel', ar: 'فندق 5 ليالي' },
      { en: 'Swiss Travel Pass', ar: 'بطاقة السفر السويسرية' },
      { en: 'Daily breakfast', ar: 'إفطار يومي' },
    ],
    exclusions: [
      { en: 'Travel insurance', ar: 'تأمين السفر' },
      { en: 'Ski equipment rental', ar: 'استئجار معدات التزلج' },
      { en: 'Meals not mentioned', ar: 'الوجبات غير المذكورة' },
    ],
    isActive: true,
    isFeatured: true,
  },
  {
    name: { en: 'Dubai Luxe Escape', ar: 'رحلة دبي الفاخرة' },
    slug: 'dubai-luxe-escape',
    description: {
      en: 'Experience the epitome of luxury in the City of Gold. From the iconic Burj Khalifa to world-class shopping and desert safaris, Dubai offers an unparalleled blend of modern marvels and Arabian heritage.',
      ar: 'استمتع بأقصى درجات الفخامة في مدينة الذهب. من برج خليفة الأيقوني إلى التسوق العالمي ورحلات السفاري الصحراوية.',
    },
    country: 'UAE',
    region: 'Middle East',
    duration: { days: 4, nights: 3 },
    depositAmount: 199,
    currency: 'AED',
    thumbnailImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    images: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200',
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200',
    ],
    highlights: [
      { en: 'Burj Khalifa At The Top', ar: 'قمة برج خليفة' },
      { en: 'Desert safari with BBQ', ar: 'سفاري صحراوي مع شواء' },
      { en: 'Dubai Mall shopping', ar: 'التسوق في دبي مول' },
      { en: 'Dhow cruise dinner', ar: 'عشاء على قارب داو' },
    ],
    inclusions: [
      { en: '3 nights 5-star hotel', ar: 'فندق 5 نجوم 3 ليالي' },
      { en: 'Daily breakfast', ar: 'إفطار يومي' },
      { en: 'Desert safari', ar: 'سفاري صحراوي' },
      { en: 'Burj Khalifa tickets', ar: 'تذاكر برج خليفة' },
      { en: 'Airport transfers', ar: 'خدمة التوصيل من المطار' },
    ],
    exclusions: [
      { en: 'Flights', ar: 'الرحلات الجوية' },
      { en: 'Travel insurance', ar: 'تأمين السفر' },
      { en: 'Personal expenses', ar: 'النفقات الشخصية' },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    name: { en: 'Santorini Romance', ar: 'رومانسية سانتوريني' },
    slug: 'santorini-romance',
    description: {
      en: 'Fall in love with the iconic blue domes, stunning caldera views, and magical sunsets of Santorini. This Greek island paradise offers romance, history, and Mediterranean cuisine at its finest.',
      ar: 'استمتع بالقباب الزرقاء الأيقونية وإطلالات الكالديرا المذهلة وغروب الشمس السحري في سانتوريني.',
    },
    country: 'Greece',
    region: 'Europe',
    duration: { days: 5, nights: 4 },
    depositAmount: 199,
    currency: 'AED',
    thumbnailImage: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    images: [
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200',
    ],
    highlights: [
      { en: 'Sunset in Oia', ar: 'غروب الشمس في أويا' },
      { en: 'Wine tasting tour', ar: 'جولة تذوق النبيذ' },
      { en: 'Caldera boat tour', ar: 'جولة قارب الكالديرا' },
      { en: 'Black sand beaches', ar: 'شواطئ الرمال السوداء' },
    ],
    inclusions: [
      { en: 'Return flights', ar: 'رحلات العودة' },
      { en: '4 nights cave hotel', ar: 'فندق كهف 4 ليالي' },
      { en: 'Daily breakfast', ar: 'إفطار يومي' },
      { en: 'Sunset catamaran cruise', ar: 'رحلة كاتاماران عند الغروب' },
    ],
    exclusions: [
      { en: 'Travel insurance', ar: 'تأمين السفر' },
      { en: 'Meals not mentioned', ar: 'الوجبات غير المذكورة' },
      { en: 'Optional activities', ar: 'الأنشطة الاختيارية' },
    ],
    isActive: true,
    isFeatured: true,
  },
  {
    name: { en: 'Japanese Discovery', ar: 'اكتشاف اليابان' },
    slug: 'japanese-discovery',
    description: {
      en: 'Immerse yourself in the fascinating contrast of ancient traditions and cutting-edge technology. From serene temples in Kyoto to the bustling streets of Tokyo, Japan offers a unique cultural experience.',
      ar: 'انغمس في التناقض الرائع بين التقاليد القديمة والتكنولوجيا المتطورة. من المعابد الهادئة في كيوتو إلى شوارع طوكيو الصاخبة.',
    },
    country: 'Japan',
    region: 'East Asia',
    duration: { days: 8, nights: 7 },
    depositAmount: 199,
    currency: 'AED',
    thumbnailImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200',
    ],
    highlights: [
      { en: 'Mount Fuji views', ar: 'إطلالات جبل فوجي' },
      { en: 'Traditional tea ceremony', ar: 'حفل الشاي التقليدي' },
      { en: 'Bullet train experience', ar: 'تجربة القطار السريع' },
      { en: 'Geisha district walk', ar: 'جولة في حي الجيشا' },
    ],
    inclusions: [
      { en: 'Return flights', ar: 'رحلات العودة' },
      { en: '7 nights accommodation', ar: 'إقامة 7 ليالي' },
      { en: 'JR Rail Pass', ar: 'بطاقة قطار JR' },
      { en: 'Guided tours', ar: 'جولات مع مرشد' },
      { en: 'Daily breakfast', ar: 'إفطار يومي' },
    ],
    exclusions: [
      { en: 'Visa fees', ar: 'رسوم التأشيرة' },
      { en: 'Travel insurance', ar: 'تأمين السفر' },
      { en: 'Meals not mentioned', ar: 'الوجبات غير المذكورة' },
    ],
    isActive: true,
    isFeatured: true,
  },
];

async function seedDestinations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing destinations
    await Destination.deleteMany({});
    console.log('Cleared existing destinations');

    // Insert new destinations
    const result = await Destination.insertMany(destinations);
    console.log(`Successfully inserted ${result.length} destinations:`);
    result.forEach((dest) => {
      console.log(`  - ${dest.name.en} (${dest.slug})`);
    });

    console.log('\nSeeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding destinations:', error);
    process.exit(1);
  }
}

seedDestinations();

