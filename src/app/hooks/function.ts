'use client'
import { ethers } from 'ethers'
import { abis } from '@contracts/abis'
import { getProvider } from '@contracts/contract'
import { getProjectContract as getProjectContractBase } from '@contracts/index'

async function getProjectContract(contractStrore: ContractStoreDefine) {
  const contract = await getProjectContractBase()
  return contract
}

// for upgrade contract
async function contractProxyContract(contractProxyAddress: string) {
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(contractProxyAddress, abis, signer)
  return contract
}

export { getProvider, getProjectContract, contractProxyContract }
