'use client'

import { contractService } from "@contracts/contract"
import { Button, message, Tooltip } from "antd"
import React, { useState } from "react"
import dayjs from 'dayjs'
import {
    transactionWait,
    extractMessage,
} from '@utils/index'

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
            message.error(extractMessage(error))
        } finally {
            setLoading(false)
        }
    }

    // 如果当前时间(UTC)大于投票过期时间(UTC)，按钮才可点
    const canSettle = Date.now() > proposal.expired * 1000
    // 计算当前时间和投票过期时间的差值（小时）
    const hoursDiff = dayjs(proposal.expired * 1000).diff(dayjs(), 'hour')
    const text = canSettle
        ? `There are ${pendingSettleCount} pending voters left to settle.`
        : `The settlement button can only be clicked after the voting time of the proposal ends. The proposal will expire in ${hoursDiff} hours.`
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
