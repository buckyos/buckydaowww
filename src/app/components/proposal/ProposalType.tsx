import { Tag } from 'antd'
import { getProposalType } from '@utils/index'


const ProposalType: React.FC<{proposal: ProposalResponseData}> = ({ proposal }) => {
  return (
    <div className='mt-2'>
      <span className='mr-1'>Proposal type:</span>
      <Tag>{getProposalType(proposal)}</Tag>
    </div>
  )
}

export default ProposalType
