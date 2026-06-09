import app from '../src/app.js';
import { initializeDatabase } from '../src/config/db.js';

// Ensure the database tables are auto-initialized in the serverless environment
initializeDatabase().catch(err => {
  console.error("Database initialization failed:", err);
});

export default app;
