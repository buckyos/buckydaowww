import { ethers } from 'ethers'
import { transactionWait } from '@utils/index'
import { message } from 'antd'
import { contractProxyContract } from '@hooks/index'
import { extractUpgradeCalldataFromExtra } from '@utils/index'
import { contractService } from './contract'

// 执行委员会变更
async function executeChangeCommittee(
  id: string,
  committeeList: string[],
  msg: string,
) {
  console.log('🌍🌍🌍 executeChangeCommittee', id, committeeList, msg)
  const committeeContract = await contractService.getCommitteeContract()
  const tx = await committeeContract.setCommittees(committeeList, id)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`execute failed[3][${receipt?.status}]`)
    return false
  }
  message.success(msg)
  return true
}

// 执行合约升级
async function executeUpgradeContract(
  contractAddress: string,
  upgradeAddress: string,
  proposalExtra: string,
  approvedCalldataHash?: string,
) {
  const { calldata } = extractUpgradeCalldataFromExtra(proposalExtra || '')
  const calldataHash = ethers.keccak256(calldata)
  const emptyCalldataHash = ethers.keccak256('0x')

  if (approvedCalldataHash && approvedCalldataHash !== emptyCalldataHash && calldata === '0x') {
    message.error('This proposal requires migration calldata, but no calldata metadata was found in the proposal content')
    return false
  }

  if (approvedCalldataHash && approvedCalldataHash !== calldataHash) {
    message.error('The stored migration calldata does not match the approved calldata hash')
    return false
  }

  const proxyContract = await contractProxyContract(contractAddress)
  console.log('🍻 proposal :', proxyContract)
  const tx = await proxyContract.upgradeToAndCall(
    upgradeAddress,
    calldata,
  )
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`execute failed[3][${receipt?.status}]`)
    return
  }
  message.success('Execute upgrade contract proposal success')
  return true
}

export { executeChangeCommittee, executeUpgradeContract }
