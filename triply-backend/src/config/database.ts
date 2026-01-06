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
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      logger.error('MongoDB connection refused. Please check:');
      logger.error('1. MongoDB Atlas cluster is running');
      logger.error('2. Your IP address is whitelisted in MongoDB Atlas');
      logger.error('3. Network connection is available');
      logger.error('4. MONGODB_URI in .env file is correct');
    }
    
    process.exit(1);
  }
};

export default connectDatabase;

