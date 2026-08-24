# syntax=docker/dockerfile:1.12

ARG NODE_IMAGE=node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SOURCE_COMMIT
ARG NEXT_DEPLOYMENT_ID
ENV NODE_ENV=production \
    EJAM_DATA_ROOT=ejam/data \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_SOURCE_COMMIT=${NEXT_PUBLIC_SOURCE_COMMIT} \
    NEXT_DEPLOYMENT_ID=${NEXT_DEPLOYMENT_ID}

RUN --mount=type=secret,id=next_server_actions_encryption_key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,required=true \
    node scripts/validate-production-build-env.mjs && npm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ARG OCI_CREATED
ARG OCI_REVISION
ARG OCI_SOURCE=https://github.com/kewonit/deetnuts
LABEL org.opencontainers.image.created=${OCI_CREATED} \
      org.opencontainers.image.description="DEETNUTS Next.js web application" \
      org.opencontainers.image.licenses="MIT AND AGPL-3.0-or-later" \
      org.opencontainers.image.revision=${OCI_REVISION} \
      org.opencontainers.image.source=${OCI_SOURCE} \
      org.opencontainers.image.title="DEETNUTS web"

ENV NODE_ENV=production \
    EJAM_DATA_ROOT=ejam/data \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    HOME=/tmp \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=512

RUN rm -rf /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /opt/yarn-v1.22.22 && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx \
        /usr/local/bin/corepack /usr/local/bin/pnpm /usr/local/bin/pnpx \
        /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs && \
    mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app /tmp

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health',{headers:{accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error(String(r.status))}).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
