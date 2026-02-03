# CDN Module Variables

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the CloudFront distribution"
  type        = string
}

variable "alternative_domain_names" {
  description = "Alternative domain names (CNAMEs)"
  type        = list(string)
  default     = []
}

variable "certificate_arn" {
  description = "ACM SSL certificate ARN for HTTPS"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name (primary origin)"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "S3 bucket domain name for static assets origin"
  type        = string
  default     = ""
}

variable "s3_bucket_origin_id" {
  description = "S3 bucket origin ID"
  type        = string
  default     = "appforge-assets"
}

variable "enable_s3_origin" {
  description = "Enable S3 bucket as origin"
  type        = bool
  default     = false
}

variable "enable_ipv6" {
  description = "Enable IPv6"
  type        = bool
  default     = true
}

variable "http_version" {
  description = "HTTP version (http1.1, http2, http2and3)"
  type        = string
  default     = "http2and3"
}

variable "default_root_object" {
  description = "Default root object"
  type        = string
  default     = "index.html"
}

variable "enable_logging" {
  description = "Enable CloudFront access logs"
  type        = bool
  default     = true
}

variable "log_bucket_name" {
  description = "S3 bucket for CloudFront logs"
  type        = string
  default     = ""
}

variable "log_prefix" {
  description = "Prefix for CloudFront logs"
  type        = string
  default     = "cloudfront-logs/"
}

variable "default_ttl" {
  description = "Default TTL in seconds"
  type        = number
  default     = 86400 # 1 day
}

variable "min_ttl" {
  description = "Minimum TTL in seconds"
  type        = number
  default     = 0
}

variable "max_ttl" {
  description = "Maximum TTL in seconds"
  type        = number
  default     = 31536000 # 1 year
}

variable "compress" {
  description = "Enable automatic compression of objects"
  type        = bool
  default     = true
}

variable "viewer_protocol_policy" {
  description = "Viewer protocol policy (allow-all, https-only, redirect-to-https)"
  type        = string
  default     = "redirect-to-https"
}

variable "allowed_methods" {
  description = "Allowed HTTP methods"
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS"]
}

variable "cached_methods" {
  description = "Cached HTTP methods"
  type        = list(string)
  default     = ["GET", "HEAD"]
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_100, PriceClass_200)"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = false
}

variable "waf_acl_arn" {
  description = "WAF ACL ARN"
  type        = string
  default     = ""
}

variable "enable_cache_policy" {
  description = "Use managed cache policy"
  type        = bool
  default     = true
}

variable "custom_headers" {
  description = "Custom headers to add to origin requests"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
