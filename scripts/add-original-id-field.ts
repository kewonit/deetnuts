import PocketBase from "./supabase-pocketbase-compat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://api.deetnuts.com",
);

async function main() {
  console.log(" Authenticating...");
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!,
    );
  console.log(" Auth OK\n");

  // Get current schemas
  const institutes = await pb.collections.getOne("josaa_institutes");
  const branches = await pb.collections.getOne("josaa_branches");

  // Add original_id to institutes
  console.log(" Adding original_id field to josaa_institutes...");
  const instFields = [...(institutes as any).fields];
  if (!instFields.some((f: any) => f.name === "original_id")) {
    instFields.push({
      name: "original_id",
      type: "text",
      required: false,
      options: { maxLength: 20 },
    });
    await pb.collections.update("josaa_institutes", { fields: instFields });
    console.log(" Added original_id to josaa_institutes");
  } else {
    console.log("original_id already exists in josaa_institutes");
  }

  // Add original_id to branches
  console.log(" Adding original_id field to josaa_branches...");
  const branchFields = [...(branches as any).fields];
  if (!branchFields.some((f: any) => f.name === "original_id")) {
    branchFields.push({
      name: "original_id",
      type: "text",
      required: false,
      options: { maxLength: 20 },
    });
    await pb.collections.update("josaa_branches", { fields: branchFields });
    console.log(" Added original_id to josaa_branches");
  } else {
    console.log("original_id already exists in josaa_branches");
  }

  console.log("\n Schema update complete!");
}

main().catch(console.error);
