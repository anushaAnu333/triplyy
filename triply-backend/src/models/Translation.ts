import mongoose, { Document, Schema, Model } from 'mongoose';

interface TranslationContent {
  en: string;
  ar?: string;
  [key: string]: string | undefined;
}

export interface ITranslation extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  translations: TranslationContent;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const translationSchema = new Schema<ITranslation>(
  {
    key: {
      type: String,
      required: [true, 'Translation key is required'],
      unique: true,
      trim: true,
    },
    translations: {
      type: Schema.Types.Mixed,
      required: [true, 'Translations are required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
translationSchema.index({ key: 1 });
translationSchema.index({ category: 1 });

const Translation: Model<ITranslation> = mongoose.model<ITranslation>(
  'Translation',
  translationSchema
);

export default Translation;

