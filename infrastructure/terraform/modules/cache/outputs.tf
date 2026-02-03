# Cache Module Outputs

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].primary_endpoint_address : null
}

output "redis_port" {
  description = "Redis port"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].port : null
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint (for read-only operations)"
  value       = var.engine == "redis" && var.automatic_failover_enabled ? aws_elasticache_replication_group.appforge[0].reader_endpoint_address : null
}

output "redis_cluster_id" {
  description = "Redis replication group ID"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].id : null
}

output "redis_engine_version" {
  description = "Redis engine version"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].engine_version : null
}

output "redis_node_type" {
  description = "Redis node type"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].node_type : null
}

output "redis_num_cache_clusters" {
  description = "Number of Redis cache clusters"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].num_cache_clusters : null
}

output "redis_automatic_failover" {
  description = "Redis automatic failover enabled"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].automatic_failover_enabled : null
}

output "redis_multi_az" {
  description = "Redis Multi-AZ enabled"
  value       = var.engine == "redis" ? aws_elasticache_replication_group.appforge[0].multi_az_enabled : null
}

output "memcached_endpoint" {
  description = "Memcached cluster endpoint"
  value       = var.engine == "memcached" ? aws_elasticache_cluster.appforge[0].cluster_nodes[0].address : null
}

output "memcached_port" {
  description = "Memcached port"
  value       = var.engine == "memcached" ? aws_elasticache_cluster.appforge[0].port : null
}

output "memcached_cluster_id" {
  description = "Memcached cluster ID"
  value       = var.engine == "memcached" ? aws_elasticache_cluster.appforge[0].cluster_id : null
}

output "security_group_id" {
  description = "Security group ID for cache"
  value       = aws_security_group.cache.id
}

output "subnet_group_name" {
  description = "Cache subnet group name"
  value       = aws_elasticache_subnet_group.appforge.name
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = var.enable_encryption ? aws_kms_key.cache[0].id : null
}
