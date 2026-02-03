# CDN Module - CloudFront Distribution

# Origin Access Identity for S3 (if applicable)
resource "aws_cloudfront_origin_access_identity" "appforge" {
  count   = var.enable_s3_origin ? 1 : 0
  comment = "${var.environment} AppForge S3 access"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "appforge" {
  comment             = "${var.environment} AppForge CDN"
  enabled             = true
  is_ipv6_enabled     = var.enable_ipv6
  default_root_object = var.default_root_object
  http_version        = var.http_version

  # Web ACL for WAF
  web_acl_id = var.enable_waf ? var.waf_acl_arn : null

  # Alternate domain names
  aliases = concat([var.domain_name], var.alternative_domain_names)

  # Primary origin (ALB)
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Origin-Verify"
      value = "CloudFront-${var.environment}"
    }

    dynamic "custom_header" {
      for_each = var.custom_headers
      content {
        name  = custom_header.key
        value = custom_header.value
      }
    }
  }

  # S3 origin for static assets (optional)
  dynamic "origin" {
    for_each = var.enable_s3_origin ? [1] : []
    content {
      domain_name = var.s3_bucket_domain_name
      origin_id   = var.s3_bucket_origin_id

      s3_origin_config {
        origin_access_identity = aws_cloudfront_origin_access_identity.appforge[0].cloudfront_access_identity_path
      }
    }
  }

  # Default cache behavior (ALB)
  default_cache_behavior {
    allowed_methods  = var.allowed_methods
    cached_methods   = var.cached_methods
    target_origin_id = "alb"

    viewer_protocol_policy = var.viewer_protocol_policy
    compress               = var.compress

    # Use managed cache policy if enabled
    cache_policy_id = var.enable_cache_policy ? data.aws_cloudfront_cache_policy.recommended[0].id : null

    # Custom cache settings if not using managed policy
    dynamic "forwarded_values" {
      for_each = var.enable_cache_policy ? [] : [1]
      content {
        query_string = true
        cookies {
          forward = "all"
        }
        headers = [
          "Authorization",
          "Host",
          "User-Agent",
          "Referer",
          "Accept",
          "Accept-Encoding",
          "Content-Type"
        ]
      }
    }

    dynamic "min_ttl" {
      for_each = var.enable_cache_policy ? [] : [1]
      content {
        value = var.min_ttl
      }
    }

    dynamic "default_ttl" {
      for_each = var.enable_cache_policy ? [] : [1]
      content {
        value = var.default_ttl
      }
    }

    dynamic "max_ttl" {
      for_each = var.enable_cache_policy ? [] : [1]
      content {
        value = var.max_ttl
      }
    }
  }

  # Cache behavior for static assets from S3
  dynamic "cache_behavior" {
    for_each = var.enable_s3_origin ? [1] : []
    content {
      path_pattern     = ["/assets/*", "/static/*"]
      allowed_methods  = ["GET", "HEAD"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = var.s3_bucket_origin_id

      viewer_protocol_policy = "redirect-to-https"
      compress               = true

      cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized[0].id
    }
  }

  # API cache behavior (no caching)
  cache_behavior {
    path_pattern     = ["/api/*"]
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"

    viewer_protocol_policy = "https-only"
    compress               = true

    cache_policy_id            = data.aws_cloudfront_cache_policy.disabled[0].id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer[0].id
  }

  # Error responses
  custom_error_response {
    error_code            = 403
    response_code         = 200
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    error_caching_min_ttl = 300
  }

  # Viewer certificate
  viewer_certificate {
    acm_certificate_arn            = var.certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # Logging
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      include_cookies = false
      bucket          = var.log_bucket_name
      prefix          = var.log_prefix
    }
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Price class
  price_class = var.price_class

  # Tags
  tags = merge(
    {
      Name        = "${var.environment}-appforge-cdn"
      Environment = var.environment
    },
    var.tags
  )

  depends_on = [aws_cloudfront_origin_access_identity.appforge]
}

# Data sources for managed cache policies
data "aws_cloudfront_cache_policy" "recommended" {
  count = var.enable_cache_policy ? 1 : 0
  name  = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  count = var.enable_s3_origin ? 1 : 0
  name  = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  count = 1
  name  = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  count = 1
  name  = "Managed-AllViewer"
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.environment}-appforge-cdn-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when 4xx error rate exceeds 5%"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.appforge.id
  }

  tags = {
    Name        = "${var.environment}-cdn-error-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "origin_latency" {
  alarm_name          = "${var.environment}-appforge-cdn-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000" # milliseconds
  alarm_description   = "Alert when origin latency exceeds 1 second"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.appforge.id
  }

  tags = {
    Name        = "${var.environment}-cdn-latency-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "${var.environment}-appforge-cdn-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Alert when 5xx error rate exceeds 1%"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.appforge.id
  }

  tags = {
    Name        = "${var.environment}-cdn-5xx-alarm"
    Environment = var.environment
  }
}
