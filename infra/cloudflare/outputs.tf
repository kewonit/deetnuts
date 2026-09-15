output "access_application_audience" {
  description = "Copy this value to CF_ACCESS_AUD on the origin before enabling public DNS."
  value       = cloudflare_zero_trust_access_application.pocketbase.aud
  sensitive   = true
}

output "api_hostname" {
  value = "api.deetnuts.com"
}

output "public_dns_enabled" {
  value = var.enable_public_dns
}
