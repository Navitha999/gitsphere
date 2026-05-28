import dotenv from 'dotenv';
import app from './app.js';
import { initializeDatabase } from './config/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * Starts the application server.
 * Ensures the database schema is fully verified and constructed first.
 */
const startServer = async () => {
  try {
    // 1. Core verification & setup of database schemas
    await initializeDatabase();

    // 2. Start HTTP server
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 GitHub Profile Analyzer API is running!`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('CRITICAL: Server failed to start due to database initialization failure.');
    console.error(error.message);
    process.exit(1);
  }
};

// Gracefully handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION] at:', promise, 'reason:', reason);
});

// Gracefully handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION] encountered:', error.message);
  console.error(error.stack);
  process.exit(1);
});

startServer();
