Provisioning installs six files here on the Droplet and keeps them out of Git:

- `origin.pem`: Cloudflare Origin CA certificate for `deetnuts.com` and `*.deetnuts.com`
- `origin-key.pem`: matching private key
- `cloudflare-origin-pull-ca.pem`: Cloudflare Authenticated Origin Pull CA certificate
- `api-origin.pem`: dedicated Cloudflare Origin CA certificate for `api.deetnuts.com`
- `api-origin-key.pem`: matching dedicated private key
- `cloudflare-api-origin-pull-ca.pem`: public certificate of the private CA that
  signs only the per-host Cloudflare client certificate for `api.deetnuts.com`

The directory must be owned by `root:deetnuts-tls` with mode `0750`. All six
files must be owned by `root:deetnuts-tls` with mode `0640`, allowing only root
and the pinned supplementary GID used by the unprivileged Nginx container to
read them. The deployment helper rejects symlinks or different
ownership/modes. Never commit certificate private keys.
