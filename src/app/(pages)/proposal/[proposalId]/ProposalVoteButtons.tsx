'use client'

import { useEffect, useState } from 'react'
import { Button, Modal, Tag, Tooltip, message } from 'antd'
import { useBindWalletAddress, useCommittee } from '@hooks/index'
import {
  contractService,
  newProviderContract,
  voteProposal,
  supportsProposalVotingOnWeb,
} from '@contracts/index'
import { abis } from '@contracts/abis'
import { decodeIfEncoded } from '@utils/encode'
import {
  decodePaddedAddress,
  getEffectiveProposalState,
  getProposalMetadataConflictMessage,
  getProposalMissingMetadataMessage,
  getProposalType,
  hasTrustedProposalMetadata,
  isProposalVotingOpen,
  isProposalMetadataConflict,
  proposalTypeMap,
  showErrorMessage,
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
    const pname = proposal.project?.pname || decodeIfEncoded(String(proposal.params[1]))
    const version = proposal.project?.version || String(proposal.params[2])
    return `${pname} ${version}`
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
  const { isCommittee, isUnknown } = useCommittee(activeAddress)
  const [loadingAction, setLoadingAction] = useState<'support' | 'reject' | ''>(
    '',
  )
  const [checkingFullVoteEligibility, setCheckingFullVoteEligibility] = useState(false)
  const [hasFullVotingPower, setHasFullVotingPower] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkFullVoteEligibility = async () => {
      if (!proposal.full || !hasActiveWallet || !activeAddress) {
        setCheckingFullVoteEligibility(false)
        setHasFullVotingPower(null)
        return
      }

      setCheckingFullVoteEligibility(true)
      try {
        const committee = await contractService.getReadonlyCommitteeContract()
        const devToken = await newProviderContract(
          contractService.getAddressOfDevToken(),
          abis,
        )
        const normalToken = await newProviderContract(
          contractService.getAddressOfNormalToken(),
          abis,
        )
        const [devRatioRaw, devBalanceRaw, normalBalanceRaw] = await Promise.all([
          committee.devRatio(),
          devToken.balanceOf(activeAddress),
          normalToken.balanceOf(activeAddress),
        ])

        if (cancelled) {
          return
        }

        const devRatio = BigInt(devRatioRaw.toString())
        const devBalance = BigInt(devBalanceRaw.toString())
        const normalBalance = BigInt(normalBalanceRaw.toString())
        const votingPower = normalBalance + (devBalance * devRatio) / 100n
        setHasFullVotingPower(votingPower > 0n)
      } catch (error) {
        console.warn('check full vote eligibility failed', error)
        if (!cancelled) {
          setHasFullVotingPower(null)
        }
      } finally {
        if (!cancelled) {
          setCheckingFullVoteEligibility(false)
        }
      }
    }

    void checkFullVoteEligibility()

    return () => {
      cancelled = true
    }
  }, [activeAddress, hasActiveWallet, proposal.full])

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
  const effectiveState = getEffectiveProposalState(proposal)
  const votingOpen = isProposalVotingOpen(proposal)
  const voteClosed = !votingOpen || effectiveState !== ProposalState.InProgress
  const proposalType = getProposalType(proposal)
  const ordinaryVoteHint = !hasActiveWallet
    ? 'Connect your browser wallet before voting.'
    : proposal.full
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
      : hasActiveWallet && proposal.full && checkingFullVoteEligibility
        ? 'Checking token-holder voting eligibility...'
        : hasActiveWallet && proposal.full && hasFullVotingPower === false
          ? 'Only token holders can vote on this full proposal.'
          : hasActiveWallet && !proposal.full && isUnknown
            ? 'Checking committee voting eligibility...'
            : hasActiveWallet && !proposal.full && !isCommittee
              ? 'Only committee members can vote on this proposal.'
                : !votingOpen
                ? 'Voting has already ended for this proposal on chain.'
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
        showErrorMessage(
          new Error(`Vote transaction failed with status ${receipt?.status}`),
          'Vote failed',
        )
        return
      }

      message.success(
        action === 'support'
          ? 'Support vote submitted successfully'
          : 'Reject vote submitted successfully',
      )
      await fetchData()
    } catch (error) {
      showErrorMessage(error, 'Vote failed')
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
      message.info('Connect your browser wallet before voting.')
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
