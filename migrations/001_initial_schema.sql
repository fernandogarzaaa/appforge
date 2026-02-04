-- AppForge PostgreSQL Schema - Phase 1-5 Implementation
-- Created: 2026-02-04

-- ==================== USERS & AUTHENTICATION ====================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  profile JSONB DEFAULT '{}',
  subscription_level VARCHAR(50) DEFAULT 'free',
  usage_quota JSONB DEFAULT '{"monthly_requests": 1000, "storage_gb": 5}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ==================== CODE TEMPLATES ====================

CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  price DECIMAL(10,2) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 0,
  downloads INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_language ON templates(language);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);

-- ==================== SECURITY & CODE ANALYSIS ====================

CREATE TABLE IF NOT EXISTS security_scans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_snippet TEXT NOT NULL,
  language VARCHAR(50),
  vulnerabilities JSONB DEFAULT '[]',
  severity VARCHAR(20),
  scan_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  scan_duration_ms INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_scans_user_id ON security_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_severity ON security_scans(severity);
CREATE INDEX IF NOT EXISTS idx_security_scans_created_at ON security_scans(created_at);

-- ==================== AI REQUEST TRACKING ====================

CREATE TABLE IF NOT EXISTS ai_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id VARCHAR(100) UNIQUE NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  language VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  result TEXT,
  error TEXT,
  tokens_used INT,
  processing_time_ms INT,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_request_id ON ai_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_type ON ai_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_requests_status ON ai_requests(status);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at);

-- ==================== METRICS & ANALYTICS ====================

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(255) NOT NULL,
  metric_value FLOAT NOT NULL,
  metric_unit VARCHAR(50),
  service VARCHAR(100),
  tags JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_service ON metrics(service);

-- ==================== ALERTS & MONITORING ====================

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type VARCHAR(100),
  condition TEXT NOT NULL,
  threshold FLOAT,
  comparison_operator VARCHAR(10),
  enabled BOOLEAN DEFAULT true,
  notifications JSONB DEFAULT '[]',
  last_triggered TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON alerts(alert_type);

-- ==================== COLLABORATION ====================

CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  project_id INT,
  project_name VARCHAR(255),
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participants JSONB DEFAULT '[]',
  code_content TEXT,
  language VARCHAR(50),
  recording JSONB DEFAULT '{}',
  chat_messages JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  max_participants INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collaboration_owner_id ON collaboration_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_session_id ON collaboration_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_status ON collaboration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_created_at ON collaboration_sessions(created_at);

-- ==================== USAGE LOGS ====================

CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INT,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- ==================== NOTIFICATIONS ====================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ==================== AUDIT LOG ====================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT,
  action VARCHAR(50) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==================== VIEWS ====================

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.email,
  COUNT(DISTINCT ar.id) as total_ai_requests,
  COUNT(DISTINCT ss.id) as total_security_scans,
  COUNT(DISTINCT t.id) as total_templates,
  MAX(ar.created_at) as last_ai_request,
  MAX(u.last_login) as last_login_date
FROM users u
LEFT JOIN ai_requests ar ON u.id = ar.user_id
LEFT JOIN security_scans ss ON u.id = ss.user_id
LEFT JOIN templates t ON u.id = t.user_id
GROUP BY u.id, u.email;

-- Template popularity
CREATE OR REPLACE VIEW template_popularity AS
SELECT 
  id,
  user_id,
  title,
  language,
  downloads,
  views,
  rating,
  CASE 
    WHEN downloads > 100 THEN 'viral'
    WHEN downloads > 50 THEN 'popular'
    WHEN downloads > 10 THEN 'trending'
    ELSE 'new'
  END as popularity_tier,
  created_at
FROM templates
WHERE is_public = true
ORDER BY downloads DESC;

-- ==================== FUNCTIONS ====================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for templates table
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ai_requests table
CREATE TRIGGER update_ai_requests_updated_at
BEFORE UPDATE ON ai_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==================== PERMISSIONS ====================

-- Create read-only role for analytics
CREATE ROLE appforge_reader;
GRANT USAGE ON SCHEMA public TO appforge_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO appforge_reader;

-- Create application role
CREATE ROLE appforge_app;
GRANT USAGE ON SCHEMA public TO appforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO appforge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO appforge_app;
