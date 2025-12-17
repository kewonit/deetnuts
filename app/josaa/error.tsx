"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function JosaaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      console.error("[JoSAA Error]", {
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      });
      // TODO: Send to error monitoring service
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-amber-50">
      <div className="max-w-md w-full">
        <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 border-4 border-black rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-center mb-2">
            Something went wrong
          </h1>

          <p className="text-gray-600 text-center mb-6">
            We encountered an error while loading the JoSAA cutoffs data. Please
            try again or return to the homepage.
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 border-4 border-black bg-green-400 hover:bg-green-500 text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Link href="/josaa" className="flex-1">
              <Button className="w-full border-4 border-black bg-white hover:bg-gray-100 text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
