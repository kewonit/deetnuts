import PocketBase from "./supabase-pocketbase-compat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://api.deetnuts.com",
);
pb.autoCancellation(false);

async function main() {
  console.log(" Authenticating...");
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!,
    );
  console.log(" Auth OK\n");

  // Get institutes with original_id set
  const institutes = await pb.collection("josaa_institutes").getList(1, 5, {
    filter: "original_id != ''",
  });
  console.log(
    "Institutes with original_id:",
    institutes.items.length,
    "of",
    institutes.totalItems,
  );
  institutes.items.forEach((i: any) =>
    console.log("  -", i.original_id, "->", i.id, i.name.substring(0, 40)),
  );

  // Get institutes without original_id
  const noOriginal = await pb.collection("josaa_institutes").getList(1, 5, {
    filter: "original_id = ''",
  });
  console.log("\nInstitutes WITHOUT original_id:", noOriginal.totalItems);
  noOriginal.items.forEach((i: any) => console.log("  -", i.id, i.name));

  // Test lookup: Get cutoffs for first institute with original_id
  if (institutes.items.length > 0) {
    const originalId = (institutes.items[0] as any).original_id;
    console.log("\n Looking up cutoffs for original_id:", originalId);
    const cutoffs = await pb.collection("josaa_cutoffs").getList(1, 3, {
      filter: `institute_id = '${originalId}'`,
    });
    console.log("Found", cutoffs.totalItems, "cutoffs for this institute");
    if (cutoffs.items.length > 0) {
      console.log("Sample cutoff:", JSON.stringify(cutoffs.items[0], null, 2));
    }
  }
}

main().catch(console.error);
