import mongoose, { Document, Schema, Model } from 'mongoose';
import { generateBookingReference } from '../utils/generateReference';

export type BookingStatus = 
  | 'pending_deposit'
  | 'deposit_paid'
  | 'dates_selected'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

interface DepositPayment {
  amount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  paymentStatus: PaymentStatus;
}

interface TravelDates {
  startDate?: Date;
  endDate?: Date;
  isFlexible: boolean;
}

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  destinationId: mongoose.Types.ObjectId;
  bookingReference: string;
  status: BookingStatus;
  depositPayment: DepositPayment;
  travelDates: TravelDates;
  numberOfTravellers: number;
  specialRequests?: string;
  affiliateCode?: string;
  affiliateId?: mongoose.Types.ObjectId;
  adminNotes?: string;
  rejectionReason?: string;
  calendarUnlockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const depositPaymentSchema = new Schema<DepositPayment>(
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

const travelDatesSchema = new Schema<TravelDates>(
  {
    startDate: { type: Date },
    endDate: { type: Date },
    isFlexible: { type: Boolean, default: false },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    destinationId: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      required: [true, 'Destination ID is required'],
    },
    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending_deposit',
        'deposit_paid',
        'dates_selected',
        'confirmed',
        'rejected',
        'cancelled',
      ],
      default: 'pending_deposit',
    },
    depositPayment: {
      type: depositPaymentSchema,
      required: true,
    },
    travelDates: {
      type: travelDatesSchema,
      default: { isFlexible: false },
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
    affiliateCode: {
      type: String,
    },
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Indexes
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ destinationId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ affiliateCode: 1 });
bookingSchema.index({ createdAt: -1 });

// Generate booking reference before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    this.bookingReference = generateBookingReference();
  }
  next();
});

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

