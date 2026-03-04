import PocketBase from "./supabase-pocketbase-compat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://api.deetnuts.com",
);
pb.autoCancellation(false);

async function main() {
  console.log("🔐 Authenticating...");
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!,
    );
  console.log("✓ Auth OK\n");

  // Get cutoff schema
  const cutoffCollection = await pb.collections.getOne("josaa_cutoffs");
  console.log("=== Cutoff Collection Schema ===");
  console.log(
    "Fields:",
    (cutoffCollection as any).fields.map((f: any) => f.name).join(", "),
  );

  // Get a sample cutoff
  const cutoff = await pb.collection("josaa_cutoffs").getList(1, 1);
  console.log("\n=== Sample Cutoff ===");
  console.log(JSON.stringify(cutoff.items[0], null, 2));

  // Get a sample institute
  const institute = await pb.collection("josaa_institutes").getList(1, 1);
  console.log("\n=== Sample Institute ===");
  console.log(JSON.stringify(institute.items[0], null, 2));

  // Get a sample branch
  const branch = await pb.collection("josaa_branches").getList(1, 1);
  console.log("\n=== Sample Branch ===");
  console.log(JSON.stringify(branch.items[0], null, 2));
}

main().catch(console.error);
