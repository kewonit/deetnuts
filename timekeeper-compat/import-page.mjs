export const importHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Move your TimeKeeper countdowns to Deetnuts</title><style>body{margin:0;background:#111;color:#eee;font:16px/1.6 system-ui,sans-serif}main{max-width:640px;margin:auto;padding:48px 24px}h1{font:italic 36px Georgia,serif}button,a{font:inherit}button{border:1px dashed #888;border-radius:8px;padding:12px 16px;background:#222;color:#fff;cursor:pointer;margin:8px 8px 8px 0}button:disabled{opacity:.5;cursor:wait}a{color:#9cf}button:focus-visible,a:focus-visible{outline:3px solid #9cf;outline-offset:4px}#status{min-height:3em}</style><script src="/timekeeper-migration.js" defer></script></head><body><main><h1>TimeKeeper is moving to Deetnuts</h1><p>Bring your saved countdowns, theme, and avatar with you. Your original data stays in this browser. Existing Deetnuts countdowns and preferences are retained.</p><p>The transfer contains only those settings. It uses a private, single-use ticket that expires after 15 minutes. Download a recovery copy before continuing.</p><p id="status" role="status">Reading your saved countdowns…</p><button type="button" id="export">Download recovery JSON</button><button type="button" id="transfer">Transfer to Deetnuts</button><p><a href="https://www.deetnuts.com/exam-countdown/countdown" rel="noreferrer">Open countdowns on Deetnuts</a> · <a href="/">Return to TimeKeeper</a></p><p>If the transfer is unavailable, use “Import JSON” on Deetnuts. Keep this original browser profile until your countdowns are verified.</p></main></body></html>`;

// This deliberately reads only the old application's three preference keys.
// Auth sessions, location, cookies, and other browser data are never exported.
export const importScript = String.raw`"use strict";
const status = document.getElementById("status");
const transferButton = document.getElementById("transfer");
const exportButton = document.getElementById("export");
function readData() {
  const stored = JSON.parse(localStorage.getItem("timekeeper-countdowns") || "[]");
  if (!Array.isArray(stored)) throw new Error("Saved countdown data could not be read. Your original storage is unchanged.");
  const countdowns = stored.map(function (item) {
    return { id: item.id, title: item.title, description: item.description || "", targetDate: item.targetDate, color: item.color || "blue", createdAt: item.createdAt };
  });
  const result = { version: 1, countdowns: countdowns };
  const theme = localStorage.getItem("timekeeper-theme");
  if (["light","dark","ocean","valentine","cupcake"].includes(theme)) result.theme = theme;
  let seed = localStorage.getItem("timekeeper_avatar_seed") || localStorage.getItem("timekeeper-avatar-seed");
  try { seed = JSON.parse(seed); } catch {}
  if (typeof seed === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(seed)) result.avatarSeed = seed;
  return result;
}
try {
  const data = readData();
  status.textContent = data.countdowns.length + " countdowns found" + (data.theme ? ", with your " + data.theme + " theme" : "") + ". Download a recovery copy or start a transfer.";
} catch (error) { status.textContent = error.message; transferButton.disabled = true; }
exportButton.addEventListener("click", function () {
  try {
    const data = JSON.stringify(readData(), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "timekeeper-recovery.json"; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = "Recovery copy downloaded. Your original data is unchanged.";
  } catch (error) { status.textContent = error.message; }
});
transferButton.addEventListener("click", async function () {
  transferButton.disabled = true;
  try {
    const payload = JSON.stringify(readData());
    if (new Blob([payload]).size > 65536) throw new Error("Your export is too large for a ticket. Download the recovery JSON and import it on Deetnuts instead.");
    status.textContent = "Preparing a private transfer…";
    const response = await fetch("https://www.deetnuts.com/api/exam-countdown/migration", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(20000)
    });
    const result = await response.json();
    if (!response.ok || !/^[A-Za-z0-9_-]{43}$/.test(result.token)) throw new Error(result.error || "Transfer unavailable. Use your recovery JSON instead.");
    location.assign("https://www.deetnuts.com/exam-countdown/import#ticket=" + encodeURIComponent(result.token));
  } catch (error) {
    status.textContent = error.name === "TimeoutError" ? "The transfer timed out. Download a recovery copy or try again. Your original data is unchanged." : error.message;
    transferButton.disabled = false;
  }
});`;

// The old root worker has no navigation cache. Replace its background timer
// with a network pass-through worker, retaining the old origin's cached data.
export const compatibilityServiceWorker = `self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));`;
