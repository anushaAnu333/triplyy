import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAvailability extends Document {
  _id: mongoose.Types.ObjectId;
  destinationId: mongoose.Types.ObjectId;
  date: Date;
  availableSlots: number;
  bookedSlots: number;
  isBlocked: boolean;
  blockReason?: string;
  priceOverride?: number;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>(
  {
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      required: [true, 'Destination ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    availableSlots: {
      type: Number,
      required: [true, 'Available slots is required'],
      min: [0, 'Available slots cannot be negative'],
    },
    bookedSlots: {
      type: Number,
      default: 0,
      min: [0, 'Booked slots cannot be negative'],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: {
      type: String,
    },
    priceOverride: {
      type: Number,
      min: [0, 'Price override cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient availability queries
availabilitySchema.index({ destinationId: 1, date: 1 }, { unique: true });

// Virtual to check if date is available
availabilitySchema.virtual('isAvailable').get(function () {
  return !this.isBlocked && this.bookedSlots < this.availableSlots;
});

// Virtual to get remaining slots
availabilitySchema.virtual('remainingSlots').get(function () {
  return Math.max(0, this.availableSlots - this.bookedSlots);
});

// Include virtuals when converting to JSON
availabilitySchema.set('toJSON', { virtuals: true });
availabilitySchema.set('toObject', { virtuals: true });

const Availability: Model<IAvailability> = mongoose.model<IAvailability>(
  'Availability',
  availabilitySchema
);

export default Availability;

