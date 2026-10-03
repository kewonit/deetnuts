import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canonical = JSON.parse(
  await readFile(
    resolve(root, "lib/admissions/canonical-manifest.generated.json"),
    "utf8",
  ),
);
const manifest = JSON.parse(
  await readFile(resolve(root, "data/mht-cet/college-media.json"), "utf8"),
);
const expected = Object.keys(canonical.mhtCetColleges)
  .map((code) => code.padStart(5, "0"))
  .sort();
assert.equal(manifest.version, 1);
assert.deepEqual(
  Object.keys(manifest.colleges).sort(),
  expected,
  "Media must cover every canonical college exactly once",
);

const report = {
  totalColleges: expected.length,
  reviewedColleges: 0,
  logos: 0,
  campusBackgrounds: 0,
  photoAvatars: 0,
  initialAvatars: 0,
  neutralBackgrounds: 0,
  officialAssets: 0,
  secondaryAssets: 0,
  decodedAssets: 0,
  losslessLogos: 0,
  assetBytes: 0,
  unavailableLogos: [],
  unavailableBackgrounds: [],
  unavailable: [],
  partial: [],
  sharedAssets: [],
};
const hashes = new Map();
const referencedFiles = new Set();
for (const code of expected) {
  const college = manifest.colleges[code];
  assert.ok(
    Object.hasOwn(college, "logo") && Object.hasOwn(college, "campus"),
    `${code}: missing assets must be explicitly null`,
  );
  assert.equal(college.code, code);
  assert.equal(
    college.canonicalPath,
    canonical.mhtCetColleges[String(Number(code))],
  );
  assert.ok(college.collegeName?.trim());
  assert.match(college.review.reviewedAt, /^\d{4}-\d{2}-\d{2}/);
  assert.ok(college.review.notes?.trim(), `${code}: review notes required`);
  assert.ok(
    college.attemptedSources.length > 0,
    `${code}: source attempts required`,
  );
  if (college.identitySource) {
    const identity = new URL(college.identitySource);
    const instituteCode = identity.searchParams.get("InstituteCode");
    if (instituteCode)
      assert.equal(
        Number(instituteCode),
        Number(code),
        `${code}: identity source belongs to another college`,
      );
  }
  const status =
    college.logo && college.campus
      ? "verified"
      : college.logo || college.campus
        ? "partial"
        : "unavailable";
  assert.equal(
    college.review.status,
    status,
    `${code}: review status must describe asset coverage`,
  );
  report.reviewedColleges++;
  const missing = [!college.logo && "logo", !college.campus && "campus"].filter(
    Boolean,
  );
  if (status !== "verified")
    report[status].push({
      code,
      name: college.collegeName,
      missing,
      notes: college.review.notes,
    });
  if (!college.logo) report.unavailableLogos.push(code);
  if (!college.campus) report.unavailableBackgrounds.push(code);
  if (college.logo) report.logos++;
  else if (college.campus) report.photoAvatars++;
  else report.initialAvatars++;
  if (college.campus) report.campusBackgrounds++;
  else report.neutralBackgrounds++;
  for (const kind of ["logo", "campus"]) {
    const asset = college[kind];
    if (!asset) continue;
    assert.equal(asset.src, `/mht-cet/colleges/${code}/${kind}.webp`);
    assert.ok(["official", "secondary"].includes(asset.sourceType));
    for (const url of [asset.sourcePage, asset.sourceUrl])
      assert.ok(["http:", "https:"].includes(new URL(url).protocol));
    assert.match(asset.originalSha256, /^[a-f0-9]{64}$/);
    if (asset.backgroundColor)
      assert.match(asset.backgroundColor, /^#[a-fA-F0-9]{6}$/);
    if (asset.extractedFrom)
      assert.match(asset.extractedFrom.documentSha256, /^[a-f0-9]{64}$/);
    const file = resolve(root, "public", asset.src.slice(1));
    referencedFiles.add(file);
    const buffer = await readFile(file);
    assert.equal(
      createHash("sha256").update(buffer).digest("hex"),
      asset.sha256,
      `${code} ${kind}: checksum mismatch`,
    );
    const metadata = await sharp(buffer).metadata();
    await sharp(buffer).raw().toBuffer();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, asset.width);
    assert.equal(metadata.height, asset.height);
    assert.ok(asset.width > 0 && asset.height > 0);
    if (kind === "logo") {
      assert.ok(Math.max(asset.width, asset.height) <= 512);
      let lossless = false;
      for (let offset = 12; offset + 8 <= buffer.length;) {
        const chunk = buffer.toString("ascii", offset, offset + 4);
        const length = buffer.readUInt32LE(offset + 4);
        if (chunk === "VP8L") lossless = true;
        offset += 8 + length + (length % 2);
      }
      assert.ok(lossless, `${code}: logo must use lossless WebP`);
      report.losslessLogos++;
    } else {
      assert.ok(asset.width <= 1600);
      assert.ok(
        asset.focalPoint &&
          [asset.focalPoint.x, asset.focalPoint.y].every(
            (value) => Number.isFinite(value) && value >= 0 && value <= 100,
          ),
      );
    }
    assert.ok(
      Math.max(asset.width, asset.height) <=
        Math.max(asset.originalWidth, asset.originalHeight),
      `${code} ${kind}: image must not be enlarged`,
    );
    report[
      asset.sourceType === "official" ? "officialAssets" : "secondaryAssets"
    ]++;
    report.decodedAssets++;
    report.assetBytes += buffer.length;
    const owners = hashes.get(asset.sha256) ?? [];
    owners.push({ code, kind });
    hashes.set(asset.sha256, owners);
  }
}
const assetDirectory = resolve(root, "public/mht-cet/colleges");
for (const collegeDirectory of await readdir(assetDirectory, {
  withFileTypes: true,
})) {
  if (!collegeDirectory.isDirectory()) continue;
  for (const filename of await readdir(
    resolve(assetDirectory, collegeDirectory.name),
  )) {
    if (!filename.endsWith(".webp")) continue;
    const file = resolve(assetDirectory, collegeDirectory.name, filename);
    assert.ok(
      referencedFiles.has(file),
      `${collegeDirectory.name}/${filename}: unreferenced asset`,
    );
  }
}
report.sharedAssets = [...hashes.values()].filter(
  (owners) => new Set(owners.map((owner) => owner.code)).size > 1,
);
if (process.argv.includes("--write-report"))
  await writeFile(
    resolve(root, "data/mht-cet/college-media-coverage.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
console.log(JSON.stringify(report, null, 2));
