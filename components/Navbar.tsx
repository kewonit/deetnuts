import { BsReddit } from 'react-icons/bs'

import Link from 'next/link'

import MobileDrawer from '@/components/MobileDrawer'
import NavDropdown from '@/components/NavDropdown'
import AuthButton from '@/app/mht-cet/all-india-cutoffs/components/authbutton'

function Navbar() {
  return (
    <nav className="fixed left-0 top-0 z-20 mx-auto flex h-[88px] w-full items-center border-b-4 border-black bg-white px-5 m500:h-16 ">
      <div className="mx-auto flex w-[1300px] max-w-full items-center justify-between">
        <MobileDrawer />

        <div className="flex items-center gap-10 pl-5 m400:flex-1 m400:pl-5">
          <Link className="text-4xl font-heading m500:text-xl" href={'/'}>
            DEETNUTS
          </Link>
        </div>

        <div className="flex items-center gap-10 m900:hidden">

          <NavDropdown />

        </div>

        <div className="flex w-[160px] items-center justify-end gap-5 m800:w-[unset] m400:gap-3">
          {/*}
          <a
            target="_blank"
            href="https://github.com/ekmas/neobrutalism-components"
            className="flex items-center justify-center rounded-base border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
          >
            <AiFillGithub className="h-6 w-6 m500:h-4 m500:w-4" />
          </a>
          */}
          <AuthButton />
        </div>
      </div>
    </nav>
  )
}

export default Navbar