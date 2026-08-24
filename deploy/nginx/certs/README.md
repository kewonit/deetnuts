Provisioning installs three files here on the Droplet and keeps them out of Git:

- `origin.pem`: Cloudflare Origin CA certificate for `deetnuts.com` and `*.deetnuts.com`
- `origin-key.pem`: matching private key
- `cloudflare-origin-pull-ca.pem`: Cloudflare Authenticated Origin Pull CA certificate

The directory must be owned by `root:101` with mode `0750`. All three files
must be owned by `root:101` with mode `0640`, allowing only root and the pinned
unprivileged Nginx container group to read them. The deployment helper rejects
symlinks or different ownership/modes. Never commit certificate private keys.
