import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: 'admin' | 'affiliate';
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['admin', 'affiliate'],
      required: [true, 'Role is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Invited by is required'],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
invitationSchema.index({ email: 1 });
// Note: token index is automatically created by unique: true constraint
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Check if invitation is expired
invitationSchema.methods.isExpired = function (): boolean {
  return this.expiresAt < new Date();
};

const Invitation: Model<IInvitation> = mongoose.model<IInvitation>(
  'Invitation',
  invitationSchema
);

export default Invitation;


