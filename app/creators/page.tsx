import React from "react";
import { Metadata } from "next";
import Augillion from "next/font/local";

const augillion = Augillion({
  src: "../../public/Augillion.otf",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creators | DEETNUTS",
  description:
    "Meet the team behind DEETNUTS - the platform simplifying college data for engineering aspirants.",
  openGraph: {
    title: "Creators | DEETNUTS",
    description: "Meet the team behind DEETNUTS.",
    url: "https://deetnuts.com/creators",
    type: "website",
  },
  alternates: {
    canonical: "https://deetnuts.com/creators",
  },
};

const CreatorPage: React.FC = () => {
  return (
    <div className="text-center mt-40 min-h-screen">
      <div className={augillion.className}>
        <h1 className="text-7xl font-augillion text-orange-400">
          The Brain behind the site
        </h1>
      </div>
      <div className="mt-4">
        <a href="https://github.com/kewonit" className="mr-1 hover:underline">
          github.com/kewonit
        </a>
      </div>
    </div>
  );
};

export default CreatorPage;
