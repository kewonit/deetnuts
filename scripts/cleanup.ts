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

  // Delete duplicate institute
  try {
    await pb.collection("josaa_institutes").delete("80fc4rmlwmrj800");
    console.log(" Deleted duplicate institute");
  } catch (e) {
    console.log("Institute already deleted or not found");
  }

  // Verify counts
  const institutes = await pb.collection("josaa_institutes").getList(1, 1);
  const branches = await pb.collection("josaa_branches").getList(1, 1);
  const cutoffs = await pb.collection("josaa_cutoffs").getList(1, 1);

  console.log("\n Final counts:");
  console.log("  Institutes:", institutes.totalItems);
  console.log("  Branches:", branches.totalItems);
  console.log("  Cutoffs:", cutoffs.totalItems);
}

main().catch(console.error);
