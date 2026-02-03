# Cache Module Variables

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ElastiCache will be created"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ElastiCache placement"
  type        = list(string)
}

variable "engine" {
  description = "Cache engine (redis or memcached)"
  type        = string
  default     = "redis"
  validation {
    condition     = contains(["redis", "memcached"], var.engine)
    error_message = "Engine must be either 'redis' or 'memcached'."
  }
}

variable "engine_version" {
  description = "Cache engine version"
  type        = string
  default     = "7.0"
}

variable "node_type" {
  description = "ElastiCache node type (cache.t3.micro, cache.t3.small, cache.t4g.micro, etc.)"
  type        = string
  default     = "cache.t4g.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
  validation {
    condition     = var.num_cache_nodes >= 1 && var.num_cache_nodes <= 100
    error_message = "Number of cache nodes must be between 1 and 100."
  }
}

variable "parameter_group_name" {
  description = "Parameter group name"
  type        = string
  default     = "default"
}

variable "port" {
  description = "Port number"
  type        = number
  default     = 6379
  validation {
    condition     = var.port >= 1024 && var.port <= 65535
    error_message = "Port must be between 1024 and 65535."
  }
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover (Multi-AZ)"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ for Redis"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
  validation {
    condition     = var.snapshot_retention_limit >= 0 && var.snapshot_retention_limit <= 35
    error_message = "Snapshot retention limit must be between 0 and 35 days."
  }
}

variable "snapshot_window" {
  description = "Preferred snapshot window (HH:MM-HH:MM UTC)"
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window (ddd:HH:MM-ddd:HH:MM UTC)"
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "enable_encryption" {
  description = "Enable encryption at rest and in transit"
  type        = bool
  default     = true
}

variable "enable_automatic_backups" {
  description = "Enable automatic backups"
  type        = bool
  default     = true
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

variable "transit_encryption_mode" {
  description = "Transit encryption mode (preferred or required)"
  type        = string
  default     = "preferred"
  validation {
    condition     = contains(["preferred", "required"], var.transit_encryption_mode)
    error_message = "Transit encryption mode must be either 'preferred' or 'required'."
  }
}

variable "auth_token" {
  description = "Authentication token for Redis"
  type        = string
  sensitive   = true
  default     = null
}

variable "ecs_security_group_id" {
  description = "Security group ID of ECS tasks for ingress"
  type        = string
}

variable "log_delivery_configuration" {
  description = "Enable log delivery to CloudWatch"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
