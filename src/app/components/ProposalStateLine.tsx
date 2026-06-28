import { Tag } from 'antd'
import ProposalStateTag from '@components/ProposalStateTag'
import { getEffectiveProposalState, proposalExpiredTimeDisplay } from '@utils/index'
import { ProposalState } from '@vars/index'

interface ProposalStateLineProps {
  proposal: ProposalResponseData
  rejectPercent: number
}

const ProposalStateLine: React.FC<ProposalStateLineProps> = ({
  proposal,
  rejectPercent,
}) => {
  const effectiveState = getEffectiveProposalState(proposal)
  // 有结果的提案，就不用显示过期tag了
  const hasResult =
    effectiveState == ProposalState.Executed ||
    effectiveState == ProposalState.Rejected ||
    effectiveState == ProposalState.Expired ||
    rejectPercent > 50

  return (
    <div className='flex items-center'>
      <span className='mr-4'>
        {proposalExpiredTimeDisplay(proposal.expired)}
      </span>
      <ProposalStateTag proposal={proposal} state={effectiveState} is_reject={rejectPercent > 50} />
      {effectiveState == ProposalState.Expired && !proposal.full && (
        <Tag className='ml-2' color='magenta'>
          proposal expired
        </Tag>
      )}
    </div>
  )
}

export default ProposalStateLine
