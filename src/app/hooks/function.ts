'use client'
import { ethers } from 'ethers'
import { message } from 'antd'
import { abis } from '@contracts/abis'

//
async function getProvider() {
  if (window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      return provider
    } catch (e) {
      message.error((e as any).toString())
      throw new Error('user reject connect wallet')
    }
  } else {
    message.error('Please install MetaMask first')
    console.log('MetaMask not installed; using read-only defaults')
    throw new Error('MetaMask not installed; using read-only defaults')
  }
}

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
