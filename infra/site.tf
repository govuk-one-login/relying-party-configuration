terraform {
  backend "s3" {}
}

provider "aws" {
  region = "eu-west-2"

  default_tags {
    tags = {
      Product     = var.product
      System      = var.system
      Environment = var.environment
      Owner       = var.owner_email
    }
  }
}
