import { Database } from "bun:sqlite";

export function initSchema(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL, phone TEXT, avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'agent', territory_id TEXT, manager_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1, daily_target INTEGER DEFAULT 5,
      monthly_target INTEGER DEFAULT 100, refresh_token TEXT,
      last_login_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS territories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT, description TEXT,
      color TEXT, boundary_json TEXT, center_lat REAL, center_lng REAL,
      zoom_level INTEGER, created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, company_name TEXT NOT NULL, contact_name TEXT,
      contact_title TEXT, phone TEXT, email TEXT, alternative_phone TEXT,
      address TEXT, city TEXT, province TEXT, postal_code TEXT,
      latitude REAL, longitude REAL, status TEXT DEFAULT 'new',
      source TEXT, qualification TEXT DEFAULT 'cold', segment TEXT,
      industry TEXT, website TEXT, notes TEXT, tags TEXT,
      custom_fields TEXT, assigned_to TEXT, territory_id TEXT,
      created_by TEXT, converted_deal_id TEXT, last_contacted_at INTEGER,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, user_id TEXT NOT NULL,
      title TEXT, description TEXT, visit_type TEXT,
      status TEXT NOT NULL DEFAULT 'planned', scheduled_date TEXT,
      scheduled_start_time TEXT, scheduled_end_time TEXT,
      checkin_time INTEGER, checkout_time INTEGER,
      checkin_lat REAL, checkin_lng REAL, checkout_lat REAL, checkout_lng REAL,
      checkin_distance_meters REAL, meeting_notes TEXT, next_steps TEXT,
      deal_id TEXT, route_stop_id TEXT, duration_minutes INTEGER,
      is_offline_sync INTEGER DEFAULT 0, sync_confirmed_at INTEGER,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, "order" INTEGER NOT NULL,
      color TEXT, emoji TEXT, is_default INTEGER DEFAULT 1,
      is_won INTEGER DEFAULT 0, is_lost INTEGER DEFAULT 0,
      probability INTEGER DEFAULT 20, created_by TEXT, created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, lead_id TEXT, stage_id TEXT,
      user_id TEXT, value INTEGER DEFAULT 0, currency TEXT DEFAULT 'IDR',
      probability INTEGER, expected_close_date TEXT, actual_close_date TEXT,
      notes TEXT, products TEXT, lost_reason TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY, lead_id TEXT, visit_id TEXT, user_id TEXT,
      title TEXT NOT NULL, description TEXT, due_date TEXT NOT NULL,
      due_time TEXT, status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium',
      type TEXT DEFAULT 'task', completed_at INTEGER, completed_by TEXT,
      reminder_sent_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      date TEXT, status TEXT DEFAULT 'planned', total_distance_km REAL,
      estimated_duration_minutes INTEGER, actual_duration_minutes INTEGER,
      start_lat REAL, start_lng REAL, end_lat REAL, end_lng REAL,
      polyline_encoded TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_stops (
      id TEXT PRIMARY KEY, route_id TEXT NOT NULL, lead_id TEXT,
      visit_id TEXT, stop_order INTEGER, estimated_arrival INTEGER,
      actual_arrival INTEGER, actual_departure INTEGER,
      distance_from_previous_km REAL, status TEXT DEFAULT 'pending',
      notes TEXT, created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
      message TEXT, type TEXT, reference_type TEXT, reference_id TEXT,
      is_read INTEGER DEFAULT 0, read_at INTEGER, created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY, user_id TEXT, event_type TEXT NOT NULL,
      payload TEXT, created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pack_settings (
      id TEXT PRIMARY KEY, company_id TEXT DEFAULT 'default',
      pack_type TEXT NOT NULL, pack_id TEXT NOT NULL,
      enabled INTEGER DEFAULT 0, config_json TEXT,
      activated_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
  `);
}
