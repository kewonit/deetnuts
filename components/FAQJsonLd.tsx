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

export const JOSAA_FAQS: FAQItem[] = [
  {
    question: "What is JoSAA?",
    answer:
      "JoSAA (Joint Seat Allocation Authority) is the centralized counseling process for admission to IITs, NITs, IIITs, and GFTIs based on JEE Main and JEE Advanced ranks.",
  },
  {
    question: "How are JoSAA cutoffs determined?",
    answer:
      "JoSAA cutoffs are determined based on the closing ranks of the last admitted candidate in each category for a particular branch and institute. The cutoffs vary each year based on the number of seats, difficulty of the exam, and candidate preferences.",
  },
  {
    question: "What is the difference between opening and closing rank?",
    answer:
      "Opening rank is the rank of the first student admitted to a branch, while closing rank is the rank of the last student admitted. If your rank is better than or equal to the closing rank, you have a chance of getting that seat.",
  },
  {
    question: "How many rounds are there in JoSAA counseling?",
    answer:
      "JoSAA typically conducts 6 rounds of counseling, followed by additional rounds for CSAB (Central Seat Allocation Board) for supernumerary seats.",
  },
];

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

export const PREDICTIONS_FAQS: FAQItem[] = [
  {
    question: "How accurate are these predictions?",
    answer:
      "Our predictions are based on historical trends, seat changes, and statistical analysis. While they provide a good estimate, actual cutoffs may vary based on exam difficulty, number of applicants, and other factors. Use these as a reference guide only.",
  },
  {
    question: "What data is used for predictions?",
    answer:
      "We analyze 5+ years of historical cutoff data, seat matrix changes, exam difficulty trends, and student preference patterns to generate predictions.",
  },
  {
    question: "Should I rely solely on these predictions?",
    answer:
      "No. These predictions should be used as one of many factors in your decision-making process. Always refer to official JoSAA/CSAB websites and consult with counselors for final decisions.",
  },
];
