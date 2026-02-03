# Database Module Outputs

output "primary_endpoint" {
  description = "RDS primary instance endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "primary_address" {
  description = "RDS primary instance address (host only)"
  value       = aws_db_instance.primary.address
}

output "primary_port" {
  description = "RDS primary instance port"
  value       = aws_db_instance.primary.port
}

output "primary_db_name" {
  description = "RDS primary database name"
  value       = aws_db_instance.primary.db_name
}

output "replica_endpoints" {
  description = "RDS read replica endpoints"
  value       = var.enable_read_replica ? aws_db_instance.read_replica[*].endpoint : []
}

output "replica_addresses" {
  description = "RDS read replica addresses (hosts only)"
  value       = var.enable_read_replica ? aws_db_instance.read_replica[*].address : []
}

output "security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "db_instance_class" {
  description = "Database instance class"
  value       = aws_db_instance.primary.instance_class
}

output "allocated_storage" {
  description = "Allocated storage in GB"
  value       = aws_db_instance.primary.allocated_storage
}

output "engine_version" {
  description = "Database engine version"
  value       = aws_db_instance.primary.engine_version
}

output "multi_az" {
  description = "Multi-AZ enabled"
  value       = aws_db_instance.primary.multi_az
}

output "backup_retention_days" {
  description = "Backup retention period"
  value       = aws_db_instance.primary.backup_retention_period
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = var.enable_encryption ? aws_kms_key.rds[0].id : null
}

output "replicas_count" {
  description = "Number of read replicas"
  value       = var.enable_read_replica ? length(aws_db_instance.read_replica) : 0
}
