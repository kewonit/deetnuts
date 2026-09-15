terraform {
  required_version = "= 1.16.2"

  cloud {}

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "= 5.23.0"
    }
  }
}

provider "cloudflare" {}
