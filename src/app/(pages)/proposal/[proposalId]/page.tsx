'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import {
  fetchProposalId,
  fetchMembers,
} from '@services/index'
import { Alert, message, Tag } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ProposalExtraContent from '@components/ProposalExtraContent'
import ProposalHeaderContent from './ProposalHeaderContent'
import {
  extractUpgradeCalldataFromExtra,
  getProposalSyncState,
  hasTrustedProposalMetadata,
  getProposalMissingMetadataMessage,
  getProposalMetadataConflictMessage,
  isProposalMetadataMissing,
  isProposalMetadataConflict,
} from '@utils/index'

dayjs.extend(relativeTime)

export default function ProposalDetailPage() {
  const { proposalId } = useParams() as { proposalId: string }
  const [proposal, setProposal] = useState<ProposalResponseData>()
  const [members, setMembers] = useState<CommitteeMember[]>([])
  
  const fetchData = async () => {
    const result = await fetchProposalId(proposalId)
    // console.log('result', result)
    const proposal = result.data as ProposalResponseData
    setProposal(proposal)
    return proposal
  }

  useAsyncEffect(async () => {
    const [_proposal, memberResp] = await Promise.all([
      fetchData(),
      fetchMembers(),
    ])
    setMembers(memberResp.data)
  }, [])

  if (!proposal) {
    return (<div className='w-[1000px] mx-auto flex-center'>
      loading proposal...
    </div>)
  }

  const { content: proposalExtraContent } = extractUpgradeCalldataFromExtra(
    proposal.extra || '',
  )
  const syncState = getProposalSyncState(proposal)
  const trustedMetadata = hasTrustedProposalMetadata(proposal)
  const metadataMissing = isProposalMetadataMissing(proposal)
  const metadataConflict = isProposalMetadataConflict(proposal)
  const displayTitle = proposal.title?.trim()
    || (metadataMissing
      ? `Proposal #${proposal.id} (Chain Only)`
      : metadataConflict
        ? `Proposal #${proposal.id} (Metadata Conflict)`
        : `Proposal #${proposal.id}`)

  return (
    <>
      <div className='w-[1000px] mx-auto'>
        <h2 className='text-4xl font-medium'>{displayTitle}</h2>
        {(metadataMissing || metadataConflict) && (
          <Alert
            className='mt-6'
            type={metadataConflict ? 'error' : 'warning'}
            showIcon
            message={
              metadataConflict
                ? 'Proposal metadata conflict'
                : 'Proposal metadata missing'
            }
            description={
              metadataConflict
                ? getProposalMetadataConflictMessage()
                : getProposalMissingMetadataMessage()
            }
          />
        )}
        <ProposalHeaderContent
          proposal={proposal}
          members={members}
          fetchData={fetchData}
        />
        <ProposalExtraContent proposal={proposal} />

        <div className='mt-20 pt-20'>{proposalExtraContent}</div>
        <div className='my-20 border-b border-solid border-[#F0F0F0]'></div>
        <div className='flex flex-col gap-4'>
          <div className='flex relative'>
            <label className='font-bold w-28'>params:</label>
            <div className='text-cyfs-gray'>
              {trustedMetadata && Array.isArray(proposal.params) ? 
                proposal.params.map((item, index) => (
                  <div key={index}>{JSON.stringify(item, null, 2)}</div>
                )) : syncState === 'chain_only' ? (
                  <Tag color='orange'>Chain-only proposal</Tag>
                ) : syncState === 'conflict' ? (
                  <Tag color='red'>Conflicting metadata</Tag>
                ) : (
                  <Tag color='red'>Empty params</Tag>
                )
              }
            </div>
            {trustedMetadata && Array.isArray(proposal.params) && (
              <CopyOutlined
                className='absolute right-2 top-2 cursor-pointer hover:text-blue-500'
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(proposal.params, null, 2))
                    .then(() => message.success('Params Copied to clipboard'))
                    .catch(() => message.error('Failed to copy'))
                }}
              />
            )}
          </div>
          <div className='flex'>
            <label className='font-bold w-28'>paramroot:</label>
            <span className='text-cyfs-gray'>{proposal.paramroot}</span>
          </div>
          <div className='flex'>
            <label className='font-bold w-28'>from group:</label>
            <span className='text-cyfs-gray'>{proposal.fromGroup}</span>
          </div>
        </div>
      </div>
    </>
  )
}
