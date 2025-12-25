import mongoose, { Document, Schema, Model } from 'mongoose';

export type EmailType =
  | 'deposit_confirmation'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'dates_selected'
  | 'date_reminder'
  | 'calendar_expiring'
  | 'password_reset'
  | 'email_verification';

export type EmailStatus = 'sent' | 'failed' | 'pending';

export interface IEmailLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  emailType: EmailType;
  recipient: string;
  subject: string;
  status: EmailStatus;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    emailType: {
      type: String,
      enum: [
        'deposit_confirmation',
        'booking_confirmed',
        'booking_rejected',
        'dates_selected',
        'date_reminder',
        'calendar_expiring',
        'password_reset',
        'email_verification',
      ],
      required: [true, 'Email type is required'],
    },
    recipient: {
      type: String,
      required: [true, 'Recipient email is required'],
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailLogSchema.index({ userId: 1 });
emailLogSchema.index({ emailType: 1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ createdAt: -1 });

const EmailLog: Model<IEmailLog> = mongoose.model<IEmailLog>('EmailLog', emailLogSchema);

export default EmailLog;

