# Monitoring Module Outputs

output "log_group_app_name" {
  description = "CloudWatch log group name for application logs"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "log_group_ecs_tasks_name" {
  description = "CloudWatch log group name for ECS task logs"
  value       = aws_cloudwatch_log_group.ecs_tasks.name
}

output "log_group_performance_name" {
  description = "CloudWatch log group name for performance logs"
  value       = aws_cloudwatch_log_group.performance.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = var.enable_sns_alerts ? aws_sns_topic.alerts[0].arn : null
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value = var.enable_dashboard ? format(
    "https://console.aws.amazon.com/cloudwatch/home?region=%s#dashboards:name=%s",
    data.aws_region.current.name,
    aws_cloudwatch_dashboard.main[0].dashboard_name
  ) : null
}

output "cpu_alarm_arn" {
  description = "CPU utilization alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
}

output "memory_alarm_arn" {
  description = "Memory utilization alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_memory_high.arn
}

output "task_count_alarm_arn" {
  description = "Task count alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_task_count_low.arn
}

output "unhealthy_hosts_alarm_arn" {
  description = "Unhealthy hosts alarm ARN"
  value       = var.alb_target_group_arn != "" ? aws_cloudwatch_metric_alarm.alb_unhealthy_hosts[0].arn : null
}

output "system_health_alarm_arn" {
  description = "System health composite alarm ARN"
  value       = var.enable_sns_alerts ? aws_cloudwatch_composite_alarm.system_health[0].arn : null
}

output "query_error_logs_arn" {
  description = "Error logs query ARN"
  value       = var.enable_log_insights ? aws_cloudwatch_query_definition.error_logs[0].arn : null
}

output "query_performance_arn" {
  description = "Performance analysis query ARN"
  value       = var.enable_log_insights ? aws_cloudwatch_query_definition.performance_analysis[0].arn : null
}

output "region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}
