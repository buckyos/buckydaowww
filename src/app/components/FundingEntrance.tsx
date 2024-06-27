'use client'
import cx from 'classnames'
import { InvestmentState } from '@vars/index'
import { Button, message } from 'antd'
import { nowTimestamp, timeago } from '@utils/time'
import { useRouter } from 'next/navigation'
import { useInvestment } from '@hooks/useInvestment'

const FundingEntrance = () => {
  const router = useRouter()
  const { latestInvestment } = useInvestment()

  const handleFundingButtonClicked = () => {
    if (latestInvestment === null) {
      message.info(
        'There is currently no investment, please create a proposal first',
        10,
      )
      router.push('/proposals')
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 0)
      return
    }

    router.push('/funding')
  }

  const latestInvestmentEndTimeDisplay = () => {
    if (latestInvestment === null) {
      return ''
    }

    const prefix =
      latestInvestment.endTime > nowTimestamp() ? 'Will end' : 'Ended about'
    return `${prefix} ${timeago(latestInvestment.endTime * 1000)}`
  }

  const latestInvestmentTagColorClass = () => {
    if (latestInvestment === null) {
      return 'bg-gray-400'
    }

    switch (latestInvestment.state) {
      case InvestmentState.PREPARE:
        return 'bg-[#FAAD14]'
      case InvestmentState.STARTED:
        return 'bg-[#1890FF]'
      case InvestmentState.SUCCESSFUL:
        return 'bg-[#52C41A]'
      case InvestmentState.FAILED:
        return 'bg-[#F5222D]'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className='border-round p-4 mt-10'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-6 ml-3'>
          <div
            className={cx(
              'w-3 h-3',
              'rounded-md',
              `${latestInvestmentTagColorClass()}`,
            )}
          />
          <div className='flex flex-col justify-center'>
            <div className='font-medium'>
              {latestInvestment?.title
                ? latestInvestment?.title
                : 'Latest Investment'}
            </div>
            <div className='text-sm text-black-secondary'>
              {latestInvestmentEndTimeDisplay()}
            </div>
          </div>
        </div>
        <Button type='primary' onClick={handleFundingButtonClicked}>
          Funding Now
        </Button>
      </div>

      <div className='mt-10 text-sm leading-6  pl-12'>
        <div className='leading-10 text-base'>Why Invest in OpenDAN Token?</div>
        <p>
          <strong className='mr-1'>Support Without Coding:</strong>
          Help OpenDAN grow, reaching more users and developers.
        </p>
        <p>
          <strong className='mr-1'>Transparent & Secure:</strong>
          Acquire DAO Tokens through our official, transparent smart contract.
        </p>
        <p>
          <strong className='mr-1'>Share & Decide:</strong>
          Profit from OpenDAN&apos;s success and participate in governance.
        </p>
      </div>
    </div>
  )
}
export default FundingEntrance
