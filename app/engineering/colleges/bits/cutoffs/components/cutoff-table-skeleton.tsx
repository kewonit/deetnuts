"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CutoffTableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[180px] ml-auto" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-[80px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[200px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[100px]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[100px]" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end mt-4 space-x-2">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[70px]" />
      </div>
    </div>
  );
}
