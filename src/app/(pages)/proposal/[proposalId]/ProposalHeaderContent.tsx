
'use client'
import React, { useState } from 'react'
import { Progress, Tag, Tooltip } from 'antd'
import { transformPercentNumber, wrapUnits } from '@utils/numberConverter'
import ExecuteProposalButton from '@components/ExecuteProposalButton'
import ProposalType from '@components/proposal/ProposalType'
import ProposalStateLine from '@components/ProposalStateLine'
import { useUserStore } from '@hooks/index'
import ProposalEdition from './ProposalEdition'
import FullVoteExecuteButton from './FullVoteExecuteButton'
import _ from 'lodash'
import { useAsyncEffect } from 'ahooks'
import {
    getCommitteeProposalExtra,
    getDevRatio,
    newProviderContract,
    contractService,

} from '@contracts/index'
import { erc20, ISourceDAODevToken } from '@contracts/abis'
import { InfoCircleOutlined } from '@ant-design/icons'

const ProposalHeaderContent: React.FC<{
    proposal: ProposalResponseData,
    members: CommitteeMember[],
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, members, fetchData }) => {
    const [supportPercent, setSupportPercent] = useState<number>(0)
    const [rejectPercent, setRejectPercent] = useState<number>(0)
    const [voteInfo, setVoteinfo] = useState<ProposalVoteInfomation[]>([])
    const [isFullVote, setIsFullVote] = useState(false)

    // 当提案的投票方式是全员投票时，需要计算最大票数和提案生效所需票数
    const [maxVoteNumber, setMaxVoteNumber] = useState<string>("")
    const [validVoteNumber, setValidVoteNumber] = useState<string>("")
    const [threshold, setThreshold] = useState<number>(0)

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
        const isFullVote = extra.from != "0x0000000000000000000000000000000000000000"
        setIsFullVote(isFullVote)
        console.log('proposal extra', extra)
        if (isFullVote) {

            setThreshold(Number(extra.threshold))

            const BDT = await newProviderContract(contractService.getAddressOfNormalToken(), erc20)
            const BDDT = await newProviderContract(contractService.getAddressOfDevToken(), ISourceDAODevToken)

            const [BDDTTotalReleased, BDTTotalSupply, devRatio] = await Promise.all([
                BDDT.totalReleased(),
                BDT.totalSupply(),
                getDevRatio()
            ]) as [bigint, bigint, bigint]
            // 计算最大票数
            // 最大票数：已释放的BDDT*ratio/100+已释放的BDT
            const maxVoteNumber = BDDTTotalReleased * devRatio / 100n + BDTTotalSupply
            setMaxVoteNumber(wrapUnits(maxVoteNumber, 18))

            // 投票阈值。总票数要达到最大票数*threshold/100才可能结算
            const validVoteNumber = maxVoteNumber * extra.threshold / 100n
            setValidVoteNumber(wrapUnits(validVoteNumber, 18))

            console.log("maxVoteNumber", maxVoteNumber, validVoteNumber)

        }
        // console.log(extra.toString())
    }, [JSON.stringify({ proposal, members })])


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
                    <Tag>{isFullVote ? "Full members vote" : "Committee vote"}</Tag>
                    <InfoCircleOutlined />
                </Tooltip>
            </div>
            <div className='flex mt-6'>
                <div className='w-40'>Vote Progress: </div>
                <div className='relative w-full'>
                    <Progress
                        className='relative'
                        // size="large" 在 antd 5.x 版本中已废弃，改用 size={{ width: 300 }}
                        style={{ width: '100%', height: 20 }}
                        success={{ percent: supportPercent, strokeColor: '#52c41a' }}
                        percent={
                            // 总进度百分比
                            rejectPercent + supportPercent
                        }
                        strokeColor="#ff4d4f"
                        showInfo={false}
                    />
                    {isFullVote &&
                        <div className='absolute z-10 t-[6px]' style={{ left: threshold + "%" }}>
                            <Tooltip title="full vote threshold">
                                <div
                                    className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                />
                            </Tooltip>
                        </div>
                    }

                </div>


            </div>
            {maxVoteNumber ? <>
                <div className='flex gap-2 mt-4'>
                    <div>Maximum number of votes:</div>
                    <div className='font-bold'>{parseInt(maxVoteNumber)}</div>
                </div>
                <div className='flex gap-2'>
                    <div>Voting threshold count:</div>
                    <div className='font-bold'>{parseInt(validVoteNumber)}</div>
                </div>
            </> : ''}
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
            <div className='flex-center gap-6 mt-10'>
                {isFullVote && <FullVoteExecuteButton proposal={proposal} />}

                <ExecuteProposalButton
                    disabled={supportPercent <= 50 && rejectPercent < 50}
                    proposal={proposal} />
            </div>

        </>
    )
}

export default ProposalHeaderContent