variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the DEETNUTS zone and Zero Trust organization."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
    error_message = "cloudflare_account_id must be a 32-character lowercase hexadecimal ID."
  }
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for deetnuts.com."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_zone_id))
    error_message = "cloudflare_zone_id must be a 32-character lowercase hexadecimal ID."
  }
}

variable "droplet_ipv4" {
  description = "Public IPv4 address of the production origin Droplet."
  type        = string
  sensitive   = true

  validation {
    condition     = can(cidrhost("${var.droplet_ipv4}/32", 0))
    error_message = "droplet_ipv4 must be a valid IPv4 address."
  }
}

variable "google_identity_provider_id" {
  description = "ID of the dedicated Google IdP for the allowlisted administrator."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-f-]{32,36}$", var.google_identity_provider_id))
    error_message = "google_identity_provider_id must be a Cloudflare identity provider ID."
  }
}

variable "api_aop_certificate_id" {
  description = "ID of the manually uploaded per-hostname Authenticated Origin Pulls client certificate."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[0-9a-f-]{32,36}$", var.api_aop_certificate_id))
    error_message = "api_aop_certificate_id must be a Cloudflare certificate ID."
  }
}

variable "allowed_email" {
  description = "Only identity allowed through the API Access policy and origin verifier."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.allowed_email) <= 254 && lower(var.allowed_email) == var.allowed_email && can(regex("^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$", var.allowed_email))
    error_message = "allowed_email must be the lowercase Google email selected for this protected route."
  }
}

variable "enable_public_dns" {
  description = "Cutover gate. Leave false until the origin certificate, verifier audience, AOP, and recovery tests pass."
  type        = bool
  default     = false
}
