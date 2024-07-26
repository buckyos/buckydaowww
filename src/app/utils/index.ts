import { nowTimestamp, timeago } from '@utils/time'
import { ethers } from 'ethers'
import _ from 'lodash'
import { message } from 'antd'
import { decodeIfEncoded } from '@utils/encode'

const proposalExpiredTimeDisplay = (expired: number) => {
  const prefix =
    expired > nowTimestamp() ? 'Voting will end' : 'Voting ended about'
  return `${prefix} ${timeago(expired, true)}`
}

const zeroPadLeft = (value: number | string | undefined) => {
  if (undefined === value) {
    throw new Error('value is undefined')
  }
  const big = ethers.toBigInt(value.toString())
  const hex = ethers.toBeHex(big)
  const result = ethers.zeroPadValue(hex, 32)
  return result
}

function extractMessage(error: unknown) {
  const errorInfo = (error as any).message
  try {
    let jsonPart = errorInfo.split('{').slice(1).join('{')
    jsonPart = '{' + jsonPart.split('}').slice(0, -1).join('}') + '}'
    // 解析 JSON
    let jsonObj = JSON.parse(jsonPart)
    // 提取 'message' 字段
    let msg = jsonObj.error.message
    return msg
  } catch (e) {
    return errorInfo.toString()
  }
}

async function transactionWait(tx: any) {
  message.info(
    'The contract has been called, tx is being confirmed, please wait...',
  )

  const receipt = await tx.wait(1, 60000)
  return receipt
}

// 提案类型
enum proposalTypeMap {
  createInvestment = 'createInvestment',
  CreateVersion = 'CreateVersion',
  releaseTokens = 'releaseTokens',
  SettlementVersion = 'acceptProject',
  UpgradeContract = 'upgradeContract',
  ChangeCommittee = 'setCommittees',
  unknown = '',
}

// 获取提案类型
const getProposalType = (proposal: ProposalResponseData) => {
  const proposalType = decodeIfEncoded(_.last(proposal.params))
  if (proposalType === 'releaseTokens') {
    return proposalTypeMap.releaseTokens
  }
  if (proposalType === 'acceptProject') {
    return proposalTypeMap.SettlementVersion
  }
  if (proposalType === 'upgradeContract') {
    return proposalTypeMap.UpgradeContract
  }
  if (proposalType === 'setCommittees') {
    return proposalTypeMap.ChangeCommittee
  }

  if (!!proposal.investment) {
    return proposalTypeMap.createInvestment
  }
  if (!!proposal.project) {
    return proposalTypeMap.CreateVersion
  }

  return proposalTypeMap.unknown
}

const checkProposalVote = (proposal: ProposalResponseData) => {
  const proposalType = getProposalType(proposal)
  if (proposalType === proposalTypeMap.unknown) {
    return false
  } else {
    return true
  }
}

export {
  transactionWait,
  proposalTypeMap,
  checkProposalVote,
  getProposalType,
  proposalExpiredTimeDisplay,
  zeroPadLeft,
  extractMessage,
}
