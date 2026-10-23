const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medichain';

  try {
    // Configure conservative timeout so app starts without hanging if Mongo is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });
    isConnected = true;
    connectionError = null;
    console.log(`[Database] MongoDB successfully connected to: ${uri}`);
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[Database] MongoDB connection unavailable at ${uri}: ${err.message}`);
    console.warn(`[Database] Operating in degraded mode with in-memory metadata storage.`);
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB connection lost.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    connectionError = null;
    console.log('[Database] MongoDB connection restored.');
  });
}

function getDatabaseStatus() {
  return {
    connected: isConnected,
    state: isConnected ? 'connected' : 'disconnected_fallback_active',
    error: connectionError,
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medichain'
  };
}

module.exports = {
  connectDB,
  getDatabaseStatus,
};
