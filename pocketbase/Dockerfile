# syntax=docker/dockerfile:1.12

ARG ALPINE_IMAGE=alpine:3.23.5@sha256:fd791d74b68913cbb027c6546007b3f0d3bc45125f797758156952bc2d6daf40

FROM ${ALPINE_IMAGE} AS downloader
ARG POCKETBASE_VERSION=0.40.0
ARG POCKETBASE_LINUX_AMD64_SHA256=983740a4e5cc3b60c03d018c5a97ffe32ea560d6f55a53e2bca1ce3aae2cf8cb
WORKDIR /download
RUN wget -q -O pocketbase.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip" && \
    echo "${POCKETBASE_LINUX_AMD64_SHA256}  pocketbase.zip" | sha256sum -c - && \
    unzip -q pocketbase.zip pocketbase && \
    chmod 0555 pocketbase

FROM ${ALPINE_IMAGE}
ARG POCKETBASE_VERSION=0.40.0
LABEL org.opencontainers.image.description="Private DEETNUTS PocketBase service" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/pocketbase/pocketbase" \
      org.opencontainers.image.title="DEETNUTS PocketBase" \
      org.opencontainers.image.version=${POCKETBASE_VERSION}

RUN addgroup -S -g 10001 pocketbase && \
    adduser -S -D -H -u 10001 -G pocketbase pocketbase && \
    mkdir -p /pb/pb_data /pb/pb_hooks /pb/pb_migrations && \
    chown -R pocketbase:pocketbase /pb

COPY --from=downloader /download/pocketbase /usr/local/bin/pocketbase
COPY --chown=pocketbase:pocketbase docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --chown=pocketbase:pocketbase pb_hooks /pb/pb_hooks
COPY --chown=pocketbase:pocketbase pb_migrations /pb/pb_migrations

RUN chmod 0555 /usr/local/bin/docker-entrypoint.sh && \
    find /pb/pb_hooks /pb/pb_migrations -type f -exec chmod 0444 {} +

USER 10001:10001
WORKDIR /pb
EXPOSE 8090
VOLUME ["/pb/pb_data"]
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8090/api/health"]
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
