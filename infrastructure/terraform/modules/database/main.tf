# Database Module - RDS PostgreSQL with Read Replicas

# DB Subnet Group
resource "aws_db_subnet_group" "appforge" {
  name       = "${var.environment}-${var.db_subnet_group_name}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.environment}-appforge-rds-sg"
  description = "Security group for AppForge RDS"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
    description     = "PostgreSQL from ECS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-rds-sg"
    Environment = var.environment
  }
}

# KMS Key for encryption
resource "aws_kms_key" "rds" {
  count                   = var.enable_encryption ? 1 : 0
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-rds-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds" {
  count         = var.enable_encryption ? 1 : 0
  name          = "alias/${var.environment}-rds"
  target_key_id = aws_kms_key.rds[0].key_id
}

# IAM Role for enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0
  name  = "${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.environment}-rds-monitoring-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.enable_enhanced_monitoring ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  identifier            = "${var.environment}-appforge-primary"
  engine               = "postgres"
  engine_version       = var.postgres_version
  instance_class       = var.db_instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.appforge.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup and Recovery
  backup_retention_period = var.backup_retention_days
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  copy_tags_to_snapshot  = true
  skip_final_snapshot    = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.environment}-appforge-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # High Availability
  multi_az = var.multi_az

  # Encryption
  storage_encrypted = var.enable_encryption
  kms_key_id        = var.enable_encryption ? aws_kms_key.rds[0].arn : null

  # Performance Insights
  performance_insights_enabled    = var.environment == "production" ? true : false
  performance_insights_retention_period = var.environment == "production" ? 31 : 7

  # Enhanced Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_enabled             = var.enable_enhanced_monitoring
  monitoring_interval            = var.enable_enhanced_monitoring ? var.monitoring_interval : 0
  monitoring_role_arn            = var.enable_enhanced_monitoring ? aws_iam_role.rds_monitoring[0].arn : null

  # Deletion Protection
  deletion_protection = var.deletion_protection

  # Parameter Group for optimization
  parameter_group_name = aws_db_parameter_group.appforge.name

  depends_on = [
    aws_db_subnet_group.appforge,
    aws_security_group.rds
  ]

  tags = {
    Name        = "${var.environment}-rds-primary"
    Environment = var.environment
    Role        = "Primary"
  }
}

# DB Parameter Group
resource "aws_db_parameter_group" "appforge" {
  name   = "${var.environment}-appforge-params"
  family = "postgres15"

  # Performance tuning
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory/2621440}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory/63963}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "work_mem"
    value = "262144"
    apply_method = "immediate"
  }

  # Connection limits
  parameter {
    name  = "max_connections"
    value = "500"
    apply_method = "pending-reboot"
  }

  # WAL configuration
  parameter {
    name  = "wal_buffers"
    value = "16384"
    apply_method = "pending-reboot"
  }

  tags = {
    Name        = "${var.environment}-db-param-group"
    Environment = var.environment
  }
}

# Read Replicas
resource "aws_db_instance" "read_replica" {
  count                    = var.enable_read_replica ? var.read_replica_count : 0
  identifier               = "${var.environment}-appforge-replica-${count.index + 1}"
  replicate_source_db      = aws_db_instance.primary.identifier
  instance_class           = var.db_instance_class
  publicly_accessible      = false
  auto_minor_version_upgrade = true
  skip_final_snapshot      = true

  # Encryption
  storage_encrypted = var.enable_encryption
  kms_key_id        = var.enable_encryption ? aws_kms_key.rds[0].arn : null

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_enabled             = var.enable_enhanced_monitoring
  monitoring_interval            = var.enable_enhanced_monitoring ? var.monitoring_interval : 0
  monitoring_role_arn            = var.enable_enhanced_monitoring ? aws_iam_role.rds_monitoring[0].arn : null

  depends_on = [aws_db_instance.primary]

  tags = {
    Name        = "${var.environment}-rds-replica-${count.index + 1}"
    Environment = var.environment
    Role        = "ReadReplica"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.environment}-appforge-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name        = "${var.environment}-rds-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.environment}-appforge-rds-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes
  alarm_description   = "Alert when RDS storage is below 10GB"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name        = "${var.environment}-rds-storage-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.environment}-appforge-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "400"
  alarm_description   = "Alert when database connections exceed 400"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name        = "${var.environment}-rds-conn-alarm"
    Environment = var.environment
  }
}
