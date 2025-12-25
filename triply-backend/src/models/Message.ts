import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  attachments: string[];
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient message queries
messageSchema.index({ bookingId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ isRead: 1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);

export default Message;

