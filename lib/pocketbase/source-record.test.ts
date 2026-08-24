import assert from "node:assert/strict";
import test from "node:test";
import {
  restoreSourceRecord,
  sourceTargetField,
  translateSourceFields,
  translateSourceFilter,
  translateSourceSort,
} from "./source-record";

test("restores the exact source row and projects requested fields", () => {
  const source = {
    id: "source-id",
    created: "2024-01-01T00:00:00Z",
    college_id: 1001,
  };
  const restored = restoreSourceRecord(
    {
      id: "pocketbase-id",
      collectionId: "collection-id",
      migration_source_hash: "a".repeat(64),
      migration_source_json: JSON.stringify(source),
    },
    "id,created,college_id",
  );
  assert.deepEqual(restored, source);
});

test("translates reserved source columns without changing filter values", () => {
  assert.equal(
    translateSourceFilter('id = "updated" && college_id = 1001'),
    `${sourceTargetField("id")} = "updated" && college_id = 1001`,
  );
  assert.equal(
    translateSourceSort("-updated,college_id"),
    `-${sourceTargetField("updated")},college_id`,
  );
  assert.equal(
    translateSourceFields("id,created,college_id"),
    `${sourceTargetField("id")},${sourceTargetField("created")},college_id,migration_source_json`,
  );
});

test("removes PocketBase and migration metadata from fallback records", () => {
  assert.deepEqual(
    restoreSourceRecord({
      id: "pocketbase-id",
      collectionId: "collection-id",
      collectionName: "example",
      migration_run_id: "run-id",
      [sourceTargetField("id")]: "source-id",
      college_id: 1001,
    }),
    { id: "source-id", college_id: 1001 },
  );
});
