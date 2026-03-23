import mongoose, { Document, Schema, Model } from 'mongoose';
import { generatePackageBookingReference } from '../utils/generateReference';

export type PackageBookingStatus =
  | 'pending_deposit'
  | 'pending_date'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PackageDepositPayment {
  amount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  paymentStatus: PaymentStatus;
}

export interface PackageTravelDates {
  startDate?: Date;
  endDate?: Date;
}

export interface IPackageBooking extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  bookingReference: string;
  status: PackageBookingStatus;
  depositPayment: PackageDepositPayment;
  travelDates: PackageTravelDates;
  numberOfTravellers: number;
  specialRequests?: string;
  adminNotes?: string;
  rejectionReason?: string;
  calendarUnlockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const depositPaymentSchema = new Schema<PackageDepositPayment>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'AED' },
    paymentMethod: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  { _id: false }
);

const travelDatesSchema = new Schema<PackageTravelDates>(
  {
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: false }
);

const packageBookingSchema = new Schema<IPackageBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package ID is required'],
    },
    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_deposit', 'pending_date', 'confirmed', 'rejected', 'cancelled'],
      default: 'pending_deposit',
    },
    depositPayment: {
      type: depositPaymentSchema,
      required: true,
    },
    travelDates: {
      type: travelDatesSchema,
      default: {},
    },
    numberOfTravellers: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 traveller is required'],
    },
    specialRequests: {
      type: String,
      maxlength: [1000, 'Special requests cannot exceed 1000 characters'],
    },
    adminNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    calendarUnlockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

packageBookingSchema.index({ userId: 1 });
packageBookingSchema.index({ packageId: 1 });
packageBookingSchema.index({ status: 1 });
packageBookingSchema.index({ bookingReference: 1 });

packageBookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    this.bookingReference = generatePackageBookingReference();
  }
  next();
});

const PackageBooking: Model<IPackageBooking> = mongoose.model<IPackageBooking>(
  'PackageBooking',
  packageBookingSchema
);

export default PackageBooking;
