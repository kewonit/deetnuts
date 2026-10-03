import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const root = process.cwd();
const scratch = resolve(root, "data/output/college-media");
const runFile = promisify(execFile);
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const decode = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
const plain = (value) =>
  decode(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
const xml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

async function fetchPublic(url, accept, referer) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        "User-Agent": userAgent,
        Accept: accept,
        ...(referer ? { Referer: referer } : {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      url: response.url,
    };
  } catch (error) {
    // System curl can use the host certificate store when Node's TLS chain fails.
    const marker = Buffer.from("\nDEETNUTS_EFFECTIVE_URL:");
    try {
      const { stdout } = await runFile(
        "curl",
        [
          "--fail",
          "--location",
          "--max-time",
          "25",
          "--silent",
          "--show-error",
          "--user-agent",
          userAgent,
          "--header",
          `Accept: ${accept}`,
          ...(referer ? ["--referer", referer] : []),
          "--write-out",
          "\nDEETNUTS_EFFECTIVE_URL:%{url_effective}",
          url,
        ],
        { encoding: "buffer", maxBuffer: 21 * 1024 * 1024 },
      );
      const index = stdout.lastIndexOf(marker);
      if (index < 0) throw new Error("Missing download response URL");
      return {
        buffer: stdout.subarray(0, index),
        url: stdout.subarray(index + marker.length).toString("utf8"),
      };
    } catch (fallbackError) {
      throw new Error(
        `${error.message}; secure curl fallback: ${fallbackError.message}`,
      );
    }
  }
}

export async function fetchPage(url) {
  const directory = resolve(scratch, "pages");
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `${hash(url)}.json`);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {}
  const response = await fetchPublic(url, "text/html,application/xhtml+xml");
  const page = { url: response.url, html: response.buffer.toString("utf8") };
  await writeFile(path, JSON.stringify(page));
  return page;
}

