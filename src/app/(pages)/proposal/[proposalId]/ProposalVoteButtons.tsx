'use client'

import { useState } from 'react'
import { Button, Modal, Tag, Tooltip, message } from 'antd'
import { useBindWalletAddress, useCommittee } from '@hooks/index'
import { voteProposal, supportsProposalVotingOnWeb } from '@contracts/index'
import {
  decodePaddedAddress,
  extractMessage,
  getProposalMetadataConflictMessage,
  getProposalMissingMetadataMessage,
  getProposalType,
  hasTrustedProposalMetadata,
  isProposalMetadataConflict,
  proposalTypeMap,
  transactionWait,
} from '@utils/index'
import { ProposalState } from '@vars/index'

function getProposalTargetSummary(proposal: ProposalResponseData) {
  const proposalType = getProposalType(proposal)

  if (proposalType === proposalTypeMap.ChangeCommittee) {
    const nextCommittees = proposal.params
      .slice(0, -1)
      .map((value: string) => decodePaddedAddress(value))
    const preview = nextCommittees.slice(0, 3).join(', ')
    return nextCommittees.length > 3
      ? `${preview} ... (${nextCommittees.length} members)`
      : preview
  }

  if (proposalType === proposalTypeMap.UpgradeContract) {
    return `Proxy ${proposal.params[0]} -> ${proposal.params[1]}`
  }

  if (
    proposalType === proposalTypeMap.CreateVersion ||
    proposalType === proposalTypeMap.SettlementVersion
  ) {
    return `${proposal.params[1]} ${proposal.params[2]}`
  }

  return 'See proposal details below before confirming this vote.'
}

function getProposalDescriptionPreview(proposal: ProposalResponseData) {
  const extra = proposal.extra?.trim()
  if (!extra) {
    return ''
  }

  return extra.length > 140 ? `${extra.slice(0, 140)}...` : extra
}

const ProposalVoteButtons: React.FC<{
  proposal: ProposalResponseData
  fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, fetchData }) => {
  const {
    activeAddress,
    hasActiveWallet,
    handleConnectWallet,
  } = useBindWalletAddress()
  const { isCommittee } = useCommittee(activeAddress)
  const [loadingAction, setLoadingAction] = useState<'support' | 'reject' | ''>(
    '',
  )

  const normalizedActiveAddress = activeAddress.trim().toLowerCase()
  const currentVote = normalizedActiveAddress
    ? proposal.support.some(
        (address) => address.trim().toLowerCase() === normalizedActiveAddress,
      )
      ? 'support'
      : proposal.reject.some(
            (address) =>
              address.trim().toLowerCase() === normalizedActiveAddress,
          )
        ? 'reject'
        : ''
    : ''
  const trustedMetadata = hasTrustedProposalMetadata(proposal)
  const metadataConflict = isProposalMetadataConflict(proposal)
  const supportsWebVoting = supportsProposalVotingOnWeb(proposal)
  const voteClosed = proposal.state !== ProposalState.InProgress
  const proposalType = getProposalType(proposal)
  const ordinaryVoteHint = proposal.full
    ? 'Token holders can vote on this full proposal.'
    : isCommittee
      ? 'Committee members at the proposal snapshot can vote on this proposal.'
      : 'Only committee members at the proposal snapshot can vote on this proposal.'

  const disabledReason = !trustedMetadata
    ? metadataConflict
      ? getProposalMetadataConflictMessage()
      : getProposalMissingMetadataMessage()
    : !supportsWebVoting
      ? 'Web voting for this proposal type is not supported yet.'
      : voteClosed
        ? 'Voting is closed for this proposal.'
        : currentVote
          ? `You already ${currentVote === 'support' ? 'supported' : 'rejected'} this proposal.`
          : ''

  const executeVote = async (action: 'support' | 'reject') => {
    setLoadingAction(action)
    try {
      const tx = await voteProposal(proposal, action)
      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        message.error(`Vote failed [${receipt?.status}]`)
        return
      }

      message.success(
        action === 'support'
          ? 'Support vote submitted successfully'
          : 'Reject vote submitted successfully',
      )
      await fetchData()
    } catch (error) {
      message.error(extractMessage(error))
    } finally {
      setLoadingAction('')
    }
  }

  const submitVote = async (action: 'support' | 'reject') => {
    if (disabledReason) {
      message.info(disabledReason)
      return
    }

    if (!hasActiveWallet) {
      const connected = await handleConnectWallet()
      if (!connected) {
        return
      }
    }

    const actionLabel = action === 'support' ? 'support' : 'reject'
    const descriptionPreview = getProposalDescriptionPreview(proposal)

    Modal.confirm({
      centered: true,
      title: `Confirm ${actionLabel} vote`,
      okText: action === 'support' ? 'Confirm support' : 'Confirm reject',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: action === 'reject',
      },
      content: (
        <div className='mt-4 flex flex-col gap-3 text-sm'>
          <div>
            You are about to <b>{actionLabel}</b> this proposal on chain.
          </div>
          <div>
            <b>Proposal:</b> {proposal.title?.trim() || `Proposal #${proposal.id}`}
          </div>
          <div>
            <b>Proposal ID:</b> #{proposal.id}
          </div>
          <div>
            <b>Type:</b> {proposalType}
          </div>
          <div>
            <b>Vote mode:</b> {proposal.full ? 'Full members vote' : 'Committee vote'}
          </div>
          <div>
            <b>Target:</b> {getProposalTargetSummary(proposal)}
          </div>
          {!!descriptionPreview && (
            <div>
              <b>Description:</b> {descriptionPreview}
            </div>
          )}
          <div className='text-cyfs-gray'>
            After you confirm here, your wallet will open for the actual vote transaction.
          </div>
        </div>
      ),
      onOk: async () => executeVote(action),
    })
  }

  if (!supportsWebVoting && trustedMetadata) {
    return null
  }

  return (
    <div className='flex items-center gap-3'>
      <Tooltip title={disabledReason || ordinaryVoteHint}>
        <div className='flex items-center gap-2'>
          <Button
            type='primary'
            ghost
            disabled={!!disabledReason}
            loading={loadingAction === 'support'}
            onClick={() => void submitVote('support')}
          >
            Support
          </Button>
          <Button
            danger
            disabled={!!disabledReason}
            loading={loadingAction === 'reject'}
            onClick={() => void submitVote('reject')}
          >
            Reject
          </Button>
        </div>
      </Tooltip>
      {!!currentVote && (
        <Tag color={currentVote === 'support' ? 'green' : 'red'}>
          You {currentVote === 'support' ? 'supported' : 'rejected'}
        </Tag>
      )}
    </div>
  )
}

export default ProposalVoteButtons
