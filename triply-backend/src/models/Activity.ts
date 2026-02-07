import mongoose, { Document, Schema, Model } from 'mongoose';

export type ActivityStatus = 'pending' | 'approved' | 'rejected';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  photos: string[]; // Array of image URLs (1-3 photos)
  status: ActivityStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Merchant ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'AED',
      uppercase: true,
    },
    photos: {
      type: [String],
      validate: {
        validator: function (photos: string[]) {
          return photos.length >= 1 && photos.length <= 3;
        },
        message: 'Activity must have between 1 and 3 photos',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activitySchema.index({ merchantId: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ createdAt: -1 });

const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
