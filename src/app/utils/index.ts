import { nowTimestamp, timeago } from '@utils/time'
import { ethers } from 'ethers'
import _ from 'lodash'
import { message } from 'antd'
import { createElement } from 'react'
import { parseToFloat, wrapUnits } from '@utils/numberConverter'
import { decodeIfEncoded, decodePaddedAddress } from '@utils/encode'

export * from "./numberConverter"
export * from './time'

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
    if (
      typeof errorInfo === 'string' &&
      errorInfo.includes('missing revert data') &&
      errorInfo.includes('estimateGas')
    ) {
      return 'Transaction simulation failed before the wallet could send it on chain.\n\nCommon causes:\n- budget exceeds the current 2.5% token supply limit\n- version is not greater than the latest version\n- token/amount array lengths do not match'
    }

    if (
      typeof errorInfo === 'string' &&
      errorInfo.includes('eth_sendTransaction') &&
      errorInfo.includes('Failed to fetch')
    ) {
      return 'MetaMask could not reach the local Hardhat RPC while sending the transaction. Re-select or re-add the Hardhat Local network (RPC http://127.0.0.1:8545, chainId 31337) and try again.'
    }

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

function formatLongErrorMessage(messageText: string) {
  return messageText
    .replace(/\]\[/g, ']\n[')
    .replace(/, transaction=\{/g, ',\ntransaction={')
    .replace(/, invocation=/g, ',\ninvocation=')
    .replace(/, revert=/g, ',\nrevert=')
    .replace(/, code=/g, ',\ncode=')
}

function showErrorMessage(e: any, msg: string) {
    const result = extractMessage(e)
    const formatted = formatLongErrorMessage(`${msg}\n${result}`)
    message.open({
      type: 'error',
      duration: 10,
      style: { marginTop: '20vh' },
      content: createElement(
        'div',
        {
          style: {
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
            maxWidth: '720px',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          },
        },
        formatted,
      ),
    })
}

async function transactionWait(tx: any) {
  if (!tx || typeof tx.wait !== 'function') {
    throw new Error('No transaction response was returned from the contract call')
  }

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

const getProposalSyncState = (
  proposal: ProposalResponseData,
): ProposalSyncState => {
  return proposal.syncState ?? 'legacy'
}

const isProposalMetadataMissing = (proposal: ProposalResponseData) => {
  return getProposalSyncState(proposal) === 'chain_only'
}

const isProposalMetadataConflict = (proposal: ProposalResponseData) => {
  return getProposalSyncState(proposal) === 'conflict'
}

const getProposalMissingMetadataMessage = () => {
  return 'This proposal exists on chain, but backend metadata has not been submitted or accepted yet.'
}

const getProposalMetadataConflictMessage = () => {
  return 'Backend received proposal metadata that does not match the on-chain creator. Only chain data is trusted right now.'
}

const hasTrustedProposalMetadata = (proposal: ProposalResponseData) => {
  const syncState = getProposalSyncState(proposal)
  return syncState === 'legacy' || syncState === 'ready'
}

// 获取提案类型
const getProposalType = (proposal: ProposalResponseData) => {
  if (!hasTrustedProposalMetadata(proposal)) {
    return proposalTypeMap.unknown
  }

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


function transformVersionStateWord(state: number | string) {
  if (state == 0) {
    return 'Waiting vote'
  }
  if (state == 1) {
    return 'Proposal passed'
  }
  if (state == 3) {
    return 'Version settled'
  }
  return 'Unknown'
}

const UPGRADE_CALLDATA_BLOCK_START = '[upgrade-calldata]'
const UPGRADE_CALLDATA_BLOCK_END = '[/upgrade-calldata]'

function normalizeUpgradeCalldata(calldata?: string) {
  const trimmed = calldata?.trim() || ''
  if (!trimmed) {
    return '0x'
  }
  if (!ethers.isHexString(trimmed)) {
    throw new Error('Migration calldata must be a hex string')
  }
  return trimmed
}

function appendUpgradeCalldataToExtra(extra: string, calldata?: string) {
  const normalizedCalldata = normalizeUpgradeCalldata(calldata)
  const trimmedExtra = extra.trimEnd()
  if (normalizedCalldata === '0x') {
    return trimmedExtra
  }

  const markerBlock = `${UPGRADE_CALLDATA_BLOCK_START}\n${normalizedCalldata}\n${UPGRADE_CALLDATA_BLOCK_END}`
  return trimmedExtra ? `${trimmedExtra}\n\n${markerBlock}` : markerBlock
}

function extractUpgradeCalldataFromExtra(extra: string) {
  const regex = /\n?\[upgrade-calldata\]\n(0x[a-fA-F0-9]*)\n\[\/upgrade-calldata\]\s*$/s
  const match = extra.match(regex)

  if (!match) {
    return {
      content: extra,
      calldata: '0x',
    }
  }

  return {
    content: extra.slice(0, match.index).trimEnd(),
    calldata: normalizeUpgradeCalldata(match[1]),
  }
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
  getProposalSyncState,
  isProposalMetadataMissing,
  isProposalMetadataConflict,
  getProposalMissingMetadataMessage,
  getProposalMetadataConflictMessage,
  hasTrustedProposalMetadata,
  proposalExpiredTimeDisplay,
  zeroPadLeft,
  extractMessage,
  convertVersion,
  showErrorMessage,
  transformVersionStateWord,
  normalizeUpgradeCalldata,
  appendUpgradeCalldataToExtra,
  extractUpgradeCalldataFromExtra,
}
