import { formatAmount } from '@utils/numberConverter'
import { Progress } from 'antd'

const DaoTokenAmountCard: React.FC<DaoTokenAmountCardProps> = ({
  item,
  symbol,
}) => {
  const amountDisplayed = formatAmount(item.amount, 3, true)

  return (
    <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-baseline gap-1'>
          <div className='text-xl font-medium'>{amountDisplayed}</div>
          <div>{symbol}</div>
        </div>
        {item.percent != undefined && (
          <div className=' absolute top-0 right-0 scale-75'>
            <Progress
              steps={4}
              percent={item.percent}
              size='small'
              status='active'
            />
          </div>
        )}

        <div className='text-sm text-black-secondary'>{item.title}</div>
      </div>
    </div>
  )
}

export default DaoTokenAmountCard
