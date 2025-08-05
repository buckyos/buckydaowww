import { Tag } from 'antd'
import ProposalStateTag from '@components/ProposalStateTag'
import { proposalExpiredTimeDisplay } from '@utils/index'
import { ProposalState } from '@vars/index'

interface ProposalStateLineProps {
  proposal: ProposalResponseData
  rejectPercent: number
}

const ProposalStateLine: React.FC<ProposalStateLineProps> = ({
  proposal,
  rejectPercent,
}) => {
  // 有结果的提案，就不用显示过期tag了
  const hasResult =
    proposal.state == ProposalState.Executed ||
    proposal.state == ProposalState.Rejected ||
    rejectPercent > 50
  const isExpired = !hasResult && proposal.expired * 1000 < Date.now()

  return (
    <div className='flex items-center'>
      <span className='mr-4'>
        {proposalExpiredTimeDisplay(proposal.expired)}
      </span>
      <ProposalStateTag proposal={proposal} state={proposal.state} is_reject={rejectPercent > 50} />
      {isExpired && !proposal.full && (
        <Tag className='ml-2' color='magenta'>
          proposal expired
        </Tag>
      )}
    </div>
  )
}

export default ProposalStateLine
