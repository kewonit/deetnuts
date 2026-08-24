const RELEASE_ID_PATTERN = /^[A-Za-z0-9._-]{7,64}$/;

export function normalizeDeploymentSha(value: string | undefined): string {
  const candidate = value?.trim();
  return candidate && RELEASE_ID_PATTERN.test(candidate)
    ? candidate
    : "unknown";
}

export function getDeploymentSha(): string {
  return normalizeDeploymentSha(process.env.DEPLOYMENT_SHA);
}
