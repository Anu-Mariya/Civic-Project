const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongod = null;

const connectDB = async () => {
  const dbName = 'civic_complaints';
  const localDefaultUri = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${dbName}`;

  try {
    // 1. First attempt connecting to local native MongoDB service if installed
    await mongoose.connect(localDefaultUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`=======================================================`);
    console.log(`[Database] Connected successfully to native MongoDB!`);
    console.log(`[Database] Database Name: ${dbName}`);
    console.log(`[Database] URI: ${localDefaultUri}`);
    console.log(`=======================================================`);
  } catch (error) {
    console.warn(`[Database] Native MongoDB service not detected on port 27017 (${error.message}).`);
    
    if (process.env.USE_MEMORY_DB_IF_LOCAL_FAILS !== 'false') {
      try {
        console.log(`[Database] Starting persistent embedded MongoDB on port 27017...`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        
        // Ensure local persistent data directory exists so registered users persist across restarts
        const dataDir = path.join(__dirname, '../../data/db');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        // Try binding to port 27017 so MongoDB Compass connects effortlessly without config!
        try {
          mongod = await MongoMemoryServer.create({
            instance: {
              port: 27017,
              dbName: dbName,
              dbPath: dataDir,
              storageEngine: 'wiredTiger',
            },
          });
        } catch (portErr) {
          // If port 27017 happens to be busy, let MongoMemoryServer pick an available port
          console.warn(`[Database] Port 27017 was busy, using dynamic port fallback.`);
          mongod = await MongoMemoryServer.create({
            instance: {
              dbName: dbName,
              dbPath: dataDir,
              storageEngine: 'wiredTiger',
            },
          });
        }
        
        const baseUri = mongod.getUri();
        // Ensure URI includes /civic_complaints
        const finalUri = baseUri.endsWith('/') ? `${baseUri}${dbName}` : `${baseUri}/${dbName}`;
        
        await mongoose.connect(finalUri);

        console.log(`=======================================================`);
        console.log(`[Database] Connected to Embedded MongoDB successfully!`);
        console.log(`[Database] Database Name: ${dbName}`);
        console.log(`[Database] MongoDB Compass URI: ${finalUri}`);
        console.log(`[Database] Open MongoDB Compass & paste: ${finalUri}`);
        console.log(`[Database] Registered Users Collection: ${dbName} > users`);
        console.log(`=======================================================`);
      } catch (memError) {
        console.error('[Database] Failed to start MongoMemoryServer:', memError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, closeDB };
