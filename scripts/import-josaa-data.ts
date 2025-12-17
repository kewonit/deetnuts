/**
 * JoSAA Data Import Script
 * 
 * Imports institutes, branches, and cutoffs from exported JSON files into PocketBase.
 * 
 * Usage:
 *   npx tsx scripts/import-josaa-data.ts
 */

import PocketBase from 'pocketbase';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Configuration
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://api.deetnuts.com';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const DATA_DIR = path.resolve('./data/josaa');
const CUTOFFS_DIR = path.resolve('./data/josaa/cutoffs');

const BATCH_SIZE = 10000; // Records per batch for cutoffs
const DELAY_MS = 50; // Delay between batches

// Collection names
const COLLECTIONS = {
  INSTITUTES: 'josaa_institutes',
  BRANCHES: 'josaa_branches',
  CUTOFFS: 'josaa_cutoffs',
};

interface ExportedInstitute {
  id: string;
  name: string;
  short_code: string;
  type: string;
  years_active: number[];
}

interface ExportedBranch {
  id: string;
  name: string;
  short_code: string;
  degree_type: string;
  duration_years: number;
  specializations: string[];
  years_active: number[];
}

interface ExportedCutoff {
  year: number;
  round: number;
  source: string;
  institute_id: string;
  branch_id: string;
  quota: string;
  seat_category: string;
  is_pwd: boolean;
  gender: string;
  opening_rank: number;
  closing_rank: number;
}

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read JSON file
function readJsonFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  console.log(`Reading ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Read all cutoff chunks
function readCutoffChunks(): ExportedCutoff[] {
  const allCutoffs: ExportedCutoff[] = [];
  let chunkIndex = 1;
  
  while (true) {
    const chunkFile = `cutoffs_chunk_${chunkIndex}.json`;
    const chunkPath = path.join(CUTOFFS_DIR, chunkFile);
    
    if (!fs.existsSync(chunkPath)) {
      console.log(`Found ${chunkIndex - 1} chunks total`);
      break;
    }
    
    console.log(`Reading ${chunkFile}...`);
    const content = fs.readFileSync(chunkPath, 'utf-8');
    
    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        allCutoffs.push(...parsed);
      }
    } catch {
      // Try parsing as newline-delimited JSON
      const lines = content.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const cutoff = JSON.parse(line);
          allCutoffs.push(cutoff);
        } catch {
          // Skip invalid lines
        }
      }
    }
    
    chunkIndex++;
  }
  
  return allCutoffs;
}

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('JoSAA Data Import Script');
  console.log('='.repeat(60));
  console.log(`PocketBase URL: ${POCKETBASE_URL}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log('');
  
  // Check environment variables
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERROR: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD not set');
    console.error('Check your .env or .env.local file');
    process.exit(1);
  }
  
  // Initialize PocketBase
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  
  try {
    // Authenticate as admin/superuser
    console.log('Authenticating as superuser...');
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Authenticated as superuser');
    console.log('');
    
    // =====================
    // IMPORT INSTITUTES
    // =====================
    console.log('='.repeat(60));
    console.log('Step 1: Importing Institutes');
    console.log('='.repeat(60));
    
    const institutes = readJsonFile<ExportedInstitute[]>('institutes.json');
    console.log(`Found ${institutes.length} institutes`);
    
    let institutesCreated = 0;
    let institutesSkipped = 0;
    let institutesErrors = 0;
    
    for (const inst of institutes) {
      try {
        // Check if already exists
        try {
          await pb.collection(COLLECTIONS.INSTITUTES).getOne(inst.id);
          institutesSkipped++;
          continue;
        } catch {
          // Doesn't exist, continue to create
        }
        
        // Create institute record - map field names to match PocketBase schema
        await pb.collection(COLLECTIONS.INSTITUTES).create({
          id: inst.id,
          name: inst.name,
          short_name: inst.short_code,  // Schema uses short_name, data has short_code
          institute_type: inst.type,     // Schema uses institute_type, data has type
          years_active: inst.years_active,
        });
        
        institutesCreated++;
        
        if (institutesCreated % 20 === 0) {
          console.log(`  Progress: ${institutesCreated} created...`);
        }
      } catch (error: any) {
        institutesErrors++;
        if (institutesErrors <= 3) {
          console.error(`  Error creating ${inst.short_code}: ${error?.message || error}`);
        }
      }
    }
    
    console.log(`✓ Institutes: ${institutesCreated} created, ${institutesSkipped} skipped, ${institutesErrors} errors`);
    console.log('');
    
    // =====================
    // IMPORT BRANCHES
    // =====================
    console.log('='.repeat(60));
    console.log('Step 2: Importing Branches');
    console.log('='.repeat(60));
    
    const branches = readJsonFile<ExportedBranch[]>('branches.json');
    console.log(`Found ${branches.length} branches`);
    
    let branchesCreated = 0;
    let branchesSkipped = 0;
    let branchesErrors = 0;
    
    for (const branch of branches) {
      try {
        // Check if already exists
        try {
          await pb.collection(COLLECTIONS.BRANCHES).getOne(branch.id);
          branchesSkipped++;
          continue;
        } catch {
          // Doesn't exist, continue to create
        }
        
        // Create branch record - use field names matching PocketBase schema
        await pb.collection(COLLECTIONS.BRANCHES).create({
          id: branch.id,
          name: branch.name,
          short_code: branch.short_code,
          degree_type: branch.degree_type,
          duration_years: branch.duration_years,
          specializations: branch.specializations,
          years_active: branch.years_active,
        });
        
        branchesCreated++;
        
        if (branchesCreated % 50 === 0) {
          console.log(`  Progress: ${branchesCreated} created...`);
        }
      } catch (error: any) {
        branchesErrors++;
        if (branchesErrors <= 3) {
          console.error(`  Error creating ${branch.short_code}: ${error?.message || error}`);
        }
      }
    }
    
    console.log(`✓ Branches: ${branchesCreated} created, ${branchesSkipped} skipped, ${branchesErrors} errors`);
    console.log('');
    
    // =====================
    // IMPORT CUTOFFS
    // =====================
    console.log('='.repeat(60));
    console.log('Step 3: Importing Cutoffs');
    console.log('='.repeat(60));
    
    const cutoffs = readCutoffChunks();
    console.log(`Found ${cutoffs.length.toLocaleString()} cutoff records`);
    console.log('');
    
    // Ask user if they want to proceed
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question(`Import ${cutoffs.length.toLocaleString()} cutoffs? This may take a while (y/n): `, resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Skipping cutoffs import.');
      console.log('');
      console.log('='.repeat(60));
      console.log('Import Summary');
      console.log('='.repeat(60));
      console.log(`Institutes: ${institutesCreated} created`);
      console.log(`Branches:   ${branchesCreated} created`);
      console.log(`Cutoffs:    Skipped by user`);
      return;
    }
    
    let cutoffsCreated = 0;
    let cutoffsErrors = 0;
    const startTime = Date.now();
    
    // Process in batches
    for (let i = 0; i < cutoffs.length; i += BATCH_SIZE) {
      const batch = cutoffs.slice(i, i + BATCH_SIZE);
      
      for (const cutoff of batch) {
        try {
          await pb.collection(COLLECTIONS.CUTOFFS).create({
            year: cutoff.year,
            round: cutoff.round,
            source: cutoff.source,
            institute: cutoff.institute_id,
            branch: cutoff.branch_id,
            branch_code: cutoff.branch_id,
            quota: cutoff.quota,
            category: cutoff.seat_category,
            gender: cutoff.gender.replace('-only', ''),
            is_pwd: cutoff.is_pwd,
            opening_rank: cutoff.opening_rank,
            closing_rank: cutoff.closing_rank,
          });
          
          cutoffsCreated++;
        } catch (error: any) {
          cutoffsErrors++;
          // Only log first few errors
          if (cutoffsErrors <= 5) {
            console.error(`  Error: ${error?.message || error}`);
          }
        }
      }
      
      // Progress update every 1000 records
      const progress = Math.min(i + BATCH_SIZE, cutoffs.length);
      if (progress % 1000 === 0 || progress === cutoffs.length) {
        const percent = Math.round((progress / cutoffs.length) * 100);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = Math.round(cutoffsCreated / (elapsed || 1));
        console.log(`  Progress: ${progress.toLocaleString()} / ${cutoffs.length.toLocaleString()} (${percent}%) - ${rate} records/sec`);
      }
      
      // Delay between batches
      await delay(DELAY_MS);
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`✓ Cutoffs: ${cutoffsCreated.toLocaleString()} created, ${cutoffsErrors.toLocaleString()} errors in ${totalTime}s`);
    console.log('');
    
    // =====================
    // SUMMARY
    // =====================
    console.log('='.repeat(60));
    console.log('Import Complete!');
    console.log('='.repeat(60));
    console.log(`Institutes: ${institutesCreated} created, ${institutesSkipped} skipped`);
    console.log(`Branches:   ${branchesCreated} created, ${branchesSkipped} skipped`);
    console.log(`Cutoffs:    ${cutoffsCreated.toLocaleString()} created, ${cutoffsErrors.toLocaleString()} errors`);
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Go to PocketBase Admin: ' + POCKETBASE_URL + '/_/');
    console.log('2. For each josaa_* collection, set API rules:');
    console.log('   - List/Search rule: (empty for public)');
    console.log('   - View rule: (empty for public)');
    
  } catch (error: any) {
    console.error('');
    console.error('Fatal error:', error?.message || error);
    if (error?.status === 400) {
      console.error('This may be an authentication error. Check your admin credentials.');
    }
    process.exit(1);
  }
}

main();
