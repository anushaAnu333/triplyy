import mongoose, { Document, Schema } from 'mongoose';

export type ReferralPartnerOnboardingStatus = 'pending' | 'reapplied' | 'approved' | 'rejected';

export interface IReferralPartnerOnboarding extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  previousApplicationId?: mongoose.Types.ObjectId;
  businessType: string;
  categories: string[];
  businessInfo: Record<string, unknown>;
  documentPaths: Record<string, string | string[]>;
  status: ReferralPartnerOnboardingStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const referralPartnerOnboardingSchema = new Schema<IReferralPartnerOnboarding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    previousApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'ReferralPartnerOnboarding',
      required: false,
      index: true,
    },
    businessType: { type: String, required: true },
    categories: [{ type: String }],
    businessInfo: { type: Schema.Types.Mixed, default: {} },
    documentPaths: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'reapplied', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

referralPartnerOnboardingSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'reapplied'] } },
  }
);

export default mongoose.model<IReferralPartnerOnboarding>(
  'ReferralPartnerOnboarding',
  referralPartnerOnboardingSchema
);
