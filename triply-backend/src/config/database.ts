import mongoose from 'mongoose';
import env from './environment';
import logger from '../utils/logger';
import { MerchantOnboarding } from '../models';

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
      retryWrites: true,
      retryReads: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Ensure onboarding uniqueness rules match our resubmission behavior.
    // If an older unique index exists on `userId`, it will prevent creating the new `reapplied`
    // document (and will surface as a Mongo duplicate-key error).
    const syncMerchantOnboardingIndexes = async (): Promise<void> => {
      if (env.NODE_ENV === 'production') return;

      try {
        const indexes = await MerchantOnboarding.collection.indexes();
        const uniqueUserIdIndexes = indexes.filter(
          (i) => i.unique === true && i.key && Object.prototype.hasOwnProperty.call(i.key, 'userId')
        );

        for (const idx of uniqueUserIdIndexes) {
          if (!idx.name) {
            logger.warn('Skipping legacy unique index without a name');
            continue;
          }
          logger.warn(`Dropping legacy unique index on MerchantOnboarding.userId: ${idx.name}`);
          await MerchantOnboarding.collection.dropIndex(idx.name);
        }

        // Recreate desired partial unique index (only pending/reapplied are unique per user).
        await MerchantOnboarding.collection.createIndex(
          { userId: 1 },
          {
            unique: true,
            partialFilterExpression: { status: { $in: ['pending', 'reapplied'] } },
          }
        );
      } catch (error: any) {
        logger.warn(`Failed to sync MerchantOnboarding indexes: ${error?.message || String(error)}`);
      }
    };

    await syncMerchantOnboardingIndexes();

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
      
      // Handle specific error types
      if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        logger.error('DNS resolution failed. Possible causes:');
        logger.error('1. Network connectivity issue');
        logger.error('2. MongoDB Atlas cluster may be paused or deleted');
        logger.error('3. DNS server issues');
        logger.error('4. Firewall blocking DNS queries');
      } else if (err.message.includes('ECONNREFUSED')) {
        logger.error('Connection refused. Check:');
        logger.error('1. MongoDB Atlas cluster is running');
        logger.error('2. Your IP address is whitelisted');
        logger.error('3. Connection string is correct');
      }
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    // Handle connection close
    mongoose.connection.on('close', () => {
      logger.warn('MongoDB connection closed');
    });

  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);

    // Provide helpful error messages based on error type
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      logger.error('DNS Resolution Failed - Cannot resolve MongoDB hostname');
      logger.error('1. Check your internet connection');
      logger.error('2. Verify MongoDB Atlas cluster is active (not paused)');
      logger.error('3. Check MONGODB_URI in .env (host, port, database name)');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      logger.error('MongoDB connection refused. Please check:');
      logger.error('1. MongoDB is running (local: run `mongod` or start MongoDB service)');
      logger.error('2. If using Atlas: cluster is running and your IP is whitelisted');
      logger.error('3. MONGODB_URI in .env is correct (e.g. mongodb://localhost:27017/yourdb)');
    } else if (error.message.includes('authentication failed')) {
      logger.error('Authentication failed. Check username/password in MONGODB_URI');
    } else {
      logger.error('MongoDB connection error. Check MONGODB_URI and that MongoDB is running.');
    }

    // Always rethrow so the server does not start without a DB (avoids buffering timeouts)
    throw error;
  }
};

export default connectDatabase;

