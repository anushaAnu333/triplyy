import mongoose from 'mongoose';
import env from './environment';
import logger from '../utils/logger';

/**
 * Establishes connection to MongoDB database
 * Uses Mongoose ODM for MongoDB operations
 */
const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDatabase;

