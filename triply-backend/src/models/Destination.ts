import mongoose, { Document, Schema, Model } from 'mongoose';

interface Duration {
  days: number;
  nights: number;
}

export interface IItineraryDay {
  day: string;
  route?: string;
  highlights: string[];
  subHighlights?: string[];
  extra?: string;
  checkin?: string;
  overnight?: string;
}

export interface IPricingHotelOption {
  name: string;
  starLabel?: string;
  pricePerPerson: number;
  currency: string;
  hotels: { location: string; choices: string[] }[];
}

export interface IPricingHotel {
  validFrom?: string;
  validTo?: string;
  note?: string;
  options: IPricingHotelOption[];
  optionalEntryFees?: {
    totalEstimated: number;
    currency: string;
    items: string[];
  };
  emergencyContact?: string;
}

export interface IDestination extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  thumbnailImage: string;
  country: string;
  region?: string;
  depositAmount: number;
  currency: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  duration: Duration;
  itinerary?: IItineraryDay[];
  pricingHotel?: IPricingHotel;
  calendarValidityDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const destinationSchema = new Schema<IDestination>(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
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
    images: [
      {
        type: String,
      },
    ],
    thumbnailImage: {
      type: String,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    region: {
      type: String,
    },
    depositAmount: {
      type: Number,
      default: 199,
      min: [0, 'Deposit amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'AED',
    },
    highlights: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    duration: {
      days: { type: Number, default: 1 },
      nights: { type: Number, default: 0 },
    },
    itinerary: [
      {
        day: { type: String, required: true },
        route: { type: String },
        highlights: [{ type: String }],
        subHighlights: [{ type: String }],
        extra: { type: String },
        checkin: { type: String },
        overnight: { type: String },
      },
    ],
    pricingHotel: {
      validFrom: { type: String },
      validTo: { type: String },
      note: { type: String },
      options: [
        {
          name: { type: String },
          starLabel: { type: String },
          pricePerPerson: { type: Number },
          currency: { type: String },
          hotels: [
            {
              location: { type: String },
              choices: [{ type: String }],
            },
          ],
        },
      ],
      optionalEntryFees: {
        totalEstimated: { type: Number },
        currency: { type: String },
        items: [{ type: String }],
      },
      emergencyContact: { type: String },
    },
    calendarValidityDays: {
      type: Number,
      min: [1, 'Calendar validity must be at least 1 day'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: slug index is automatically created by unique: true
destinationSchema.index({ country: 1 });
destinationSchema.index({ isActive: 1 });

// Generate slug from name before saving
destinationSchema.pre('save', function (this: IDestination, next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Destination: Model<IDestination> = mongoose.model<IDestination>(
  'Destination',
  destinationSchema
);

export default Destination;

