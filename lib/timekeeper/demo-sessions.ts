// Deterministic example sessions for the study map. The map labels them and
// leaves them out of the live count. UTC accessors keep the IST seed consistent
// across browser timezones, so every visitor sees the same examples.
import { exams, nextSession } from "./exams";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

// Share of the day's desks in use for each IST hour; evenings peak and the
// small hours keep a few night owls.
const HOURLY_ACTIVITY = [
  0.55, 0.4, 0.3, 0.25, 0.25, 0.3, 0.5, 0.75, 0.92, 0.95, 1, 1, 0.95, 0.92,
  0.92, 0.95, 1, 1, 1, 1, 1, 1, 0.95, 0.8,
];

// Relative aspirant volume; unlisted exams weigh 0.5.
const EXAM_POPULARITY: Record<string, number> = {
  "jee-main": 8,
  "neet-ug": 8,
  "cbse-class-12": 5,
  "cbse-class-10": 5,
  cat: 4,
  "upsc-cse": 4,
  "ssc-cgl": 3,
  "cuet-ug": 3,
  gate: 3,
  "jee-advanced": 3,
  clat: 2,
  "icse-class-10": 2,
  "maharashtra-hsc": 2,
  "maharashtra-ssc": 2,
  "up-board-10th": 2,
  "up-board-12th": 2,
  mhtcet: 2,
  "ugc-net": 2,
};

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextElement<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  nextWeighted<T>(array: T[], weight: (item: T) => number): T {
    const total = array.reduce((sum, item) => sum + weight(item), 0);
    let pick = this.next() * total;
    for (const item of array) {
      pick -= weight(item);
      if (pick < 0) return item;
    }
    return array[array.length - 1];
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Coaching hubs weigh more within their area.
const DEMONSTRATION_CITIES = [
  { name: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648, weight: 4 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209, weight: 4 },
  { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376, weight: 3 },
  {
    name: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    weight: 3,
  },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, weight: 3 },
  {
    name: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    weight: 3,
  },
  {
    name: "Bengaluru",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    weight: 3,
  },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, weight: 2 },
  {
    name: "Lucknow",
    state: "Uttar Pradesh",
    lat: 26.8467,
    lng: 80.9462,
    weight: 2,
  },
  {
    name: "Prayagraj",
    state: "Uttar Pradesh",
    lat: 25.4358,
    lng: 81.8463,
    weight: 2,
  },
  {
    name: "Indore",
    state: "Madhya Pradesh",
    lat: 22.7196,
    lng: 75.8577,
    weight: 2,
  },
  {
    name: "Kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    weight: 2,
  },
  {
    name: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    weight: 2,
  },
  {
    name: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    weight: 2,
  },
  {
    name: "Chandigarh",
    state: "Chandigarh",
    lat: 30.7333,
    lng: 76.7794,
    weight: 1,
  },
  {
    name: "Kanpur",
    state: "Uttar Pradesh",
    lat: 26.4499,
    lng: 80.3319,
    weight: 1,
  },
  {
    name: "Nagpur",
    state: "Maharashtra",
    lat: 21.1458,
    lng: 79.0882,
    weight: 1,
  },
  {
    name: "Bhopal",
    state: "Madhya Pradesh",
    lat: 23.2599,
    lng: 77.4126,
    weight: 1,
  },
  {
    name: "Varanasi",
    state: "Uttar Pradesh",
    lat: 25.3176,
    lng: 82.9739,
    weight: 1,
  },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096, weight: 1 },
  {
    name: "Bhubaneswar",
    state: "Odisha",
    lat: 20.2961,
    lng: 85.8245,
    weight: 1,
  },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, weight: 1 },
  {
    name: "Raipur",
    state: "Chhattisgarh",
    lat: 21.2514,
    lng: 81.6296,
    weight: 1,
  },
  {
    name: "Dehradun",
    state: "Uttarakhand",
    lat: 30.3165,
    lng: 78.0322,
    weight: 1,
  },
  {
    name: "Srinagar",
    state: "Jammu & Kashmir",
    lat: 34.0837,
    lng: 74.7973,
    weight: 1,
  },
  {
    name: "Jammu",
    state: "Jammu & Kashmir",
    lat: 32.7266,
    lng: 74.857,
    weight: 1,
  },
  { name: "Amritsar", state: "Punjab", lat: 31.634, lng: 74.8723, weight: 1 },
  { name: "Ludhiana", state: "Punjab", lat: 30.901, lng: 75.8573, weight: 1 },
  {
    name: "Meerut",
    state: "Uttar Pradesh",
    lat: 28.9845,
    lng: 77.7064,
    weight: 1,
  },
  {
    name: "Gorakhpur",
    state: "Uttar Pradesh",
    lat: 26.7606,
    lng: 83.3732,
    weight: 1,
  },
  {
    name: "Gwalior",
    state: "Madhya Pradesh",
    lat: 26.2183,
    lng: 78.1828,
    weight: 1,
  },
  {
    name: "Jabalpur",
    state: "Madhya Pradesh",
    lat: 23.1815,
    lng: 79.9864,
    weight: 1,
  },
  {
    name: "Jodhpur",
    state: "Rajasthan",
    lat: 26.2389,
    lng: 73.0243,
    weight: 1,
  },
  {
    name: "Udaipur",
    state: "Rajasthan",
    lat: 24.5854,
    lng: 73.7125,
    weight: 1,
  },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311, weight: 1 },
  { name: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812, weight: 1 },
  {
    name: "Nashik",
    state: "Maharashtra",
    lat: 19.9975,
    lng: 73.7898,
    weight: 1,
  },
  {
    name: "Chhatrapati Sambhajinagar",
    state: "Maharashtra",
    lat: 19.8762,
    lng: 75.3433,
    weight: 1,
  },
  { name: "Panaji", state: "Goa", lat: 15.4909, lng: 73.8278, weight: 1 },
  {
    name: "Hubballi",
    state: "Karnataka",
    lat: 15.3647,
    lng: 75.124,
    weight: 1,
  },
  {
    name: "Mangaluru",
    state: "Karnataka",
    lat: 12.9141,
    lng: 74.856,
    weight: 1,
  },
  { name: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394, weight: 1 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673, weight: 1 },
  {
    name: "Thiruvananthapuram",
    state: "Kerala",
    lat: 8.5241,
    lng: 76.9366,
    weight: 1,
  },
  {
    name: "Madurai",
    state: "Tamil Nadu",
    lat: 9.9252,
    lng: 78.1198,
    weight: 1,
  },
  {
    name: "Coimbatore",
    state: "Tamil Nadu",
    lat: 11.0168,
    lng: 76.9558,
    weight: 1,
  },
  {
    name: "Vijayawada",
    state: "Andhra Pradesh",
    lat: 16.5062,
    lng: 80.648,
    weight: 1,
  },
  {
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lng: 83.2185,
    weight: 1,
  },
  {
    name: "Siliguri",
    state: "West Bengal",
    lat: 26.7271,
    lng: 88.3953,
    weight: 1,
  },
  {
    name: "Shillong",
    state: "Meghalaya",
    lat: 25.5788,
    lng: 91.8933,
    weight: 1,
  },
  { name: "Agartala", state: "Tripura", lat: 23.8315, lng: 91.2868, weight: 1 },
  { name: "Imphal", state: "Manipur", lat: 24.817, lng: 93.9368, weight: 1 },
];

