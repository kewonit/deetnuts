# syntax=docker/dockerfile:1.12

ARG NODE_IMAGE=node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

FROM ${NODE_IMAGE}
WORKDIR /app

ARG OCI_CREATED
ARG OCI_REVISION
ARG OCI_SOURCE=https://github.com/kewonit/deetnuts
LABEL org.opencontainers.image.created=${OCI_CREATED} \
      org.opencontainers.image.description="Cloudflare Access JWT verifier for the DEETNUTS PocketBase origin" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.revision=${OCI_REVISION} \
      org.opencontainers.image.source=${OCI_SOURCE} \
      org.opencontainers.image.title="DEETNUTS Access verifier"

RUN apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /opt/yarn-v1.22.22 && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx \
        /usr/local/bin/corepack /usr/local/bin/pnpm /usr/local/bin/pnpx \
        /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    addgroup --system --gid 10002 verifier && \
    adduser --system --uid 10002 --ingroup verifier verifier

COPY --chown=verifier:verifier server.mjs verify.mjs ./

USER 10002:10002
EXPOSE 8081
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8081/healthz').then(r=>{if(!r.ok)throw new Error(String(r.status))}).catch(()=>process.exit(1))"]
CMD ["node", "server.mjs"]
