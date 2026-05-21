/**
 * Nexus AI — MongoDB Connection Setup
 * 
 * Production-grade Mongoose connection controller with detailed logging
 * and graceful exit handlers upon database startup failure.
 */

import mongoose from 'mongoose';

/**
 * Connects to the target MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern connection options defaults (Mongoose v6+ handles these automatically,
      // but keeping them explicit for compatibility and robustness)
      autoIndex: true,
    });

    console.log(`\x1b[36m%s\x1b[0m`, `[Neural Sync] MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `[Critical Error] MongoDB Connection Failed: ${error.message}`);
    // Exit server process with failure code
    process.exit(1);
  }
};

export default connectDB;