export interface DemonstrationSession {
  id: string;
  exam_slug: string;
  exam_name: string;
  subject: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  avatar_seed: string;
  started_at: string;
  is_demonstration: boolean;
}

// Exams with a session coming up soon draw more examples, so the map follows
// the exam calendar. Weights use the start of the IST day, so a student's exam
// never changes during their stint.
function examWeights(dayStart: number) {
  const weights = new Map<string, number>();
  for (const exam of exams) {
    const session = nextSession(exam.sessions, dayStart);
    const days = session
      ? Math.max(0, (Date.parse(session.date) - dayStart) / DAY_MS)
      : Infinity;
    weights.set(
      exam.slug,
      (EXAM_POPULARITY[exam.slug] ?? 0.5) *
        (Number.isFinite(days) ? 1 / (1 + days / 90) : 0.05),
    );
  }
  return weights;
}

// A student studies one named subject, not "Mathematics/Biology" or
// "Optional subject".
function concreteSubjects(subjects: string[]) {
  const named = subjects.filter(
    (subject) => !/\/|subject|etc\./i.test(subject),
  );
  return named.length ? named : subjects;
}

// Each desk owns a run of neighbouring cities along a path that snakes through
// 3° latitude bands, so examples spread across the country instead of
// stacking on one spot. The path's starting point and the desk order change
// daily.
function deskRegions(rng: SeededRandom, desks: number) {
  const band = (city: { lat: number }) => Math.floor(city.lat / 3);
  const path = [...DEMONSTRATION_CITIES].sort(
    (a, b) =>
      band(a) - band(b) || (band(a) % 2 ? b.lng - a.lng : a.lng - b.lng),
  );
  const offset = rng.nextInt(0, path.length - 1);
  const rotated = [...path.slice(offset), ...path.slice(0, offset)];
  return rng
    .shuffle(Array.from({ length: desks }, (_, index) => index))
    .map((region) =>
      rotated.slice(
        Math.floor((region * rotated.length) / desks),
        Math.floor(((region + 1) * rotated.length) / desks),
      ),
    );
}

