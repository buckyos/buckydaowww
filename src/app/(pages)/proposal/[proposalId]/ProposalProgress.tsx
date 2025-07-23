
'use client'
import React, { useState } from 'react'
import { Progress, Tag } from 'antd'
import { transformPercentNumber, wrapUnits } from '@utils/numberConverter'
import ExecuteProposalButton from '@components/ExecuteProposalButton'
import ProposalType from '@components/proposal/ProposalType'
import ProposalStateLine from '@components/ProposalStateLine'
import { useUserStore } from '@hooks/index'
import ProposalEdition from './ProposalEdition'
import _ from 'lodash'
import { useAsyncEffect } from 'ahooks'
import { contractService } from '@contracts/contract'

const ProposalProgress: React.FC<{
    proposal: ProposalResponseData,
    members: CommitteeMember[],
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, members, fetchData }) => {
    const [supportPercent, setSupportPercent] = useState<number>(0)
    const [rejectPercent, setRejectPercent] = useState<number>(0)
    const [voteInfo, setVoteinfo] = useState<ProposalVoteInfomation[]>([])
    const { user } = useUserStore((state) => {
        return { user: state.user, jwt: state.jwt }
    })

    useAsyncEffect(async () => {
        const votesInfo: ProposalVoteInfomation[] = proposal.support.map(item => {
            return {
                address: item,
                isCommiittee: !!_.find(members, (member) => member.address == item)
            }
        })
        const memberCount = members.length

        console.log('vote result', votesInfo)
        setVoteinfo(votesInfo)

        setSupportPercent(
            transformPercentNumber(votesInfo.filter(o => o.isCommiittee).length, memberCount),
        )
        setRejectPercent(transformPercentNumber(proposal.rejectCount, memberCount))

        const committeeContract = await contractService.getCommitteeContract()
        const extra = await committeeContract.proposalExtraOf(proposal.proposalId)
        console.log('proposal extra', extra)
        console.log(extra.toString())
    }, [proposal])


    return (
        <>
            <div className='flex justify-between text-cyfs-gray mt-2'>
                <ProposalStateLine
                    proposal={proposal}
                    rejectPercent={rejectPercent}
                />

                <ProposalEdition
                    isEdit={
                        // 当前用户是提案创建人，且提案没有设置过标题
                        proposal.creator!.address === user.address && proposal.title == ''}
                    fetchData={fetchData}
                />
            </div>
            <ProposalType proposal={proposal} />
            <div className='mt-4'></div>
            <div className='flex'>
                <div className='w-20'>Agree</div>
                <Progress
                    // size="large" 在 antd 5.x 版本中已废弃，改用 size={{ width: 300 }}
                    style={{ width: '100%', height: 20 }}
                    success={{ percent: supportPercent, strokeColor: '#52c41a' }}
                    percent={rejectPercent}
                    strokeColor="#ff4d4f"
                    status={rejectPercent > 50 ? 'exception' : 'normal'}
                />
            </div>
            {
                voteInfo.length &&
                <div className='flex flex-col px-8 py-2 text-sm'>
                    {voteInfo.map(item => {
                        return (<div className='flex gap-2' key={item.address}>
                            <div className='w-[460px]'>vote address: {item.address}</div>
                            <Tag>{item.isCommiittee ? 'committee' : 'normal'}</Tag>
                        </div>)
                    })}
                </div>
            }

            <div className='flex'>
                <div className='w-20'>Disgree</div>
                <Progress
                    status={rejectPercent > 50 ? 'exception' : 'normal'}
                    percent={rejectPercent}
                />
            </div>
            <ExecuteProposalButton
                disabled={supportPercent <= 50 && rejectPercent < 50}
                proposal={proposal} />
        </>
    )
}

export default ProposalProgress