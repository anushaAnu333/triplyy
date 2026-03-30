import mongoose, { Document, Schema, Model } from 'mongoose';

interface Duration {
  days: number;
  nights: number;
}

export interface IItineraryPointGroup {
  text: string;
  subPoints: string[];
}

export interface IItineraryDay {
  day: string;
  route?: string;
  highlights: string[];
  subHighlights?: string[];
  /** Point → sub points (one point with its sub points). When set, used for display instead of highlights/subHighlights. */
  pointGroups?: IItineraryPointGroup[];
  extra?: string;
  checkin?: string;
  overnight?: string;
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
  earlyBirdAmount: number;
  standardAmount?: number;
  currency: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  duration: Duration;
  itinerary?: IItineraryDay[];
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
    earlyBirdAmount: {
      type: Number,
      default: 0,
      min: [0, 'Early bird amount cannot be negative'],
    },
    standardAmount: {
      type: Number,
      min: [0, 'Standard amount cannot be negative'],
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
        pointGroups: [
          {
            text: { type: String },
            subPoints: [{ type: String }],
          },
        ],
        extra: { type: String },
        checkin: { type: String },
        overnight: { type: String },
      },
    ],
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

