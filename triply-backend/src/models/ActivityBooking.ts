import mongoose, { Document, Schema, Model } from 'mongoose';
import { generateBookingReference } from '../utils/generateReference';

export type ActivityBookingStatus = 
  | 'pending_payment'
  | 'payment_completed'
  | 'confirmed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

interface ActivityPayment {
  amount: number; // Total amount paid by customer
  currency: string;
  triplyCommission: number; // 20% commission (amount * 0.2)
  merchantAmount: number; // 80% to merchant (amount * 0.8)
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  paymentStatus: PaymentStatus;
  merchantPayoutStatus: 'pending' | 'paid' | 'failed'; // Track if merchant has been paid
  merchantPayoutDate?: Date;
  merchantPayoutTransactionId?: string;
}

export interface IActivityBooking extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  availabilityId: mongoose.Types.ObjectId; // Reference to specific date/slot
  bookingReference: string;
  status: ActivityBookingStatus;
  payment: ActivityPayment;
  selectedDate: Date;
  numberOfParticipants: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
  linkedDestinationBookingId?: mongoose.Types.ObjectId; // Link to destination booking if added as add-on
  isAddOn?: boolean; // True if this activity was added to a destination booking
  createdAt: Date;
  updatedAt: Date;
}

const activityPaymentSchema = new Schema<ActivityPayment>(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AED' },
    triplyCommission: { type: Number, required: true, min: 0 },
    merchantAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    merchantPayoutStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    merchantPayoutDate: { type: Date },
    merchantPayoutTransactionId: { type: String },
  },
  { _id: false }
);

const activityBookingSchema = new Schema<IActivityBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },
    availabilityId: {
      type: Schema.Types.ObjectId,
      ref: 'ActivityAvailability',
      required: [true, 'Availability ID is required'],
    },
    bookingReference: {
      type: String,
      unique: true,
      // Not required in schema - will be generated in pre-save hook
    },
    status: {
      type: String,
      enum: ['pending_payment', 'payment_completed', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending_payment',
    },
    payment: {
      type: activityPaymentSchema,
      required: true,
    },
    selectedDate: {
      type: Date,
      required: [true, 'Selected date is required'],
    },
    numberOfParticipants: {
      type: Number,
      required: [true, 'Number of participants is required'],
      min: [1, 'At least 1 participant is required'],
      default: 1,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    specialRequests: {
      type: String,
      maxlength: [1000, 'Special requests cannot exceed 1000 characters'],
    },
    linkedDestinationBookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    isAddOn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activityBookingSchema.index({ userId: 1 });
activityBookingSchema.index({ activityId: 1 });
activityBookingSchema.index({ availabilityId: 1 });
activityBookingSchema.index({ status: 1 });
activityBookingSchema.index({ bookingReference: 1 });
activityBookingSchema.index({ 'payment.merchantPayoutStatus': 1 });
activityBookingSchema.index({ linkedDestinationBookingId: 1 });
activityBookingSchema.index({ createdAt: -1 });

// Generate booking reference before saving
activityBookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    this.bookingReference = generateBookingReference();
  }
  next();
});

// Calculate commission before saving
activityBookingSchema.pre('save', function (next) {
  if (this.isModified('payment.amount') && this.payment.amount > 0 && !this.payment.triplyCommission) {
    this.payment.triplyCommission = Math.round((this.payment.amount * 0.2) * 100) / 100; // 20%
    this.payment.merchantAmount = Math.round((this.payment.amount * 0.8) * 100) / 100; // 80%
  }
  next();
});

const ActivityBooking: Model<IActivityBooking> = mongoose.model<IActivityBooking>(
  'ActivityBooking',
  activityBookingSchema
);

export default ActivityBooking;
