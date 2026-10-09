import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve(process.argv[2]);
const fixture = JSON.parse(await readFile(process.argv[3], "utf8"));
const origin = "http://127.0.0.1:8099";
const identity = (
  await readFile(`${directory}/secrets/pocketbase_superuser_email`, "utf8")
).trim();
const password = (
  await readFile(`${directory}/secrets/pocketbase_superuser_password`, "utf8")
).trim();
async function request(path, body, token) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Isolated fixture request failed: ${path} ${response.status}`,
    );
  return response.json();
}
const auth = await request("/api/collections/_superusers/auth-with-password", {
  identity,
  password,
});
const token = auth.token;
const serviceRule =
  '@request.auth.collectionName = "app_services" && @request.auth.role = "backend"';
await request(
  "/api/collections",
  {
    name: "2024_mht_cet_colleges",
    type: "base",
    listRule: serviceRule,
    viewRule: serviceRule,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      "college_id",
      "college_name",
      "status",
      "home_university",
      "migration_source_json",
    ].map((name) => ({ name, type: "text" })),
  },
  token,
);
const runtime = Object.fromEntries(
  (await readFile(`${directory}/web.env`, "utf8"))
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
await request(
  "/api/collections/app_services/records",
  {
    email: runtime.POCKETBASE_SERVICE_EMAIL,
    password: runtime.POCKETBASE_SERVICE_PASSWORD,
    passwordConfirm: runtime.POCKETBASE_SERVICE_PASSWORD,
    role: "backend",
    verified: true,
  },
  token,
);
for (const record of fixture.records) {
  if (
    Object.keys(record).sort().join(",") !==
    "college_id,college_name,home_university,id,status"
  )
    throw new Error("Unexpected non-public fixture field");
  await request(
    "/api/collections/2024_mht_cet_colleges/records",
    {
      college_id: String(record.college_id ?? ""),
      college_name: record.college_name,
      status: record.status ?? "",
      home_university: record.home_university ?? "",
      migration_source_json: JSON.stringify(record),
    },
    token,
  );
}
console.log(
  JSON.stringify({ isolatedPublicCollegeRecords: fixture.records.length }),
);
