// Allocation mappings for MHTCET data with smart grouping
export interface AllocationGroup {
  id: string;
  label: string;
  description: string;
  allocations: string[];
}

export const MHTCET_ALLOCATION_GROUPS: AllocationGroup[] = [
  {
    id: "university_based",
    label: "🏛️ University-Based Allocation",
    description: "Allocation based on home/other university status",
    allocations: ["HOME_TO_HOME", "HOME_TO_OTHER", "OTHER_TO_OTHER"],
  },
  {
    id: "state_level",
    label: "🌍 State-Level Allocation",
    description: "State-wide allocation categories",
    allocations: ["STATE_LEVEL", "State", "All India"],
  },
  {
    id: "institutional",
    label: "🎓 Institutional Allocation",
    description: "Institution-specific allocation types",
    allocations: ["Institute", "Management", "University", "Deemed"],
  },
  {
    id: "special_quota",
    label: "⭐ Special Quota",
    description: "Special allocation categories",
    allocations: ["NRI", "Minority", "TFWS"],
  },
];

// Create a flat list of all allocations with their group information
export const ALL_ALLOCATIONS = MHTCET_ALLOCATION_GROUPS.flatMap((group) =>
  group.allocations.map((allocation) => ({
    value: allocation,
    label: allocation,
    group: group.label,
    groupId: group.id,
    description: getAllocationDescription(allocation),
  })),
);

// Helper function to get allocation description
function getAllocationDescription(allocation: string): string {
  switch (allocation) {
    case "HOME_TO_HOME":
      return "Home University seats for Home University candidates";
    case "HOME_TO_OTHER":
      return "Home University seats for Other University candidates";
    case "OTHER_TO_OTHER":
      return "Other University seats for Other University candidates";
    case "STATE_LEVEL":
      return "State-level seat allocation";
    case "State":
      return "State quota seats";
    case "All India":
      return "All India quota seats";
    case "Institute":
      return "Institute-level allocation";
    case "Management":
      return "Management quota seats";
    case "University":
      return "University-level allocation";
    case "Deemed":
      return "Deemed university seats";
    case "NRI":
      return "Non-Resident Indian quota";
    case "Minority":
      return "Minority quota seats";
    case "TFWS":
      return "Tuition Fee Waiver Scheme";
    default:
      return allocation;
  }
}

// Helper function to get allocation group
export function getAllocationGroup(
  allocation: string,
): AllocationGroup | undefined {
  return MHTCET_ALLOCATION_GROUPS.find((group) =>
    group.allocations.includes(allocation),
  );
}

// Create options for the multi-select filter
export const ALLOCATION_OPTIONS = ALL_ALLOCATIONS.map((alloc) => ({
  label: `${alloc.label} - ${alloc.description}`,
  value: alloc.value,
  group: alloc.group,
}));
