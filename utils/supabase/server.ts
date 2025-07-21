// @ts-nocheck
import { createServerClient } from '@supabase/ssr';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';

export function createClient() {
  const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies);
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(async ({ name, value, options }) => {
              // Ensure this is only called in a Server Action or Route Handler
              if (typeof window === 'undefined') {
                (await cookieStore).set(name, value, options);
              } else {
                console.error('Cookies can only be modified in a Server Action or Route Handler.');
              }
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}