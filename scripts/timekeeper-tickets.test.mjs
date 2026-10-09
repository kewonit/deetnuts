import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createServer } from "node:net";

// Real PocketBase tests always create their own database and credentials.
// No production address or ambient application credential is accepted.
const binary = process.env.POCKETBASE_TEST_BINARY;
if (!binary)
  throw new Error(
    "Set POCKETBASE_TEST_BINARY to the checksum-verified PocketBase 0.40.0 binary",
  );
assert.match(
  execFileSync(binary, ["--version"], { encoding: "utf8" }),
  /0\.40\.0/,
);
let directory, server, origin, adminToken, backendToken, userToken, database;
const password = randomBytes(24).toString("hex");
const hash = () => randomBytes(32).toString("hex");
const payload = {
  version: 1,
  countdowns: [
    {
      id: "fixture",
      title: "Fixture",
      description: "",
      targetDate: "2030-01-01T12:00",
      createdAt: "2026-10-09T00:00:00Z",
      color: "blue",
    },
  ],
  theme: "dark",
  avatarSeed: "fixture-avatar",
};
const delay = (ms) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
async function call(path, body, token = backendToken, method = "POST") {
  return fetch(`${origin}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(5000),
  });
}
async function mint(client = hash()) {
  const tokenHash = hash();
  const response = await call("/internal/timekeeper/mint", {
    token_hash: tokenHash,
    client_hash: client,
    payload_json: JSON.stringify(payload),
  });
  assert.equal(response.status, 201, await response.clone().text());
  return { tokenHash, expiresAt: (await response.json()).expiresAt };
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "timekeeper-ticket-test-"));
  const dataDir = join(directory, "data");
  const args = [
    "--dir",
    dataDir,
    "--migrationsDir",
    resolve("pocketbase/pb_migrations"),
    "--hooksDir",
    resolve("pocketbase/pb_hooks"),
  ];
  execFileSync(
    binary,
    ["superuser", "upsert", "admin@fixture.invalid", password, ...args],
    { stdio: "pipe" },
  );
  const socket = createServer();
  await new Promise((resolvePort) =>
    socket.listen(0, "127.0.0.1", resolvePort),
  );
  const port = socket.address().port;
  await new Promise((resolveClose) => socket.close(resolveClose));
  origin = `http://127.0.0.1:${port}`;
  server = spawn(
    binary,
    ["serve", "--http", `127.0.0.1:${port}`, "--hooksWatch=false", ...args],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let logs = "";
  server.stdout.on("data", (chunk) => {
    logs = (logs + chunk).slice(-4000);
  });
  server.stderr.on("data", (chunk) => {
    logs = (logs + chunk).slice(-4000);
  });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(`${origin}/api/health`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(100);
  }
  assert.ok(ready, `Isolated PocketBase failed to start: ${logs}`);
  const admin = await call(
    "/api/collections/_superusers/auth-with-password",
    { identity: "admin@fixture.invalid", password },
    null,
  );
  assert.equal(admin.status, 200);
  adminToken = (await admin.json()).token;
  for (const [collection, email, role] of [
    ["app_services", "backend@fixture.invalid", "backend"],
    ["users", "user@fixture.invalid", null],
  ]) {
    const created = await call(
      `/api/collections/${collection}/records`,
      { email, password, passwordConfirm: password, ...(role ? { role } : {}) },
      adminToken,
    );
    assert.equal(created.status, 200, await created.clone().text());
    const auth = await call(
      `/api/collections/${collection}/auth-with-password`,
      { identity: email, password },
      null,
    );
    assert.equal(auth.status, 200);
    if (role) backendToken = (await auth.json()).token;
    else userToken = (await auth.json()).token;
  }
  database = new DatabaseSync(join(dataDir, "data.db"), { readOnly: true });
});

after(async () => {
  database?.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolveExit) => server.once("exit", resolveExit));
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("ticket expiry is 15 minutes; concurrent redemption has exactly one winner and clears payload", async () => {
  const ticket = await mint();
  assert.ok(
    Math.abs(Date.parse(ticket.expiresAt) - Date.now() - 900000) < 5000,
  );
  const responses = await Promise.all(
    Array.from({ length: 8 }, () =>
      call("/internal/timekeeper/redeem", { token_hash: ticket.tokenHash }),
    ),
  );
  assert.equal(
    responses.filter((response) => response.status === 200).length,
    1,
  );
  assert.equal(
    responses.filter((response) => response.status === 404).length,
    7,
  );
  assert.deepEqual(
    (await responses.find((response) => response.status === 200).json())
      .payload,
    payload,
  );
  const record = database
    .prepare(
      "SELECT payload_json, consumed FROM timekeeper_transfer_tickets WHERE token_hash = ?",
    )
    .get(ticket.tokenHash);
  assert.equal(record.payload_json, "");
  assert.equal(record.consumed, 1);
});

test("expired tickets and replays return 404", async () => {
  const ticket = await mint();
  const record = database
    .prepare("SELECT id FROM timekeeper_transfer_tickets WHERE token_hash = ?")
    .get(ticket.tokenHash);
  assert.equal(
    (
      await call(
        `/api/collections/timekeeper_transfer_tickets/records/${record.id}`,
        { expires_at: "2020-01-01 00:00:00Z" },
        adminToken,
        "PATCH",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call("/internal/timekeeper/redeem", {
        token_hash: ticket.tokenHash,
      })
    ).status,
    404,
  );
});

test("public users and backend collection APIs cannot list or redeem private ticket records", async () => {
  const ticket = await mint();
  for (const token of [null, userToken]) {
    assert.ok(
      [401, 403].includes(
        (
          await call(
            "/internal/timekeeper/redeem",
            { token_hash: ticket.tokenHash },
            token,
          )
        ).status,
      ),
    );
    assert.equal(
      (
        await call(
          "/api/collections/timekeeper_transfer_tickets/records",
          null,
          token,
          "GET",
        )
      ).status,
      403,
    );
  }
  assert.equal(
    (
      await call(
        "/api/collections/timekeeper_transfer_tickets/records",
        null,
        backendToken,
        "GET",
      )
    ).status,
    403,
  );
});

test("mint rate limiting counts consumed tickets and rejects unexpected private payload fields", async () => {
  const client = hash();
  for (let index = 0; index < 20; index++) {
    const ticket = await mint(client);
    assert.equal(
      (
        await call("/internal/timekeeper/redeem", {
          token_hash: ticket.tokenHash,
        })
      ).status,
      200,
    );
  }
  assert.equal(
    (
      await call("/internal/timekeeper/mint", {
        token_hash: hash(),
        client_hash: client,
        payload_json: JSON.stringify(payload),
      })
    ).status,
    429,
  );
  assert.equal(
    (
      await call("/internal/timekeeper/mint", {
        token_hash: hash(),
        client_hash: hash(),
        payload_json: JSON.stringify({
          ...payload,
          authToken: "never-transfer",
        }),
      })
    ).status,
    400,
  );
});
