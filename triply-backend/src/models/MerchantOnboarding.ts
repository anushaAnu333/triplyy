import mongoose, { Document, Schema } from 'mongoose';

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';

export interface IMerchantOnboarding extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  businessType: string;
  categories: string[];
  businessInfo: Record<string, unknown>;
  documentPaths: Record<string, string>; // fieldName -> file path
  services: Array<{
    title: string;
    price: number;
    duration?: string;
    groupSize?: number;
    languages?: string;
    description: string;
    includes?: string;
    excludes?: string;
  }>;
  status: OnboardingStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const merchantOnboardingSchema = new Schema<IMerchantOnboarding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessType: { type: String, required: true },
    categories: [{ type: String }],
    businessInfo: { type: Schema.Types.Mixed, default: {} },
    documentPaths: { type: Schema.Types.Mixed, default: {} },
    services: [{ type: Schema.Types.Mixed }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMerchantOnboarding>('MerchantOnboarding', merchantOnboardingSchema);
