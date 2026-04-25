import { Button } from "@/components/ui/button";
import { FileCheck2, PlayCircle, TableProperties } from "lucide-react";
import Link from "next/link";

const dashboardCards = [
  {
    title: "Start Mock",
    text: "Build a PCM, section, or chapter mock from approved questions.",
    icon: PlayCircle,
    href: "/mht-cet/mock-tests/new",
  },
  {
    title: "Source Review",
    text: "Public mocks use approved imports only; fixtures stay separate.",
    icon: FileCheck2,
    href: "/mht-cet/mock-tests/new",
  },
  {
    title: "Stats Tables",
    text: "Results split score, accuracy, subject, and chapter performance.",
    icon: TableProperties,
    href: "/mht-cet/mock-tests/new",
  },
];

export default function MhtCetMockTestsPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 p-5 pt-24">
      <header className="grid gap-3">
        <h1 className="font-heading text-4xl sm:text-5xl">
          MHT-CET Mock Tests
        </h1>
        <p className="max-w-2xl font-base text-lg">
          Timed mocks with approved question imports, server-side scoring, and
          clear result tables.
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              className="grid gap-4 rounded-base border-2 border-black bg-main p-5 shadow-base transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
              href={card.href}
              key={card.title}
            >
              <Icon className="h-8 w-8" />
              <h2 className="font-heading text-2xl">{card.title}</h2>
              <p className="font-base">{card.text}</p>
            </Link>
          );
        })}
      </div>
      <Button asChild className="w-fit">
        <Link href="/mht-cet/mock-tests/new">Start Mock</Link>
      </Button>
    </main>
  );
}
