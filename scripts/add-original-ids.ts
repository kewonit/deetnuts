import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://api.deetnuts.com");
pb.autoCancellation(false);

async function main() {
  console.log("🔐 Authenticating...");
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
  console.log("✓ Auth OK\n");

  // Load ID maps
  const instituteMap = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../data/josaa/institute_id_map.json"),
      "utf-8"
    )
  );
  const branchMap = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../data/josaa/branch_id_map.json"),
      "utf-8"
    )
  );

  // Update institutes with original_id
  console.log("📝 Updating institutes with original_id...");
  let updated = 0;
  for (const [originalId, newId] of Object.entries(instituteMap)) {
    try {
      await pb.collection("josaa_institutes").update(newId as string, {
        original_id: originalId,
      });
      updated++;
      if (updated % 20 === 0) {
        process.stdout.write(`  Updated ${updated} institutes\r`);
      }
    } catch (e: any) {
      console.error(`  Failed to update institute ${newId}: ${e.message}`);
    }
  }
  console.log(`✓ Updated ${updated} institutes\n`);

  // Update branches with original_id
  console.log("📝 Updating branches with original_id...");
  updated = 0;
  for (const [originalId, newId] of Object.entries(branchMap)) {
    try {
      await pb.collection("josaa_branches").update(newId as string, {
        original_id: originalId,
      });
      updated++;
      if (updated % 20 === 0) {
        process.stdout.write(`  Updated ${updated} branches\r`);
      }
    } catch (e: any) {
      console.error(`  Failed to update branch ${newId}: ${e.message}`);
    }
  }
  console.log(`✓ Updated ${updated} branches\n`);

  console.log("🎉 Done!");
}

main().catch(console.error);
