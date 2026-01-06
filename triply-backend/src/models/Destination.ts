import mongoose, { Document, Schema, Model } from 'mongoose';

interface MultilingualText {
  en: string;
  ar?: string;
}

interface Duration {
  days: number;
  nights: number;
}

export interface IDestination extends Document {
  _id: mongoose.Types.ObjectId;
  name: MultilingualText;
  slug: string;
  description: MultilingualText;
  shortDescription: MultilingualText;
  images: string[];
  thumbnailImage: string;
  country: string;
  region?: string;
  depositAmount: number;
  currency: string;
  highlights: MultilingualText[];
  inclusions: MultilingualText[];
  exclusions: MultilingualText[];
  duration: Duration;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const multilingualTextSchema = new Schema<MultilingualText>(
  {
    en: { type: String, required: true },
    ar: { type: String },
  },
  { _id: false }
);

const destinationSchema = new Schema<IDestination>(
  {
    name: {
      type: multilingualTextSchema,
      required: [true, 'Destination name is required'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: multilingualTextSchema,
      required: [true, 'Description is required'],
    },
    shortDescription: {
      type: multilingualTextSchema,
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
    highlights: [multilingualTextSchema],
    inclusions: [multilingualTextSchema],
    exclusions: [multilingualTextSchema],
    duration: {
      days: { type: Number, default: 1 },
      nights: { type: Number, default: 0 },
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
destinationSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.en
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

