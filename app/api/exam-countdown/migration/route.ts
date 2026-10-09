import { migrationOptions, migrationRequest } from "@/lib/timekeeper/migration-api";
export function OPTIONS(request: Request) { return migrationOptions(request, "mint"); }
export function POST(request: Request) { return migrationRequest(request, "mint"); }
