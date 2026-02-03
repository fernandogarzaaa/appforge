# CDN Module Outputs

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.appforge.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.appforge.arn
}

output "domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.appforge.domain_name
}

output "status" {
  description = "CloudFront distribution status"
  value       = aws_cloudfront_distribution.appforge.status
}

output "etag" {
  description = "CloudFront distribution ETag"
  value       = aws_cloudfront_distribution.appforge.etag
}

output "enabled" {
  description = "CloudFront distribution enabled status"
  value       = aws_cloudfront_distribution.appforge.enabled
}

output "origin_access_identity_path" {
  description = "Origin Access Identity cloudfront access identity path"
  value       = var.enable_s3_origin ? aws_cloudfront_origin_access_identity.appforge[0].cloudfront_access_identity_path : null
}

output "origin_access_identity_iam_arn" {
  description = "Origin Access Identity IAM ARN"
  value       = var.enable_s3_origin ? aws_cloudfront_origin_access_identity.appforge[0].iam_arn : null
}

output "aliases" {
  description = "Alternate domain names (CNAMEs)"
  value       = aws_cloudfront_distribution.appforge.aliases
}

output "viewer_certificate_arn" {
  description = "ACM certificate ARN used by CloudFront"
  value       = aws_cloudfront_distribution.appforge.viewer_certificate[0].acm_certificate_arn
}
