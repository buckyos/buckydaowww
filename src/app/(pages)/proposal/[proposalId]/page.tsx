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
import StateExplanationCard from '@components/StateExplanationCard'
import ProposalHeaderContent from './ProposalHeaderContent'
import {
  extractUpgradeCalldataFromExtra,
  getEffectiveProposalState,
  getProposalSyncState,
  getProposalType,
  hasTrustedProposalMetadata,
  getProposalMissingMetadataMessage,
  getProposalMetadataConflictMessage,
  isProposalMetadataMissing,
  isProposalMetadataConflict,
  isProposalVotingOpen,
} from '@utils/index'
import { ProposalState } from '@vars/index'

dayjs.extend(relativeTime)

function buildProposalStateExplanation(proposal: ProposalResponseData) {
  const effectiveState = getEffectiveProposalState(proposal)
  const votingOpen = isProposalVotingOpen(proposal)
  const syncState = getProposalSyncState(proposal)
  const proposalType = getProposalType(proposal)
  const voteTypeLabel = proposal.full ? 'Full members vote' : 'Committee vote'
  const why: string[] = []
  const next: string[] = []
  let status = `${voteTypeLabel} · In progress`
  let tone: 'info' | 'success' | 'warning' | 'danger' = 'info'

  if (syncState === 'chain_only') {
    why.push('Backend only has the on-chain shell of this proposal, so metadata and params are not fully available yet.')
    next.push('Wait for metadata recovery or use the linked offline/cold-wallet voting path if you already know the intended payload.')
    tone = 'warning'
  } else if (syncState === 'conflict') {
    why.push('Submitted metadata conflicts with the on-chain creator, so the UI falls back to chain-trusted fields only.')
    next.push('Avoid acting on the proposal metadata until the conflict is resolved or manually verified.')
    tone = 'danger'
  }

  if (effectiveState === ProposalState.InProgress) {
    why.push(
      votingOpen
        ? 'The proposal is still within its on-chain voting window.'
        : 'The database still shows it in progress, but the current chain time has already passed its voting deadline.',
    )
    next.push(
      votingOpen
        ? 'Review the proposal payload and cast support or reject if your current wallet is eligible.'
        : 'Voting is closed now. Wait for settlement or the next chain-side state transition.',
    )
  } else if (effectiveState === ProposalState.Accepted) {
    status = `${voteTypeLabel} · Accepted`
    tone = 'success'
    why.push('The proposal reached its approval condition and is now waiting for the execution step.')
    next.push('Review the execution target and run the proposal if you are the appropriate operator.')
  } else if (effectiveState === ProposalState.Executed) {
    status = `${voteTypeLabel} · Executed`
    tone = 'success'
    why.push('The approved action has already been executed on chain.')
    next.push('Use the linked project, funding, or token pages to inspect the downstream state changes caused by this proposal.')
  } else if (effectiveState === ProposalState.Rejected) {
    status = `${voteTypeLabel} · Rejected`
    tone = 'danger'
    why.push('This proposal no longer has a path to execution because it was rejected by governance.')
    next.push('Review the vote distribution or create a revised proposal if the underlying change is still needed.')
  } else if (effectiveState === ProposalState.Expired) {
    status = `${voteTypeLabel} · Expired`
    tone = 'warning'
    why.push('The proposal passed its on-chain deadline before it reached a valid accepted outcome.')
    next.push('Treat voting as closed and review whether a follow-up or replacement proposal is needed.')
  }

  why.push(`Proposal type is currently interpreted as "${proposalType || 'unknown'}".`)

  return { status, why, next, tone }
}

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

  const stateExplanation = buildProposalStateExplanation(proposal)

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
        <div className='mt-6'>
          <StateExplanationCard
            heading='Proposal Status'
            status={stateExplanation.status}
            why={stateExplanation.why}
            next={stateExplanation.next}
            tone={stateExplanation.tone}
          />
        </div>
        <ProposalHeaderContent
          proposal={proposal}
          members={members}
          fetchData={fetchData}
        />
        <ProposalExtraContent
          proposal={proposal}
          committeeMembers={members}
        />

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
