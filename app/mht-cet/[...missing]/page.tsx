import { notFound } from "next/navigation";

// Unknown MHT-CET paths render the section's 404 inside its own layout.
export default function MissingMhtCetPage() {
  notFound();
}
