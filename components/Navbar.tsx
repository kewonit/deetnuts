import Link from "next/link";

import MobileDrawer from "@/components/MobileDrawer";
import NavDropdown from "@/components/NavDropdown";
import AuthButton from "./authbutton";
import { AiFillGithub } from "react-icons/ai";

const GITHUB_REPO_URL = "https://github.com/kewonit/deetnuts";
const Navbar = () => {
  return (
    <>
      <nav className="relative z-20 mx-auto flex h-[88px] w-full items-center border-b-4 border-black bg-white px-5 m500:h-16 ">
        <div className="mx-auto flex w-[1300px] max-w-full items-center justify-between">
          <MobileDrawer />

          <div className="flex items-center pl-5 m400:flex-1 m400:pl-5">
            <Link
              className="relative text-4xl font-heading m500:text-xl"
              href={"/"}
            >
              DEETNUTS
              <span className="absolute -top-3 -right-12 m500:-top-2 m500:-right-8 bg-purple-400 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-black rotate-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                BETA
              </span>
            </Link>
            <div className="site-desktop-nav-links ml-16 flex items-center m900:hidden">
              <NavDropdown />
            </div>
          </div>

          <div className="flex w-[320px] items-center justify-end gap-4 m900:w-[unset] m800:w-[unset] m400:gap-3">
            <a
              target="_blank"
              rel="noreferrer"
              href={GITHUB_REPO_URL}
              aria-label="Star DEETNUTS on GitHub"
              className="site-desktop-github flex items-center gap-2 rounded-base border-2 border-black bg-[#FFF4CC] px-3 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none m900:hidden"
            >
              <AiFillGithub className="h-5 w-5" />
              <span className="text-sm leading-none">Star</span>
              <span className="text-xs leading-none text-gray-700">on GitHub</span>
            </a>
            <AuthButton />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
