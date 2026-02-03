# Compute Module Outputs

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.appforge.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.appforge.zone_id
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.appforge.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.appforge.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.appforge.name
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.backend.arn
}
