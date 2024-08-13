'use client'
import { Progress } from 'antd'
import TokenWithSymbol from '@components/funding/TokenWithSymbol'

interface SubscribeProgressProps {
  totalAmount: string
  investedAmount: string
  tokenAddress: string
}

const SubscribeProgress: React.FC<SubscribeProgressProps> = ({
  investedAmount,
  tokenAddress,
  totalAmount,
}) => {
  const progress = (Number(investedAmount) / Number(totalAmount)) * 100

  return (
    <div className='flex items-center gap-2'>
      <TokenWithSymbol
        totalAmount={investedAmount}
        tokenAddress={tokenAddress}
        format={true}
      />
      <div className='w-14'>
        <Progress percent={progress} size='small' />
      </div>
    </div>
  )
}

export default SubscribeProgress
