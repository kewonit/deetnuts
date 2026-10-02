import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";
import { getJeeCollegeCanonicalRedirectPath } from "./canonical";
import { getJeeCutoffCatalog } from "./repository";

test("every published college hub and year alias resolves to its exact exam", async () => {
  const catalog = await getJeeCutoffCatalog();
  for (const college of catalog.colleges) {
    const correct = "/" + college.examId + "/colleges/" + college.id;
    const wrong =
      "/" +
      (college.examId === "jee-main" ? "jee-advanced" : "jee-main") +
      "/colleges/" +
      college.id;
    assert.equal(getJeeCollegeCanonicalRedirectPath(correct), null);
    assert.equal(getJeeCollegeCanonicalRedirectPath(wrong), correct);
    for (const page of college.pages) {
      assert.equal(
        getJeeCollegeCanonicalRedirectPath(wrong + "/cutoffs/" + page.year),
        correct + "/cutoffs/" + page.year,
      );
      assert.equal(
        getJeeCollegeCanonicalRedirectPath(correct + "/cutoffs/" + page.year),
        null,
      );
    }
    assert.equal(
      getJeeCollegeCanonicalRedirectPath(wrong + "/cutoffs/1900"),
      null,
    );
  }
  assert.equal(
    getJeeCollegeCanonicalRedirectPath("/jee-main/colleges/not-a-college"),
    null,
  );
});

test("wrong-exam redirects have one destination and preserve neutral query state before rendering", async () => {
  const response = await proxy(
    new NextRequest(
      "https://www.deetnuts.com/jee-main/colleges/iit-bhilai/cutoffs/2025?round=1",
    ),
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://www.deetnuts.com/jee-advanced/colleges/iit-bhilai/cutoffs/2025?round=1",
  );
  assert.doesNotMatch(response.headers.get("location") ?? "", /,/);
});
