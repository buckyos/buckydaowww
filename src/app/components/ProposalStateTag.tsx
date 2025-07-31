import { ProposalState } from '@vars/index'

// 样式映射对象
const stateStyles: {
  [key in ProposalState]?: {
    display: string
    textColorClass: string
    borderColorClass: string
    backgroundColorClass: string
  }
} = {
  [ProposalState.NotFound]: {
    display: 'IN-PROGRESS',
    textColorClass: 'text-[#1890FF]',
    borderColorClass: 'border-[#91D5FF]',
    backgroundColorClass: 'bg-[#E6F7FF]',
  },
  [ProposalState.InProgress]: {
    display: 'IN-PROGRESS',
    textColorClass: 'text-[#1890FF]',
    borderColorClass: 'border-[#91D5FF]',
    backgroundColorClass: 'bg-[#E6F7FF]',
  },
  [ProposalState.Accepted]: {
    display: 'ACCEPTED',
    textColorClass: 'text-[#52C41A]',
    borderColorClass: 'border-[#B7EB8F]',
    backgroundColorClass: 'bg-[#F6FFED]',
  },
  [ProposalState.Executed]: {
    display: 'EXECUTED',
    textColorClass: 'text-[#52C41A]',
    borderColorClass: 'border-[#B7EB8F]',
    backgroundColorClass: 'bg-[#F6FFED]',
  },
  [ProposalState.Rejected]: {
    display: 'REJECTED',
    textColorClass: 'text-[#F5222D]',
    borderColorClass: 'border-[#FFA39E]',
    backgroundColorClass: 'bg-[#FFF1F0]',
  },
  [ProposalState.Expired]: {
    display: 'EXPIRED',
    textColorClass: 'text-[#FA8C16]',
    borderColorClass: 'border-[#FFD591]',
    backgroundColorClass: 'bg-[#FFF7E6]',
  },
}

interface ProposalStateTagProps {
  state: ProposalState
  is_reject?: boolean
  proposal: ProposalResponseData
}

const ProposalStateTag: React.FC<ProposalStateTagProps> = ({
  state,
  is_reject,
  proposal,
}) => {
  let properties
  if (is_reject) {
    properties = stateStyles[ProposalState.Rejected]
  } else if (!proposal.full && proposal.state == ProposalState.InProgress && proposal.expired * 1000 < Date.now()) { // 非全员投票，而且没有执行，且已经过期
    properties = stateStyles[ProposalState.Expired]
  } else {
    properties = stateStyles[state]
  }

  if (!properties) return null

  return (
    <div
      className={`px-2 py-px text-xs border border-solid rounded ${properties.textColorClass} ${properties.borderColorClass} ${properties.backgroundColorClass}`}
    >
      {properties.display}
    </div>
  )
}

export default ProposalStateTag
