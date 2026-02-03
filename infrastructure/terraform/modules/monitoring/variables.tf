# Monitoring Module Variables

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch value."
  }
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring (1-minute intervals)"
  type        = bool
  default     = true
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}

variable "enable_sns_alerts" {
  description = "Enable SNS notifications for alarms"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = ""
}

variable "enable_dashboard" {
  description = "Create CloudWatch dashboard"
  type        = bool
  default     = true
}

variable "custom_metrics_namespace" {
  description = "Custom CloudWatch metrics namespace"
  type        = string
  default     = "AppForge"
}

variable "enable_log_insights" {
  description = "Create CloudWatch Logs Insights queries"
  type        = bool
  default     = true
}

variable "enable_anomaly_detection" {
  description = "Enable anomaly detection for metrics"
  type        = bool
  default     = false
}

variable "cpu_threshold" {
  description = "CPU utilization threshold (%)"
  type        = number
  default     = 80
  validation {
    condition     = var.cpu_threshold > 0 && var.cpu_threshold <= 100
    error_message = "CPU threshold must be between 0 and 100."
  }
}

variable "memory_threshold" {
  description = "Memory utilization threshold (%)"
  type        = number
  default     = 80
  validation {
    condition     = var.memory_threshold > 0 && var.memory_threshold <= 100
    error_message = "Memory threshold must be between 0 and 100."
  }
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN for health check monitoring"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
