const { MongoClient } = require('mongodb');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

let client = null;
let cachedConnections = {};

/**
 * Connect to MongoDB with automatic retry logic
 * @param {string} uri - MongoDB connection URI
 * @param {string} dbName - Database name
 * @returns {Promise<Object>} - Database instance
 */
async function connectDB(uri, dbName) {
  if (cachedConnections[dbName]) {
    return cachedConnections[dbName];
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (!client || (client.topology && client.topology.isDestroyed())) {
        if (client) await client.close().catch(() => {});

        client = new MongoClient(uri, {
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 1,
          maxIdleTimeMS: 30000,
          retryWrites: true,
          retryReads: true,
          family: 4
        });

        await client.connect();
        logger.info(`✅ MongoDB Connected Successfully on attempt ${attempt}`);
      }

      const db = client.db(dbName);
      cachedConnections[dbName] = db;
      return db;
    } catch (error) {
      logger.error(`MongoDB Connection Attempt ${attempt}/${MAX_RETRIES} Failed:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(res => setTimeout(res, RETRY_DELAY * attempt));
      } else {
        throw new Error(`❌ Database connection failed after ${MAX_RETRIES} attempts`);
      }
    }
  }
}

/**
 * Close database connection
 */
async function closeDB() {
  if (client) {
    await client.close();
    cachedConnections = {};
    logger.info('Database connection closed');
  }
}

/**
 * Get collection with validation
 * @param {Object} db - Database instance
 * @param {string} collectionName - Collection name
 * @returns {Promise<Object>} - Collection instance
 */
async function getCollection(db, collectionName) {
  try {
    const collections = await db.listCollections().toArray();
    const exists = collections.some(col => col.name === collectionName);
    
    if (!exists) {
      await db.createCollection(collectionName);
      logger.info(`Created collection: ${collectionName}`);
    }
    
    return db.collection(collectionName);
  } catch (error) {
    logger.error(`Error getting collection ${collectionName}:`, error.message);
    throw error;
  }
}

module.exports = {
  connectDB,
  closeDB,
  getCollection
};
