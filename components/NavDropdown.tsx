"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import arrow from "@/public/svg/arrow.svg";

interface LinkItem {
  href: string;
  title: string;
  subtitle: string;
}

const cutoffLinks: LinkItem[] = [
  { href: "/mht-cet", title: "MHTCET", subtitle: "All India & State Cutoffs" },
];

const toolLinks: LinkItem[] = [{ href: "#", title: "/", subtitle: "/" }];

interface DropdownProps {
  title: string;
  links: LinkItem[];
}

function Dropdown({ title, links }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xl font-base"
      >
        {title}
        <ChevronDown
          className={clsx(
            isOpen ? "rotate-180" : "rotate-0",
            "h-5 w-5 transition-transform",
          )}
          color="black"
        />
      </button>
      <div
        className={clsx(
          isOpen ? "visible top-12 opacity-100" : "invisible top-10 opacity-0",
          "absolute flex w-[250px] flex-col rounded-base border-2 border-black bg-white text-lg font-base transition-all",
        )}
      >
        {links.map((link, index) => (
          <Link
            key={index}
            className="text-left flex items-center rounded-t-base px-4 py-3 border-b-2 border-b-black hover:bg-main"
            href={link.href}
            onClick={() => setIsOpen(false)}
          >
            <div className="flex flex-col">
              <span>{link.title}</span>
              <span className="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis max-w-[170px]">
                {link.subtitle}
              </span>
            </div>
            <Image
              className="ml-[15px] h-auto w-[18px] m400:ml-4 m400:w-[15px]"
              src={arrow}
              alt="arrow"
              width={21}
              height={20}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function NavDropdowns() {
  return (
    <div className="flex gap-6">
      <Dropdown title="Cutoffs" links={cutoffLinks} />
      <Dropdown title="Tools" links={toolLinks} />
    </div>
  );
}
