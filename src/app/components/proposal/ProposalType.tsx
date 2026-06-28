import { Tag } from 'antd'
import {
  getProposalType,
  isProposalMetadataConflict,
  isProposalMetadataMissing,
} from '@utils/index'


const ProposalType: React.FC<{proposal: ProposalResponseData}> = ({ proposal }) => {
  const metadataMissing = isProposalMetadataMissing(proposal)
  const metadataConflict = isProposalMetadataConflict(proposal)

  return (
    <div className='mt-2'>
      <span className='mr-1'>Proposal type:</span>
      {metadataMissing ? (
        <Tag color='orange'>Chain only</Tag>
      ) : metadataConflict ? (
        <Tag color='red'>Metadata conflict</Tag>
      ) : (
        <Tag>{getProposalType(proposal)}</Tag>
      )}
    </div>
  )
}

export default ProposalType
