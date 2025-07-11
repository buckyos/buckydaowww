'use client'
import { SwapRightOutlined } from '@ant-design/icons'
import Link from 'next/link'

const Nav = () => {
  return (
    <nav className='flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-[38px]'>
      <Link
        href="/governance_introducing"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer flex items-center gap-2 no-underline'
      >
        <div>Governance</div>
        <div className='-rotate-45'>
          <SwapRightOutlined />
        </div>
      </Link>

      <Link
        href="/#members"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer no-underline'
      >
        Member
      </Link>
      <Link
        href="/proposals"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer no-underline'
      >
        Proposal
      </Link>

      <Link
        href="/invest"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer no-underline'
      >
        Investment
      </Link>

      <Link
        href="/projects"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer no-underline'
      >
        Project
      </Link>

      <div className='block md:hidden'>{/* <WalletConnector /> */}</div>
    </nav>
  )
}

export default Nav
