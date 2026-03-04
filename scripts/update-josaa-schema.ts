/**
 * Update JoSAA Collections Schema
 *
 * Updates the josaa_cutoffs, josaa_institutes, and josaa_branches collections
 * to have proper fields matching our data.
 *
 * Usage: npx tsx scripts/update-josaa-schema.ts
 */

import PocketBase from "./supabase-pocketbase-compat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pb = new PocketBase("https://api.deetnuts.com");
pb.autoCancellation(false);

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("JoSAA Schema Update Script");
    console.log("=".repeat(60));
    console.log("");

    console.log("Authenticating...");
    await pb
      .collection("_superusers")
      .authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL!,
        process.env.POCKETBASE_ADMIN_PASSWORD!,
      );
    console.log("✓ Auth OK\n");

    // Get current collections
    const collections = await pb.collections.getFullList();

    // Update josaa_institutes
    console.log("Updating josaa_institutes schema...");
    const institColl = collections.find((c) => c.name === "josaa_institutes");
    if (institColl) {
      await pb.collections.update(institColl.id, {
        fields: [
          { name: "name", type: "text", required: false },
          { name: "short_name", type: "text", required: false },
          { name: "institute_type", type: "text", required: false },
          { name: "years_active", type: "json" },
          { name: "state", type: "text" },
          { name: "city", type: "text" },
          { name: "nirf_rank", type: "number" },
          { name: "website", type: "url" },
        ],
        listRule: "",
        viewRule: "",
      });
      console.log("✓ josaa_institutes updated");
    }

    // Update josaa_branches
    console.log("Updating josaa_branches schema...");
    const branchColl = collections.find((c) => c.name === "josaa_branches");
    if (branchColl) {
      await pb.collections.update(branchColl.id, {
        fields: [
          { name: "name", type: "text", required: false },
          { name: "short_code", type: "text", required: false },
          { name: "degree_type", type: "text", required: false },
          { name: "duration_years", type: "number", required: false },
          { name: "specializations", type: "json" },
          { name: "years_active", type: "json" },
        ],
        listRule: "",
        viewRule: "",
      });
      console.log("✓ josaa_branches updated");
    }

    // Update josaa_cutoffs
    console.log("Updating josaa_cutoffs schema...");
    const cutoffColl = collections.find((c) => c.name === "josaa_cutoffs");
    if (cutoffColl) {
      await pb.collections.update(cutoffColl.id, {
        fields: [
          { name: "year", type: "number", required: false },
          { name: "round", type: "number", required: false },
          { name: "source", type: "text" },
          { name: "institute_id", type: "text", required: false },
          { name: "branch_id", type: "text", required: false },
          { name: "quota", type: "text" },
          { name: "category", type: "text", required: false },
          { name: "gender", type: "text", required: false },
          { name: "is_pwd", type: "bool" },
          { name: "opening_rank", type: "number", required: false },
          { name: "closing_rank", type: "number", required: false },
        ],
        listRule: "",
        viewRule: "",
      });
      console.log("✓ josaa_cutoffs updated");
    }

    // Also set public read for josaa_institute_aliases
    console.log("Updating josaa_institute_aliases schema...");
    const aliasColl = collections.find(
      (c) => c.name === "josaa_institute_aliases",
    );
    if (aliasColl) {
      await pb.collections.update(aliasColl.id, {
        fields: [
          { name: "institute_id", type: "text", required: true },
          { name: "alias", type: "text", required: true },
          { name: "is_official", type: "bool" },
        ],
        listRule: "",
        viewRule: "",
      });
      console.log("✓ josaa_institute_aliases updated");
    }

    console.log("\n✓ All schemas updated successfully!");
    console.log("\nNext step: Run the import script to populate the data.");
  } catch (e: any) {
    console.error("\nError:", e.message);
    if (e.data) {
      console.error("Details:", JSON.stringify(e.data, null, 2));
    }
  }
}

main();
