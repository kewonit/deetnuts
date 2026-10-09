import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const outline = JSON.parse(
  readFileSync(
    new URL(
      "../../public/exam-countdown/maps/india-outline.geojson",
      import.meta.url,
    ),
    "utf8",
  ),
);
const polygons: number[][][][] = outline.features[0].geometry.coordinates;

function inRing([x, y]: number[], ring: number[][]): boolean {
  let inside = false;
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1];
    const [bx, by] = ring[i];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
}

function inIndia(point: number[]) {
  return polygons.some(
    ([land, ...holes]) =>
      inRing(point, land) && !holes.some((hole) => inRing(point, hole)),
  );
}

test("India outline retains the full northern/eastern extent and excludes neighbouring capitals", () => {
  for (const point of [
    [77.21, 28.61], // Delhi
    [77.58, 34.15], // Leh
    [74.31, 35.92], // Northern extent in the official Indian depiction
    [78.5, 35], // Eastern Ladakh extent in the official Indian depiction
    [93.62, 27.084], // Arunachal Pradesh
  ])
    assert.ok(inIndia(point), `Missing India geography at ${point}`);
  for (const point of [
    [79.86, 6.93], // Colombo
    [85.32, 27.71], // Kathmandu
    [90.41, 23.8], // Dhaka
  ])
    assert.equal(
      inIndia(point),
      false,
      `Unexpected India geography at ${point}`,
    );
});

test("display simplification preserves all 80 land parts and both island groups", () => {
  assert.equal(polygons.length, 80);
  const points = polygons.flat(2);
  assert.ok(points.some(([lon, lat]) => lon < 74 && lat > 8 && lat < 12));
  assert.ok(points.some(([lon, lat]) => lon > 92 && lat < 7));
  assert.ok(points.some(([, lat]) => lat > 37));
  for (const polygon of polygons)
    for (const ring of polygon) {
      assert.ok(ring.length >= 4);
      assert.deepEqual(ring[0], ring.at(-1));
    }
});
