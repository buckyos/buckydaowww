
'use client'
import React, { useState } from 'react'
import { Progress, Tag, Tooltip, Spin, Collapse, Button } from 'antd'
import type { CollapseProps } from 'antd';
import Link from 'next/link'
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


enum VoteType {
    Unkonw,
    Committee,
    FullMember,
}


const FullProposalProgress: React.FC<{
    proposal: ProposalResponseData,
    extra?: ContractProposalExtra
}> = ({ proposal, extra }) => {
    // 当提案的投票方式是全员投票时，需要计算最大票数和提案生效所需票数
    const [maxVoteNumber, setMaxVoteNumber] = useState<bigint>(0n)
    const [validVoteNumber, setValidVoteNumber] = useState<bigint>(0n)
    const [threshold, setThreshold] = useState<bigint>(0n)
    const [devRatio, setDevRatio] = useState<bigint>(0n)
    const [supportPercent, setSupportPercent] = useState<number>(0)
    const [rejectPercent, setRejectPercent] = useState<number>(0)

    const [supportAddressBalancesWithVotes, setSupportAddressBalancesWithVotes] = useState<{
        address: string
        votes: bigint
    }[]>([])
    const [rejectAddressBalancesWithVotes, setRejectAddressBalancesWithVotes] = useState<{
        address: string
        votes: bigint
    }[]>([])



    useAsyncEffect(async () => {
        if (!extra) {
            return
        }

        setThreshold(extra.threshold)

        const BDT = await newProviderContract(contractService.getAddressOfNormalToken(), erc20)
        const BDDT = await newProviderContract(contractService.getAddressOfDevToken(), ISourceDAODevToken)

        const [BDDTTotalReleased, BDTTotalSupply, devRatio] = await Promise.all([
            BDDT.totalReleased(),
            BDT.totalSupply(),
            getDevRatio()
        ]) as [bigint, bigint, bigint]

        setDevRatio(devRatio)


        // 计算最大票数
        // 最大票数：已释放的BDDT*ratio/100+已释放的BDT
        const maxVoteNumber = BDDTTotalReleased * devRatio / 100n + BDTTotalSupply
        setMaxVoteNumber(maxVoteNumber)

        // 投票阈值。总票数要达到最大票数*threshold/100才可能结算
        const validVoteNumber = maxVoteNumber * extra.threshold / 100n
        setValidVoteNumber(validVoteNumber)

        console.log("maxVoteNumber", maxVoteNumber, validVoteNumber)
    }, [extra])


    useAsyncEffect(async () => {
        if (maxVoteNumber == 0n) {
            return
        }
        if (proposal.support.length == 0 && proposal.reject.length == 0) {
            return
        }

        const BDTToken = await newProviderContract(contractService.getAddressOfNormalToken(), erc20)
        const BDDTToken = await newProviderContract(contractService.getAddressOfDevToken(), ISourceDAODevToken)

        // 获取每个投票地址的token余额
        const supportBalances = await Promise.all(
            proposal.support.flatMap(address => [
                BDDTToken.balanceOf(address),
                BDTToken.balanceOf(address)
            ])
        )
        // 将结果两两组合,对应每个地址的BDDT和BDT余额
        const supportAddressBalances = proposal.support.map((address, index) => ({
            address,
            BDDTBalance: supportBalances[index * 2],
            BDTBalance: supportBalances[index * 2 + 1]
        }))

        // 获取每个拒绝投票地址的token余额
        const rejectBalances = await Promise.all(
            proposal.reject.flatMap(address => [
                BDDTToken.balanceOf(address),
                BDTToken.balanceOf(address)
            ])
        )
        // 将结果两两组合,对应每个拒绝地址的BDDT和BDT余额
        const rejectAddressBalances = proposal.reject.map((address, index) => ({
            address,
            BDDTBalance: rejectBalances[index * 2],
            BDTBalance: rejectBalances[index * 2 + 1]
        }))

        console.log('投票地址余额:', supportAddressBalances)
        console.log('rejectAddressBalances 投票地址余额:', rejectAddressBalances)
        // 为每个支持票地址添加票数字段
        const supportAddressBalancesWithVotes = supportAddressBalances.map(balance => ({
            ...balance,
            votes: (balance.BDDTBalance * devRatio / 100n) + balance.BDTBalance
        }))

        // 为每个反对票地址添加票数字段
        const rejectAddressBalancesWithVotes = rejectAddressBalances.map(balance => ({
            ...balance,
            votes: (balance.BDDTBalance * devRatio / 100n) + balance.BDTBalance
        }))

        setRejectAddressBalancesWithVotes(rejectAddressBalancesWithVotes)
        setSupportAddressBalancesWithVotes(supportAddressBalancesWithVotes)

        // 计算总票数
        const supportTotalVotes = supportAddressBalancesWithVotes.reduce((sum, item) => sum + item.votes, 0n)
        const rejectTotalVotes = rejectAddressBalancesWithVotes.reduce((sum, item) => sum + item.votes, 0n)

        console.log('支持票总数:', supportTotalVotes)
        console.log('反对票总数:', rejectTotalVotes)
        // 先将bigint转换为number，再计算百分比
        const supportVotesNumber = Number(wrapUnits(supportTotalVotes, 18))
        const maxVoteNumberConverted = Number(wrapUnits(maxVoteNumber, 18))
        const rejectVotesNumber = Number(wrapUnits(rejectTotalVotes, 18))

        setSupportPercent((supportVotesNumber / maxVoteNumberConverted) * 100)
        setRejectPercent((rejectVotesNumber / maxVoteNumberConverted) * 100)
    }, [proposal, maxVoteNumber])

    const items: CollapseProps['items'] = [
        {
            key: '1',
            label: 'Support Vote Detail',
            children: <>{supportAddressBalancesWithVotes.map((item) => (
                <div className='flex gap-2' key={item.address}>
                    <div>{item.address}</div>
                    <div>{parseInt(wrapUnits(item.votes, 18))}</div>
                </div>
            ))}</>,
        },
        {
            key: '2',
            label: 'Reject Vote Detail',
            children: <>{rejectAddressBalancesWithVotes.map((item) => (
                <div className='flex gap-2' key={item.address}>
                    <div>{item.address}</div>
                    <div>{parseInt(wrapUnits(item.votes, 18))}</div>
                </div>
            ))}</>,
        },
    ]



    return (
        <>
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
                    <div className='absolute z-10 top-[6px]' style={{ left: Number(threshold) + "%" }}>
                        <Tooltip title="full vote threshold">
                            <div
                                className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
            <div className='flex gap-2 mt-4'>
                <div>Maximum number of votes:</div>
                <div className='font-bold'>{parseInt(wrapUnits(maxVoteNumber, 18))}</div>
            </div>
            <div className='flex gap-2'>
                <div>Voting threshold count:</div>
                <div className='font-bold'>{parseInt(wrapUnits(validVoteNumber, 18))}</div>
            </div>
            <div className='mt-2'>
                The number of votes for each address is calculated as: BDDT owned by this address * ratio / 100 + BDT owned by this address
            </div>
            <Collapse className='mt-2' items={items} />
        </>
    )
}







