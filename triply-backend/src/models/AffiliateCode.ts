import mongoose, { Document, Schema, Model } from 'mongoose';

export type CommissionType = 'percentage' | 'fixed';

export interface IAffiliateCode extends Document {
  _id: mongoose.Types.ObjectId;
  affiliateId: mongoose.Types.ObjectId;
  code: string;
  commissionRate: number;
  commissionType: CommissionType;
  fixedAmount?: number;
  isActive: boolean;
  usageCount: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateCodeSchema = new Schema<IAffiliateCode>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Affiliate ID is required'],
    },
    code: {
      type: String,
      required: [true, 'Affiliate code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    commissionRate: {
      type: Number,
      required: [true, 'Commission rate is required'],
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%'],
      default: 10, // Default 10%
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    fixedAmount: {
      type: Number,
      min: [0, 'Fixed amount cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, 'Total earnings cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
affiliateCodeSchema.index({ code: 1 });
affiliateCodeSchema.index({ affiliateId: 1 });
affiliateCodeSchema.index({ isActive: 1 });

const AffiliateCode: Model<IAffiliateCode> = mongoose.model<IAffiliateCode>(
  'AffiliateCode',
  affiliateCodeSchema
);

export default AffiliateCode;

