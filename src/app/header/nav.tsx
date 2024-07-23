'use client'
import { useRouter } from 'next/navigation'
import { SwapRightOutlined } from '@ant-design/icons'

const Nav = () => {
  const router = useRouter()
  return (
    <nav className='flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-[38px]'>
      <div
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer flex items-center gap-2'
        onClick={() => {
          router.push('/governance_introducing')
          // setIsMenuOpened(false)
        }}
        aria-hidden
      >
        <div>Governance</div>
        <div className='-rotate-45'>
          <SwapRightOutlined />
        </div>
      </div>

      <div
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
        onClick={() => {
          router.push('/#members')
          // setIsMenuOpened(false)
        }}
        aria-hidden
      >
        Member
      </div>
      <div
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
        onClick={() => {
          router.push('/proposals')
          // setIsMenuOpened(false)
        }}
        aria-hidden
      >
        Proposal
      </div>

      <div
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
        onClick={() => {
          router.push('/invest')
          // setIsMenuOpened(false)
        }}
        aria-hidden
      >
        Investment
      </div>

      <div
        className='text-base font-medium text-black-primary hover:text-black-secondary cursor-pointer'
        onClick={() => {
          router.push('/projects')
          // setIsMenuOpened(false)
        }}
        aria-hidden
      >
        Project
      </div>

      <div className='block md:hidden'>{/* <WalletConnector /> */}</div>
    </nav>
  )
}

export default Nav