const ProposalHeaderContent: React.FC<{
    proposal: ProposalResponseData,
    members: CommitteeMember[],
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, members, fetchData }) => {
    const [supportPercent, setSupportPercent] = useState<number>(0)
    const [rejectPercent, setRejectPercent] = useState<number>(0)
    const [voteInfo, setVoteinfo] = useState<ProposalVoteInfomation[]>([])
    const [currentVoteType, setCurrentVoteType] = useState<VoteType>(VoteType.Unkonw)


    const [extra, setExtra] = useState<ContractProposalExtra>()

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
        setCurrentVoteType(isFullVote ? VoteType.FullMember : VoteType.Committee)
        console.log('proposal extra', extra)
        setExtra(extra)
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
                    <Tag>
                        {currentVoteType == VoteType.Unkonw && <Spin />}
                        {currentVoteType == VoteType.FullMember && 'Full members vote'}
                        {currentVoteType == VoteType.Committee && 'Committee vote'}
                    </Tag>
                    <InfoCircleOutlined />
                </Tooltip>
            </div>
            {currentVoteType == VoteType.FullMember &&
                <FullProposalProgress
                    extra={extra}
                    proposal={proposal}
                />}
            {currentVoteType == VoteType.Committee &&
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

                    </div>
                </div>
            }
            {
                !!voteInfo.length && currentVoteType == VoteType.Committee &&
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
                <Link href={"https://github.com/buckyos/SourceDAO"} target='_blank'>
                    <Button
                        type='primary'
                    >
                        Vote
                    </Button>
                </Link>
                {currentVoteType == VoteType.FullMember && <FullVoteExecuteButton proposal={proposal} />}
                <ExecuteProposalButton
                    disabled={supportPercent <= 50 && rejectPercent < 50}
                    proposal={proposal} />
            </div>

        </>
    )
}

export default ProposalHeaderContent