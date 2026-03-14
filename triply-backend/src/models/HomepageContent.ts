import mongoose, { Document, Schema } from 'mongoose';

export interface IGalleryImage {
  src: string;
  alt: string;
  location: string;
}

export interface IHomepageContent extends Document {
  heroImageUrl?: string;
  galleryImages: IGalleryImage[];
  updatedAt: Date;
  createdAt: Date;
}

const galleryImageSchema = new Schema(
  {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    location: { type: String, default: '' },
  },
  { _id: false }
);

const homepageContentSchema = new Schema(
  {
    heroImageUrl: { type: String, default: '' },
    galleryImages: {
      type: [galleryImageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Single document collection; use a fixed id or findOne
homepageContentSchema.index({ _id: 1 });

export default mongoose.model<IHomepageContent>('HomepageContent', homepageContentSchema);
