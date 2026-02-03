# Cache Module - ElastiCache Redis with Auto-Failover

# Subnet Group
resource "aws_elasticache_subnet_group" "appforge" {
  name       = "${var.environment}-appforge-cache-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.environment}-cache-subnet-group"
    Environment = var.environment
  }
}

# Security Group
resource "aws_security_group" "cache" {
  name        = "${var.environment}-appforge-cache-sg"
  description = "Security group for AppForge ElastiCache"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.port
    to_port         = var.port
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
    description     = "ElastiCache from ECS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-cache-sg"
    Environment = var.environment
  }
}

# Custom Parameter Group for Redis
resource "aws_elasticache_parameter_group" "appforge" {
  count = var.engine == "redis" ? 1 : 0
  
  name   = "${var.environment}-appforge-redis-params"
  family = "redis${var.engine_version}"

  # Performance tuning
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  # Enable slow log
  parameter {
    name  = "slowlog-log-slower-than"
    value = "10000"
  }

  parameter {
    name  = "slowlog-max-len"
    value = "128"
  }

  tags = {
    Name        = "${var.environment}-redis-param-group"
    Environment = var.environment
  }
}

# KMS Key for encryption
resource "aws_kms_key" "cache" {
  count                   = var.enable_encryption ? 1 : 0
  description             = "KMS key for ElastiCache encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-cache-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "cache" {
  count         = var.enable_encryption ? 1 : 0
  name          = "alias/${var.environment}-cache"
  target_key_id = aws_kms_key.cache[0].key_id
}

# ElastiCache Replication Group (Redis)
resource "aws_elasticache_replication_group" "appforge" {
  count = var.engine == "redis" ? 1 : 0

  replication_group_description = "AppForge ${var.environment} Redis cluster"
  replication_group_id          = "${var.environment}-appforge-redis"
  engine                        = var.engine
  engine_version                = var.engine_version
  node_type                     = var.node_type
  num_cache_clusters            = var.num_cache_nodes
  port                          = var.port
  parameter_group_name          = aws_elasticache_parameter_group.appforge[0].name
  subnet_group_name             = aws_elasticache_subnet_group.appforge.name
  security_group_ids            = [aws_security_group.cache.id]

  # High Availability
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled          = var.multi_az_enabled

  # Encryption
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  kms_key_id                 = var.at_rest_encryption_enabled ? aws_kms_key.cache[0].arn : null
  transit_encryption_enabled = var.transit_encryption_enabled
  transit_encryption_mode    = var.transit_encryption_enabled ? var.transit_encryption_mode : null
  auth_token                 = var.auth_token

  # Backups
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.enable_automatic_backups ? var.snapshot_window : null

  # Maintenance
  maintenance_window = var.maintenance_window
  notification_topic_arn = null # Set this if you want SNS notifications

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log[0].name
    destination_type = "cloudwatch-logs"
    enabled          = var.log_delivery_configuration
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine_log[0].name
    destination_type = "cloudwatch-logs"
    enabled          = var.log_delivery_configuration
    log_format       = "json"
    log_type         = "engine-log"
  }

  apply_immediately = var.environment != "production" ? true : false

  depends_on = [aws_elasticache_subnet_group.appforge]

  tags = merge(
    {
      Name        = "${var.environment}-appforge-redis"
      Environment = var.environment
    },
    var.tags
  )
}

# ElastiCache Cluster (Memcached)
resource "aws_elasticache_cluster" "appforge" {
  count = var.engine == "memcached" ? 1 : 0

  cluster_id           = "${var.environment}-appforge-memcached"
  engine               = var.engine
  engine_version       = var.engine_version
  node_type           = var.node_type
  num_cache_nodes     = var.num_cache_nodes
  port                = var.port
  parameter_group_name = "default.memcached${var.engine_version}"
  subnet_group_name   = aws_elasticache_subnet_group.appforge.name
  security_group_ids  = [aws_security_group.cache.id]

  maintenance_window = var.maintenance_window
  notification_topic_arn = null

  apply_immediately = var.environment != "production" ? true : false

  depends_on = [aws_elasticache_subnet_group.appforge]

  tags = merge(
    {
      Name        = "${var.environment}-appforge-memcached"
      Environment = var.environment
    },
    var.tags
  )
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  count             = var.engine == "redis" && var.log_delivery_configuration ? 1 : 0
  name              = "/aws/elasticache/${var.environment}-appforge-redis-slow-log"
  retention_in_days = 14

  tags = {
    Name        = "${var.environment}-redis-slow-log"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  count             = var.engine == "redis" && var.log_delivery_configuration ? 1 : 0
  name              = "/aws/elasticache/${var.environment}-appforge-redis-engine-log"
  retention_in_days = 7

  tags = {
    Name        = "${var.environment}-redis-engine-log"
    Environment = var.environment
  }
}

# CloudWatch Alarms - Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  count               = var.engine == "redis" ? 1 : 0
  alarm_name          = "${var.environment}-appforge-redis-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Alert when Redis CPU exceeds 75%"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.appforge[0].id
  }

  tags = {
    Name        = "${var.environment}-redis-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  count               = var.engine == "redis" ? 1 : 0
  alarm_name          = "${var.environment}-appforge-redis-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "Alert when Redis memory usage exceeds 90%"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.appforge[0].id
  }

  tags = {
    Name        = "${var.environment}-redis-memory-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  count               = var.engine == "redis" ? 1 : 0
  alarm_name          = "${var.environment}-appforge-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when Redis evictions occur"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.appforge[0].id
  }

  tags = {
    Name        = "${var.environment}-redis-evictions-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_replication_lag" {
  count               = var.engine == "redis" && var.automatic_failover_enabled ? 1 : 0
  alarm_name          = "${var.environment}-appforge-redis-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicationLag"
  namespace           = "AWS/ElastiCache"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "30" # seconds
  alarm_description   = "Alert when Redis replication lag exceeds 30 seconds"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.appforge[0].id
  }

  tags = {
    Name        = "${var.environment}-redis-lag-alarm"
    Environment = var.environment
  }
}
