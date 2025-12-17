import PocketBase from "pocketbase";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://api.deetnuts.com");
pb.autoCancellation(false);

async function main() {
  // Search for IIT Bombay
  const result = await pb.collection("josaa_institutes").getList(1, 5, {
    filter: "name~'Bombay'",
    fields: "id,name,short_name,original_id",
  });
  console.log("Search for Bombay:");
  result.items.forEach((i) => console.log(JSON.stringify(i)));

  // Show first 10 institutes
  const all = await pb.collection("josaa_institutes").getList(1, 15, {
    fields: "id,name,short_name",
  });
  console.log("\nFirst 15 institutes short_name:");
  all.items.forEach((i: any) =>
    console.log(`  "${i.short_name}" -> ${i.name.substring(0, 50)}`)
  );
}

main().catch(console.error);
