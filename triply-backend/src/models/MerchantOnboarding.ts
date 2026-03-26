import mongoose, { Document, Schema } from 'mongoose';

export type OnboardingStatus = 'pending' | 'reapplied' | 'approved' | 'rejected';

export interface IMerchantOnboarding extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** Set when this application is a resubmit after a rejection; links to the prior record */
  previousApplicationId?: mongoose.Types.ObjectId;
  businessType: string;
  categories: string[];
  businessInfo: Record<string, unknown>;
  // fieldName -> file path (or list of file paths when multiple files share the same fieldname)
  documentPaths: Record<string, string | string[]>;
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
    previousApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'MerchantOnboarding',
      required: false,
      index: true,
    },
    businessType: { type: String, required: true },
    categories: [{ type: String }],
    businessInfo: { type: Schema.Types.Mixed, default: {} },
    documentPaths: { type: Schema.Types.Mixed, default: {} },
    services: [{ type: Schema.Types.Mixed }],
    status: {
      type: String,
      enum: ['pending', 'reapplied', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

/**
 * Only allow a single in-flight application per user.
 * Rejected applications are kept for history, so they must not be part of the uniqueness constraint.
 */
merchantOnboardingSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'reapplied'] } },
  }
);

export default mongoose.model<IMerchantOnboarding>('MerchantOnboarding', merchantOnboardingSchema);
