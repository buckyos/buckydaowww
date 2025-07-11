'use client'
import { Button } from 'antd'
import Link from 'next/link'

const FundingEntrance = () => {
  return (
    <div className='border-round p-4 mt-10'>
      <div className='flex justify-between items-center'>
        <Link href='/invest'>
          <Button type='primary' >
            Funding Now
          </Button>
        </Link>

      </div>

      <div className='mt-10 text-sm leading-6  pl-12'>
        <div className='leading-10 text-base'>
          Why Invest in Buckyos Source Token?
        </div>
        <p>
          <strong className='mr-1'>Support Without Coding:</strong>
          Help Buckyos grow, reaching more users and developers.
        </p>
        <p>
          <strong className='mr-1'>Transparent & Secure:</strong>
          Acquire DAO Tokens through our official, transparent smart contract.
        </p>
        <p>
          <strong className='mr-1'>Share & Decide:</strong>
          Profit from Buckyos&apos;s success and participate in governance.
        </p>
      </div>
    </div>
  )
}
export default FundingEntrance
