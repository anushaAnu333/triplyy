import mongoose, { Document, Schema, Model } from 'mongoose';
import { hashPassword } from '../utils/password';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'affiliate' | 'merchant';
  isEmailVerified: boolean;
  profileImage?: string;
  lastLogin?: Date;
  referredBy?: mongoose.Types.ObjectId; // User who referred this user
  referralCode?: string; // Referral code used during signup
  discountAmount?: number; // Discount received from referral
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'affiliate', 'merchant'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referralCode: {
      type: String,
    },
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Note: email index is automatically created by unique: true

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;

