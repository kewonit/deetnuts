import "server-only";

export function isAdmissionsV2Enabled(_system: "mht-cet"): boolean {
  return process.env.ADMISSIONS_V2_MHT_CET?.toLowerCase() === "true";
}
