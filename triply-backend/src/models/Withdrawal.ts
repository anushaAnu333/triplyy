import mongoose, { Document, Schema, Model } from 'mongoose';

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';

export interface IWithdrawal extends Document {
  _id: mongoose.Types.ObjectId;
  affiliateId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'other';
  paymentDetails: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    iban?: string;
    swiftCode?: string;
    paypalEmail?: string;
    stripeAccountId?: string;
    otherDetails?: string;
  };
  commissionIds: mongoose.Types.ObjectId[]; // Commissions included in this withdrawal
  adminNotes?: string;
  rejectionReason?: string;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId; // Admin who processed it
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Affiliate ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Withdrawal amount is required'],
      min: [0, 'Withdrawal amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'AED',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'other'],
      required: [true, 'Payment method is required'],
    },
    paymentDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      iban: String,
      swiftCode: String,
      paypalEmail: String,
      stripeAccountId: String,
      otherDetails: String,
    },
    commissionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Commission',
    }],
    adminNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
withdrawalSchema.index({ affiliateId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });

const Withdrawal: Model<IWithdrawal> = mongoose.model<IWithdrawal>(
  'Withdrawal',
  withdrawalSchema
);

export default Withdrawal;

