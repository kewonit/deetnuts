"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Global Error Boundary - catches errors in root layout
 * Best Practice: Provides app-wide error handling fallback
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring service
    console.error("[Global Error]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-red-50">
          <div className="max-w-md w-full">
            <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 border-4 border-black rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <h1 className="text-2xl font-black text-center mb-2">
                Critical Error
              </h1>

              <p className="text-gray-600 text-center mb-6">
                A critical error occurred. Please try refreshing the page.
              </p>

              {process.env.NODE_ENV === "development" && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm font-mono text-red-700 break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-500 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={reset}
                className="w-full border-4 border-black bg-green-400 hover:bg-green-500 text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
