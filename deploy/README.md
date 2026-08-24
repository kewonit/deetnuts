# DigitalOcean production runtime

This directory contains the local, reviewable part of the Vercel-to-DigitalOcean migration. Running the host bootstrap, changing cloud resources, configuring providers, and cutting over DNS are deliberately separate operations.

## Security boundaries

- Only the unprivileged Nginx container publishes a port.
- Origin TLS requires Cloudflare Authenticated Origin Pulls.
- The DigitalOcean Cloud Firewall must allow origin 443 only from Cloudflare's published IPv4 and IPv6 ranges.
- SSH must be restricted to the administrator allowlist. CI receives a temporary runner `/32` rule only while deploying.
- The forced deployment key can call only `deploy`, `rollback`, or `status`; it cannot open a shell or invoke arbitrary sudo commands.
- Deployment and rollback commands are serialized with a host lock; an overlapping command fails closed.
- Web and worker images stay private in GHCR. The Droplet uses a dedicated classic token with `read:packages` only.
- Bootstrap disables SSH passwords and keyboard-interactive login, keeps root key-only access, enables unattended security updates without automatic reboots, and validates a hardened Docker daemon configuration.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is a persistent 32-byte base64 build secret. It is embedded in the Next.js output, which is why the image cannot be public.
- PocketBase is reachable only as `http://pocketbase:8090` on the private application network; no host or public port is published.
- PocketBase encryption, superuser, and migration secrets are separate root-owned files readable only by GID `10001`. The web container receives only a 32-to-72-character backend service password through `web.env`.
- Supabase source credentials belong only in the root-owned one-time migration environment and are never passed to a runtime container.
- Discord command-registration credentials belong in `/opt/deetnuts/shared/discord-admin.env`; they are not passed to the web or worker containers.
- The Cloudflare token in `/opt/deetnuts/shared/cloudflare.env` is root-only and must be scoped to `Zone / Cache Purge` for only the `deetnuts.com` zone. It is never passed to an application container.
- Origin TLS material is owned by `root:deetnuts-tls` with mode `0640`; the Nginx container receives only that dedicated supplementary GID.
- Next.js on-demand prerenders are written only to the release-scoped directory in the slot's `.next/cache` volume. Build-generated seed pages remain in the immutable image, and old release cache directories are removed when a new release starts in that slot.
- After a deployment passes its observation window and the previous slot stops, only that stopped slot's release-scoped prerender directories are pruned. Rollback images and manifests remain available, but a rollback may regenerate those pages from a cold cache.
- Nginx resolves the active Compose service through Docker's embedded DNS every 10 seconds, so an active container can be recreated or renumbered without leaving the proxy pinned to a stale address.

## Files installed on the host

- `/opt/deetnuts/docker-compose.yml`
- `/opt/deetnuts/deploy`: Nginx and deployment helpers
- `/opt/deetnuts/shared/web.env`: web runtime secrets, mode `0600`
- `/opt/deetnuts/shared/worker.env`: disabled worker secrets, mode `0600`
- `/opt/deetnuts/shared/cloudflare.env`: zone ID and cache-purge-only token, mode `0600`
- `/opt/deetnuts/shared/discord-admin.env`: offline Discord command-registration credentials, mode `0600`
- `/opt/deetnuts/shared/pocketbase`: PocketBase secret files, mode `0440`, owner `root:deetnuts-pocketbase`
- `/opt/deetnuts/backups/pocketbase`: verified local PocketBase backup copies with seven-copy retention
- `/opt/deetnuts/shared/certs`: Origin CA certificate/key and Origin Pull CA
- `/opt/deetnuts/state/compose.env`: immutable slot image digests
- `/opt/deetnuts/state/active-slot`: the only slot permitted to restart
- `/opt/deetnuts/state/releases`: the latest three rollback manifests

## Required external configuration

1. Create the FRA1 Ubuntu 24.04 Droplet without backups, snapshots, or a Reserved IP.
2. Run `bootstrap-host.sh` locally reviewed from this repository; do not pipe a remote script into a shell.
3. Authenticate Docker to GHCR using the dedicated read-only token.
4. Replace every example value in `shared/web.env`; include only the private PocketBase service account, OAuth-state secret, and application runtime values.
5. Install `origin.pem`, `origin-key.pem`, and `cloudflare-origin-pull-ca.pem` in `shared/certs`. Keep the directory `root:deetnuts-tls`/`0750` and all three files `root:deetnuts-tls`/`0640`; the dedicated group GID must match `NGINX_TLS_GID` (1999 by default).
6. Configure the DigitalOcean firewall and Monitoring agent before exposing DNS.
7. Set Cloudflare Full (strict), Authenticated Origin Pulls, canonical redirects, WAF exclusions, and cache rules. Create a zone-scoped token with only `Zone / Cache Purge` for `deetnuts.com`, then put it and the zone ID in `shared/cloudflare.env`.
8. Configure the Google OAuth web client with the exact redirect URI `https://www.deetnuts.com/auth/callback`, then store its client ID and secret only in the root-owned one-time migration environment.
9. Run `deetnuts-pocketbase-migrate` against the read-only Supabase source. Do not cut over until its global count/digest, Google identity, storage byte/hash, and backup checks pass.
10. Add `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` as a repository Actions secret before publishing images. It must remain stable across releases and contain canonical base64 for exactly 32 bytes.
11. Add `DO_HOST`, `DO_FIREWALL_ID`, `DO_API_TOKEN`, `DO_SSH_PRIVATE_KEY`, and `DO_SSH_HOST_KEY` to the GitHub Production environment only after the host and firewall exist. Set the repository variable `DO_DEPLOY_ENABLED=true` only when that configuration is complete; image publication remains available while deployment is disabled.
12. Perform the first deployment with the `origin-only` verification mode. Use normal `public` verification only after DNS points through Cloudflare.

`bootstrap-host.sh` is a provisioning/update operation, not a live reload. For a later host-file update, stop `deetnuts.service`, run the reviewed bootstrap from the desired checkout, then start the service and verify it. The script refuses to replace bind-mounted configuration while the service is active and reconstructs the Nginx upstream from the retained active-slot marker.

The Reddit worker is a disabled Compose profile. Do not start it during web deployment. Its later activation begins with dry-run mode and separate credential validation.

## Cache-safe deployments

Public deployments purge only the `www.deetnuts.com` hostname immediately after Nginx switches to the healthy candidate. A purge failure triggers the normal rollback path. This prevents cached HTML or React Server Component responses from referencing static assets that disappeared in the new immutable image. The purge must never target the whole Cloudflare zone because `api.deetnuts.com` and unrelated hostnames are outside the web migration.

After every deployment, verify a cacheable indexed page twice: the first response may be `MISS`, the second must be `HIT`, and both must identify the new deployment. Probe the same URL with the `RSC: 1` header and confirm it remains `text/x-component`; then fetch normal HTML again and confirm it remains `text/html`. `robots.txt`, the sitemap index, canonical redirects, and the production verification script must also pass before retiring a rollback image.
