# Temporary braces security patch

This private copy of the MIT-licensed `braces` 3.0.3 release fixes [CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Upstream has no patched npm release as of 2026-10-03. Version `3.0.4-deetnuts.1` identifies this local derivative; it is not an upstream release.

The parser rejects more than 100 nested braces or parentheses, including mixed nesting. The compile, expand and stringify walkers enforce the same bound for callers supplying an AST directly. Excessive depth produces a controlled `BRACES_MAX_DEPTH` error before stack exhaustion. Literal, quoted and escaped braces keep their existing behavior. The stringify walker preserves the original parent handling, so `escapeInvalid` output is unchanged.

The root npm override applies this copy to all transitive consumers. Both Docker dependency stages copy it before `npm ci`. The existing dependency audit remains enforced. `scripts/braces-security.test.cjs`, included in `test:platform`, verifies the depth limits, compatibility and installed glob/watch consumers.

All other source files are unchanged from the published 3.0.3 package. Its original license and attribution are retained. Remove this override and local copy when an official patched release can replace it after the same checks pass.
