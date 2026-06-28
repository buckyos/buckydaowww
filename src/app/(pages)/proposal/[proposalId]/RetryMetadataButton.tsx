'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, message } from 'antd'
import { useBindWalletAddress, useUserStore } from '@hooks/index'
import {
  hasPendingMetadataSubmissions,
  retryPendingMetadataSubmissions,
} from '@services/index'
import { extractMessage } from '@utils/index'

const normalizeAddress = (address?: string) => address?.trim().toLowerCase() || ''

const RetryMetadataButton: React.FC<{
  proposal: ProposalResponseData
  fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, fetchData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasPending, setHasPending] = useState(false)
  const { ensureAuthenticated, activeAddress, boundAddress, user } =
    useBindWalletAddress()

  useEffect(() => {
    setHasPending(hasPendingMetadataSubmissions(proposal.txHash))
  }, [proposal.txHash])

  const canRetry = useMemo(() => {
    if (proposal.syncState !== 'chain_only' || !proposal.txHash || !hasPending) {
      return false
    }

    const creatorAddress = normalizeAddress(proposal.creator?.address)
    const currentAddress =
      normalizeAddress(activeAddress) ||
      normalizeAddress(boundAddress) ||
      normalizeAddress(user.address)

    return !!creatorAddress && !!currentAddress && creatorAddress === currentAddress
  }, [
    activeAddress,
    boundAddress,
    hasPending,
    proposal.creator?.address,
    proposal.syncState,
    proposal.txHash,
    user.address,
  ])

  if (!canRetry) {
    return null
  }

  const onRetry = async () => {
    setIsSubmitting(true)

    try {
      if (!(await ensureAuthenticated({ requireWallet: true }))) {
        return
      }

      const count = await retryPendingMetadataSubmissions(
        proposal.txHash,
        useUserStore.getState().jwt,
      )
      setHasPending(hasPendingMetadataSubmissions(proposal.txHash))
      await fetchData()
      message.success(
        count > 1
          ? `Retried ${count} metadata submissions`
          : 'Retried proposal metadata',
      )
    } catch (error) {
      message.error(`Retry metadata failed[${extractMessage(error)}]`, 10)
    } finally {
      setIsSubmitting(false)
      setHasPending(hasPendingMetadataSubmissions(proposal.txHash))
    }
  }

  return (
    <Button loading={isSubmitting} onClick={onRetry}>
      Retry metadata
    </Button>
  )
}

export default RetryMetadataButton
