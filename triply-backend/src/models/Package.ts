import mongoose, { Document, Schema, Model } from 'mongoose';

interface Duration {
  days: number;
  nights: number;
}

export interface IPackageItineraryPointGroup {
  text: string;
  subPoints: string[];
}

export interface IPackageItineraryDay {
  day: string;
  route?: string;
  /**
   * Meal tags for the day, e.g. ["B","L","D"].
   * Used for the "Day meals" labels in the B2B itinerary template.
   */
  meals?: string[];
  highlights: string[];
  subHighlights?: string[];
  pointGroups?: IPackageItineraryPointGroup[];
  extra?: string;
  checkin?: string;
  overnight?: string;
}

export interface IPackageHotelGroup {
  title: string;
  items: string[];
}

export interface IPackagePricingTable {
  currency: string;
  columnHeaders: string[];
  rows: { category: string; values: number[] }[];
}

/** Admin-only PDF / image URLs for staff — not exposed on public package APIs. */
export interface IPackageAdminAttachment {
  url: string;
  originalName: string;
  mimeType?: string;
}

export interface IPackage extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  thumbnailImage: string;
  location: string;
  duration: Duration;
  /** Card / summary line, e.g. "From USD 272 / person" */
  priceLabel?: string;
  priceCurrency: string;
  /** Structured USD (or other) table */
  pricingTable?: IPackagePricingTable;
  hotelGroups?: IPackageHotelGroup[];
  blackoutDates?: string[];
  inclusions: string[];
  exclusions: string[];
  importantNotes?: string[];
  highlights: string[];
  itinerary?: IPackageItineraryDay[];
  secondaryItineraryTitle?: string;
  secondaryItinerary?: IPackageItineraryDay[];
  contactPhone?: string;
  contactEmail?: string;
  contactInstagram?: string;
  /** Optional SEO fields for public package pages / meta tags */
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isPromotion: boolean;
  promotionStartDate?: Date;
  promotionEndDate?: Date;
  isActive: boolean;
  adminOnlyAttachments?: IPackageAdminAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const pointGroupSchema = new Schema<IPackageItineraryPointGroup>(
  {
    text: { type: String },
    subPoints: [{ type: String }],
  },
  { _id: false }
);

const itineraryDaySchema = new Schema<IPackageItineraryDay>(
  {
    day: { type: String, required: true },
    route: { type: String },
    meals: [{ type: String }],
    highlights: [{ type: String }],
    subHighlights: [{ type: String }],
    pointGroups: [pointGroupSchema],
    extra: { type: String },
    checkin: { type: String },
    overnight: { type: String },
  },
  { _id: false }
);

const hotelGroupSchema = new Schema<IPackageHotelGroup>(
  {
    title: { type: String, required: true },
    items: [{ type: String }],
  },
  { _id: false }
);

const pricingTableSchema = new Schema<IPackagePricingTable>(
  {
    currency: { type: String, default: 'USD' },
    columnHeaders: [{ type: String }],
    rows: [
      {
        category: { type: String },
        values: [{ type: Number }],
      },
    ],
  },
  { _id: false }
);

const packageSchema = new Schema<IPackage>(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    shortDescription: {
      type: String,
    },
    images: [{ type: String }],
    thumbnailImage: {
      type: String,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    duration: {
      days: { type: Number, default: 1 },
      nights: { type: Number, default: 0 },
    },
    priceLabel: {
      type: String,
      trim: true,
    },
    priceCurrency: {
      type: String,
      default: 'USD',
    },
    pricingTable: {
      type: pricingTableSchema,
    },
    hotelGroups: [hotelGroupSchema],
    blackoutDates: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    importantNotes: [{ type: String }],
    highlights: [{ type: String }],
    itinerary: [itineraryDaySchema],
    secondaryItineraryTitle: {
      type: String,
    },
    secondaryItinerary: [itineraryDaySchema],
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactInstagram: { type: String, trim: true },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    seoKeywords: { type: String, trim: true },
    isPromotion: {
      type: Boolean,
      default: true,
    },
    promotionStartDate: {
      type: Date,
    },
    promotionEndDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adminOnlyAttachments: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          originalName: { type: String, required: true, trim: true },
          mimeType: { type: String, trim: true },
        },
      ],
      validate: {
        validator: (v: unknown[]) => !v || v.length <= 15,
        message: 'Maximum 15 internal files per package',
      },
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

packageSchema.index({ isActive: 1 });
packageSchema.index({ isPromotion: 1 });

packageSchema.pre('save', function (this: IPackage, next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const PackageModel: Model<IPackage> = mongoose.model<IPackage>('Package', packageSchema);

export default PackageModel;
