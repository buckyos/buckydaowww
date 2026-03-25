'use client'

import { contractService } from "@contracts/contract"
import { Button, message, Tooltip } from "antd"
import React, { useState } from "react"
import {
    getEffectiveProposalState,
    transactionWait,
    showErrorMessage,
} from '@utils/index'
import { ProposalState } from '@vars/index'

const FullVoteExecuteButton: React.FC<{
    proposal: ProposalResponseData
    extra?: ContractProposalExtra
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, extra, fetchData }) => {
    const [loading, setLoading] = useState(false)
    const allVoters = Array.from(new Set([...proposal.support, ...proposal.reject]))
    const settledCount = extra ? Number(extra.settled) : 0
    const pendingSettleCount = Math.max(allVoters.length - settledCount, 0)

    const onFullVoteExecute = async () => {
        if (!canSettle) {
            message.info('The full proposal can only be settled after it expires')
            return
        }
        if (pendingSettleCount === 0) {
            message.info('There are no pending voters left to settle')
            return
        }

        setLoading(true)
        try {
            const committee = await contractService.getCommitteeContract()
            const tx = await committee.endFullPropose(proposal.id, allVoters)
            const receipt = await transactionWait(tx)
            if (receipt?.status !== 1) {
                console.warn('transaction status:', receipt?.status, tx)
                message.error(`execute failed[3][${receipt?.status}]`)
                return
            }
            message.success("proposal execute success")
            await fetchData()
        } catch (error) {
            showErrorMessage(error, 'Settle full vote failed')
        } finally {
            setLoading(false)
        }
    }

    const canSettle = getEffectiveProposalState(proposal) === ProposalState.Expired
    const text = canSettle
        ? `There are ${pendingSettleCount} pending voters left to settle.`
        : 'The settlement button can only be clicked after the proposal reaches its expired state on chain.'
    const buttonText = 'Settle Full Vote'

    return (
        <div>
            {!canSettle || pendingSettleCount === 0 ?
                <Tooltip title={text}>
                    <Button
                        disabled={true}
                        onClick={onFullVoteExecute} loading={loading}>{buttonText}</Button>
                </Tooltip> :
                <Button
                    onClick={onFullVoteExecute} loading={loading}>{buttonText}</Button>
            }

        </div>
    )
}

export default FullVoteExecuteButton
