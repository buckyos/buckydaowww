import { ethers, Interface, InterfaceAbi } from 'ethers'
import { message } from 'antd'
import { abis, ISourceProject, ProjectManagement, SourceDaoCommittee } from '@contracts/abis'

const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID

/**
 * 检查浏览器是否安装了以太坊钱包插件
 * @returns {boolean} 如果安装了钱包插件返回true，否则返回false
 */
export function isBrowserHasWallet(): boolean {
  try {
    // 检查window.ethereum是否存在
    const hasEthereum = typeof window !== 'undefined' && !!window.ethereum;

    // 检查是否支持基本的以太坊方法
    const hasBasicEthereumMethods = hasEthereum &&
      typeof window.ethereum.request === 'function' &&
      typeof window.ethereum.isMetaMask !== 'undefined';

    return hasBasicEthereumMethods;
  } catch (error) {
    console.warn('检查钱包插件时发生错误:', error);
    return false;
  }
}

export async function getProvider() {
  if (!isBrowserHasWallet()) {
    message.info('The current browser does not install MetaMask , so the contract function cannot be used')
    console.log('MetaMask not installed; using read-only defaults')
    // throw new Error('MetaMask not installed')
    return false
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  console.log('provider', provider)
  await checkEthNetworkId(provider)
  return provider
}

async function checkEthNetworkId(ethProvider: ethers.BrowserProvider) {
  if (!ethProvider) return

  const chainId = await ethProvider
    .getNetwork()
    .then((network) => network.chainId.toString())

  const networkId = NETWORK_ID || '196'
  let hexString = Number(networkId).toString(16)
  let hexStringWithPrefix = '0x' + hexString
  console.log('networkId: ', hexStringWithPrefix)

  console.log('current network chainId', chainId, networkId)
  if (chainId !== networkId) {
    message.info('current network is not correct, switch to correct network...')
    const result = await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexStringWithPrefix }],
    })
    console.log('wallet_switchEthereumChain result', result)
    message.info('network switched, window reloading...')
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }
}

export async function newSignerContract(contractAddress: string, abi: Interface | InterfaceAbi,) {
  let provider = await getProvider()
  if (!provider) {
    throw new Error("newSignerContract failed")
  }
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(contractAddress, abi, signer)
  return contract
}

export async function newProviderContract(contractAddress: string, abi: Interface | InterfaceAbi,) {
  let provider = await getProvider()
  if (!provider) {
    throw new Error("newProviderContract failed")
  }
  const contract = new ethers.Contract(contractAddress, abi, provider)
  return contract
}




class ContractService {
  private COMMITTEE = process.env.NEXT_PUBLIC_COMMITTEE
  private DIVIDEND = process.env.NEXT_PUBLIC_DIVIDEND
  // private INVESTMENT = process.env.NEXT_PUBLIC_INVESTMENT
  private LOCKUP = process.env.NEXT_PUBLIC_LOCKUP
  private MAIN = process.env.NEXT_PUBLIC_MAIN
  private PROJECT = process.env.NEXT_PUBLIC_PROJECT
  private NORMAL_TOKEN = process.env.NEXT_PUBLIC_NORMAL_TOKEN
  private DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN
  private ACQUIRED = process.env.NEXT_PUBLIC_ACQUIRED
  private NETWORK_ID = NETWORK_ID

  private Contracts: { [key: string]: ethers.Contract | undefined } = {}

  constructor() {
    console.log('🔡 COMMITTEE contract address', this.COMMITTEE)
    console.log('🔡 DIVIDEND contract address', this.DIVIDEND)
    // console.log('🔡 INVESTMENT contract address', this.INVESTMENT)
    console.log('🔡 LOCKUP contract address', this.LOCKUP)
    console.log('🔡 MAIN contract address', this.MAIN)
    console.log('🔡 PROJECT contract address', this.PROJECT)
    console.log('🔡 NORMAL_TOKEN contract address', this.NORMAL_TOKEN)
    console.log('🔡 DEV_TOKEN contract address', this.DEV_TOKEN)
    console.log('🔡 ACQUIRED contract address', this.ACQUIRED)
    console.log('🔡 NETWORK_ID contract address', this.NETWORK_ID)
  }

  public getAddressOfDevToken() {
    if (!this.DEV_TOKEN) throw new Error('DEV_TOKEN is undefined')
    return this.DEV_TOKEN
  }

  public getAddressOfNormalToken() {
    if (!this.NORMAL_TOKEN) throw new Error('NORMAL_TOKEN is undefined')
    return this.NORMAL_TOKEN
  }

  public getAddressOfMain() {
    if (!this.MAIN) throw new Error('MAIN is undefined')
    return this.MAIN
  }

  public getAddressOfLockup() {
    if (!this.LOCKUP) throw new Error('LOCKUP is undefined')
    return this.LOCKUP
  }

  public getAddressOfAquired() {
    if (!this.ACQUIRED) throw new Error('ACQUIRED is undefined')
    return this.ACQUIRED
  }


  public getNetworkId() {
    if (!this.NETWORK_ID) throw new Error('NETWORK_ID is undefined')
    return this.NETWORK_ID
  }

  private generateContract(abi: any, key?: string, address?: string) {
    if (address === undefined) throw new Error('address is undefined')
    if (key === undefined) throw new Error('key is undefined')

    return async (): Promise<ethers.Contract> => {
      if (this.Contracts[key] !== undefined) {
        console.log('[', key, '] get contract instance ', address, 'from cache')
        return this.Contracts[key] as ethers.Contract
      }

      const contract = await newSignerContract(address, abi)
      console.log('[', key, '] contract initialized', address)

      this.Contracts[key] = contract
      return contract
    }
  }

  public getCommitteeContract = this.generateContract([...abis, ...SourceDaoCommittee], 'COMMITTEE', this.COMMITTEE)
  public getDividendContract = this.generateContract(abis, 'DIVIDEND', this.DIVIDEND)
  // public getInvestmentContract = this.generateContract(abis, 'INVESTMENT', this.INVESTMENT)
  public getLockupContract = this.generateContract(abis, 'LOCKUP', this.LOCKUP)
  public getMainContract = this.generateContract(abis, 'MAIN', this.MAIN)
  public getProjectContract = this.generateContract([...ISourceProject, ...ProjectManagement], 'PROJECT', this.PROJECT)
  public getNormalTokenContract = this.generateContract(abis, 'NORMAL_TOKEN', this.NORMAL_TOKEN)
  public getDevTokenContract = this.generateContract(abis, 'DEV_TOKEN', this.DEV_TOKEN)
  public getAcquiredContract = this.generateContract(abis, 'ACQUIRED', this.ACQUIRED)
}

export const contractService = new ContractService()




// // Export individual functions for backward compatibility if needed, or remove them if not.

