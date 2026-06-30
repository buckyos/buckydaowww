
'use client'
import React, { useState } from 'react'
import { Progress, Tag, Tooltip, Spin, Collapse, Button } from 'antd'
import type { CollapseProps } from 'antd';
import Link from 'next/link'
import { transformPercentNumber, wrapUnits, formatNumberWithCommas } from '@utils/numberConverter'
import ExecuteProposalButton from '@components/ExecuteProposalButton'
import ProposalType from '@components/proposal/ProposalType'
import ProposalStateLine from '@components/ProposalStateLine'
import StateExplanationCard from '@components/StateExplanationCard'
import { useBindWalletAddress, useCommittee, useUserStore } from '@hooks/index'
import ProposalEdition from './ProposalEdition'
import FullVoteExecuteButton from './FullVoteExecuteButton'
import ProposalVoteButtons from './ProposalVoteButtons'
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
import { ProposalState } from '@vars/index'
import {
    getEffectiveProposalState,
    getProposalMetadataConflictMessage,
    getProposalMissingMetadataMessage,
    hasTrustedProposalMetadata,
    isProposalMetadataConflict,
    isProposalVotingOpen,
} from '@utils/index'


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
    const [loading, setLoading] = useState<boolean>(true)

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

        setLoading(false)
    }, [proposal, maxVoteNumber])

    const items: CollapseProps['items'] = [
        {
            key: '1',
            label: 'Support Vote Detail',
            children: <>{supportAddressBalancesWithVotes.map((item) => (
                <div className='flex gap-2' key={item.address}>
                    <div>{item.address}</div>
                    <div>{formatNumberWithCommas(parseInt(wrapUnits(item.votes, 18)))}</div>
                </div>
            ))}</>,
        },
        {
            key: '2',
            label: 'Reject Vote Detail',
            children: <>{rejectAddressBalancesWithVotes.map((item) => (
                <div className='flex gap-2' key={item.address}>
                    <div>{item.address}</div>
                    <div>{formatNumberWithCommas(parseInt(wrapUnits(item.votes, 18)))}</div>
                </div>
            ))}</>,
        },
    ]

    if (loading) {
        return (
            <div className='flex-center flex-col py-10 gap-1'>
                <Spin />
                <div>
                    Full vote information loading...
                </div>
            </div>
        )
    }



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
                <div className='font-bold'>{formatNumberWithCommas(parseInt(wrapUnits(maxVoteNumber, 18)))}</div>
            </div>
            <div className='flex gap-2'>
                <div>Voting threshold count:</div>
                <div className='font-bold'>{formatNumberWithCommas(parseInt(wrapUnits(validVoteNumber, 18)))}</div>
            </div>
            <div className='mt-2'>
                The number of votes for each address is calculated as: BDDT owned by this address * ratio / 100 + BDT owned by this address
            </div>
            <Collapse className='mt-2' items={items} />
        </>
    )
}







