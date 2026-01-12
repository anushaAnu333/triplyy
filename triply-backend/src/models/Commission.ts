import mongoose, { Document, Schema, Model } from 'mongoose';

export type CommissionStatus = 'pending' | 'approved' | 'paid';

export interface ICommission extends Document {
  _id: mongoose.Types.ObjectId;
  affiliateId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  affiliateCode: string;
  bookingAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: CommissionStatus;
  paidAt?: Date;
  paymentReference?: string;
  metadata?: {
    type?: string; // 'referral' or 'affiliate'
    referredUserId?: string; // For referral commissions
  };
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Affiliate ID is required'],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    affiliateCode: {
      type: String,
      required: [true, 'Affiliate code is required'],
    },
    bookingAmount: {
      type: Number,
      required: [true, 'Booking amount is required'],
      min: [0, 'Booking amount cannot be negative'],
    },
    commissionAmount: {
      type: Number,
      required: [true, 'Commission amount is required'],
      min: [0, 'Commission amount cannot be negative'],
    },
    commissionRate: {
      type: Number,
      required: [true, 'Commission rate is required'],
      min: [0, 'Commission rate cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
    paymentReference: {
      type: String,
    },
    metadata: {
      type: {
        type: String,
        enum: ['referral', 'affiliate'],
      },
      referredUserId: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commissionSchema.index({ affiliateId: 1 });
commissionSchema.index({ bookingId: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ createdAt: -1 });

const Commission: Model<ICommission> = mongoose.model<ICommission>(
  'Commission',
  commissionSchema
);

export default Commission;

