routerAdd("POST", "/internal/timekeeper/mint", (e) => {
  if (!e.auth || e.auth.getString("role") !== "backend") throw e.forbiddenError("Backend access required", null);
  const data = new DynamicModel({ token_hash: "", client_hash: "", payload_json: "" });
  e.bindBody(data);
  if (!/^[0-9a-f]{64}$/.test(data.token_hash) || !/^[0-9a-f]{64}$/.test(data.client_hash) || !data.payload_json || data.payload_json.length > 65536) throw e.badRequestError("Invalid transfer", null);
  // A browser identity or precise location must never enter this collection.
  const payload = JSON.parse(data.payload_json);
  if (payload.version !== 1 || !Array.isArray(payload.countdowns) || payload.countdowns.length > 1000 || Object.keys(payload).some((key) => !["version", "countdowns", "theme", "avatarSeed"].includes(key))) throw e.badRequestError("Invalid transfer", null);
  const now = new Date().toISOString().replace("T", " ");
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  $app.runInTransaction((txApp) => {
    const recent = txApp.findRecordsByFilter("timekeeper_transfer_tickets", "client_hash = {:client} && expires_at > {:now}", "", 20, 0, { client: data.client_hash, now });
    if (recent.length >= 20) throw e.tooManyRequestsError("Please wait before creating another transfer", null);
    const record = new Record(txApp.findCollectionByNameOrId("timekeeper_transfer_tickets"));
    record.set("token_hash", data.token_hash);
    record.set("client_hash", data.client_hash);
    record.set("payload_json", data.payload_json);
    record.set("expires_at", expires);
    record.set("consumed", false);
    txApp.save(record);
  });
  return e.json(201, { expiresAt: expires });
}, $apis.bodyLimit(140000), $apis.requireAuth("app_services"));

routerAdd("POST", "/internal/timekeeper/redeem", (e) => {
  if (!e.auth || e.auth.getString("role") !== "backend") throw e.forbiddenError("Backend access required", null);
  const data = new DynamicModel({ token_hash: "" });
  e.bindBody(data);
  if (!/^[0-9a-f]{64}$/.test(data.token_hash)) throw e.badRequestError("Invalid transfer", null);
  let payload = null;
  $app.runInTransaction((txApp) => {
    const records = txApp.findRecordsByFilter("timekeeper_transfer_tickets", "token_hash = {:token} && consumed = false && expires_at > {:now}", "", 1, 0, { token: data.token_hash, now: new Date().toISOString().replace("T", " ") });
    if (!records.length) throw e.notFoundError("Transfer expired or already used", null);
    const record = records[0];
    payload = JSON.parse(record.getString("payload_json"));
    record.set("consumed", true);
    record.set("payload_json", "");
    txApp.save(record);
  });
  // Response is sent only after the transaction commits. Concurrent requests
  // cannot both obtain the payload; consumed rows keep the mint rate limit.
  return e.json(200, { payload });
}, $apis.bodyLimit(1024), $apis.requireAuth("app_services"));

cronAdd("timekeeper-transfer-cleanup", "*/5 * * * *", () => {
  $app.db().newQuery('DELETE FROM "timekeeper_transfer_tickets" WHERE "expires_at" <= {:now}')
    .bind({ now: new Date().toISOString().replace("T", " ") }).execute();
});