function buildVoteActionExplanation(params: {
    proposal: ProposalResponseData
    hasActiveWallet: boolean
    isCommittee: boolean
    isCommitteeUnknown: boolean
    isCommitteeCheckFailed: boolean
    activeAddress?: string
}): {
    status: string
    why: string[]
    next: string[]
    tone: 'info' | 'success' | 'warning' | 'danger'
} {
    const {
        proposal,
        hasActiveWallet,
        isCommittee,
        isCommitteeUnknown,
        isCommitteeCheckFailed,
        activeAddress,
    } = params
    const trustedMetadata = hasTrustedProposalMetadata(proposal)
    const metadataConflict = isProposalMetadataConflict(proposal)
    const votingOpen = isProposalVotingOpen(proposal)
    const effectiveState = getEffectiveProposalState(proposal)
    const normalizedActiveAddress = activeAddress?.trim().toLowerCase() || ''
    const currentVote = normalizedActiveAddress
        ? proposal.support.some((address) => address.trim().toLowerCase() === normalizedActiveAddress)
            ? 'support'
            : proposal.reject.some((address) => address.trim().toLowerCase() === normalizedActiveAddress)
                ? 'reject'
                : ''
        : ''

    const why: string[] = []
    const next: string[] = []
    let status = proposal.full ? 'Full vote review' : 'Committee vote review'
    let tone: 'info' | 'success' | 'warning' | 'danger' = 'info'

    if (!trustedMetadata) {
        tone = metadataConflict ? 'danger' : 'warning'
        status = metadataConflict ? 'Metadata conflict blocks web voting' : 'Metadata missing for web voting'
        why.push(
            metadataConflict
                ? getProposalMetadataConflictMessage()
                : getProposalMissingMetadataMessage(),
        )
        next.push('Use the offline guide only if you have independently verified the intended payload.')
        return { status, why, next, tone }
    }

    if (effectiveState !== ProposalState.InProgress || !votingOpen) {
        tone = 'warning'
        status = 'Voting closed'
        why.push('This proposal is no longer inside an active on-chain voting window.')
        next.push('Review the recorded vote result below or wait for settlement/execution steps.')
        return { status, why, next, tone }
    }

    if (!hasActiveWallet) {
        tone = 'warning'
        status = 'Connect wallet to vote'
        why.push('Voting actions require a connected browser wallet.')
        next.push('Connect a wallet, then review support or reject using the action buttons below.')
        return { status, why, next, tone }
    }

    if (proposal.full) {
        if (currentVote) {
            tone = 'success'
            status = `You already ${currentVote === 'support' ? 'supported' : 'rejected'}`
            why.push('Your current wallet has already cast a full-vote decision for this proposal.')
            next.push('Track the final tally or wait for the full-vote settlement step after expiry.')
            return { status, why, next, tone }
        }

        status = 'Voting open for token holders'
        why.push('This proposal is using full-member voting, so eligible token holders can vote directly on chain.')
        next.push('Review the payload summary and choose support or reject.')
        return { status, why, next, tone }
    }

    if (isCommitteeUnknown) {
        tone = 'warning'
        status = 'Checking committee eligibility'
        why.push('The UI is still checking whether the current wallet belongs to a committee member.')
        next.push('Wait a moment before voting, or confirm the correct wallet is connected.')
        return { status, why, next, tone }
    }

    if (isCommitteeCheckFailed) {
        tone = 'warning'
        status = 'Committee eligibility check unavailable'
        why.push('The browser could not complete the committee membership pre-check.')
        next.push('You can still submit the vote transaction; the contract will enforce the final eligibility check on chain.')
        return { status, why, next, tone }
    }

    if (currentVote) {
        tone = 'success'
        status = `You already ${currentVote === 'support' ? 'supported' : 'rejected'}`
        why.push('Your current wallet has already recorded a committee vote for this proposal.')
        next.push('Review the vote breakdown below or wait for the proposal to reach its next state.')
        return { status, why, next, tone }
    }

    if (!isCommittee) {
        tone = 'warning'
        status = 'Committee wallet required'
        why.push('This proposal uses committee voting, so only committee wallets can vote here.')
        next.push('Switch to an eligible committee wallet or use the proposal detail for observation only.')
        return { status, why, next, tone }
    }

    status = 'Committee voting open'
    why.push('This proposal is still in progress and the current wallet is eligible to vote.')
    next.push('Choose support or reject below after reviewing the payload summary.')
    return { status, why, next, tone }
}

