import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

try {
  // If a full DATABASE_URL is provided, we can parse it
  if (process.env.DATABASE_URL) {
    console.log('Connecting to database using DATABASE_URL...');
    pool = mysql.createPool(process.env.DATABASE_URL);
  } else {
    console.log('Connecting to database using individual DB variables...');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'github_analyzer',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
} catch (error) {
  console.error('Error creating MySQL connection pool:', error.message);
  process.exit(1);
}

/**
 * Initializes the database by creating tables if they do not exist
 */
export const initializeDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('Successfully connected to the database. Checking/Creating tables...');

    // 1. Create github_profiles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS github_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        github_id INT UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        bio TEXT,
        followers INT DEFAULT 0,
        following_count INT DEFAULT 0,
        public_repos INT DEFAULT 0,
        public_gists INT DEFAULT 0,
        account_created_at DATETIME NOT NULL,
        account_age_days INT DEFAULT 0,
        follower_to_following_ratio DECIMAL(10,2) DEFAULT 0.00,
        popularity_score DECIMAL(10,2) DEFAULT 0.00,
        developer_tier VARCHAR(10) DEFAULT 'Tier C',
        total_stars INT DEFAULT 0,
        total_forks INT DEFAULT 0,
        most_used_language VARCHAR(100) DEFAULT 'Unknown',
        activity_score DECIMAL(10,2) DEFAULT 0.00,
        avatar_url VARCHAR(500),
        profile_url VARCHAR(500),
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Table "github_profiles" verified/created.');

    // 2. Create repositories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        github_profile_id INT NOT NULL,
        repo_name VARCHAR(255) NOT NULL,
        stars INT DEFAULT 0,
        forks INT DEFAULT 0,
        language VARCHAR(100) DEFAULT 'Unknown',
        repo_url VARCHAR(500),
        CONSTRAINT fk_github_profile
          FOREIGN KEY (github_profile_id) 
          REFERENCES github_profiles(id) 
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Table "repositories" verified/created.');

  } catch (error) {
    console.error('Error initializing tables:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;
