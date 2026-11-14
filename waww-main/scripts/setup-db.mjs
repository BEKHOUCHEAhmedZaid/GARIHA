/**
 * Database Initialization and Seed CLI Script
 * 
 * Usage:
 *   node scripts/setup-db.mjs
 * 
 * Reads DATABASE_URL from .env or process.env.
 */
import { config } from "dotenv";
config();

import pg from "pg";
const { Pool } = pg;
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL is not set.");
  console.error("Please define DATABASE_URL in your .env file or environment.");
  process.exit(1);
}

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function main() {
  console.log("🚀 Initializing PostgreSQL Database Schema for GARIHA...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id VARCHAR(255) UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      hashed_password VARCHAR(255),
      avatar TEXT,
      phone VARCHAR(100),
      plate_number VARCHAR(100),
      role VARCHAR(50) DEFAULT 'owner',
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parkings (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parking_name VARCHAR(255) NOT NULL,
      location TEXT NOT NULL,
      total_places INTEGER DEFAULT 0,
      available_places INTEGER DEFAULT 0,
      pricing TEXT,
      opening_hours TEXT,
      description TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parking_spots (
      id SERIAL PRIMARY KEY,
      parking_id INTEGER REFERENCES parkings(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      level VARCHAR(100) DEFAULT 'Ground',
      status VARCHAR(50) DEFAULT 'LIBRE',
      price INTEGER DEFAULT 250
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      parking_spot_id INTEGER REFERENCES parking_spots(id) ON DELETE CASCADE,
      driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      driver_name VARCHAR(255) NOT NULL,
      plate_number VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'System Alert',
      priority VARCHAR(50) DEFAULT 'Normal',
      is_read INTEGER DEFAULT 0,
      scheduled_for TIMESTAMPTZ,
      is_sent INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      details TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_parkings_owner ON parkings(owner_id);
    CREATE INDEX IF NOT EXISTS idx_parking_spots_parking ON parking_spots(parking_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_spot ON reservations(parking_spot_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_driver ON reservations(driver_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
  `);

  console.log("✅ Schema tables and indexes created successfully.");

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "").split(",")[0]?.trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (adminEmail && adminPassword) {
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [adminEmail]
    );

    if (existing.rows.length === 0) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO users (full_name, email, hashed_password, role, status)
         VALUES ($1, $2, $3, 'admin', 'approved')`,
        ["Super Administrator", adminEmail, hashed]
      );
      console.log(`✅ Initial Administrator account created for ${adminEmail}`);
    } else {
      await pool.query(
        "UPDATE users SET role = 'admin', status = 'approved', updated_at = NOW() WHERE id = $1",
        [existing.rows[0].id]
      );
      console.log(`✅ Administrator role verified for ${adminEmail}`);
    }
  } else {
    console.log("ℹ️ Note: ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD not provided; skipping initial admin creation.");
  }

  await pool.end();
  console.log("🎉 Database setup complete!");
}

main().catch((err) => {
  console.error("❌ Database setup error:", err);
  process.exit(1);
});
