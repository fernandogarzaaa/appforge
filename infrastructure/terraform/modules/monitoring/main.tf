# Monitoring Module - CloudWatch Dashboards, Alarms, and Logs

# SNS Topic for Alarms
resource "aws_sns_topic" "alerts" {
  count = var.enable_sns_alerts ? 1 : 0
  name  = "${var.environment}-appforge-alerts"

  tags = {
    Name        = "${var.environment}-alerts-topic"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.enable_sns_alerts && var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Log Group for Application Logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ecs/${var.environment}/appforge"
  retention_in_days = var.log_retention_days

  tags = merge(
    {
      Name        = "${var.environment}-app-logs"
      Environment = var.environment
    },
    var.tags
  )
}

# Log Group for ECS Task Logs
resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/aws/ecs/${var.environment}/tasks"
  retention_in_days = var.log_retention_days

  tags = merge(
    {
      Name        = "${var.environment}-ecs-logs"
      Environment = var.environment
    },
    var.tags
  )
}

# Log Group for Performance Metrics
resource "aws_cloudwatch_log_group" "performance" {
  name              = "/aws/appforge/${var.environment}/performance"
  retention_in_days = var.log_retention_days

  tags = merge(
    {
      Name        = "${var.environment}-perf-logs"
      Environment = var.environment
    },
    var.tags
  )
}

# ECS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.environment}-appforge-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = var.enable_detailed_monitoring ? 60 : 300
  statistic           = "Average"
  threshold           = var.cpu_threshold
  alarm_description   = "Alert when ECS CPU exceeds ${var.cpu_threshold}%"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Name        = "${var.environment}-ecs-cpu-alarm"
    Environment = var.environment
  }
}

# ECS Memory Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.environment}-appforge-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = var.enable_detailed_monitoring ? 60 : 300
  statistic           = "Average"
  threshold           = var.memory_threshold
  alarm_description   = "Alert when ECS memory exceeds ${var.memory_threshold}%"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Name        = "${var.environment}-ecs-memory-alarm"
    Environment = var.environment
  }
}

# ECS Task Count Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_task_count_low" {
  alarm_name          = "${var.environment}-appforge-ecs-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RunningCount"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Alert when running task count drops below 1"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Name        = "${var.environment}-ecs-task-alarm"
    Environment = var.environment
  }
}

# Target Group Health Check Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count               = var.alb_target_group_arn != "" ? 1 : 0
  alarm_name          = "${var.environment}-appforge-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when any target becomes unhealthy"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []

  dimensions = {
    TargetGroup  = split(":", var.alb_target_group_arn)[5]
    LoadBalancer = "app/appforge-alb/${var.environment}"
  }

  tags = {
    Name        = "${var.environment}-alb-health-alarm"
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  count          = var.enable_dashboard ? 1 : 0
  dashboard_name = "${var.environment}-appforge-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # ECS Service Metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "CPU %" }],
            [".", "MemoryUtilization", { stat = "Average", label = "Memory %" }],
            [".", "RunningCount", { stat = "Average", label = "Running Tasks" }]
          ]
          period = var.enable_detailed_monitoring ? 60 : 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "ECS Service Metrics"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
          dimensions = {
            ClusterName = var.ecs_cluster_name
            ServiceName = var.ecs_service_name
          }
        }
      },
      # Log Insights Widget
      {
        type = "log"
        properties = {
          query   = "fields @timestamp, @message, @level | filter @level != 'DEBUG' | stats count() by @level"
          region  = data.aws_region.current.name
          title   = "Log Levels Distribution"
          logGroupNames = [aws_cloudwatch_log_group.app_logs.name]
        }
      },
      # Error Rate
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }],
            [".", "RequestCount", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Application Error Rates"
        }
      },
      # Request Latency
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Target Response Time"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-dashboard"
    Environment = var.environment
  }
}

# CloudWatch Log Insights Queries
resource "aws_cloudwatch_query_definition" "error_logs" {
  count       = var.enable_log_insights ? 1 : 0
  name        = "${var.environment}/appforge/error-logs"
  log_group_name_list = [aws_cloudwatch_log_group.app_logs.name]
  query_string = <<-EOQ
    fields @timestamp, @message, @logStream, error_code, error_message
    | filter @message like /ERROR|Exception|Error/
    | stats count() as error_count by error_code
    | sort error_count desc
  EOQ
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  count       = var.enable_log_insights ? 1 : 0
  name        = "${var.environment}/appforge/performance-analysis"
  log_group_name_list = [aws_cloudwatch_log_group.app_logs.name]
  query_string = <<-EOQ
    fields @duration, @timestamp, @message
    | filter ispresent(@duration)
    | stats avg(@duration), max(@duration), pct(@duration, 95) as p95, pct(@duration, 99) as p99
  EOQ
}

resource "aws_cloudwatch_query_definition" "request_count" {
  count       = var.enable_log_insights ? 1 : 0
  name        = "${var.environment}/appforge/request-count"
  log_group_name_list = [aws_cloudwatch_log_group.app_logs.name]
  query_string = <<-EOQ
    fields @timestamp, method, path, status_code
    | stats count() as request_count by method, status_code
    | sort request_count desc
  EOQ
}

resource "aws_cloudwatch_query_definition" "slow_queries" {
  count       = var.enable_log_insights ? 1 : 0
  name        = "${var.environment}/appforge/slow-database-queries"
  log_group_name_list = [aws_cloudwatch_log_group.performance.name]
  query_string = <<-EOQ
    fields @timestamp, @message, @duration
    | filter @duration > 1000
    | stats count() as slow_count, avg(@duration), max(@duration)
  EOQ
}

# Data source for current AWS region
data "aws_region" "current" {}

# Custom Metric Alarm Example (for application-published metrics)
resource "aws_cloudwatch_metric_alarm" "custom_metric_alert" {
  alarm_name          = "${var.environment}-appforge-custom-metric-alert"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CustomRequestFailureRate"
  namespace           = var.custom_metrics_namespace
  period              = 300
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when custom request failure rate exceeds 5%"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.environment}-custom-alarm"
    Environment = var.environment
  }
}

# Composite Alarm for overall system health
resource "aws_cloudwatch_composite_alarm" "system_health" {
  count          = var.enable_sns_alerts ? 1 : 0
  alarm_name     = "${var.environment}-appforge-system-health"
  alarm_description = "Composite alarm for overall system health"
  alarm_actions  = [aws_sns_topic.alerts[0].arn]

  alarm_rule = join(" OR ", [
    "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name}",
    "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name}",
    "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${aws_cloudwatch_metric_alarm.ecs_task_count_low.alarm_name}"
  ])

  tags = {
    Name        = "${var.environment}-system-health"
    Environment = var.environment
  }

  depends_on = [
    aws_cloudwatch_metric_alarm.ecs_cpu_high,
    aws_cloudwatch_metric_alarm.ecs_memory_high,
    aws_cloudwatch_metric_alarm.ecs_task_count_low
  ]
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}
