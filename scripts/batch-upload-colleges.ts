import PocketBase from "./supabase-pocketbase-compat";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface CollegeRecord {
  college_id: number;
  college_name: string;
  status: string;
  home_university: string;
}

class BatchCollegeUploader {
  private pb: PocketBase;
  private csvFilePath: string;
  private collectionName = "2024_mht_cet_colleges";
  private batchSize = 500; // Reduced batch size for better reliability
  private maxConcurrentBatches = 5; // Reduced concurrent batches to prevent auto-cancellation issues

  constructor() {
    // Initialize PocketBase
    const pbUrl = process.env.POCKETBASE_URL || "https://api.deetnuts.com";
    this.pb = new PocketBase(pbUrl);

    // Disable auto-cancellation to prevent concurrent batch requests from being cancelled
    this.pb.autoCancellation(false);

    // Set CSV file path
    this.csvFilePath = path.join(__dirname, "college_information.csv");
  }

  async authenticateWithToken(): Promise<boolean> {
    const token = process.env.POCKETBASE_AUTH_TOKEN;
    if (token) {
      console.log("🔑 Using auth token...");
      this.pb.authStore.save(token);
      return true;
    }
    return false;
  }

  async authenticateWithCredentials(): Promise<boolean> {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("❌ Missing admin credentials in environment variables");
      return false;
    }

