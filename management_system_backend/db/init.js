const pool = require("./index");

const initQueries = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  `CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    output_level VARCHAR(20) DEFAULT 'medium' CHECK (output_level IN ('low', 'medium', 'high')),
    quality_level VARCHAR(20) DEFAULT 'medium' CHECK (quality_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `ALTER TABLE team_members ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,

  `CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    lead_developer_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    quality VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (quality IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'active', 'on_hold', 'completed', 'delayed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    details TEXT,
    complexity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (complexity IN ('low', 'medium', 'high')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_time TIMESTAMPTZ,
    estimated_hours DECIMAL(10, 2) NOT NULL,
    deadline TIMESTAMPTZ,
    actual_hours DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'paused', 'on_hold', 'completed', 'cancelled')),
    paused_at TIMESTAMPTZ,
    total_paused_hours DECIMAL(10, 2) DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_lead ON projects(lead_developer_id)`,
];

async function initDatabase() {
  const client = await pool.connect();

  try {
    for (const query of initQueries) {
      await client.query(query);
    }
    console.log("Database tables verified / created successfully");
  } finally {
    client.release();
  }
}

module.exports = initDatabase;
