"use client";
import { FaBars } from "react-icons/fa";
import { AiFillGithub } from "react-icons/ai";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MAIN_SIDEBAR } from "@/data/sidebar-links";
import Drawer from "@/components/ui/drawer";

const GITHUB_REPO_URL = "https://github.com/kewonit/deetnuts";

type MobileDrawerProps = {
  githubStarCount?: string | null;
};

export default function MobileDrawer({
  githubStarCount = null,
}: MobileDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ACTIVE_SIDEBAR = pathname.includes("/") ? MAIN_SIDEBAR : MAIN_SIDEBAR;
  const [isDrawerActive, setIsDrawerActive] = useState(false);

  const handleLinkClick = (path: string) => {
    setIsDrawerActive(false);
    router.push(path);
  };

  return (
    <>
      <div className="hidden w-auto m900:block m800:w-auto m500:w-auto m400:w-[unset]">
        <button
          onClick={() => setIsDrawerActive(true)}
          aria-label="Open navigation menu"
          title="Open navigation menu"
          className="flex items-center justify-center rounded-base border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
        >
          <FaBars className="h-6 w-6 m500:h-4 m500:w-4" />
        </button>
      </div>
      <Drawer active={isDrawerActive} setActive={setIsDrawerActive}>
        <div className="scrollbar h-full w-full overflow-y-auto bg-white">
          {ACTIVE_SIDEBAR.map((item, id) => {
            return typeof item === "string" ? (
              <div
                key={id}
                className="sidebaritem block border-b-4 border-r-4 border-black p-4 text-xl font-heading m800:p-4 m800:text-base"
              >
                {item}
              </div>
            ) : (
              <button
                key={id}
                onClick={() => {
                  handleLinkClick(item.href);
                }}
                className="sidebaritem block w-full border-b-4 border-r-4 border-black p-4 pl-7 text-left text-lg font-base text-black/90 hover:bg-main m800:p-4 m800:pl-6 m800:text-base"
              >
                {item.text}
              </button>
            );
          })}
          {/*}
          <button
            onClick={() => {
              handleLinkClick('/templates')
            }}
            className="sidebaritem block w-full border-b-4 border-r-4 border-black p-4 pl-7 text-left text-lg font-base text-black/90 hover:bg-main m800:p-4 m800:pl-6 m800:text-base"
          >
            Templates
          </button>
          */}
          <div className="border-t-4 border-black p-4">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsDrawerActive(false)}
              className="flex items-center justify-between gap-3 rounded-base border-2 border-black bg-[#FFF4CC] px-4 py-3 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
            >
              <span className="flex items-center gap-2 text-sm">
                <AiFillGithub className="h-5 w-5" />
                <span>Star on GitHub</span>
              </span>
              {githubStarCount ? (
                <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs leading-none">
                  {githubStarCount}
                </span>
              ) : (
                <span className="text-xs text-gray-700">Open repo</span>
              )}
            </a>
          </div>
        </div>
      </Drawer>
    </>
  );
}
