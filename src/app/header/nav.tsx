'use client'
import { useRouter } from 'next/navigation'
import { SwapRightOutlined } from '@ant-design/icons'
import Link from 'next/link'

const Nav = () => {
  const router = useRouter()
  return (
    <nav className='flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-[38px]'>
      <Link
        href="/governance_introducing"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer flex items-center gap-2'
      >
        <div>Governance</div>
        <div className='-rotate-45'>
          <SwapRightOutlined />
        </div>
      </Link>

      <Link
        href="/#members"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
      >
        Member
      </Link>
      <Link
        href="/proposals"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
      >
        Proposal
      </Link>

      <Link
        href="/invest"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
      >
        Investment
      </Link>

      <Link
        href="/projects"
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
      >
        Project
      </Link>

      <div className='block md:hidden'>{/* <WalletConnector /> */}</div>
    </nav>
  )
}

export default Nav