// Each desk seats one student at a time for 25–110 minutes, then stays empty
// for a few minutes before the next arrives. Desks start out of phase, so
// people join and leave one at a time.
function stintAt(rng: SeededRandom, minute: number) {
  let start = -rng.nextInt(0, 60);
  for (let index = 0; ; index++) {
    const end = start + rng.nextInt(25, 110);
    if (minute < end) return { index, start: Math.max(start, 0) };
    const resume = end + rng.nextInt(0, 4);
    if (minute < resume) return null;
    start = resume;
  }
}

export function generateDeterministicSessions(
  now: number,
  focusExamSlug?: string,
): DemonstrationSession[] {
  const dayIndex = Math.floor((now + IST_OFFSET_MS) / DAY_MS);
  const dayStart = dayIndex * DAY_MS - IST_OFFSET_MS;
  const minute = Math.floor((now - dayStart) / MINUTE_MS);
  const ist = new Date(dayIndex * DAY_MS);
  const dailySeed =
    ist.getUTCFullYear() * 10000 + ist.getUTCMonth() * 100 + ist.getUTCDate();
  const dailyRng = new SeededRandom(dailySeed);
  const desks = dailyRng.nextInt(13, 15);
  const regions = deskRegions(dailyRng, desks);

  const hour = Math.floor(minute / 60);
  const activity =
    HOURLY_ACTIVITY[hour] +
    (HOURLY_ACTIVITY[(hour + 1) % 24] - HOURLY_ACTIVITY[hour]) *
      ((minute % 60) / 60);
  const occupied = Math.round(desks * activity);

  const weights = examWeights(dayStart);
  const focus = exams.find((exam) => exam.slug === focusExamSlug);
  const sessions: DemonstrationSession[] = [];

  for (let desk = 0; desk < occupied; desk++) {
    const stint = stintAt(new SeededRandom(dailySeed * 100 + desk), minute);
    if (!stint) continue;
    const rng = new SeededRandom(dailySeed * 10000 + desk * 100 + stint.index);
    const city = rng.nextWeighted(regions[desk], (item) => item.weight);
    const exam =
      focus && rng.next() < 0.5
        ? focus
        : rng.nextWeighted(exams, (item) => weights.get(item.slug) ?? 0);
    // Same approximate-city spread as real sessions in study-client.ts.
    const angle = rng.next() * Math.PI * 2;
    const radius = Math.sqrt(rng.next()) * 0.045;
    const id = `demo-${dailySeed}-${desk}-${stint.index}`;

    sessions.push({
      id,
      exam_slug: exam.slug,
      exam_name: exam.name,
      subject: rng.nextElement(concreteSubjects(exam.subjects)),
      latitude: city.lat + Math.cos(angle) * radius,
      longitude: city.lng + Math.sin(angle) * radius,
      city: city.name,
      state: city.state,
      avatar_seed: `${id}-avatar`,
      started_at: new Date(dayStart + stint.start * MINUTE_MS).toISOString(),
      is_demonstration: true,
    });
  }

  return sessions;
}