export function inspectPage(page) {
  const attributes = (tag) =>
    Object.fromEntries(
      [
        ...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g),
      ].map((m) => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]),
    );
  const absolute = (value) => {
    try {
      const url = new URL(value, page.url);
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };
  const images = new Map();
  const add = (value, hint) => {
    const url = absolute(value);
    if (url && !images.has(url)) images.set(url, { url, hint });
  };
  for (const match of page.html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const hint = [
      attrs.alt,
      attrs.title,
      attrs.class,
      attrs.id,
      attrs.width,
      attrs.height,
    ]
      .filter(Boolean)
      .join(" | ");
    for (const key of [
      "src",
      "data-src",
      "data-lazy-src",
      "data-lazyload",
      "data-original",
      "data-lazy",
    ])
      if (attrs[key]) add(attrs[key], hint);
    for (const key of ["srcset", "data-srcset"])
      if (attrs[key])
        for (const value of attrs[key].split(","))
          add(value.trim().split(/\s+/)[0], hint);
  }
  for (const match of page.html.matchAll(/<video\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs.poster) add(attrs.poster, "Video poster");
  }
  for (const match of page.html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (
      /^(og:image|twitter:image)$/.test(attrs.property ?? attrs.name ?? "") &&
      attrs.content
    )
      add(attrs.content, attrs.property ?? attrs.name);
  }
  for (const match of page.html.matchAll(
    /url\(\s*["']?([^\s"')]+)["']?\s*\)/gi,
  ))
    if (/\.(png|jpe?g|webp|gif|svg|avif)(?:[?#]|$)/i.test(match[1]))
      add(decode(match[1]), "CSS background");
  const links = [];
  for (const match of page.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = attributes(match[1]);
    const url = attrs.href && absolute(attrs.href);
    const label = plain(match[2]);
    if (
      url &&
      /about|campus|gallery|infrastructure|facilit|brochure|contact|college|institute/i.test(
        label + " " + url,
      )
    )
      links.push({ url, label: label.slice(0, 100) });
  }
  return {
    url: page.url,
    title: plain(
      page.html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "",
    ),
    text: plain(
      page.html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " "),
    ).slice(0, 3000),
    images: [...images.values()],
    links: [...new Map(links.map((link) => [link.url, link])).values()].slice(
      0,
      40,
    ),
  };
}

export async function downloadCandidate(
  code,
  url,
  sourcePage,
  sourceType = "official",
) {
  const directory = resolve(scratch, "candidates", code);
  await mkdir(directory, { recursive: true });
  const id = hash(url).slice(0, 16);
  const recordPath = resolve(directory, `${id}.json`);
  try {
    return JSON.parse(await readFile(recordPath, "utf8"));
  } catch {}
  const response = await fetchPublic(
    url,
    "image/avif,image/webp,image/*,*/*;q=0.8",
    sourcePage,
  );
  const buffer = response.buffer;
  if (buffer.length > 20 * 1024 * 1024)
    throw new Error(`Image exceeds 20 MiB: ${url}`);
  const metadata = await sharp(buffer, {
    limitInputPixels: 60000000,
  }).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`Image has no dimensions: ${url}`);
  const originalPath = resolve(directory, `${id}.original`);
  const previewPath = resolve(directory, `${id}.png`);
  await writeFile(originalPath, buffer);
  await sharp(buffer)
    .rotate()
    .resize({
      width: 800,
      height: 500,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toFile(previewPath);
  const record = {
    id,
    code,
    sourcePage,
    sourceUrl: url,
    resolvedUrl: response.url,
    sourceType,
    originalPath,
    previewPath,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    originalFormat: metadata.format,
    originalSha256: hash(buffer),
  };
  await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n");
  return record;
}

export async function promoteAsset(
  candidate,
  kind,
  focalPoint = { x: 50, y: 50 },
) {
  if (!["logo", "campus"].includes(kind))
    throw new Error("Asset kind must be logo or campus");
  const directory = resolve(root, "public/mht-cet/colleges", candidate.code);
  await mkdir(directory, { recursive: true });
  let image = sharp(candidate.originalPath).rotate();
  if (candidate.crop) image = image.extract(candidate.crop);
  image =
    kind === "logo"
      ? image
          .resize({
            width: 512,
            height: 512,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ lossless: true })
      : image
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 80 });
  const { data, info } = await image.toBuffer({ resolveWithObject: true });
  await writeFile(resolve(directory, `${kind}.webp`), data);
  return {
    src: `/mht-cet/colleges/${candidate.code}/${kind}.webp`,
    width: info.width,
    height: info.height,
    sourcePage: candidate.sourcePage,
    sourceUrl: candidate.sourceUrl,
    sourceType: candidate.sourceType,
    originalWidth: candidate.originalWidth,
    originalHeight: candidate.originalHeight,
    originalSha256: candidate.originalSha256,
    sha256: hash(data),
    ...(candidate.crop ? { crop: candidate.crop } : {}),
    ...(candidate.backgroundColor
      ? { backgroundColor: candidate.backgroundColor }
      : {}),
    ...(candidate.extractedFrom
      ? { extractedFrom: candidate.extractedFrom }
      : {}),
    ...(kind === "campus" ? { focalPoint } : {}),
  };
}

export async function saveRecord(code, record) {
  const directory = resolve(scratch, "records");
  await mkdir(directory, { recursive: true });
  const temporary = resolve(directory, `${code}.${randomUUID()}.tmp`);
  await writeFile(
    temporary,
    JSON.stringify({ code, ...record }, null, 2) + "\n",
  );
  await rename(temporary, resolve(directory, `${code}.json`));
}

export async function contactSheet(items, name, columns = 4) {
  const width = 320;
  const height = 240;
  const rows = Math.ceil(items.length / columns);
  const layers = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const left = (index % columns) * width;
    const top = Math.floor(index / columns) * height;
    if (item.path) {
      const thumbnail = await sharp(item.path)
        .resize({
          width: width - 16,
          height: height - 54,
          fit: "contain",
          background: "#ffffff",
        })
        .png()
        .toBuffer();
      layers.push({ input: thumbnail, left: left + 8, top: top + 42 });
    }
    const label = String(item.label).slice(0, 48);
    layers.push({
      input: Buffer.from(
        `<svg width="${width}" height="40"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="8" y="17" font-family="Arial" font-size="12" fill="#111827">${xml(label.slice(0, 46))}</text><text x="8" y="33" font-family="Arial" font-size="11" fill="#475569">${xml(item.note ?? "")}</text></svg>`,
      ),
      left,
      top,
    });
  }
  const directory = resolve(scratch, "review");
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `${name}.png`);
  await sharp({
    create: {
      width: width * columns,
      height: Math.max(1, rows) * height,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(layers)
    .png()
    .toFile(path);
  return path;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "inspect")
    console.log(JSON.stringify(inspectPage(await fetchPage(args[0])), null, 2));
  else if (command === "candidate")
    console.log(
      JSON.stringify(
        await downloadCandidate(args[0], args[1], args[2], args[3]),
        null,
        2,
      ),
    );
  else
    throw new Error(
      "Use inspect <page-url> or candidate <code> <image-url> <source-page> [official|secondary]",
    );
}
