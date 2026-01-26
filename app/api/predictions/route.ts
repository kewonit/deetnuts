import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export interface PredictionRecord {
  seat_id: string;
  institute: string;
  branch: string;
  seat_type: string;
  quota: string;
  predicted_cutoff_2026: number;
  change_from_2025: number;
  pct_change_from_2025: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "50");

    // Filter parameters
    const instituteFilter = searchParams.get("institute") || "";
    const branchFilter = searchParams.get("branch") || "";
    const seatTypeFilter = searchParams.get("seatType") || "";
    const quotaFilter = searchParams.get("quota") || "";
    const search = searchParams.get("search") || "";

    // Sorting parameters (default: sort by change from 2025, ascending)
    const sortBy = searchParams.get("sortBy") || "change_from_2025";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Range filters
    const minCutoff = searchParams.get("minCutoff")
      ? parseFloat(searchParams.get("minCutoff")!)
      : null;
    const maxCutoff = searchParams.get("maxCutoff")
      ? parseFloat(searchParams.get("maxCutoff")!)
      : null;
    const minChange = searchParams.get("minChange")
      ? parseFloat(searchParams.get("minChange")!)
      : null;
    const maxChange = searchParams.get("maxChange")
      ? parseFloat(searchParams.get("maxChange")!)
      : null;

    // Read CSV file
    const filePath = path.join(
      process.cwd(),
      "scripts",
      "predictions_2026_complete.csv",
    );
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Parse CSV
    const records: PredictionRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Cast numeric columns to numbers
        if (
          context.column === "predicted_cutoff_2026" ||
          context.column === "change_from_2025" ||
          context.column === "pct_change_from_2025"
        ) {
          const num = parseFloat(value);
          return isNaN(num) ? 0 : num;
        }
        // Trim string values and handle empty values
        return typeof value === "string" ? value.trim() : value;
      },
    });

    // Apply filters
    const filteredRecords = records.filter((record) => {
      // Filter out N/A or invalid predicted cutoffs
      if (
        !record.predicted_cutoff_2026 ||
        record.predicted_cutoff_2026 <= 0 ||
        isNaN(record.predicted_cutoff_2026)
      ) {
        return false;
      }

      // Text search across multiple fields
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          record.institute.toLowerCase().includes(searchLower) ||
          record.branch.toLowerCase().includes(searchLower) ||
          record.seat_id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Institute filter
      if (instituteFilter && record.institute !== instituteFilter) return false;

      // Branch filter
      if (branchFilter && record.branch !== branchFilter) return false;

      // Seat type filter
      if (seatTypeFilter && record.seat_type !== seatTypeFilter) return false;

      // Quota filter
      if (quotaFilter && record.quota !== quotaFilter) return false;

      // Range filters
      if (minCutoff !== null && record.predicted_cutoff_2026 < minCutoff)
        return false;
      if (maxCutoff !== null && record.predicted_cutoff_2026 > maxCutoff)
        return false;
      if (minChange !== null && record.change_from_2025 < minChange)
        return false;
      if (maxChange !== null && record.change_from_2025 > maxChange)
        return false;

      return true;
    });

    // Apply sorting
    filteredRecords.sort((a, b) => {
      const aValue = a[sortBy as keyof PredictionRecord];
      const bValue = b[sortBy as keyof PredictionRecord];

      let comparison = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        // For change columns, sort by absolute value to get smallest changes first
        if (
          sortBy === "change_from_2025" ||
          sortBy === "pct_change_from_2025"
        ) {
          const absA = Math.abs(aValue);
          const absB = Math.abs(bValue);
          comparison = absA - absB;
        } else {
          comparison = aValue - bValue;
        }
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Calculate pagination
    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    // Get unique values for filters
    const uniqueInstitutes = [
      ...new Set(records.map((r) => r.institute)),
    ].sort();
    const uniqueBranches = [...new Set(records.map((r) => r.branch))].sort();
    const uniqueSeatTypes = [
      ...new Set(records.map((r) => r.seat_type)),
    ].sort();
    const uniqueQuotas = [...new Set(records.map((r) => r.quota))].sort();

    // Calculate statistics
    const stats = {
      totalRecords: records.length,
      filteredRecords: totalRecords,
      averagePredictedCutoff:
        filteredRecords.reduce((sum, r) => sum + r.predicted_cutoff_2026, 0) /
          filteredRecords.length || 0,
      averageChange:
        filteredRecords.reduce((sum, r) => sum + r.change_from_2025, 0) /
          filteredRecords.length || 0,
      averagePercentChange:
        filteredRecords.reduce((sum, r) => sum + r.pct_change_from_2025, 0) /
          filteredRecords.length || 0,
    };

    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: {
        page,
        perPage,
        totalRecords,
        totalPages,
      },
      filters: {
        institutes: uniqueInstitutes,
        branches: uniqueBranches,
        seatTypes: uniqueSeatTypes,
        quotas: uniqueQuotas,
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch predictions data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
