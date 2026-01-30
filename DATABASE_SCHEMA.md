<!-- markdownlint-disable MD013 -->
# 📊 Database Schema & Entities

**AppForge Data Model**  
**Last Updated:** January 28, 2026

---

## New Entities for Feature Support

### Marketplace Entities

#### Template
```sql
CREATE TABLE templates (
  id VARCHAR PRIMARY KEY,
  creator_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  tags JSON,
  price INT DEFAULT 0, -- in cents
  preview_image_url VARCHAR,
  source_project_id VARCHAR,
  version VARCHAR,
  downloads INT DEFAULT 0,
  rating DECIMAL(3,2),
  review_count INT DEFAULT 0,
  status ENUM('draft', 'published', 'archived'),
  commission_percentage INT DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### MarketplacePurchase
```sql
CREATE TABLE marketplace_purchases (
  id VARCHAR PRIMARY KEY,
  buyer_id VARCHAR NOT NULL,
  template_id VARCHAR NOT NULL,
  creator_id VARCHAR NOT NULL,
  amount INT NOT NULL, -- in cents
  platform_fee INT, -- 30% of amount
  creator_payout INT, -- 70% of amount
  payment_status ENUM('pending', 'completed', 'failed'),
  stripe_charge_id VARCHAR,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

#### TemplateRating
```sql
CREATE TABLE template_ratings (
  id VARCHAR PRIMARY KEY,
  template_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  rating INT NOT NULL, -- 1-5 stars
  review TEXT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### Monitoring & Analytics Entities

#### AppMetric
```sql
CREATE TABLE app_metrics (
  id VARCHAR PRIMARY KEY,
  app_id VARCHAR NOT NULL,
  metric_type ENUM('error', 'latency', 'throughput', 'memory', 'cpu'),
  value DECIMAL(10,2),
  unit VARCHAR, -- ms, %, bytes, etc.
  endpoint VARCHAR,
  status_code INT,
  tags JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (app_id, timestamp),
  INDEX (metric_type, timestamp)
);
```

#### AppError
```sql
CREATE TABLE app_errors (
  id VARCHAR PRIMARY KEY,
  app_id VARCHAR NOT NULL,
  error_fingerprint VARCHAR UNIQUE, -- hash of stack trace
  error_type VARCHAR,
  error_message TEXT,
  stack_trace TEXT,
  context JSON, -- request/response/env context
  frequency INT DEFAULT 1,
  first_occurrence TIMESTAMP,
  last_occurrence TIMESTAMP,
  status ENUM('new', 'acknowledged', 'resolved'),
  severity ENUM('low', 'medium', 'high', 'critical'),
  INDEX (app_id),
  INDEX (error_fingerprint)
);
```

#### ErrorAlert
```sql
CREATE TABLE error_alerts (
  id VARCHAR PRIMARY KEY,
  app_id VARCHAR NOT NULL,
  error_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  alert_type ENUM('email', 'slack', 'sms'),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'sent', 'failed'),
  FOREIGN KEY (error_id) REFERENCES app_errors(id)
);
```

#### PerformanceReport
```sql
CREATE TABLE performance_reports (
  id VARCHAR PRIMARY KEY,
  app_id VARCHAR NOT NULL,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  avg_latency_ms DECIMAL(10,2),
  p95_latency_ms DECIMAL(10,2),
  p99_latency_ms DECIMAL(10,2),
  error_rate DECIMAL(5,2), -- percentage
  throughput_rps DECIMAL(10,2),
  uptime_percentage DECIMAL(5,2),
  report_data JSON,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Team & Collaboration Entities

#### TeamMember
```sql
CREATE TABLE team_members (
  id VARCHAR PRIMARY KEY,
  team_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  role ENUM('owner', 'admin', 'editor', 'viewer'),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  permissions JSON, -- custom permissions
  UNIQUE KEY (team_id, user_id)
);
```

#### ProjectPermission
```sql
CREATE TABLE project_permissions (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  team_id VARCHAR,
  permission_type ENUM('view', 'edit', 'admin', 'own'),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by VARCHAR,
  UNIQUE KEY (project_id, user_id)
);
```

#### CodeReview
```sql
CREATE TABLE code_reviews (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  function_id VARCHAR,
  reviewer_id VARCHAR NOT NULL,
  status ENUM('pending', 'approved', 'changes_requested', 'rejected'),
  comments TEXT,
  suggestions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

#### ActivityLog
```sql
CREATE TABLE activity_logs (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  action VARCHAR, -- created, updated, deployed, etc.
  resource_type VARCHAR, -- project, function, page, etc.
  resource_id VARCHAR,
  changes JSON, -- before/after
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (project_id, timestamp),
  INDEX (user_id, timestamp)
);
```

#### Comment
```sql
CREATE TABLE comments (
  id VARCHAR PRIMARY KEY,
  resource_type VARCHAR, -- function, page, etc.
  resource_id VARCHAR,
  user_id VARCHAR NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  replies JSON
);
```

---

### Integration Configuration Entities

#### IntegrationConfig
```sql
CREATE TABLE integration_configs (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  integration_type ENUM('stripe', 'sendgrid', 'twilio', 'slack', 'github', 'datadog', 'aws', 'firebase'),
  config_data JSON ENCRYPTED, -- store API keys securely
  is_active BOOLEAN DEFAULT TRUE,
  test_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_tested_at TIMESTAMP,
  UNIQUE KEY (project_id, integration_type)
);
```

#### WebhookLog
```sql
CREATE TABLE webhook_logs (
  id VARCHAR PRIMARY KEY,
  integration_id VARCHAR NOT NULL,
  event_type VARCHAR,
  payload JSON,
  response_status INT,
  response_body TEXT,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMP,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (integration_id, timestamp)
);
```

---

### Deployment & Version Control Entities

#### Deployment
```sql
CREATE TABLE deployments (
  id VARCHAR PRIMARY KEY,
  app_id VARCHAR NOT NULL,
  version VARCHAR,
  environment ENUM('development', 'staging', 'production'),
  deployed_by VARCHAR,
  status ENUM('pending', 'in_progress', 'success', 'failed'),
  deployment_log TEXT,
  rollback_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX (app_id, created_at)
);
```

#### ProjectVersion
```sql
CREATE TABLE project_versions (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  version_number VARCHAR,
  created_by VARCHAR,
  changes JSON, -- what changed from previous version
  backup_data LONGBLOB, -- full project snapshot
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (project_id, version_number)
);
```

---

### Security & Audit Entities

#### SecurityAudit
```sql
CREATE TABLE security_audits (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  audit_type ENUM('penetration_test', 'vulnerability_scan', 'compliance_check'),
  findings JSON,
  severity_distribution JSON,
  remediation_recommendations TEXT,
  completed_at TIMESTAMP,
  next_audit_scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### EncryptedSecret
```sql
CREATE TABLE encrypted_secrets (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  secret_name VARCHAR,
  secret_value VARCHAR ENCRYPTED,
  secret_type ENUM('api_key', 'password', 'token', 'certificate'),
  created_by VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP,
  access_count INT DEFAULT 0
);
```

#### AuditTrail
```sql
CREATE TABLE audit_trails (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  action VARCHAR,
  resource_type VARCHAR,
  resource_id VARCHAR,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, timestamp),
  INDEX (resource_type, resource_id)
);
```

---

### Marketplace & Monetization Entities

#### Commission
```sql
CREATE TABLE commissions (
  id VARCHAR PRIMARY KEY,
  creator_id VARCHAR NOT NULL,
  purchase_id VARCHAR NOT NULL,
  amount INT, -- in cents
  status ENUM('pending', 'processed', 'paid'),
  payout_id VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES marketplace_purchases(id)
);
```

#### ReferralCode
```sql
CREATE TABLE referral_codes (
  id VARCHAR PRIMARY KEY,
  creator_id VARCHAR NOT NULL,
  code VARCHAR UNIQUE,
  discount_percentage INT,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## Indexes for Performance

```sql
-- App metrics queries
CREATE INDEX idx_metrics_app_time ON app_metrics(app_id, timestamp DESC);
CREATE INDEX idx_metrics_type_time ON app_metrics(metric_type, timestamp DESC);

-- Error queries
CREATE INDEX idx_errors_app ON app_errors(app_id);
CREATE INDEX idx_errors_severity ON app_errors(app_id, severity);
CREATE INDEX idx_errors_fingerprint ON app_errors(error_fingerprint);

-- Activity and audit
CREATE INDEX idx_activity_project_time ON activity_logs(project_id, timestamp DESC);
CREATE INDEX idx_activity_user_time ON activity_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_user_time ON audit_trails(user_id, timestamp DESC);

-- Marketplace
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_creator ON templates(creator_id);
CREATE INDEX idx_purchases_creator ON marketplace_purchases(creator_id);
CREATE INDEX idx_purchases_buyer ON marketplace_purchases(buyer_id);

-- Collaboration
CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_permissions_project ON project_permissions(project_id);
```

---

## Entity Relationships Diagram

```
User (existing)
├── Projects (existing)
│   ├── Templates (new)
│   ├── Deployments (new)
│   ├── ProjectVersions (new)
│   ├── AppMetrics (new)
│   ├── AppErrors (new)
│   ├── ActivityLogs (new)
│   ├── Comments (new)
│   ├── CodeReviews (new)
│   ├── IntegrationConfigs (new)
│   ├── ProjectPermissions (new)
│   ├── SecurityAudits (new)
│   └── EncryptedSecrets (new)
├── TeamMembers (new)
├── MarketplacePurchases (new)
├── TemplateRatings (new)
├── ReferralCodes (new)
└── Commissions (new)

Template
├── TemplateRatings (new)
└── MarketplacePurchases (new)

Integration (new)
└── WebhookLogs (new)
```

---

## Migration Strategy

### Phase 1 (Immediate)
```sql
-- Monitoring tables
CREATE TABLE app_metrics;
CREATE TABLE app_errors;

-- Team collaboration
CREATE TABLE team_members;
CREATE TABLE project_permissions;
```

### Phase 2 (Week 2)
```sql
-- Marketplace
CREATE TABLE templates;
CREATE TABLE marketplace_purchases;
CREATE TABLE template_ratings;

-- Deployment tracking
CREATE TABLE deployments;
CREATE TABLE project_versions;
```

### Phase 3 (Week 3)
```sql
-- Security & audit
CREATE TABLE security_audits;
CREATE TABLE encrypted_secrets;
CREATE TABLE audit_trails;

-- Monetization
CREATE TABLE commissions;
CREATE TABLE referral_codes;
```

---

## Data Retention Policies

| Entity | Retention | Archive | Notes |
|--------|-----------|---------|-------|
| AppMetric | 90 days | 1 year | Roll up hourly after 7 days |
| AppError | Indefinite | N/A | Keep for analysis |
| ActivityLog | 1 year | 3 years | Required for compliance |
| WebhookLog | 30 days | 90 days | Keep for debugging |
| AuditTrail | 3 years | 7 years | Legal/compliance requirement |

---

**Last Updated:** January 28, 2026  
**Next Review:** February 28, 2026
