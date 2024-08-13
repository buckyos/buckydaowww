'use client'
import { Tag } from 'antd'

enum InvestStatus {
  // 只能认购自己的份额
  OnlySubscribeSelfShare = 0,
  // 能认购总余额，取决于自己的token数量
  SubscribeLeftAmount = 1,
  // 投资结束
  InvestmentEnd = 2,

  // InvestmentPhase1 = 1,
  // InvestmentPhase2 = 2,
  // InvestmentEnd = 3,
}

// Investment Phase 1，绿色
// Investment Phase 2，绿色
// Investment End，红色
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

  return (
    <div>
      {data.end || stage === InvestStatus.InvestmentEnd ? (
        <Tag color='magenta'>End</Tag>
      ) : stage === InvestStatus.OnlySubscribeSelfShare ? (
        <Tag color='green'>Processing: open</Tag>
      ) : (
        <Tag color='cyan'>Processing: subcribe</Tag>
      )}
      <div></div>
    </div>
  )
}

export default InvestStatusTag
