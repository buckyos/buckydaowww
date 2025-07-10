'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import {
  fetchProposalId,
  fetchMembers,
  // updateProposalInfomation,
} from '@services/index'
import { Button, Progress, Tag, message } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ethers } from 'ethers'
import { transformPercentNumber, wrapUnits } from '@utils/numberConverter'
import { solidityPackedKeccak256 } from 'ethers'
import _ from 'lodash'
import ExecuteProposalButton from '@components/ExecuteProposalButton'
import UpdateProposalModal from '@components/proposal/UpdateProposalModal'
import ProposalExtraContent from '@components/ProposalExtraContent'
import ProposalStateLine from '@components/ProposalStateLine'
import ProposalType from '@components/proposal/ProposalType'
import {
  zeroPadLeft,
  extractMessage,
  transactionWait,
  getProposalType,
  checkProposalVote,
  proposalTypeMap,
} from '@utils/index'
import { useUserStore, useContractStore } from '@hooks/index'
import { 
  contractService,
  voteChangeCommittee, 
  voteUpgradeContract 
} from '@contracts/index'

dayjs.extend(relativeTime)

// 提取参数
// 同意和拒绝都用到
function extractReleaseTokenParams(proposal: ProposalResponseData) {
  console.log('proposal.params', proposal?.params)
  const address = proposal?.params[0]
  const amounts = proposal?.params[1]

  if (!address || !amounts) {
    throw new Error('Invalid proposal params')
    // return
  }

  let proposalParams = []
  for (let i = 0; i < address.length; i++) {
    proposalParams.push(
      solidityPackedKeccak256(['address', 'uint256'], [address[i], amounts[i]]),
    )
  }
  proposalParams.push(ethers.encodeBytes32String('releaseTokens'))
  return proposalParams
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams() as { proposalId: string }
  const contract = useContractStore()
  const { user } = useUserStore((state) => {
    return { user: state.user, jwt: state.jwt }
  })

  const [proposal, setProposal] = useState<ProposalResponseData>()
  const [isVote, setIsVote] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  // const [committeeCount, setCommitteeLength] = useState<number>(0)
  const [supportPercent, setSupportPercent] = useState<number>(0)
  const [rejectPercent, setRejectPercent] = useState<number>(0)

  const [voteInfo, setVoteinfo] = useState<ProposalVoteInfomation[]>([])

  const [edit, setEdit] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchData = async () => {
    const result = await fetchProposalId(proposalId as string)
    console.log('result', result)
    const proposal = result.data as ProposalResponseData
    setProposal(proposal)
    setIsVote(checkProposalVote(proposal))

    return proposal
  }

  useAsyncEffect(async () => {
    // 获取提案信息
    const [proposal, data] = await Promise.all([
      fetchData(),
      fetchMembers(),
    ])
    const memberCount = data.data.length

    const votesInfo: ProposalVoteInfomation[] = proposal.support.map(item => {
      return {
        address: item,
        isCommiittee: !!_.find(data.data, (member) => member.address == item)
      }
    })

    console.log('vote result', votesInfo)
    setVoteinfo(votesInfo)

    setSupportPercent(
      transformPercentNumber(votesInfo.filter(o => o.isCommiittee).length, memberCount),
    )
    setRejectPercent(transformPercentNumber(proposal.rejectCount, memberCount))

    // 设置模式
    const isCreator = proposal.creator!.address === user.address
    setEdit(isCreator && proposal.title == '')
  }, [])

  const errorWrap = (fn: () => Promise<void>) => {
    return async () => {
      try {
        await fn()
      } catch (_e) {
        console.log(typeof _e, _e)
        let error = (_e as Error).message
        console.log('error', error)
        if (error.includes('already voted')) {
          message.error('Failed to vote: already voted', 10)
        } else {
          const msg = extractMessage(_e)
          message.error('Failed to vote ' + msg, 10)
        }
      }
    }
  }

  const voteSupportReleaseToken = async () => {
    const committeeContract = await contractService.getCommitteeContract()
    const proposalParams = extractReleaseTokenParams(proposal!)
    const tx = await committeeContract.support(proposalId, proposalParams)
    return tx
  }
  const voteSupportCreateVersion = async () => {
    if (!proposal?.project) {
      throw new Error('missing project data')
    }
    const committeeContract = await contractService.getCommitteeContract()
    const tx = await committeeContract.support(proposalId, [
      zeroPadLeft(proposal?.project?.id),
      zeroPadLeft(proposal?.project?.budget),
      zeroPadLeft(proposal?.project?.start_date),
      zeroPadLeft(proposal?.project?.end_date),
      ethers.encodeBytes32String('createProject'),
    ])
    return tx
  }
  const voteSupportSettlementVersion = async () => {
    const committeeContract = await contractService.getCommitteeContract()
    const params = proposal?.params[0] as SettlementVersionProposalParams
    const tx = await committeeContract.support(proposalId, [
      zeroPadLeft(params.projectId),
      zeroPadLeft(params.budget),
      zeroPadLeft(params.startDate),
      zeroPadLeft(params.endDate),
      ethers.encodeBytes32String('acceptProject'),
    ])
    return tx
  }
  // deprecated
  // const voteUpgradeContract = async () => {
  //   const committeeContract = await contract.getSignerComitteeContract()
  //   const contractProxyAddress = proposal?.params[0]
  //   const implAddress = proposal?.params[1]
  //   const upgradeContract = proposal?.params[2]
  //   const tx = await committeeContract.support(proposalId, [
  //     ethers.zeroPadValue(contractProxyAddress as string, 32),
  //     ethers.zeroPadValue(implAddress as string, 32),
  //     ethers.encodeBytes32String(upgradeContract),
  //   ])
  //   return tx
  // }

  const voteSupportInvestment = async () => {
    console.log('handleSupport', proposal?.investment)
    const committeeContract = await contractService.getCommitteeContract()
    // 投资的参数, 投票后面需要根据类型来区分参数
    const tx = await committeeContract.support(proposalId, [
      zeroPadLeft(proposal?.investment?.id),
      zeroPadLeft(proposal?.investment?.totalTokenAmount),
      zeroPadLeft(proposal?.investment?.priceType),
      zeroPadLeft(proposal?.investment?.tokenExchangeRate),
      zeroPadLeft(proposal?.investment?.assetExchangeRate),
      zeroPadLeft(proposal?.investment?.startTime),
      zeroPadLeft(proposal?.investment?.endTime),
      zeroPadLeft(proposal?.investment?.goalAssetAmount),
      zeroPadLeft(proposal?.investment?.minAssetPerInvestor),
      zeroPadLeft(proposal?.investment?.maxAssetPerInvestor),
      ethers.zeroPadValue(proposal?.investment?.assetAddress as string, 32),
      zeroPadLeft(proposal?.investment?.onlyWhitelist ? 1 : 0),
      ethers.encodeBytes32String('createInvestment'),
    ])
    return tx
  }

  // 投赞成票
  const handleSupport = errorWrap(async () => {
    setSupportLoading(true)
    const proposalType = getProposalType(proposal!)
    try {
      let tx
      if (proposalType === proposalTypeMap.releaseTokens) {
        tx = await voteSupportReleaseToken()
      } else if (proposalType === proposalTypeMap.createInvestment) {
        tx = await voteSupportInvestment()
      } else if (proposalType === proposalTypeMap.CreateVersion) {
        tx = await voteSupportCreateVersion()
      } else if (proposalType === proposalTypeMap.SettlementVersion) {
        tx = await voteSupportSettlementVersion()
      } else if (proposalType === proposalTypeMap.UpgradeContract) {
        tx = await voteUpgradeContract(proposalId, proposal?.params!)
      } else if (proposalType === proposalTypeMap.ChangeCommittee) {
        tx = await voteChangeCommittee(proposalId, proposal?.params!)
      } else {
        setSupportLoading(false)
        message.error('not support proposal type: ' + proposalType)
        return
      }
      const receipt = await transactionWait(tx)
      setSupportLoading(false)
      if (receipt?.status !== 1) {
        message.error('Failed to vote')
        return
      }
    } catch (e) {
      setSupportLoading(false)
      //message.error('Failed to vote')
    }

    message.success('Vote successfully. windwo refreshing...')
    _.delay(() => {
      window.location.reload()
    }, 3000)
    //
  })

  const handleReject = errorWrap(async () => {
    setRejectLoading(true)
    const committeeContract = await contractService.getCommitteeContract()
    const proposalType = getProposalType(proposal!)
    let tx
    if (getProposalType(proposal!) === 'releaseTokens') {
      const proposalParams = extractReleaseTokenParams(proposal!)
      tx = await committeeContract.reject(proposalId, proposalParams)
    } else if (proposalType === 'createInvestment') {
      tx = await committeeContract.reject(proposalId, [
        // investmentId|uint|investmentId
        // refund|uint|
        // ProposalType|bytes32|"abortInvestment"
        zeroPadLeft(proposal?.investment?.id),
        zeroPadLeft(1),
        ethers.encodeBytes32String('abortInvestment'),
      ])
    } else {
      setRejectLoading(false)
      message.error('not support proposal type: ' + proposalType)
      return
    }
    console.log('result', tx)
    const receipt = await tx.wait(1, 60000)
    setRejectLoading(false)
    if (receipt?.status !== 1) {
      message.error('Failed to vote')
      return
    }
    message.success('Successful vote against')
  })

  const onEdit = () => {
    setShowEditModal(true)
  }

  if (!proposal) {
    return null
  }

  const voteInProgress = supportPercent <= 50 && rejectPercent < 50
  console.log('voteInProgress', voteInProgress, supportPercent, rejectPercent)

  return (
    <>
      <div className='w-[1000px] mx-auto'>
        <h2 className='text-4xl font-medium'>{proposal.title}</h2>
        <div className='flex justify-between text-cyfs-gray mt-2'>
          <ProposalStateLine
            proposal={proposal}
            rejectPercent={rejectPercent}
          />

          {edit && <Button onClick={onEdit}>Edit</Button>}
        </div>
        <ProposalType proposal={proposal} />

        <div className='mt-4'>
          <div className='flex'>
            <div className='w-20'>Agree</div>
            <Progress
              status={supportPercent > 50 ? 'success' : 'normal'}
              percent={supportPercent}
            />
          </div>
          {voteInfo.length &&
            <div className='flex flex-col px-8 py-2 text-sm'>
              {voteInfo.map(item => {
                return (<div className='flex gap-2' key={item.address}>
                  <div className='w-[460px]'>vote address: {item.address}</div>
                  <Tag>{item.isCommiittee? 'committee':'normal'}</Tag>
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
          {voteInProgress && (
            <>
              <div className='flex justify-center gap-10'>
                <Button
                  type='primary'
                  onClick={handleSupport}
                  className=''
                  loading={supportLoading}
                  disabled={!isVote}
                >
                  Agree
                </Button>
                <Button
                  onClick={handleReject}
                  className=''
                  loading={rejectLoading}
                  disabled={!isVote}
                >
                  Disagree
                </Button>
              </div>
              {!isVote && (
                <div className='text-center text-red-300 mt-5 text-sm'>
                  The current proposal lacks the necessary type and cannot be
                  voted on.
                </div>
              )}
              <div className='text-center text-sm text-gray-300 mt-4'>
                Proposals completed by voting need to be clicked to execute
              </div>
            </>
          )}

          <ExecuteProposalButton
            disabled={voteInProgress}
            proposal={proposal}
          />
        </div>

        <ProposalExtraContent proposal={proposal} />

        <div className='mt-20 pt-20'>{proposal.extra}</div>
        <div className='mt-20 flex justify-end '>
          <div className='flex flex-col'>
            <div>
              <label className='font-bold mr-4'>params:</label>
              <span className='text-cyfs-gray'>{proposal.paramroot}</span>
            </div>
            <div>
              <label className='font-bold mr-4'>from group:</label>
              <span className='text-cyfs-gray'>{proposal.fromGroup}</span>
            </div>
          </div>
        </div>
      </div>
      <UpdateProposalModal
        visible={showEditModal}
        setVisible={setShowEditModal}
        fetchData={fetchData}
      />
    </>
  )
}
