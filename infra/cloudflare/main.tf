locals {
  api_hostname = "api.deetnuts.com"
}

resource "cloudflare_zero_trust_access_application" "pocketbase" {
  account_id                  = var.cloudflare_account_id
  name                        = "DEETNUTS PocketBase production"
  type                        = "self_hosted"
  domain                      = local.api_hostname
  destinations                = [{ type = "public", uri = local.api_hostname }]
  allowed_idps                = [var.google_identity_provider_id]
  auto_redirect_to_identity   = true
  allow_authenticate_via_warp = false
  app_launcher_visible        = false
  enable_binding_cookie       = true
  http_only_cookie_attribute  = true
  path_cookie_attribute       = false
  same_site_cookie_attribute  = "lax"
  options_preflight_bypass    = false
  service_auth_401_redirect   = false
  session_duration            = "1h"
  skip_interstitial           = false

  mfa_config = {
    allowed_authenticators = ["security_key", "biometrics", "totp"]
    mfa_disabled           = false
    session_duration       = "1h"
  }

  policies = [{
    name       = "Allow only the designated administrator with the dedicated Google IdP"
    decision   = "allow"
    precedence = 1
    mfa_config = {
      allowed_authenticators = ["security_key", "biometrics", "totp"]
      mfa_disabled           = false
      session_duration       = "1h"
    }
    include = [{
      email = { email = var.allowed_email }
    }]
    require = [{
      login_method = { id = var.google_identity_provider_id }
    }]
  }]

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_authenticated_origin_pulls" "api" {
  zone_id = var.cloudflare_zone_id
  config = [{
    cert_id  = var.api_aop_certificate_id
    enabled  = true
    hostname = local.api_hostname
  }]

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_dns_record" "api" {
  count = var.enable_public_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = local.api_hostname
  type    = "A"
  content = var.droplet_ipv4
  proxied = true
  ttl     = 1
  comment = "Protected PocketBase production route; managed by HCP Terraform"

  depends_on = [
    cloudflare_authenticated_origin_pulls.api,
    cloudflare_zero_trust_access_application.pocketbase,
  ]

  lifecycle {
    prevent_destroy = true
  }
}
