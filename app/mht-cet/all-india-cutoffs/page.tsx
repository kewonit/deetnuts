import AllIndiaCutoffs from "./all-india-cutoffs";
import { getMhtCetCollegeNames } from "@/lib/admissions/college-media";

export default function AllIndiaCutoffsPage() {
  return <AllIndiaCutoffs collegeNames={getMhtCetCollegeNames()} />;
}
