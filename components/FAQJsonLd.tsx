// components/FAQJsonLd.tsx
// FAQ Schema for pages with frequently asked questions
import { serializeJsonLd } from "@/lib/json-ld";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQJsonLdProps {
  faqs: FAQItem[];
}

export default function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  if (!faqs || faqs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
    />
  );
}

// Pre-defined FAQs for common pages

export const MHTCET_FAQS: FAQItem[] = [
  {
    question: "What is MHT-CET?",
    answer:
      "MHT-CET (Maharashtra Common Entrance Test) is a state-level entrance exam for admission to engineering, pharmacy, and agriculture courses in Maharashtra colleges.",
  },
  {
    question: "How are MHT-CET cutoffs calculated?",
    answer:
      "MHT-CET cutoffs are based on the percentile scores of candidates. The cutoffs depend on factors like total applicants, seat availability, previous year trends, and category reservations.",
  },
  {
    question: "What is CAP round in MHT-CET?",
    answer:
      "CAP (Centralized Admission Process) rounds are the counseling rounds conducted by the State CET Cell for seat allocation based on merit and preferences filled by candidates.",
  },
  {
    question:
      "What is the difference between State Level and All India cutoffs?",
    answer:
      "State Level cutoffs apply to Maharashtra domicile students with reserved seats, while All India cutoffs apply to students from any state competing for All India quota seats.",
  },
];