    try {
      console.log("🔑 Authenticating with credentials...");
      await this.pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log("✅ Successfully authenticated as admin");
      return true;
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      return false;
    }
  }

  async readCSVData(): Promise<CollegeRecord[]> {
    return new Promise((resolve, reject) => {
      const records: CollegeRecord[] = [];
      let lineNumber = 0;
      let skippedRecords = 0;

      createReadStream(this.csvFilePath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true, // Allow inconsistent column count
            relax_quotes: true, // Allow inconsistent quoting
          }),
        )
        .on("data", (row) => {
          lineNumber++;
          try {
            // Validate required fields
            if (!row.college_id || !row.college_name) {
              console.warn(
                `⚠️  Skipping line ${lineNumber}: Missing college_id or college_name`,
              );
              skippedRecords++;
              return;
            }

            const record: CollegeRecord = {
              college_id: parseInt(row.college_id) || 0,
              college_name: row.college_name?.toString() || "",
              status: row.status?.toString() || "",
              home_university: row.home_university?.toString() || "",
            };

            // Additional validation
            if (record.college_id === 0) {
              console.warn(
                `⚠️  Skipping line ${lineNumber}: Invalid college_id`,
              );
              skippedRecords++;
              return;
            }

            records.push(record);
          } catch (error) {
            console.warn(`⚠️  Error processing line ${lineNumber}:`, error);
            skippedRecords++;
          }
        })
        .on("end", () => {
          console.log(`📊 Read ${records.length} college records from CSV`);
          if (skippedRecords > 0) {
            console.log(`⚠️  Skipped ${skippedRecords} invalid records`);
          }
          resolve(records);
        })
        .on("error", (error) => {
          console.error(`❌ CSV parsing error:`, error);
          reject(error);
        });
    });
  }

  async createBatch(records: CollegeRecord[], batchId: string): Promise<any> {
    const batch = this.pb.createBatch();

    for (const record of records) {
      batch.collection(this.collectionName).create(record);
    }

    // Add unique request key to prevent auto-cancellation
    return await batch.send({ requestKey: `batch_create_colleges_${batchId}` });
  }

  async upsertBatch(records: CollegeRecord[], batchId: string): Promise<any> {
    const batch = this.pb.createBatch();

    for (const record of records) {
      // For upsert, we use college_id as the unique identifier
      const upsertRecord = {
        ...record,
        id: record.college_id.toString(),
      };
      batch.collection(this.collectionName).upsert(upsertRecord);
    }

    // Add unique request key to prevent auto-cancellation
    return await batch.send({ requestKey: `batch_upsert_colleges_${batchId}` });
  }

  async processBatchesConcurrently(
    batches: CollegeRecord[][],
    operation: "create" | "upsert" = "create",
  ): Promise<void> {
    let completedBatches = 0;

    for (let i = 0; i < batches.length; i += this.maxConcurrentBatches) {
      const concurrentBatches = batches.slice(i, i + this.maxConcurrentBatches);

      const concurrentPromises = concurrentBatches.map(async (batch, index) => {
        const actualIndex = i + index;
        const batchId = `${Date.now()}_${actualIndex}`;
        try {
          const startTime = Date.now();

          let result;
          if (operation === "upsert") {
            result = await this.upsertBatch(batch, batchId);
          } else {
            result = await this.createBatch(batch, batchId);
          }

          const endTime = Date.now();
          const duration = endTime - startTime;

          completedBatches++;
          console.log(
            `✅ Batch ${actualIndex + 1} completed in ${duration}ms (${batch.length} records) - ${completedBatches}/${batches.length} batches done`,
          );

          return result;
        } catch (error) {
          console.error(`❌ Batch ${actualIndex + 1} failed:`, error);
          throw error;
        }
      });

      await Promise.all(concurrentPromises);
    }
  }

  async uploadData(operation: "create" | "upsert" = "create"): Promise<void> {
    try {
      console.log("🚀 Starting college batch upload process...");

      // Authenticate
      const authenticated =
        (await this.authenticateWithToken()) ||
        (await this.authenticateWithCredentials());
      if (!authenticated) {
        throw new Error("Authentication failed");
      }

      // Read CSV data
      const records = await this.readCSVData();

      if (records.length === 0) {
        console.log("⚠️  No college records found in CSV file");
        return;
      }

      // Validate data
      const invalidRecords = records.filter(
        (r) => !r.college_id || !r.college_name,
      );
      if (invalidRecords.length > 0) {
        console.warn(
          `⚠️  Found ${invalidRecords.length} records with missing college_id or college_name`,
        );
      }

      // Split records into batches
      const batches: CollegeRecord[][] = [];
      for (let i = 0; i < records.length; i += this.batchSize) {
        batches.push(records.slice(i, i + this.batchSize));
      }

      console.log(
        `📦 Created ${batches.length} batches of ${this.batchSize} records each`,
      );
      console.log(
        `⚡ Processing ${this.maxConcurrentBatches} batches concurrently for maximum speed`,
      );

      const startTime = Date.now();

      // Process batches concurrently
      await this.processBatchesConcurrently(batches, operation);

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const recordsPerSecond = Math.round(
        (records.length / totalDuration) * 1000,
      );

      console.log(
        `🎉 Successfully ${operation === "upsert" ? "upserted" : "created"} ${records.length} college records!`,
      );
      console.log(
        `⏱️  Total time: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`,
      );
      console.log(`🚀 Speed: ${recordsPerSecond} records/second`);
    } catch (error) {
      console.error("❌ College upload failed:", error);
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    try {
      console.log("🧹 Clearing existing college records...");

      // Authenticate
      const authenticated =
        (await this.authenticateWithToken()) ||
        (await this.authenticateWithCredentials());
      if (!authenticated) {
        throw new Error("Authentication failed");
      }

      // Get all records in batches and delete them
      let page = 1;
      let hasMore = true;
      let totalDeleted = 0;

      while (hasMore) {
        const result = await this.pb
          .collection(this.collectionName)
          .getList(page, 500);

        if (result.items.length === 0) {
          hasMore = false;
          break;
        }

        // Create batch delete operation
        const batch = this.pb.createBatch();
        for (const record of result.items) {
          batch.collection(this.collectionName).delete(record.id);
        }

        await batch.send({
          requestKey: `batch_delete_colleges_${page}_${Date.now()}`,
        });
        totalDeleted += result.items.length;
        console.log(
          `🗑️  Deleted ${result.items.length} college records (${totalDeleted} total)`,
        );

        page++;
        hasMore = result.items.length === 500; // Continue if we got a full page
      }

      console.log(`✅ Successfully deleted ${totalDeleted} college records`);
    } catch (error) {
      console.error("❌ Clear college collection failed:", error);
      throw error;
    }
  }

  async validateCSV(): Promise<void> {
    try {
      console.log("🔍 Validating CSV file...");

      // Check if file exists
      const fs = require("fs");
      if (!fs.existsSync(this.csvFilePath)) {
        throw new Error(`CSV file not found: ${this.csvFilePath}`);
      }

      // Read and validate data
      const records = await this.readCSVData();

      if (records.length === 0) {
        console.log("⚠️  No valid records found in CSV file");
        return;
      }

      // Show sample of data
      console.log(
        `✅ Validation successful! Found ${records.length} valid records`,
      );
      console.log("\n📋 Sample records:");

      const sampleSize = Math.min(5, records.length);
      for (let i = 0; i < sampleSize; i++) {
        const record = records[i];
        console.log(
          `${i + 1}. ID: ${record.college_id}, Name: ${record.college_name}`,
        );
        console.log(`   Status: ${record.status}`);
        console.log(`   University: ${record.home_university || "N/A"}`);
        console.log("");
      }

      // Show statistics
      const statusCounts = records.reduce(
        (acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("📊 Status distribution:");
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} colleges`);
      });

      const missingUniversity = records.filter(
        (r) => !r.home_university,
      ).length;
      if (missingUniversity > 0) {
        console.log(
          `⚠️  ${missingUniversity} records have missing home_university`,
        );
      }
    } catch (error) {
      console.error("❌ CSV validation failed:", error);
      throw error;
    }
  }

  async listColleges(limit: number = 10): Promise<void> {
    try {
      console.log(`📋 Listing first ${limit} college records...`);

      // Authenticate
      const authenticated =
        (await this.authenticateWithToken()) ||
        (await this.authenticateWithCredentials());
      if (!authenticated) {
        throw new Error("Authentication failed");
      }

      const result = await this.pb
        .collection(this.collectionName)
        .getList(1, limit, {
          sort: "college_id",
        });

      console.log(`📊 Found ${result.totalItems} total college records`);
      console.log(`📄 Showing first ${result.items.length} records:\n`);

      result.items.forEach((record, index) => {
        console.log(`${index + 1}. College ID: ${record.college_id}`);
        console.log(`   Name: ${record.college_name}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   University: ${record.home_university}`);
        console.log("");
      });
    } catch (error) {
      console.error("❌ List colleges failed:", error);
      throw error;
    }
  }
}

// Command line interface
async function main() {
  const uploader = new BatchCollegeUploader();

  const command = process.argv[2];
  const limit = parseInt(process.argv[3]) || 10;

  switch (command) {
    case "create":
      console.log("📝 Creating new college records...");
      await uploader.uploadData("create");
      break;

    case "upsert":
      console.log("🔄 Upserting college records...");
      await uploader.uploadData("upsert");
      break;

    case "clear":
      console.log("🧹 Clearing college collection...");
      await uploader.clearCollection();
      break;

    case "replace":
      console.log("🔄 Replacing all college records (clear + create)...");
      await uploader.clearCollection();
      await uploader.uploadData("create");
      break;

    case "list":
      await uploader.listColleges(limit);
      break;

    case "validate":
      await uploader.validateCSV();
      break;

    default:
      console.log("📋 Usage:");
      console.log(
        "  npm run batch-upload-colleges create    - Create new college records",
      );
      console.log(
        "  npm run batch-upload-colleges upsert    - Upsert college records (create or update)",
      );
      console.log(
        "  npm run batch-upload-colleges clear     - Clear all college records",
      );
      console.log(
        "  npm run batch-upload-colleges replace   - Clear and create (full replace)",
      );
      console.log(
        "  npm run batch-upload-colleges list [n]  - List first n college records (default: 10)",
      );
      console.log(
        "  npm run batch-upload-colleges validate  - Validate CSV file without uploading",
      );
      console.log("");
      console.log("Examples:");
      console.log("  npm run batch-upload-colleges validate");
      console.log("  npm run batch-upload-colleges create");
      console.log("  npm run batch-upload-colleges list 20");
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default BatchCollegeUploader;
