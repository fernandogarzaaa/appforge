terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_ecs_cluster" "appforge" {
  name = "appforge-cluster"
}

resource "aws_ecr_repository" "appforge_backend" {
  name = "appforge-backend"
  image_scanning_configuration {
    scan_on_push = true
  }
}

output "cluster_name" {
  value = aws_ecs_cluster.appforge.name
}

output "backend_repo_url" {
  value = aws_ecr_repository.appforge_backend.repository_url
}
