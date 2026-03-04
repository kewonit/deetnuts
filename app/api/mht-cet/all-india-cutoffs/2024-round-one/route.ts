import { NextRequest } from "next/server";
import { handleAllIndiaCutoffsRequest } from "../_shared";

export async function GET(request: NextRequest) {
  return handleAllIndiaCutoffsRequest(
    request,
    "2024_all_india_rounds_one",
    "Round One",
  );
}
