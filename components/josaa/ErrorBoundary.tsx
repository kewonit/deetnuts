"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Production-grade error boundary for JoSAA pages
 * Catches React rendering errors and displays user-friendly fallback
 */
export class JosaaErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      console.error("JoSAA Error Boundary caught an error:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      // TODO: Send to error monitoring service (Sentry, etc.)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="border-4 border-black bg-red-100 p-6 shadow-[4px_4px_0_0_#000] max-w-md">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We encountered an error loading this page. This has been logged
              for investigation.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-black text-red-400 p-3 rounded overflow-auto max-h-32 mb-4">
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={this.handleRetry}
              className="border-2 border-black bg-white hover:bg-gray-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error fallback for data fetching errors
 */
export function DataErrorFallback({
  message = "Failed to load data",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-2 border-red-300 bg-red-50 p-4 rounded-lg text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
      <p className="text-red-700 font-medium">{message}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry} className="mt-3">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Loading skeleton for data fetching states
 */
export function DataLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-gray-200 rounded border-2 border-gray-300"
        />
      ))}
    </div>
  );
}
