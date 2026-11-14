import { Pool, QueryResult, QueryResultRow } from "pg";

let pool: Pool | null = null;
let tablesInitialized = false;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Please define the DATABASE_URL environment variable in your Vercel project or local .env file."
      );
    }

    const isLocal =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1");

    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 7000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await ensureTables();
  const p = getPool();
  return p.query<T>(text, params);
}

export async function ensureTables(): Promise<void> {
  if (tablesInitialized) return;
  const p = getPool();

  await p.query(`
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

  tablesInitialized = true;
}
