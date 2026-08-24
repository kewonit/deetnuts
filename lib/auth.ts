import { getAuthenticatedPocketBase } from "@/lib/pocketbase/auth";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  verified: boolean;
  avatar?: string;
  created: string;
  updated: string;
}

/**
 * Get current authenticated user
 * Wrapped with React cache() for request deduplication
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const auth = await getAuthenticatedPocketBase();
    if (!auth) {
      return null;
    }
    const { user } = auth;

    const mappedUser: User = {
      id: user.id,
      email: user.email,
      name:
        user.full_name ||
        user.email?.split("@")[0] ||
        "",
      verified: user.verified,
      avatar: user.avatar_url,
      created: user.created,
      updated: user.updated || user.created,
    };

    return mappedUser;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error getting current user:", error);
    return null;
  }
});

/**
 * Get auth status with user info
 * Wrapped with React cache() for request deduplication
 */
export const getAuthStatus = cache(
  async (): Promise<{ isAuthenticated: boolean; user: User | null }> => {
    try {
      const user = await getCurrentUser();
      return { isAuthenticated: user !== null, user };
    } catch (error) {
      unstable_rethrow(error);
      console.error("Error checking auth status:", error);
      return { isAuthenticated: false, user: null };
    }
  },
);

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
