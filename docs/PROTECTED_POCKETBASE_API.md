# Protected PocketBase API rollout

This runbook exposes the production PocketBase service at
`https://api.deetnuts.com` without publishing port 8090:

```text
Chrome Work profile
  -> Cloudflare Access (Google + independent MFA, one exact email)
    -> proxied Cloudflare DNS and per-hostname Authenticated Origin Pulls
      -> Nginx :443
        -> Access JWT signature/audience/email verifier
          -> PocketBase :8090 on the private Docker network
```

The route is for interactive browser administration only. It does not create
an Access service token and it does not replace the application's existing
PocketBase authentication.

## Fixed production values

| Item | Required value |
| --- | --- |
| Public hostname | `api.deetnuts.com` |
| Cloudflare team domain | `deetnuts.cloudflareaccess.com` |
| Only allowed identity | Exact email kept in sensitive runtime configuration |
| Access and MFA session | 1 hour |
| Droplet | Existing production Droplet selected from the private operations record |
| Region and OS | FRA1, Ubuntu 24.04 |
| Target size | `s-1vcpu-2gb-70gb-intel` only |
| HCP Terraform workspace | `deetnuts-cloudflare-production` |
| Terraform / provider | `1.16.2` / `cloudflare/cloudflare 5.23.0` |

Stop instead of substituting another value if the team domain or target size
is unavailable. An existing Cloudflare Google IdP that reports the wrong
identity is not valid for this application and must remain unselected.

## Services and total cost

Prices are USD before tax and must be checked again in each provider's review
screen before a paid change.

| Service | Use | Expected incremental cost |
| --- | --- | ---: |
| DigitalOcean Basic Premium Intel Droplet | One VM for Nginx, Next.js, verifier, worker profile and PocketBase | `$0.02381/hour`, advertised/capped at `$16/month`; 1 vCPU, 2 GiB RAM, 70 GiB NVMe and 2,000 GiB transfer |
| DigitalOcean Cloud Firewall and basic monitoring | Restrict 443 to Cloudflare and SSH to approved addresses | `$0` |
| DigitalOcean powered-off snapshot | Short-lived rollback point for the resize | `$0.06/GB-month`; at most about `$0.20` for 48 hours at the current 50 GB disk, or a conservative `$0.28` at 70 GB |
| DigitalOcean transfer overage | Only outbound use above the team transfer pool | `$0.01/GiB`; expected `$0` |
| Cloudflare DNS, proxy, Origin CA and AOP | DNS/TLS, DDoS/WAF edge and account-specific origin mTLS | `$0` on the existing zone plan |
| Cloudflare Zero Trust Access | One browser user, exact-email policy and MFA | `$0` while the account remains within the Free-plan allowance |
| Google Cloud OAuth client | Dedicated Google sign-in for Cloudflare Access | `$0` direct service charge |
| HCP Terraform | Remote state, plan and reviewed apply for three resources | `$0` on the Free plan while the organization remains below 500 managed resources |
| GitHub Actions and GHCR | Public-repository verification and four immutable images | `$0` for standard public-repository usage, subject to package/storage limits |
| Nginx, PocketBase and the JWT verifier | Open-source runtime containers on the Droplet | `$0` beyond the Droplet |

Expected steady-state total: **$16/month before tax**, with an expected
one-time snapshot cost below **$0.28**. Domain registration, optional paid
Cloudflare add-ons, excess GitHub storage and bandwidth overages are excluded.
The resize review screen is the final price authority.

Pricing references:

