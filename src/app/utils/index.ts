import { nowTimestamp, timeago } from '@utils/time'
import { ethers } from 'ethers'
import _ from 'lodash'
import { message } from 'antd'
import { parseToFloat, wrapUnits } from '@utils/numberConverter'
import { decodeIfEncoded, decodePaddedAddress } from '@utils/encode'

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
    // 先正则匹配
    const regex = /execution reverted: "([^"]+)"/
    const match = errorInfo.match(regex)
    if (match) {
      return match[1]
    }

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
  if (proposalType === proposalTypeMap.ChangeCommittee) {
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

/**
 * 将版本号字符串转换为数字
 * @param version 版本号字符串，格式为 'major.minor.patch'
 * @returns 转换后的数字
 * 
 * @example
 * convertVersion('1.2.3') // 返回 10000200003
 * convertVersion('2.0.5') // 返回 20000000005
 * convertVersion('0.1.0') // 返回 100000
 * 
 * @throws 当版本号格式不正确时抛出错误
 */
function convertVersion(version: string): number {
    let versions = version.split('.');
    if (versions.length < 3) {
        throw new Error(`Invalid version format: ${version}. Expected format is 'major.minor.patch'.`);
    }

    let major = parseInt(versions[0], 10);
    let minor = parseInt(versions[1], 10);
    let patch = parseInt(versions[2], 10);

    return major*10000000000+minor*100000+patch
}

export {
  // number
  parseToFloat,
  wrapUnits,
  // decode
  decodePaddedAddress,
  transactionWait,
  proposalTypeMap,
  checkProposalVote,
  getProposalType,
  proposalExpiredTimeDisplay,
  zeroPadLeft,
  extractMessage,
  convertVersion,
}
