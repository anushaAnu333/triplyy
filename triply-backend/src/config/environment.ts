import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_EXPIRE: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PAYMENT_SUCCESS_URL: string;
  PAYMENT_CANCEL_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  FRONTEND_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  DEFAULT_DEPOSIT_AMOUNT: number;
  DEFAULT_CURRENCY: string;
  CALENDAR_UNLOCK_DURATION_DAYS: number;
}

const env: Environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_VERSION: process.env.API_VERSION || 'v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/triply',
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_change_this',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_this',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@triply.com',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  PAYMENT_SUCCESS_URL: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/booking/success',
  PAYMENT_CANCEL_URL: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/booking/cancel',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  DEFAULT_DEPOSIT_AMOUNT: parseInt(process.env.DEFAULT_DEPOSIT_AMOUNT || '199', 10),
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || 'AED',
  CALENDAR_UNLOCK_DURATION_DAYS: parseInt(process.env.CALENDAR_UNLOCK_DURATION_DAYS || '365', 10),
};

export default env;