- [DigitalOcean Droplet pricing](https://docs.digitalocean.com/products/droplets/details/pricing/)
- [DigitalOcean snapshot pricing](https://docs.digitalocean.com/products/snapshots/details/pricing/)
- [DigitalOcean bandwidth billing](https://docs.digitalocean.com/platform/billing/bandwidth/)
- [Cloudflare Access limits](https://developers.cloudflare.com/cloudflare-one/account-limits/)
- [HCP Terraform plans](https://developer.hashicorp.com/terraform/cloud-docs/overview)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

## Use the Chrome Work profile

1. In Chrome, select the profile avatar and open **Work**. Do not continue in
   Personal, Guest or Incognito.
2. Open `https://cloud.digitalocean.com`. Sign in with the saved GitHub login,
   select the team containing the production Droplet, and compare the Droplet
   ID with the private operations record before a change.
3. Open `https://dash.cloudflare.com`. Compare the signed-in address, account
   name and account ID with the private operations record before a change.
4. Open `https://console.cloud.google.com`. Confirm the avatar email is
   the exact address stored as the sensitive `allowed_email` HCP variable
   before creating the project or OAuth client.
5. Keep each provider in its own tab. Recheck the account banner immediately
   before every **Create**, **Save**, **Apply**, **Resize** or **Delete** action.

If any page displays an unexpected identity, stop and select the designated
Google account in the Work profile. Do not “fix” a mismatch by widening the
Access policy.

## 1. Establish recoverable SSH administration

Use a dedicated passphrase-protected Ed25519 workstation key. Keep its path,
fingerprint and Keychain reference in the private operations record, never in
Git. Never paste the private key or passphrase into a browser, chat, repository
or VM console.

1. In DigitalOcean **Settings -> Security -> SSH keys**, add the public key as
   a descriptive name that does not expose a person or workstation. Adding it
   to the team does not modify
   an existing Droplet.
2. Open the Droplet Recovery Console. On the VM, run
   `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` and compare it with a
   locally derived fingerprint before trusting the existing `known_hosts`
   entry.
3. Through the console or a previously trusted root session, create
   `deetnuts-admin`, add it to `sudo`, create its `.ssh` directory with mode
   `0700`, and install only the new public key as `authorized_keys` mode
   `0600`.
4. The operator must set the admin password directly in the console. Do not
   transmit it. Keep `PasswordAuthentication no`; the password is for `sudo`,
   not remote login.
5. From two fresh local terminals, test key-only SSH and `sudo -v`. Keep the
   recovery console open while testing.
6. Run the reviewed `deploy/bootstrap-host.sh` with
   `DEETNUTS_ADMIN_PUBLIC_KEY` set. Only after both sessions and console
   recovery work, rerun with `DEETNUTS_DISABLE_ROOT_SSH=1`. Confirm a third
   fresh admin session before closing the root session.

Keep `deetnuts-deploy` unchanged. It has a forced command and can deploy but
cannot open a shell. If the host fingerprint differs, treat it as a possible
rebuild or interception and investigate in the Recovery Console; never accept
the new key automatically.

## 2. Create the dedicated Google identity provider

1. In Google Cloud, create project `deetnuts-cloudflare-access` under
   the designated administrator account.
2. Configure the OAuth consent screen as **External**, request only
   `openid`, `email` and `profile`, and publish it to Production. Add no
   sensitive scopes.
3. Create a **Web application** OAuth client named
   `Cloudflare Access - DEETNUTS production` with:

   - Authorized JavaScript origin:
     `https://deetnuts.cloudflareaccess.com`
   - Authorized redirect URI:
     `https://deetnuts.cloudflareaccess.com/cdn-cgi/access/callback`

4. In Cloudflare Zero Trust, claim exactly
   `deetnuts.cloudflareaccess.com`. If unavailable, stop; do not select a
   similar team name.
5. Under **Access controls -> Access settings**, enable independent MFA at the
   organization level. This is a prerequisite for the application and policy
   custom MFA settings; it must not be skipped.
6. Add a new Google identity provider using the new client ID and secret.
   Name it `Google - DEETNUTS API administrator`. Do not edit or delete the
   existing mismatched IdP.
7. Use Cloudflare's **Test** action in the Work profile. The returned email
   claim must exactly match the sensitive `allowed_email` value. A missing
   email, alias or any other value is a failed test.

Store the OAuth secret only in Google and Cloudflare. It is intentionally not
managed by Terraform or committed to Git.

## 3. Create the dedicated TLS and AOP material

Do not replace `origin.pem`, `origin-key.pem` or the current apex/www AOP CA.

1. In Cloudflare **SSL/TLS -> Origin Server**, create an ECC Origin CA
   certificate containing only `api.deetnuts.com`. Install it on the VM as
   `api-origin.pem` and `api-origin-key.pem`.
2. Generate a private root CA and a leaf client certificate for the per-host
   AOP flow. The leaf must use `basicConstraints=CA:FALSE`, client-auth extended
   key usage, a random serial number, and at most a two-year validity. Keep the
   CA private key encrypted and off the VM.
3. Upload the leaf certificate and its private key to Cloudflare's
   per-hostname Authenticated Origin Pulls area. Associate only
   `api.deetnuts.com` and record the returned certificate ID for Terraform.
4. Install only the CA public certificate on the VM as
   `cloudflare-api-origin-pull-ca.pem`.
5. Set `/opt/deetnuts/shared/certs` to `root:deetnuts-tls` mode `0750` and all
   six certificate/key files to `root:deetnuts-tls` mode `0640`. Run
   `validate-origin-certs` before starting Nginx.

Cloudflare Origin CA private keys and AOP leaf private keys are credentials.
Create, upload and install them in one controlled session; never write them to
the repository or HCP Terraform state.

## 4. Configure HCP Terraform without public DNS

Create the HCP workspace `deetnuts-cloudflare-production` with remote execution
and **auto apply disabled**. Configure Terraform version `1.16.2` and these
workspace variables:

| Variable | Kind | Value |
| --- | --- | --- |
| `cloudflare_account_id` | Terraform, sensitive | exact account ID from the Work profile |
| `cloudflare_zone_id` | Terraform, sensitive | exact `deetnuts.com` zone ID |
| `droplet_ipv4` | Terraform, sensitive | exact production origin IPv4 from DigitalOcean |
| `google_identity_provider_id` | Terraform, sensitive | ID of the new dedicated IdP |
| `api_aop_certificate_id` | Terraform, sensitive | ID of the uploaded per-host AOP leaf |
| `allowed_email` | Terraform, sensitive | exact designated Google email |
| `enable_public_dns` | Terraform | `false` |
| `CLOUDFLARE_API_TOKEN` | Environment, sensitive | narrow production Terraform token |

The token needs only the `deetnuts.com` zone and the permissions required for
DNS, Access applications/policies and hostname AOP association. It must not
have account membership, billing, Workers or unrelated-zone permissions.

Add GitHub repository variable `HCP_TERRAFORM_ORGANIZATION` and secret
`HCP_TERRAFORM_TOKEN`. The HCP token should access only this workspace. Run the
**Plan or apply Cloudflare infrastructure** workflow with `plan`, review the
named saved `run-*` in HCP, then dispatch `apply-reviewed-run` with that exact
ID. The workflow uploads a provisional configuration and creates a saved plan;
the apply job rejects a different workspace, a speculative run or a run that
is not confirmable. A no-change plan is reported and cannot be applied.

This first apply creates the Access application and AOP hostname association,
but no DNS record. Copy output `access_application_audience` to
`CF_ACCESS_AUD` in `/opt/deetnuts/shared/access-verifier.env`; keep the team
domain and exact email unchanged.

## 5. Take verified backups before host or disk changes

1. While PocketBase is healthy, run:

   ```bash
   sudo deetnuts-pocketbase-backup --fresh --no-prune
   ```

   The command asks PocketBase to create a new archive, validates ZIP paths and
   CRCs, runs SQLite integrity and foreign-key checks, writes per-table row
   counts, and writes archive/database SHA-256 values.
2. Copy the new ZIP, `.sha256` and `.counts.tsv` to the workstation over the
   pinned admin SSH connection. Compare the remote and local archive SHA-256.
3. Encrypt the workstation ZIP with AES-256 or an offline public key, verify a
   decrypted copy with `unzip -t`, and keep the encrypted copy outside the VM.
   Do not delete the VM copy.
4. Record `docker compose ps`, the active slot, image digests, `lsblk`, `df -h`,
   service status, and the table-count manifest.
5. Stop `deetnuts.service`, power off the VM cleanly, and create a named
   DigitalOcean snapshot. Wait for the snapshot to become fully available
   before any resize.

No schema migration, collection deletion, account reset or PocketBase restore
is part of this rollout.

## 6. Resize only after the live catalog gate

Use a short-lived, narrowly scoped DigitalOcean API token or the Work-profile
control panel to query the FRA1 catalog. Continue only if
`s-1vcpu-2gb-70gb-intel` is available and its review screen still shows the
expected 1 vCPU, 2 GiB, 70 GiB, 2,000 GiB and `$16/month` price.

Select the permanent disk resize. It cannot be reversed to a smaller disk.
After boot, verify the filesystem expanded, the host fingerprint is unchanged,
systemd units are healthy, PocketBase row counts match, and apex/www health is
unchanged. If any check fails, keep DNS disabled and recover to a new Droplet
from the powered-off snapshot; do not attempt an in-place disk shrink.

## 7. Deploy and cut over

1. Build and deploy the four immutable images: web, worker, PocketBase and
   Access verifier. Install the reviewed Compose, Nginx and helper files on the
   stopped service before starting it.
2. Confirm the Access verifier, PocketBase, active web slot and Nginx are all
   healthy. `validate-access-verifier-env` and `validate-origin-certs` must pass.
3. Direct-origin HTTPS with `--resolve` and no AOP client certificate must fail
   before HTTP is served. Apex and www must continue to pass their existing
   Cloudflare path.
4. Set HCP variable `enable_public_dns=true`, create and review a new plan, and
   apply that exact `run-*`. Terraform creates the proxied A record only after
   the Access application and AOP association exist.
5. In a clean Work-profile tab, visit `https://api.deetnuts.com/_/`. Confirm
   automatic Google redirect, the exact Gmail identity, independent MFA, then
   PocketBase's own superuser login. Inspect cookies without copying values.
6. Confirm an unauthenticated request never reaches PocketBase, a wrong Google
   identity is denied, `Cache-Control: private, no-store` is present, uploads
   up to 64 MiB work, larger bodies receive 413, and PocketBase realtime SSE
   remains connected longer than two minutes.
7. Confirm Nginx strips the Access JWT and Access cookies before proxying to
   PocketBase. Review logs for status and request IDs only; token values must
   never be logged.

Keep the snapshot for a 48-hour observation period. Deleting it is a separate,
explicitly approved action after health, login, backup and row-count checks
remain stable.

## Failure and edge-case rules

| Condition | Required response |
| --- | --- |
| Team domain unavailable | Stop; do not invent a suffix. |
| Google test returns the old or another email | Stop; fix Work-profile Google selection or the dedicated IdP. Never widen policy. |
| New IdP would require changing an existing IdP | Create a separate IdP; preserve existing consumers. |
| AOP certificate is pending | Keep DNS disabled until active and origin validation passes. |
| Access audience changes after app replacement | `prevent_destroy` blocks routine replacement. If deliberately replaced, update the origin audience before DNS. |
| JWKS endpoint is unavailable | Verifier uses cached keys until their bounded TTL, then fails closed with 401. |
| Cloudflare signing key rotates | Unknown `kid` triggers one forced JWKS refresh, then fails closed. |
| Verifier is unhealthy | Nginx deployment/start is blocked; no bypass route exists. |
| Direct-IP request forges Access headers | AOP mTLS rejects it before Nginx HTTP authorization. |
| Browser redirect loop | Confirm SameSite is Lax, third-party cookies are not blocked for the app/team domains, and incompatible Zaraz/Google tag gateway features are absent. |
| Target size or price differs | Stop before Resize; no fallback slug. |
| Backup ZIP, SQLite, hash or counts fail | Stop before shutdown/snapshot/resize. Preserve all copies for diagnosis. |
| Resize fails or disk does not expand | Keep DNS disabled and recover a new Droplet from the snapshot. Never shrink in place. |
| Root-disable test fails | Restore `PermitRootLogin prohibit-password` in the open console and reload SSH. |
| Production API test would mutate data | Use health/read-only checks or a separately approved disposable record; never use a destructive “test.” |

## Rollback

Before DNS cutover, rollback means leaving `enable_public_dns=false`. After
cutover, an application failure is handled by the retained image release and
the deployment helper. An Access/AOP/DNS failure is fixed with a reviewed HCP
run; `prevent_destroy` makes accidental deletion fail. A host/disk failure is
recovered by creating a replacement Droplet from the powered-off snapshot,
verifying all row counts and hashes, updating the origin IP through a reviewed
plan, and only then resuming traffic.

Never delete the active Droplet, PocketBase volume, local backup, encrypted
off-host copy, AOP CA or snapshot as part of rollback.
