import { getAuthenticatedPocketBase } from "@/lib/pocketbase/auth";

export async function ensureUserAuthenticated() {
  try {
    const auth = await getAuthenticatedPocketBase();
    if (!auth) {
      throw new Error("User authentication required");
    }
    return auth.user;
  } catch (error) {
    console.error("Authentication check failed:", error);
    throw new Error("Authentication failed");
  }
}

export async function getAuthenticatedUserClient() {
  try {
    const auth = await getAuthenticatedPocketBase();
    if (!auth) {
      throw new Error("User authentication required");
    }
    return auth.pb;
  } catch (error) {
    console.error("Authentication check failed:", error);
    throw new Error("Authentication failed");
  }
}
