'use client'
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Tag, Tooltip } from 'antd'

enum InvestStatus {
  // 只能认购自己的份额
  OnlySubscribeSelfShare = 0,
  // 能认购总余额，取决于自己的token数量
  SubscribeLeftAmount = 1,
  // 投资结束
  InvestmentEnd = 2,
}

const InvestStatusTag: React.FC<{ data: TwoStepInvestmentData }> = ({
  data,
}) => {
  // const  =
  const now = Date.now()
  const stage =
    now < data.step1EndTime * 1000
      ? InvestStatus.OnlySubscribeSelfShare
      : now < data.step2EndTime * 1000
      ? InvestStatus.SubscribeLeftAmount
      : InvestStatus.InvestmentEnd

  const content = (
    <div className='flex flex-row gap-2'>
      <p>
        Phase 1: Whitelisted users can subscribe to their allotted share of
        tokens.
      </p>
      <p>
        Phase 2: Whitelisted users can subscribe to all remaining unsold tokens,
        as long as their DAO holdings are sufficient for the exchange.
      </p>
      <p>
        Phase 3: The contract ends, and subscriptions are no longer possible.
        Investors can reclaim any remaining tokens.
      </p>
    </div>
  )

  return (
    <div className='flex items-center'>
      {data.end || stage === InvestStatus.InvestmentEnd ? (
        <Tag color='magenta' icon={<ClockCircleOutlined />}>
          End
        </Tag>
      ) : stage === InvestStatus.OnlySubscribeSelfShare ? (
        <Tag color='green'>Processing: open</Tag>
      ) : (
        <Tag color='cyan'>Processing: subcribe</Tag>
      )}
      <div>
        <Tooltip title={content} color='blue'>
          <InfoCircleOutlined />
        </Tooltip>
      </div>
    </div>
  )
}

export default InvestStatusTag
