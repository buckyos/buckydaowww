'use client'
import { ethers } from 'ethers'
import { abis } from '@contracts/abis'
import { 
  //getProjectContract as getProjectContractBase, 
  newSignerContract, 
} from '@contracts/index'

// async function getProjectContract(contractStrore: ContractStoreDefine) {
//   const contract = await getProjectContractBase()
//   return contract
// }

// for upgrade contract
async function contractProxyContract(contractProxyAddress: string) {
  const contract = await newSignerContract(contractProxyAddress, abis)
  return contract
}

export { contractProxyContract }
