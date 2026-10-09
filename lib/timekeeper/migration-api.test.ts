import assert from "node:assert/strict";
import test from "node:test";
import {
  migrationHeaders,
  migrationOptions,
  migrationRequest,
} from "./migration-api";

const request = (origin: string, body = "{}", type = "application/json") =>
  new Request("https://www.deetnuts.com/api/exam-countdown/migration", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": type },
    body,
  });
test("tickets can be minted only by the old origin and redeemed only by the destination", () => {
  assert.ok(migrationHeaders(request("https://timekeeper.edbn.me"), "mint"));
  assert.equal(migrationHeaders(request("https://evil.example"), "mint"), null);
  assert.equal(
    migrationHeaders(
      request("https://timekeeper.edbn.me.evil.example"),
      "mint",
    ),
    null,
  );
  assert.equal(
    migrationHeaders(request("https://timekeeper.edbn.me"), "redeem"),
    null,
  );
  assert.ok(migrationHeaders(request("https://www.deetnuts.com"), "redeem"));
  assert.equal(
    migrationOptions(request("https://evil.example"), "mint").status,
    403,
  );
  assert.equal(
    migrationOptions(request("https://timekeeper.edbn.me"), "mint").status,
    204,
  );
});
test("invalid types, oversized exports and malformed tickets fail before PocketBase access", async () => {
  for (const [body, type] of [
    ["not JSON", "application/json"],
    ["{}", "text/plain"],
    [JSON.stringify({ title: "x".repeat(70000) }), "application/json"],
    [
      JSON.stringify({ version: 1, countdowns: [{ targetDate: "invalid" }] }),
      "application/json",
    ],
  ]) {
    const response = await migrationRequest(
      request("https://timekeeper.edbn.me", body, type),
      "mint",
    );
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(
    (
      await migrationRequest(
        request("https://www.deetnuts.com", JSON.stringify({ token: "bad" })),
        "redeem",
      )
    ).status,
    400,
  );
  assert.equal(
    (await migrationRequest(request("https://evil.example"), "mint")).status,
    403,
  );
});
