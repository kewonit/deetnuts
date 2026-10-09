// Pure map demonstration generator retained from TimeKeeper production 8cb7379.
// UTC accessors keep the IST seed consistent across browser timezones.
const IST_OFFSET_HOURS = 5.5;

const ACTIVE_START_HOUR_IST = 6;

const ACTIVE_END_HOUR_IST = 2;

const SESSION_CHANGE_INTERVALS = [30, 45, 60, 90, 120, 150, 180, 210, 240];

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

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

const DEMONSTRATION_EXAMS = [
  {
    slug: "jee-main",
    name: "JEE Main",
    subjects: ["Physics", "Chemistry", "Mathematics"],
  },
  {
    slug: "jee-advanced",
    name: "JEE Advanced",
    subjects: ["Physics", "Chemistry", "Mathematics"],
  },
  {
    slug: "neet-ug",
    name: "NEET UG",
    subjects: ["Physics", "Chemistry", "Biology"],
  },
  {
    slug: "gate",
    name: "GATE",
    subjects: ["Engineering Mathematics", "General Aptitude", "Core Subject"],
  },
  {
    slug: "upsc-cse",
    name: "UPSC CSE",
    subjects: ["General Studies", "CSAT", "Essay"],
  },
  { slug: "cat", name: "CAT", subjects: ["VARC", "DILR", "QA"] },
  {
    slug: "ssc-cgl",
    name: "SSC CGL",
    subjects: ["General Intelligence", "Quantitative Aptitude", "English"],
  },
  {
    slug: "bank-po",
    name: "Bank PO",
    subjects: ["Reasoning", "Quantitative Aptitude", "English"],
  },
  {
    slug: "nda",
    name: "NDA",
    subjects: ["Mathematics", "General Ability", "English"],
  },
  {
    slug: "clat",
    name: "CLAT",
    subjects: ["Legal Reasoning", "English", "Current Affairs"],
  },
];

const DEMONSTRATION_CITIES = [
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
  { name: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  {
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lng: 83.2185,
  },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362 },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { name: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296 },
  { name: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lng: 74.7973 },
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Allahabad", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },
  { name: "Amritsar", state: "Punjab", lat: 31.634, lng: 74.8723 },
  { name: "Mysore", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
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

function getCurrentISTDate(now: number): Date {
  return new Date(now + IST_OFFSET_HOURS * 60 * 60 * 1000);
}

function getCurrentISTHour(now: number): number {
  return getCurrentISTDate(now).getUTCHours();
}

export function isWithinActiveHours(now: number): boolean {
  const istHour = getCurrentISTHour(now);

  return istHour >= ACTIVE_START_HOUR_IST || istHour < ACTIVE_END_HOUR_IST;
}

function getDailySeed(now: number): number {
  const ist = getCurrentISTDate(now);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const day = ist.getUTCDate();

  return year * 10000 + month * 100 + day;
}

function getSlotSeed(
  accountIndex: number,
  intervalMinutes: number,
  now: number,
): number {
  const ist = getCurrentISTDate(now);
  const totalMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const slot = Math.floor(totalMinutes / intervalMinutes);
  return getDailySeed(now) * 1000 + accountIndex * 100 + slot;
}

export function generateDeterministicSessions(
  now: number,
): DemonstrationSession[] {
  if (!isWithinActiveHours(now)) {
    return [];
  }

  const dailySeed = getDailySeed(now);
  const dailyRng = new SeededRandom(dailySeed);

  const accountCount = dailyRng.nextInt(5, 15);

  const shuffledCities = dailyRng.shuffle(DEMONSTRATION_CITIES);

  const sessions: DemonstrationSession[] = [];

  for (let i = 0; i < accountCount; i++) {
    const intervalMinutes =
      SESSION_CHANGE_INTERVALS[i % SESSION_CHANGE_INTERVALS.length];

    const slotSeed = getSlotSeed(i, intervalMinutes, now);
    const slotRng = new SeededRandom(slotSeed);

    const city = shuffledCities[i % shuffledCities.length];

    const exam = slotRng.nextElement(DEMONSTRATION_EXAMS);
    const subject = slotRng.nextElement(exam.subjects);

    const latJitter = (slotRng.next() - 0.5) * 0.08;
    const lngJitter = (slotRng.next() - 0.5) * 0.08;

    const ist = getCurrentISTDate(now);
    const totalMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    const slotStart =
      Math.floor(totalMinutes / intervalMinutes) * intervalMinutes;
    const slotStartDate = new Date(ist);
    slotStartDate.setUTCHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);

    sessions.push({
      id: `demo-${dailySeed}-${i}`,
      exam_slug: exam.slug,
      exam_name: exam.name,
      subject: subject,
      latitude: city.lat + latJitter,
      longitude: city.lng + lngJitter,
      city: city.name,
      state: city.state,
      avatar_seed: `demo-avatar-${dailySeed}-${i}`,
      started_at: new Date(
        slotStartDate.getTime() - IST_OFFSET_HOURS * 60 * 60 * 1000,
      ).toISOString(),
      is_demonstration: true,
    });
  }

  return sessions;
}
