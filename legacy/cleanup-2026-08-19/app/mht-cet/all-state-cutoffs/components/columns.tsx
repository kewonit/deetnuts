"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  GraduationCap,
  Users,
  Trophy,
  Hash,
  Medal,
  UserCheck,
  TrendingUp,
} from "lucide-react";

// Helper function to get category color and description
const getCategoryInfo = (category: string) => {
  const categoryInfo: Record<
    string,
    { color: string; description: string; priority: number }
  > = {
    OPEN: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Open Category - General Merit",
      priority: 1,
    },
    OBC: {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      description: "Other Backward Classes",
      priority: 2,
    },
    SC: {
      color: "bg-purple-100 text-purple-800 border-purple-300",
      description: "Scheduled Caste",
      priority: 3,
    },
    ST: {
      color: "bg-orange-100 text-orange-800 border-orange-300",
      description: "Scheduled Tribe",
      priority: 4,
    },
    "NT-B": {
      color: "bg-pink-100 text-pink-800 border-pink-300",
      description: "Nomadic Tribe B",
      priority: 5,
    },
    "NT-C": {
      color: "bg-indigo-100 text-indigo-800 border-indigo-300",
      description: "Nomadic Tribe C",
      priority: 6,
    },
    "NT-D": {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      description: "Nomadic Tribe D",
      priority: 7,
    },
    EWS: {
      color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      description: "Economically Weaker Section",
      priority: 8,
    },
  };
  return (
    categoryInfo[category] || {
      color: "bg-gray-100 text-gray-800 border-gray-300",
      description: "Other Category",
      priority: 9,
    }
  );
};

// Helper function to format large numbers with better readability
const formatNumber = (num: number | string) => {
  const numValue = typeof num === "string" ? parseInt(num) : num;
  if (isNaN(numValue)) return num.toString();
  return new Intl.NumberFormat("en-IN").format(numValue);
};

// Helper function to get score color based on range
const getScoreColor = (score: number) => {
  if (score >= 95) return "text-emerald-600";
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-yellow-600";
  if (score >= 70) return "text-orange-600";
  if (score >= 60) return "text-red-600";
  return "text-gray-600";
};

// Helper function to get rank color
const getRankColor = (rank: number) => {
  if (rank <= 1000) return "text-emerald-600";
  if (rank <= 5000) return "text-green-600";
  if (rank <= 10000) return "text-yellow-600";
  if (rank <= 20000) return "text-orange-600";
  return "text-red-600";
};

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "college_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="College" icon={Building2} />
    ),
    cell: ({ row }) => {
      const collegeName = row.getValue("college_name") as string;
      const collegeCode = row.original.college_code;
      return (
        <div className="w-[300px] flex flex-col">
          <span className="font-medium text-black truncate">{collegeName}</span>
          <span className="text-xs text-gray-500">Code: {collegeCode}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "course_name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Course"
        icon={GraduationCap}
      />
    ),
    cell: ({ row }) => {
      const courseName = row.getValue("course_name") as string;
      const courseCode = row.original.course_code;
      return (
        <div className="w-[250px] flex flex-col">
          <span className="font-medium text-black truncate">{courseName}</span>
          <span className="text-xs text-gray-500">Code: {courseCode}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" icon={Users} />
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      const { color, description } = getCategoryInfo(category);
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className={`border ${color} hover:${color} font-bold`}>
                {category}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "seat_allocation_section",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Allocation"
        icon={UserCheck}
      />
    ),
    cell: ({ row }) => {
      const allocation = row.getValue("seat_allocation_section") as string;
      return (
        <div className="w-[120px] truncate">
          <Badge
            variant="neutral"
            className="font-semibold border-gray-300 text-gray-700"
          >
            {allocation}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "last_rank",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rank" icon={Trophy} />
    ),
    cell: ({ row }) => {
      const rank = row.getValue("last_rank") as string;
      const rankValue = parseInt(rank);
      const rankColor = getRankColor(rankValue);
      return (
        <div className={`w-[100px] font-bold text-center ${rankColor}`}>
          {formatNumber(rank)}
        </div>
      );
    },
  },
  {
    accessorKey: "cutoff_score",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Score" icon={Medal} />
    ),
    cell: ({ row }) => {
      const score = parseFloat(row.getValue("cutoff_score"));
      const scoreColor = getScoreColor(score);
      return (
        <div className={`w-[100px] font-bold text-center ${scoreColor}`}>
          {score.toFixed(4)}
        </div>
      );
    },
  },
  {
    accessorKey: "total_admitted",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Admitted"
        icon={TrendingUp}
      />
    ),
    cell: ({ row }) => {
      const admitted = row.getValue("total_admitted") as number;
      return (
        <div className="w-[80px] text-center font-medium text-gray-700">
          {admitted}
        </div>
      );
    },
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" icon={Hash} />
    ),
    cell: ({ row }) => (
      <div className="w-[150px] truncate text-xs text-gray-500">
        {row.getValue("id")}
      </div>
    ),
    enableHiding: true,
  },
];
