-- AppForge Database Initialization
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS appforge;
CREATE SCHEMA IF NOT EXISTS audit;

-- Users table
CREATE TABLE IF NOT EXISTS appforge.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS appforge.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES appforge.users(id) ON DELETE CASCADE,
    visibility VARCHAR(20) DEFAULT 'private',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS appforge.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES appforge.users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit.logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES appforge.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON appforge.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON appforge.users(username);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON appforge.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON appforge.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON appforge.sessions(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit.logs(created_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_projects_search ON appforge.projects USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON appforge.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON appforge.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO appforge.users (email, username, password_hash, full_name, role, email_verified)
VALUES (
    'admin@appforge.local',
    'admin',
    '$2b$10$K8jZY5xJ5zJ5zJ5zJ5zJ5OQ5xJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ', -- bcrypt hash
    'System Administrator',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA appforge TO appforge;
GRANT ALL PRIVILEGES ON SCHEMA audit TO appforge;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA appforge TO appforge;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO appforge;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA appforge TO appforge;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO appforge;
