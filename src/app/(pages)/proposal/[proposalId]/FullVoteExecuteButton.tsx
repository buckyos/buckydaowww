'use client'

import { contractService } from "@contracts/contract"
import { Button, message, Tooltip } from "antd"
import React, { useState } from "react"
import dayjs from 'dayjs'
import {
    transactionWait,
    isBeforeNow,
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
    const disabled = isBeforeNow(proposal.expired, 'second')
    // 计算当前时间和投票过期时间的差值（小时）
    const hoursDiff = dayjs().diff(dayjs(proposal.expired * 1000), 'hour')
    const text = `The settlement button can only be clicked after the voting time of the proposal ends. The proposal will expire in ${hoursDiff} hours.`

    return (
        <div>
            {disabled ?
                <Tooltip title={text}>
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