function buildExecutionActionExplanation(params: {
    proposal: ProposalResponseData
    hasActiveWallet: boolean
    isCommittee: boolean
    extra?: ContractProposalExtra
}): {
    status: string
    why: string[]
    next: string[]
    tone: 'info' | 'success' | 'warning' | 'danger'
} {
    const { proposal, hasActiveWallet, isCommittee, extra } = params
    const trustedMetadata = hasTrustedProposalMetadata(proposal)
    const metadataConflict = isProposalMetadataConflict(proposal)
    const effectiveState = getEffectiveProposalState(proposal)
    const isFullProposal = proposal.full
    const allVoters = Array.from(new Set([...proposal.support, ...proposal.reject]))
    const settledCount = extra ? Number(extra.settled) : 0
    const pendingSettleCount = Math.max(allVoters.length - settledCount, 0)
    const why: string[] = []
    const next: string[] = []
    let status = isFullProposal ? 'Awaiting full-vote settlement' : 'Execution not available yet'
    let tone: 'info' | 'success' | 'warning' | 'danger' = 'info'

    if (!trustedMetadata && !isFullProposal) {
        tone = metadataConflict ? 'danger' : 'warning'
        status = metadataConflict ? 'Metadata conflict blocks execution' : 'Metadata missing for execution'
        why.push(
            metadataConflict
                ? getProposalMetadataConflictMessage()
                : getProposalMissingMetadataMessage(),
        )
        next.push('Recover proposal metadata before trying to execute the committee action from the web UI.')
        return { status, why, next, tone }
    }

    if (isFullProposal) {
        if (effectiveState !== ProposalState.Expired) {
            tone = 'warning'
            status = 'Settle after expiry'
            why.push('Full-vote proposals must first reach their expired state before the final settlement transaction can run.')
            next.push('Wait for the proposal to expire on chain, then settle the remaining voters.')
            return { status, why, next, tone }
        }

        if (pendingSettleCount === 0) {
            tone = 'success'
            status = 'No pending voter settlement'
            why.push('All voter settlement entries tracked by the UI are already accounted for.')
            next.push('Refresh proposal status and inspect whether the final state has already transitioned.')
            return { status, why, next, tone }
        }

        status = 'Full-vote settlement available'
        why.push(`There are ${pendingSettleCount} voter entries left to settle for this expired full-vote proposal.`)
        next.push('Run the full-vote settlement transaction to finalize the proposal state.')
        return { status, why, next, tone: 'success' }
    }

    if (effectiveState === ProposalState.Executed) {
        tone = 'success'
        status = 'Proposal already executed'
        why.push('The execution transaction has already been confirmed on chain.')
        next.push('Inspect the downstream project, funding, or token state changes instead of executing again.')
        return { status, why, next, tone }
    }

    if (effectiveState !== ProposalState.Accepted) {
        tone = effectiveState === ProposalState.Rejected ? 'danger' : 'warning'
        status = 'Execution locked by proposal state'
        why.push('Committee execution is only available after the proposal reaches the accepted state.')
        next.push('Wait for acceptance or review why the proposal ended without an executable outcome.')
        return { status, why, next, tone }
    }

    if (!hasActiveWallet) {
        tone = 'warning'
        status = 'Connect wallet to execute'
        why.push('Execution requires a connected browser wallet.')
        next.push('Connect the appropriate operator wallet and then run the execution action below.')
        return { status, why, next, tone }
    }

    if (!isCommittee) {
        tone = 'warning'
        status = 'Committee wallet required'
        why.push('Only committee wallets should execute accepted committee proposals from the web UI.')
        next.push('Switch to an eligible committee wallet before running execution.')
        return { status, why, next, tone }
    }

    status = 'Ready to execute'
    tone = 'success'
    why.push('The proposal has been accepted and the current wallet is suitable for execution.')
    next.push('Run the execution transaction once you are ready to apply the approved change on chain.')
    return { status, why, next, tone }
}

