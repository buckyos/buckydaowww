
'use client'
import React, { useState } from 'react'
import { Progress, Tag, Tooltip } from 'antd'
import { transformPercentNumber, wrapUnits } from '@utils/numberConverter'
import ExecuteProposalButton from '@components/ExecuteProposalButton'
import ProposalType from '@components/proposal/ProposalType'
import ProposalStateLine from '@components/ProposalStateLine'
import { useUserStore } from '@hooks/index'
import ProposalEdition from './ProposalEdition'
import _ from 'lodash'
import { useAsyncEffect } from 'ahooks'
import { contractService, getCommitteeProposalExtra } from '@contracts/index'
import { InfoCircleOutlined } from '@ant-design/icons'

const ProposalHeaderContent: React.FC<{
    proposal: ProposalResponseData,
    members: CommitteeMember[],
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, members, fetchData }) => {
    const [supportPercent, setSupportPercent] = useState<number>(0)
    const [rejectPercent, setRejectPercent] = useState<number>(0)
    const [voteInfo, setVoteinfo] = useState<ProposalVoteInfomation[]>([])
    const [isFUllVote, setIsFullVote] = useState(false)
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

        // 判断是否全员投票
        const extra = await getCommitteeProposalExtra(Number(proposal.id))
        setIsFullVote(extra.from != "0x0000000000000000000000000000000000000000")
        console.log('proposal extra', extra)
        // console.log(extra.toString())
    }, [proposal, members])


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
            <div className='mt-2 flex gap-2'>
                <Tooltip title="There are two types of voting: full voting and committee voting. Most proposals default to committee voting.">
                    <span >Proposal Vote type:</span>
                    <Tag>{isFUllVote ? "Full members vote" : "Committee vote"}</Tag>
                    <InfoCircleOutlined />
                </Tooltip>
            </div>
            <div className='flex mt-6'>
                <div className='w-40'>Vote Progress: </div>
                <Progress
                    // size="large" 在 antd 5.x 版本中已废弃，改用 size={{ width: 300 }}
                    style={{ width: '100%', height: 20 }}
                    success={{ percent: supportPercent, strokeColor: '#52c41a' }}
                    percent={
                        // 总进度百分比
                        rejectPercent + supportPercent
                    }
                    strokeColor="#ff4d4f"
                />
            </div>
            {
                !!voteInfo.length &&
                <div className='flex flex-col px-8 py-2 text-sm'>
                    {voteInfo.map(item => {
                        return (<div className='flex gap-2' key={item.address}>
                            <div className='w-[460px]'>vote address: {item.address}</div>
                            <Tag>{item.isCommiittee ? 'committee' : 'normal'}</Tag>
                        </div>)
                    })}
                </div>
            }

            <ExecuteProposalButton
                disabled={supportPercent <= 50 && rejectPercent < 50}
                proposal={proposal} />
        </>
    )
}

export default ProposalHeaderContent