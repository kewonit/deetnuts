"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { CutoffTableSkeleton } from "./cutoff-table-skeleton";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface CutoffTableProps {
  year: number;
}

export function CutoffTable({ year }: CutoffTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/bits/cutoffs/${year}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Error ${response.status}: Failed to fetch data`,
          );
        }

        const result = await response.json();

        if (!result.items || result.items.length === 0) {
          setError("No data found for the selected year");
          setData([]);
          return;
        }

        setData(result.items);
      } catch (err: any) {
        console.error("Failed to fetch BITS cutoffs:", err);
        setError(err.message || "Failed to fetch data");
        toast({
          title: "Error",
          description: err.message || "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [year]);

  if (loading) {
    return <CutoffTableSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          {error === "No data found for the selected year" && (
            <div className="mt-2">
              <button
                onClick={() =>
                  router.push(pathname.replace(`/${year}`, "/2023"))
                }
                className="underline text-sm"
              >
                View 2023 data instead
              </button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <DataTable data={data} columns={columns} />;
}
