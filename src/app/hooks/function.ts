'use client'
import { ethers } from 'ethers'
import { message } from 'antd'
import { abis } from '@contracts/abis'
import { getProvider } from '@contracts/contract'

async function getTokenContract(address: string) {
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(address, abis, signer)
  return contract
}

async function getProjectContract(contractStrore: ContractStoreDefine) {
  const address = contractStrore.projectAddress
  // console.log('🐼 getProjectContract', address)
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(address, abis, signer)
  return contract
}

// for upgrade contract
async function contractProxyContract(contractProxyAddress: string) {
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(contractProxyAddress, abis, signer)
  return contract
}

export {
  getProvider,
  getTokenContract,
  getProjectContract,
  contractProxyContract,
}