const ProposalHeaderContent: React.FC<{
    proposal: ProposalResponseData,
    members: CommitteeMember[],
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, members, fetchData }) => {
    const [supportPercent, setSupportPercent] = useState<number>(0)
    const [rejectPercent, setRejectPercent] = useState<number>(0)
    const [supportVoteInfo, setSupportVoteInfo] = useState<ProposalVoteInfomation[]>([])
    const [rejectVoteInfo, setRejectVoteInfo] = useState<ProposalVoteInfomation[]>([])
    // const [currentVoteType, setCurrentVoteType] = useState<VoteType>(VoteType.Unkonw)


    const [extra, setExtra] = useState<ContractProposalExtra>()

    const { user } = useUserStore((state) => {
        return { user: state.user, jwt: state.jwt }
    })
    const { activeAddress, hasActiveWallet } = useBindWalletAddress()
    const {
        isCommittee,
        isChecking: isCommitteeChecking,
        checkFailed: committeeCheckFailed,
    } = useCommittee(activeAddress)

    useAsyncEffect(async () => {
        const supportVotesInfo: ProposalVoteInfomation[] = proposal.support.map(item => {
            return {
                address: item,
                isCommiittee: !!_.find(members, (member) => member.address == item)
            }
        })
        const rejectVotesInfo: ProposalVoteInfomation[] = proposal.reject.map(item => {
            return {
                address: item,
                isCommiittee: !!_.find(members, (member) => member.address == item)
            }
        })
        const memberCount = members.length

        console.log('vote result', supportVotesInfo, rejectVotesInfo)
        setSupportVoteInfo(supportVotesInfo)
        setRejectVoteInfo(rejectVotesInfo)

        setSupportPercent(
            transformPercentNumber(supportVotesInfo.filter(o => o.isCommiittee).length, memberCount),
        )
        setRejectPercent(
            transformPercentNumber(rejectVotesInfo.filter(o => o.isCommiittee).length, memberCount),
        )
        // 判断是否全员投票
        const extra = await getCommitteeProposalExtra(Number(proposal.id))
        // const isFullVote = extra.from != "0x0000000000000000000000000000000000000000"
        // console.log('proposal extra', extra)
        setExtra(extra)
    }, [JSON.stringify({ proposal, members })])

    const currentVoteType = proposal.full ? VoteType.FullMember : VoteType.Committee
    const effectiveState = getEffectiveProposalState(proposal)
    const voteActionExplanation = buildVoteActionExplanation({
        proposal,
        hasActiveWallet,
        isCommittee,
        isCommitteeUnknown: isCommitteeChecking,
        isCommitteeCheckFailed: committeeCheckFailed,
        activeAddress,
    })
    const executionActionExplanation = buildExecutionActionExplanation({
        proposal,
        hasActiveWallet,
        isCommittee,
        extra,
    })

    return (
        <>
            <div className='flex justify-between text-cyfs-gray mt-2'>
                <ProposalStateLine
                    proposal={proposal}
                    rejectPercent={currentVoteType == VoteType.Committee ? rejectPercent : 0}
                />

                <ProposalEdition
                    proposal={proposal}
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
            {currentVoteType == VoteType.Committee && (
                <div className='mt-4 rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-5'>
                    <div className='text-sm font-medium uppercase tracking-[0.16em] text-[#8C8C8C]'>
                        Vote Breakdown
                    </div>
                    <div className='mt-4 grid gap-4 md:grid-cols-3'>
                        <div className='rounded-xl border border-[#E6F4FF] bg-white p-4'>
                            <div className='text-sm text-[#8C8C8C]'>Support</div>
                            <div className='mt-2 text-2xl font-semibold text-[#0958D9]'>
                                {proposal.support.filter((address) =>
                                    _.find(members, (member) => member.address == address),
                                ).length}
                                <span className='ml-1 text-base font-medium text-[#8C8C8C]'>
                                    / {members.length}
                                </span>
                            </div>
                            <div className='mt-2 text-sm text-[#8C8C8C]'>
                                {supportPercent.toFixed(2)}% of visible committee votes
                            </div>
                        </div>
                        <div className='rounded-xl border border-[#FFF1F0] bg-white p-4'>
                            <div className='text-sm text-[#8C8C8C]'>Reject</div>
                            <div className='mt-2 text-2xl font-semibold text-[#CF1322]'>
                                {proposal.reject.filter((address) =>
                                    _.find(members, (member) => member.address == address),
                                ).length}
                                <span className='ml-1 text-base font-medium text-[#8C8C8C]'>
                                    / {members.length}
                                </span>
                            </div>
                            <div className='mt-2 text-sm text-[#8C8C8C]'>
                                {rejectPercent.toFixed(2)}% of visible committee votes
                            </div>
                        </div>
                        <div className='rounded-xl border border-[#F0F0F0] bg-white p-4'>
                            <div className='text-sm text-[#8C8C8C]'>Result Signal</div>
                            <div className='mt-2 text-base font-semibold text-black-primary'>
                                {rejectPercent > supportPercent
                                    ? 'Rejection currently dominates'
                                    : supportPercent > rejectPercent
                                        ? 'Support currently dominates'
                                        : 'Votes are balanced'}
                            </div>
                            <div className='mt-2 text-sm text-[#8C8C8C]'>
                                The database stores support and reject addresses separately for committee voting.
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {
                currentVoteType == VoteType.Committee &&
                <div className='mt-4 grid gap-4 md:grid-cols-2'>
                    <div className='rounded-2xl border border-[#D6E4FF] bg-[#F5F9FF] p-5'>
                        <div className='text-sm font-medium uppercase tracking-[0.16em] text-[#8C8C8C]'>
                            Supported By
                        </div>
                        <div className='mt-4 flex flex-col gap-3 text-sm'>
                            {supportVoteInfo.length ? supportVoteInfo.map(item => {
                                return (
                                    <div className='flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3' key={`support-${item.address}`}>
                                        <div className='min-w-0 font-mono text-black-primary'>
                                            {item.address}
                                        </div>
                                        <Tag color={item.isCommiittee ? 'green' : 'default'}>
                                            {item.isCommiittee ? 'committee' : 'normal'}
                                        </Tag>
                                    </div>
                                )
                            }) : (
                                <div className='rounded-xl bg-white px-4 py-3 text-[#8C8C8C]'>
                                    No support votes recorded.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='rounded-2xl border border-[#FFCCC7] bg-[#FFF1F0] p-5'>
                        <div className='text-sm font-medium uppercase tracking-[0.16em] text-[#8C8C8C]'>
                            Rejected By
                        </div>
                        <div className='mt-4 flex flex-col gap-3 text-sm'>
                            {rejectVoteInfo.length ? rejectVoteInfo.map(item => {
                                return (
                                    <div className='flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3' key={`reject-${item.address}`}>
                                        <div className='min-w-0 font-mono text-black-primary'>
                                            {item.address}
                                        </div>
                                        <Tag color={item.isCommiittee ? 'red' : 'default'}>
                                            {item.isCommiittee ? 'committee' : 'normal'}
                                        </Tag>
                                    </div>
                                )
                            }) : (
                                <div className='rounded-xl bg-white px-4 py-3 text-[#8C8C8C]'>
                                    No reject votes recorded.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
            <div className='mt-8 grid gap-4 xl:grid-cols-2'>
                <StateExplanationCard
                    heading='Voting Action'
                    status={voteActionExplanation.status}
                    why={voteActionExplanation.why}
                    next={voteActionExplanation.next}
                    tone={voteActionExplanation.tone}
                    footer={(
                        <div className='flex flex-wrap items-center gap-4'>
                            <Link
                                className='text-cyfs-blue'
                                href={'https://github.com/buckyos/SourceDAO/blob/main/docs/VoteGuide.md'}
                                target='_blank'
                            >
                                How to vote?
                            </Link>
                            <ProposalVoteButtons
                                proposal={proposal}
                                fetchData={fetchData}
                            />
                        </div>
                    )}
                />

                <StateExplanationCard
                    heading={currentVoteType == VoteType.FullMember ? 'Settlement Action' : 'Execution Action'}
                    status={executionActionExplanation.status}
                    why={executionActionExplanation.why}
                    next={executionActionExplanation.next}
                    tone={executionActionExplanation.tone}
                    footer={(
                        <div className='flex flex-wrap items-center gap-4'>
                            {currentVoteType == VoteType.FullMember ? (
                                <FullVoteExecuteButton
                                    proposal={proposal}
                                    extra={extra}
                                    fetchData={fetchData}
                                />
                            ) : (
                                <ExecuteProposalButton
                                    disabled={effectiveState != ProposalState.Accepted}
                                    proposal={proposal}
                                />
                            )}
                        </div>
                    )}
                />
            </div>

        </>
    )
}

export default ProposalHeaderContent
