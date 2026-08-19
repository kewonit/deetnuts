"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Custom Node Component
const CustomNode = ({ data }: { data: any }) => {
  const { label, type, description, examples } = data;

  const getNodeStyles = () => {
    switch (type) {
      case "root":
        return "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700";
      case "category":
        return "bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-700";
      case "subcategory":
        return "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-700";
      case "allocation":
        return "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-700";
      case "final":
        return "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-700";
      default:
        return "bg-white border-gray-300";
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[200px] ${getNodeStyles()}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="font-semibold text-sm mb-1">{label}</div>
      {description && (
        <div className="text-xs opacity-90 mb-2">{description}</div>
      )}
      {examples && (
        <div className="space-y-1">
          {examples.map((example: string, index: number) => (
            <Badge
              key={index}
              variant="neutral"
              className="text-xs mr-1 bg-white/20 text-white border-white/30"
            >
              {example}
            </Badge>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const CategoryFlowChart = () => {
  const initialNodes: Node[] = useMemo(
    () => [
      // Root Node
      {
        id: "1",
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          label: "Seat Types",
          type: "root",
          description: "MHT-CET Seat Type Categories",
        },
      },

      // Main Seat Type - General
      {
        id: "2",
        type: "custom",
        position: { x: 400, y: -200 },
        data: {
          label: "General",
          type: "category",
          description: "General seat type",
        },
      },

      // Main Seat Type - Ladies (centered with its children)
      {
        id: "35",
        type: "custom",
        position: { x: 400, y: 2675 }, // Centered around Ladies children (2100-3600)
        data: {
          label: "Ladies",
          type: "category",
          description: "Ladies seat type",
        },
      },

      // Main Seat Type - PWD (centered with its children)
      {
        id: "56",
        type: "custom",
        position: { x: 400, y: 4375 }, // Centered around PWD children (3900-4900)
        data: {
          label: "PWD",
          type: "category",
          description: "Persons with Disabilities seat type",
        },
      },

      // Main Seat Type - Defence (centered with its children)
      {
        id: "57",
        type: "custom",
        position: { x: 400, y: 5600 }, // Centered around Defence children (5200-6000)
        data: {
          label: "Defence",
          type: "category",
          description: "Defence seat type",
        },
      },

      // Special Categories (spaced out better)
      {
        id: "58",
        type: "custom",
        position: { x: 400, y: 400 },
        data: {
          label: "EWS",
          type: "final",
          description: "Economically Weaker Section",
        },
      },
      {
        id: "59",
        type: "custom",
        position: { x: 400, y: 550 },
        data: {
          label: "ORPHAN",
          type: "final",
          description: "Orphan Category",
        },
      },
      {
        id: "60",
        type: "custom",
        position: { x: 400, y: 700 },
        data: {
          label: "TFWS",
          type: "final",
          description: "Tuition Fee Waiver Scheme",
        },
      },
      {
        id: "61",
        type: "custom",
        position: { x: 400, y: 850 },
        data: {
          label: "MI",
          type: "final",
          description: "Minority Institutions",
        },
      },

      // Category Level under General (properly aligned with final codes)
      {
        id: "3",
        type: "custom",
        position: { x: 800, y: -800 }, // Aligned with OPEN codes
        data: {
          label: "OPEN",
          type: "subcategory",
          description: "Open category",
        },
      },
      {
        id: "4",
        type: "custom",
        position: { x: 800, y: -450 }, // Aligned with OBC codes
        data: {
          label: "OBC",
          type: "subcategory",
          description: "Other Backward Classes",
        },
      },
      {
        id: "5",
        type: "custom",
        position: { x: 800, y: -100 }, // Aligned with SC codes
        data: {
          label: "SC",
          type: "subcategory",
          description: "Scheduled Caste",
        },
      },
      {
        id: "6",
        type: "custom",
        position: { x: 800, y: 250 }, // Aligned with ST codes
        data: {
          label: "ST",
          type: "subcategory",
          description: "Scheduled Tribe",
        },
      },
      {
        id: "7",
        type: "custom",
        position: { x: 800, y: 600 }, // Aligned with VJ codes
        data: {
          label: "VJ",
          type: "subcategory",
          description: "Vimukta Jati",
        },
      },
      {
        id: "8",
        type: "custom",
        position: { x: 800, y: 950 }, // Aligned with NT1 codes
        data: {
          label: "NT1",
          type: "subcategory",
          description: "Nomadic Tribe 1",
        },
      },
      {
        id: "9",
        type: "custom",
        position: { x: 800, y: 1300 }, // Aligned with NT2 codes
        data: {
          label: "NT2",
          type: "subcategory",
          description: "Nomadic Tribe 2",
        },
      },
      {
        id: "10",
        type: "custom",
        position: { x: 800, y: 1650 }, // Aligned with NT3 codes
        data: {
          label: "NT3",
          type: "subcategory",
          description: "Nomadic Tribe 3",
        },
      },

      // Category Level under Ladies (properly aligned with final codes)
      {
        id: "36",
        type: "custom",
        position: { x: 800, y: 2100 }, // Aligned with Ladies OPEN codes
        data: {
          label: "OPEN",
          type: "subcategory",
          description: "Open category (Ladies)",
        },
      },
      {
        id: "37",
        type: "custom",
        position: { x: 800, y: 2450 }, // Aligned with Ladies OBC codes
        data: {
          label: "OBC",
          type: "subcategory",
          description: "Other Backward Classes (Ladies)",
        },
      },
      {
        id: "38",
        type: "custom",
        position: { x: 800, y: 2800 }, // Aligned with Ladies SC codes
        data: {
          label: "SC",
          type: "subcategory",
          description: "Scheduled Caste (Ladies)",
        },
      },
      {
        id: "39",
        type: "custom",
        position: { x: 800, y: 3150 }, // Aligned with Ladies ST codes
        data: {
          label: "ST",
          type: "subcategory",
          description: "Scheduled Tribe (Ladies)",
        },
      },
      {
        id: "40",
        type: "custom",
        position: { x: 800, y: 3500 }, // Aligned with Ladies VJ codes
        data: {
          label: "VJ",
          type: "subcategory",
          description: "Vimukta Jati (Ladies)",
        },
      },

      // Category Level under PWD (properly aligned with final codes)
      {
        id: "62",
        type: "custom",
        position: { x: 800, y: 3900 }, // Aligned with PWD OPEN codes
        data: {
          label: "OPEN",
          type: "subcategory",
          description: "Open category (PWD)",
        },
      },
      {
        id: "63",
        type: "custom",
        position: { x: 800, y: 4150 }, // Aligned with PWD OBC codes
        data: {
          label: "OBC",
          type: "subcategory",
          description: "Other Backward Classes (PWD)",
        },
      },
      {
        id: "64",
        type: "custom",
        position: { x: 800, y: 4400 }, // Aligned with PWD SC codes
        data: {
          label: "SC",
          type: "subcategory",
          description: "Scheduled Caste (PWD)",
        },
      },
      {
        id: "65",
        type: "custom",
        position: { x: 800, y: 4650 }, // Aligned with PWD ST codes
        data: {
          label: "ST",
          type: "subcategory",
          description: "Scheduled Tribe (PWD)",
        },
      },
      {
        id: "66",
        type: "custom",
        position: { x: 800, y: 4900 }, // Aligned with PWD VJ codes
        data: {
          label: "VJ",
          type: "subcategory",
          description: "Vimukta Jati (PWD)",
        },
      },

      // Category Level under Defence (properly aligned with final codes)
      {
        id: "67",
        type: "custom",
        position: { x: 800, y: 5200 }, // Aligned with Defence OPEN codes
        data: {
          label: "OPEN",
          type: "subcategory",
          description: "Open category (Defence)",
        },
      },
      {
        id: "68",
        type: "custom",
        position: { x: 800, y: 5400 }, // Aligned with Defence OBC codes
        data: {
          label: "OBC",
          type: "subcategory",
          description: "Other Backward Classes (Defence)",
        },
      },
      {
        id: "69",
        type: "custom",
        position: { x: 800, y: 5600 }, // Aligned with Defence SC codes
        data: {
          label: "SC",
          type: "subcategory",
          description: "Scheduled Caste (Defence)",
        },
      },
      {
        id: "70",
        type: "custom",
        position: { x: 800, y: 5800 }, // Aligned with Defence ST codes
        data: {
          label: "ST",
          type: "subcategory",
          description: "Scheduled Tribe (Defence)",
        },
      },
      {
        id: "71",
        type: "custom",
        position: { x: 800, y: 6000 }, // Aligned with Defence VJ codes
        data: {
          label: "VJ",
          type: "subcategory",
          description: "Vimukta Jati (Defence)",
        },
      },

      // Final Category Codes - OPEN (no overlap, proper spacing)
      {
        id: "11",
        type: "custom",
        position: { x: 1200, y: -900 },
        data: {
          label: "GOPENS",
          type: "final",
          description: "General Open State",
        },
      },
      {
        id: "12",
        type: "custom",
        position: { x: 1200, y: -800 },
        data: {
          label: "GOPENH",
          type: "final",
          description: "General Open Home University",
        },
      },
      {
        id: "13",
        type: "custom",
        position: { x: 1200, y: -700 },
        data: {
          label: "GOPENO",
          type: "final",
          description: "General Open Other University",
        },
      },

      // Final Category Codes - OBC (no overlap, proper spacing)
      {
        id: "14",
        type: "custom",
        position: { x: 1200, y: -550 },
        data: {
          label: "GOBCS",
          type: "final",
          description: "General OBC State",
        },
      },
      {
        id: "15",
        type: "custom",
        position: { x: 1200, y: -450 },
        data: {
          label: "GOBCH",
          type: "final",
          description: "General OBC Home University",
        },
      },
      {
        id: "16",
        type: "custom",
        position: { x: 1200, y: -350 },
        data: {
          label: "GOBCO",
          type: "final",
          description: "General OBC Other University",
        },
      },

      // Final Category Codes - SC (no overlap, proper spacing)
      {
        id: "17",
        type: "custom",
        position: { x: 1200, y: -200 },
        data: {
          label: "GSCS",
          type: "final",
          description: "General SC State",
        },
      },
      {
        id: "18",
        type: "custom",
        position: { x: 1200, y: -100 },
        data: {
          label: "GSCH",
          type: "final",
          description: "General SC Home University",
        },
      },
      {
        id: "19",
        type: "custom",
        position: { x: 1200, y: 0 },
        data: {
          label: "GSCO",
          type: "final",
          description: "General SC Other University",
        },
      },

      // Final Category Codes - ST (no overlap, proper spacing)
      {
        id: "20",
        type: "custom",
        position: { x: 1200, y: 150 },
        data: {
          label: "GSTS",
          type: "final",
          description: "General ST State",
        },
      },
      {
        id: "21",
        type: "custom",
        position: { x: 1200, y: 250 },
        data: {
          label: "GSTH",
          type: "final",
          description: "General ST Home University",
        },
      },
      {
        id: "22",
        type: "custom",
        position: { x: 1200, y: 350 },
        data: {
          label: "GSTO",
          type: "final",
          description: "General ST Other University",
        },
      },

      // Final Category Codes - VJ (no overlap, proper spacing)
      {
        id: "23",
        type: "custom",
        position: { x: 1200, y: 500 },
        data: {
          label: "GVJS",
          type: "final",
          description: "General VJ State",
        },
      },
      {
        id: "24",
        type: "custom",
        position: { x: 1200, y: 600 },
        data: {
          label: "GVJH",
          type: "final",
          description: "General VJ Home University",
        },
      },
      {
        id: "25",
        type: "custom",
        position: { x: 1200, y: 700 },
        data: {
          label: "GVJO",
          type: "final",
          description: "General VJ Other University",
        },
      },

      // Final Category Codes - NT1 (no overlap, proper spacing)
      {
        id: "26",
        type: "custom",
        position: { x: 1200, y: 850 },
        data: {
          label: "GNT1S",
          type: "final",
          description: "General NT1 State",
        },
      },
      {
        id: "27",
        type: "custom",
        position: { x: 1200, y: 950 },
        data: {
          label: "GNT1H",
          type: "final",
          description: "General NT1 Home University",
        },
      },
      {
        id: "28",
        type: "custom",
        position: { x: 1200, y: 1050 },
        data: {
          label: "GNT1O",
          type: "final",
          description: "General NT1 Other University",
        },
      },

      // Final Category Codes - NT2 (no overlap, proper spacing)
      {
        id: "29",
        type: "custom",
        position: { x: 1200, y: 1200 },
        data: {
          label: "GNT2S",
          type: "final",
          description: "General NT2 State",
        },
      },
      {
        id: "30",
        type: "custom",
        position: { x: 1200, y: 1300 },
        data: {
          label: "GNT2H",
          type: "final",
          description: "General NT2 Home University",
        },
      },
      {
        id: "31",
        type: "custom",
        position: { x: 1200, y: 1400 },
        data: {
          label: "GNT2O",
          type: "final",
          description: "General NT2 Other University",
        },
      },

      // Final Category Codes - NT3 (no overlap, proper spacing)
      {
        id: "32",
        type: "custom",
        position: { x: 1200, y: 1550 },
        data: {
          label: "GNT3S",
          type: "final",
          description: "General NT3 State",
        },
      },
      {
        id: "33",
        type: "custom",
        position: { x: 1200, y: 1650 },
        data: {
          label: "GNT3H",
          type: "final",
          description: "General NT3 Home University",
        },
      },
      {
        id: "34",
        type: "custom",
        position: { x: 1200, y: 1750 },
        data: {
          label: "GNT3O",
          type: "final",
          description: "General NT3 Other University",
        },
      },

      // Final Category Codes - Ladies OPEN (no overlap, proper spacing)
      {
        id: "41",
        type: "custom",
        position: { x: 1200, y: 2000 },
        data: {
          label: "LOPENS",
          type: "final",
          description: "Ladies Open State",
        },
      },
      {
        id: "42",
        type: "custom",
        position: { x: 1200, y: 2100 },
        data: {
          label: "LOPENH",
          type: "final",
          description: "Ladies Open Home University",
        },
      },
      {
        id: "43",
        type: "custom",
        position: { x: 1200, y: 2200 },
        data: {
          label: "LOPENO",
          type: "final",
          description: "Ladies Open Other University",
        },
      },

      // Final Category Codes - Ladies OBC (no overlap, proper spacing)
      {
        id: "44",
        type: "custom",
        position: { x: 1200, y: 2350 },
        data: {
          label: "LOBCS",
          type: "final",
          description: "Ladies OBC State",
        },
      },
      {
        id: "45",
        type: "custom",
        position: { x: 1200, y: 2450 },
        data: {
          label: "LOBCH",
          type: "final",
          description: "Ladies OBC Home University",
        },
      },
      {
        id: "46",
        type: "custom",
        position: { x: 1200, y: 2550 },
        data: {
          label: "LOBCO",
          type: "final",
          description: "Ladies OBC Other University",
        },
      },

      // Final Category Codes - Ladies SC (no overlap, proper spacing)
      {
        id: "47",
        type: "custom",
        position: { x: 1200, y: 2700 },
        data: {
          label: "LSCS",
          type: "final",
          description: "Ladies SC State",
        },
      },
      {
        id: "48",
        type: "custom",
        position: { x: 1200, y: 2800 },
        data: {
          label: "LSCH",
          type: "final",
          description: "Ladies SC Home University",
        },
      },
      {
        id: "49",
        type: "custom",
        position: { x: 1200, y: 2900 },
        data: {
          label: "LSCO",
          type: "final",
          description: "Ladies SC Other University",
        },
      },

      // Final Category Codes - Ladies ST (no overlap, proper spacing)
      {
        id: "50",
        type: "custom",
        position: { x: 1200, y: 3050 },
        data: {
          label: "LSTS",
          type: "final",
          description: "Ladies ST State",
        },
      },
      {
        id: "51",
        type: "custom",
        position: { x: 1200, y: 3150 },
        data: {
          label: "LSTH",
          type: "final",
          description: "Ladies ST Home University",
        },
      },
      {
        id: "52",
        type: "custom",
        position: { x: 1200, y: 3250 },
        data: {
          label: "LSTO",
          type: "final",
          description: "Ladies ST Other University",
        },
      },

      // Final Category Codes - Ladies VJ (no overlap, proper spacing)
      {
        id: "53",
        type: "custom",
        position: { x: 1200, y: 3400 },
        data: {
          label: "LVJS",
          type: "final",
          description: "Ladies VJ State",
        },
      },
      {
        id: "54",
        type: "custom",
        position: { x: 1200, y: 3500 },
        data: {
          label: "LVJH",
          type: "final",
          description: "Ladies VJ Home University",
        },
      },
      {
        id: "55",
        type: "custom",
        position: { x: 1200, y: 3600 },
        data: {
          label: "LVJO",
          type: "final",
          description: "Ladies VJ Other University",
        },
      },

      // Final Category Codes - PWD OPEN
      {
        id: "72",
        type: "custom",
        position: { x: 1200, y: 3850 },
        data: {
          label: "PWDOPENS",
          type: "final",
          description: "PWD Open State",
        },
      },
      {
        id: "73",
        type: "custom",
        position: { x: 1200, y: 3950 },
        data: {
          label: "PWDOPENH",
          type: "final",
          description: "PWD Open Home University",
        },
      },

      // Final Category Codes - PWD OBC
      {
        id: "74",
        type: "custom",
        position: { x: 1200, y: 4100 },
        data: {
          label: "PWDOBCS",
          type: "final",
          description: "PWD OBC State",
        },
      },
      {
        id: "75",
        type: "custom",
        position: { x: 1200, y: 4200 },
        data: {
          label: "PWDOBCH",
          type: "final",
          description: "PWD OBC Home University",
        },
      },

      // Final Category Codes - PWD SC
      {
        id: "76",
        type: "custom",
        position: { x: 1200, y: 4350 },
        data: {
          label: "PWDSCS",
          type: "final",
          description: "PWD SC State",
        },
      },
      {
        id: "77",
        type: "custom",
        position: { x: 1200, y: 4450 },
        data: {
          label: "PWDSCH",
          type: "final",
          description: "PWD SC Home University",
        },
      },

      // Final Category Codes - PWD ST
      {
        id: "78",
        type: "custom",
        position: { x: 1200, y: 4600 },
        data: {
          label: "PWDRSTS",
          type: "final",
          description: "PWD ST State",
        },
      },
      {
        id: "79",
        type: "custom",
        position: { x: 1200, y: 4700 },
        data: {
          label: "PWDRSTH",
          type: "final",
          description: "PWD ST Home University",
        },
      },

      // Final Category Codes - PWD VJ
      {
        id: "80",
        type: "custom",
        position: { x: 1200, y: 4850 },
        data: {
          label: "PWDRVJS",
          type: "final",
          description: "PWD VJ State",
        },
      },

      // Final Category Codes - Defence OPEN
      {
        id: "81",
        type: "custom",
        position: { x: 1200, y: 5150 },
        data: {
          label: "DEFOPENS",
          type: "final",
          description: "Defence Open State",
        },
      },

      // Final Category Codes - Defence OBC
      {
        id: "82",
        type: "custom",
        position: { x: 1200, y: 5350 },
        data: {
          label: "DEFOBCS",
          type: "final",
          description: "Defence OBC State",
        },
      },

      // Final Category Codes - Defence SC
      {
        id: "83",
        type: "custom",
        position: { x: 1200, y: 5550 },
        data: {
          label: "DEFSCS",
          type: "final",
          description: "Defence SC State",
        },
      },

      // Final Category Codes - Defence ST
      {
        id: "84",
        type: "custom",
        position: { x: 1200, y: 5750 },
        data: {
          label: "DEFSTS",
          type: "final",
          description: "Defence ST State",
        },
      },

      // Final Category Codes - Defence VJ
      {
        id: "85",
        type: "custom",
        position: { x: 1200, y: 5950 },
        data: {
          label: "DEFRVJS",
          type: "final",
          description: "Defence VJ State",
        },
      },
    ],
    [],
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      // Root to all main categories
      {
        id: "e1-2",
        source: "1",
        target: "2",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-35",
        source: "1",
        target: "35",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-56",
        source: "1",
        target: "56",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-57",
        source: "1",
        target: "57",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-58",
        source: "1",
        target: "58",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-59",
        source: "1",
        target: "59",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-60",
        source: "1",
        target: "60",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e1-61",
        source: "1",
        target: "61",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },

      // General to all categories
      {
        id: "e2-3",
        source: "2",
        target: "3",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-4",
        source: "2",
        target: "4",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-5",
        source: "2",
        target: "5",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-6",
        source: "2",
        target: "6",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-7",
        source: "2",
        target: "7",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-8",
        source: "2",
        target: "8",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-9",
        source: "2",
        target: "9",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e2-10",
        source: "2",
        target: "10",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },

      // Ladies to all categories
      {
        id: "e35-36",
        source: "35",
        target: "36",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e35-37",
        source: "35",
        target: "37",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e35-38",
        source: "35",
        target: "38",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e35-39",
        source: "35",
        target: "39",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e35-40",
        source: "35",
        target: "40",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },

      // PWD to all categories
      {
        id: "e56-62",
        source: "56",
        target: "62",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e56-63",
        source: "56",
        target: "63",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e56-64",
        source: "56",
        target: "64",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e56-65",
        source: "56",
        target: "65",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e56-66",
        source: "56",
        target: "66",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },

      // Defence to all categories
      {
        id: "e57-67",
        source: "57",
        target: "67",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e57-68",
        source: "57",
        target: "68",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e57-69",
        source: "57",
        target: "69",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e57-70",
        source: "57",
        target: "70",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },
      {
        id: "e57-71",
        source: "57",
        target: "71",
        markerEnd: { type: MarkerType.Arrow },
        style: { strokeWidth: 2 },
      },

      // ...existing code...

      // Ladies OPEN to final codes
      {
        id: "e36-41",
        source: "36",
        target: "41",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e36-42",
        source: "36",
        target: "42",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e36-43",
        source: "36",
        target: "43",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Ladies OBC to final codes
      {
        id: "e37-44",
        source: "37",
        target: "44",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e37-45",
        source: "37",
        target: "45",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e37-46",
        source: "37",
        target: "46",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Ladies SC to final codes
      {
        id: "e38-47",
        source: "38",
        target: "47",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e38-48",
        source: "38",
        target: "48",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e38-49",
        source: "38",
        target: "49",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Ladies ST to final codes
      {
        id: "e39-50",
        source: "39",
        target: "50",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e39-51",
        source: "39",
        target: "51",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e39-52",
        source: "39",
        target: "52",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Ladies VJ to final codes
      {
        id: "e40-53",
        source: "40",
        target: "53",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e40-54",
        source: "40",
        target: "54",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e40-55",
        source: "40",
        target: "55",
        markerEnd: { type: MarkerType.Arrow },
      },

      // PWD OPEN to final codes
      {
        id: "e62-72",
        source: "62",
        target: "72",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e62-73",
        source: "62",
        target: "73",
        markerEnd: { type: MarkerType.Arrow },
      },

      // PWD OBC to final codes
      {
        id: "e63-74",
        source: "63",
        target: "74",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e63-75",
        source: "63",
        target: "75",
        markerEnd: { type: MarkerType.Arrow },
      },

      // PWD SC to final codes
      {
        id: "e64-76",
        source: "64",
        target: "76",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e64-77",
        source: "64",
        target: "77",
        markerEnd: { type: MarkerType.Arrow },
      },

      // PWD ST to final codes
      {
        id: "e65-78",
        source: "65",
        target: "78",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e65-79",
        source: "65",
        target: "79",
        markerEnd: { type: MarkerType.Arrow },
      },

      // PWD VJ to final codes
      {
        id: "e66-80",
        source: "66",
        target: "80",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Defence OPEN to final codes
      {
        id: "e67-81",
        source: "67",
        target: "81",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Defence OBC to final codes
      {
        id: "e68-82",
        source: "68",
        target: "82",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Defence SC to final codes
      {
        id: "e69-83",
        source: "69",
        target: "83",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Defence ST to final codes
      {
        id: "e70-84",
        source: "70",
        target: "84",
        markerEnd: { type: MarkerType.Arrow },
      },

      // Defence VJ to final codes
      {
        id: "e71-85",
        source: "71",
        target: "85",
        markerEnd: { type: MarkerType.Arrow },
      },

      // OPEN to final codes
      {
        id: "e3-11",
        source: "3",
        target: "11",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e3-12",
        source: "3",
        target: "12",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e3-13",
        source: "3",
        target: "13",
        markerEnd: { type: MarkerType.Arrow },
      },

      // OBC to final codes
      {
        id: "e4-14",
        source: "4",
        target: "14",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e4-15",
        source: "4",
        target: "15",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e4-16",
        source: "4",
        target: "16",
        markerEnd: { type: MarkerType.Arrow },
      },

      // SC to final codes
      {
        id: "e5-17",
        source: "5",
        target: "17",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e5-18",
        source: "5",
        target: "18",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e5-19",
        source: "5",
        target: "19",
        markerEnd: { type: MarkerType.Arrow },
      },

      // ST to final codes
      {
        id: "e6-20",
        source: "6",
        target: "20",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e6-21",
        source: "6",
        target: "21",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e6-22",
        source: "6",
        target: "22",
        markerEnd: { type: MarkerType.Arrow },
      },

      // VJ to final codes
      {
        id: "e7-23",
        source: "7",
        target: "23",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e7-24",
        source: "7",
        target: "24",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e7-25",
        source: "7",
        target: "25",
        markerEnd: { type: MarkerType.Arrow },
      },

      // NT1 to final codes
      {
        id: "e8-26",
        source: "8",
        target: "26",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e8-27",
        source: "8",
        target: "27",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e8-28",
        source: "8",
        target: "28",
        markerEnd: { type: MarkerType.Arrow },
      },

      // NT2 to final codes
      {
        id: "e9-29",
        source: "9",
        target: "29",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e9-30",
        source: "9",
        target: "30",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e9-31",
        source: "9",
        target: "31",
        markerEnd: { type: MarkerType.Arrow },
      },

      // NT3 to final codes
      {
        id: "e10-32",
        source: "10",
        target: "32",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e10-33",
        source: "10",
        target: "33",
        markerEnd: { type: MarkerType.Arrow },
      },
      {
        id: "e10-34",
        source: "10",
        target: "34",
        markerEnd: { type: MarkerType.Arrow },
      },
    ],
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <Card className="w-full h-[800px] bg-gradient-to-br from-gray-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-abel text-xl">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
              />
            </svg>
          </div>
          MHT-CET Category Code Structure
        </CardTitle>
        <div className="text-sm text-muted-foreground font-abel">
          Interactive flow chart showing the hierarchy: Seat Types → Categories
          (General/Ladies/PWD/Defence) → Sub-Categories → Final Codes
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-120px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.5}
          maxZoom={2}
          attributionPosition="bottom-left"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background color="#f1f5f9" gap={20} />
          <Controls position="top-right" />
          <MiniMap
            position="bottom-right"
            nodeColor={(node: Node) => {
              switch (node.data.type) {
                case "root":
                  return "#3b82f6";
                case "category":
                  return "#8b5cf6";
                case "subcategory":
                  return "#10b981";
                case "allocation":
                  return "#f59e0b";
                case "final":
                  return "#ef4444";
                default:
                  return "#6b7280";
              }
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>
      </CardContent>
    </Card>
  );
};

export default CategoryFlowChart;
