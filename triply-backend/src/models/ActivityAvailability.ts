import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivityAvailability extends Document {
  activityId: mongoose.Types.ObjectId;
  date: Date;
  availableSlots: number; // Total slots available for this date
  bookedSlots: number; // Number of slots already booked
  isAvailable: boolean; // Can be manually disabled
  price?: number; // Optional: different price for specific dates
  createdAt: Date;
  updatedAt: Date;
}

const activityAvailabilitySchema = new Schema<IActivityAvailability>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    availableSlots: {
      type: Number,
      required: [true, 'Available slots is required'],
      min: [0, 'Available slots cannot be negative'],
      default: 1,
    },
    bookedSlots: {
      type: Number,
      default: 0,
      min: [0, 'Booked slots cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one availability record per activity per date
activityAvailabilitySchema.index({ activityId: 1, date: 1 }, { unique: true });
activityAvailabilitySchema.index({ date: 1, isAvailable: 1 });

// Virtual to check if there are remaining slots
activityAvailabilitySchema.virtual('remainingSlots').get(function () {
  return Math.max(0, this.availableSlots - this.bookedSlots);
});

// Virtual to check if fully booked
activityAvailabilitySchema.virtual('isFullyBooked').get(function () {
  return this.bookedSlots >= this.availableSlots || !this.isAvailable;
});

const ActivityAvailability: Model<IActivityAvailability> = mongoose.model<IActivityAvailability>(
  'ActivityAvailability',
  activityAvailabilitySchema
);

export default ActivityAvailability;
