const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_DEPLOYMENT_ID",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
];

for (const name of required) {
  if (!process.env[name]?.trim()) {
    throw new Error(`${name} is required for a production image build`);
  }
}

const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
if (
  appUrl.origin !== "https://www.deetnuts.com" ||
  appUrl.href !== `${appUrl.origin}/`
) {
  throw new Error("NEXT_PUBLIC_APP_URL must be https://www.deetnuts.com");
}

const releasePattern = /^[0-9a-f]{40}$/;
if (!releasePattern.test(process.env.NEXT_DEPLOYMENT_ID)) {
  throw new Error("NEXT_DEPLOYMENT_ID must be a 40-character release digest");
}
const sourceCommit = process.env.NEXT_PUBLIC_SOURCE_COMMIT?.trim();
if (sourceCommit && !releasePattern.test(sourceCommit)) {
  throw new Error(
    "NEXT_PUBLIC_SOURCE_COMMIT must be a full Git SHA when it is supplied",
  );
}

const encodedEncryptionKey = process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY;
const encryptionKey = Buffer.from(encodedEncryptionKey, "base64");
if (
  !/^[A-Za-z0-9+/]{43}=$/.test(encodedEncryptionKey) ||
  encryptionKey.length !== 32 ||
  encryptionKey.toString("base64") !== encodedEncryptionKey
) {
  throw new Error(
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY must be canonical base64 for exactly 32 bytes",
  );
}

console.log("Production build environment is valid");
