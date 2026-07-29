import assert from "node:assert/strict";
import test from "node:test";

import { serializeJsonLd } from "./json-ld";

test("serializes JSON-LD without allowing a script-closing sequence", () => {
  const serialized = serializeJsonLd({
    name: "</script><script>alert(1)</script>",
  });

  assert.equal(serialized.includes("</script>"), false);
  assert.deepEqual(JSON.parse(serialized), {
    name: "</script><script>alert(1)</script>",
  });
});
