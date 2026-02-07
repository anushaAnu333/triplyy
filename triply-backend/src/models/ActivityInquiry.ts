import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivityInquiry extends Document {
  _id: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredDate: Date;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityInquirySchema = new Schema<IActivityInquiry>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activityInquirySchema.index({ activityId: 1 });
activityInquirySchema.index({ customerEmail: 1 });
activityInquirySchema.index({ createdAt: -1 });

const ActivityInquiry: Model<IActivityInquiry> = mongoose.model<IActivityInquiry>(
  'ActivityInquiry',
  activityInquirySchema
);

export default ActivityInquiry;
