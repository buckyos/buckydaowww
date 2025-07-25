'use client'

import { contractService } from "@contracts/contract"
import { Button, message, Tooltip } from "antd"
import React, { useState } from "react"

import {
    transactionWait,
} from '@utils/index'






const FullVoteExecuteButton: React.FC<{ proposal: ProposalResponseData }> = ({ proposal }) => {
    const [loading, setLoading] = useState(false)

    const onFullVoteExecute = async () => {
        setLoading(true)
        const fn = async () => {
            const committee = await contractService.getCommitteeContract()
            const tx = await committee.endFullPropose(proposal.id, proposal.support)
            const receipt = await transactionWait(tx)
            if (receipt?.status !== 1) {
                console.warn('transaction status:', receipt?.status, tx)
                message.error(`execute failed[3][${receipt?.status}]`)
                return
            }
            message.success("proposal execute success")
        }


        await fn()
        setLoading(false)
    }

    // 如果当前时间(UTC)大于投票过期时间(UTC)，按钮才可点
    const disabled = new Date().getTime() > new Date(proposal.expired).getTime()

    return (
        <div>
            {disabled ?
                <Tooltip title="The button is clickable only if the current time is greater than the voting expiration time">
                    <Button
                        disabled={disabled}
                        onClick={onFullVoteExecute} loading={loading}>Full Vote Execute</Button>
                </Tooltip> :
                <Button
                    disabled={disabled}
                    onClick={onFullVoteExecute} loading={loading}>Full Vote Execute</Button>
            }

        </div>
    )
}

export default FullVoteExecuteButton