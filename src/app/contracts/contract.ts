import { ethers, Interface, InterfaceAbi } from 'ethers'
import { message } from 'antd'
import { abis, ISourceProject, ProjectManagement, SourceDaoCommittee } from '@contracts/abis'

const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

/**
 * 检查浏览器是否安装了以太坊钱包插件
 * @returns {boolean} 如果安装了钱包插件返回true，否则返回false
 */
function getInjectedProvider() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const injectedProvider = window.ethereum
  if (!injectedProvider || typeof injectedProvider.request !== 'function') {
    return undefined
  }

  return injectedProvider
}

function getExpectedNetworkId() {
  return NETWORK_ID || '10'
}

function getExpectedChainIdHex() {
  return `0x${Number(getExpectedNetworkId()).toString(16)}`
}

function getDefaultRpcUrl(networkId: string) {
  switch (networkId) {
    case '10':
      return 'https://mainnet.optimism.io'
    case '11155420':
      return 'https://sepolia.optimism.io'
    case '1':
      return 'https://ethereum.publicnode.com'
    case '5':
      return 'https://ethereum-goerli.publicnode.com'
    default:
      return ''
  }
}

export function isBrowserHasWallet(): boolean {
  try {
    return !!getInjectedProvider()
  } catch (error) {
    console.warn('检查钱包插件时发生错误:', error);
    return false;
  }
}

let readOnlyProvider: ethers.JsonRpcProvider | undefined
let browserProvider: ethers.BrowserProvider | undefined
let walletListenersBound = false

function clearWalletDerivedState() {
  browserProvider = undefined
  contractService.clearCachedContracts()
  if (typeof window !== 'undefined') {
    localStorage.removeItem('committee-type')
  }
}

function bindWalletEvents() {
  if (walletListenersBound) {
    return
  }

  const injectedProvider = getInjectedProvider()
  if (!injectedProvider || typeof injectedProvider.on !== 'function') {
    return
  }

  injectedProvider.on('accountsChanged', () => {
    clearWalletDerivedState()
  })

  injectedProvider.on('chainChanged', () => {
    clearWalletDerivedState()
  })

  walletListenersBound = true
}

export function getReadOnlyProvider() {
  if (!readOnlyProvider) {
    const rpcUrl = RPC_URL || getDefaultRpcUrl(getExpectedNetworkId())
    if (!rpcUrl) {
      throw new Error('Readonly RPC URL is not configured')
    }

    readOnlyProvider = new ethers.JsonRpcProvider(
      rpcUrl,
      Number(getExpectedNetworkId()),
    )
  }

  return readOnlyProvider
}

export async function getProvider() {
  const injectedProvider = getInjectedProvider()
  if (!injectedProvider) {
    message.info('No compatible browser wallet was detected')
    return false
  }

  bindWalletEvents()

  if (!browserProvider) {
    browserProvider = new ethers.BrowserProvider(injectedProvider)
  }

  browserProvider = await checkEthNetworkId(browserProvider, injectedProvider)
  return browserProvider
}

async function checkEthNetworkId(
  ethProvider: ethers.BrowserProvider,
  injectedProvider: any,
) {
  if (!ethProvider) return

  const chainId = await ethProvider
    .getNetwork()
    .then((network) => network.chainId.toString())

  const networkId = getExpectedNetworkId()
  const hexStringWithPrefix = getExpectedChainIdHex()
  console.log('current network chainId', chainId, networkId, hexStringWithPrefix)
  if (chainId !== networkId) {
    message.info('Current network is not correct, attempting to switch...')
    try {
      const result = await injectedProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexStringWithPrefix }],
      })
      console.log('wallet_switchEthereumChain result', result)
      clearWalletDerivedState()
      return new ethers.BrowserProvider(injectedProvider)
    } catch (error: any) {
      if (error?.code === 4902) {
        message.error('The configured chain is not added in the wallet')
      } else {
        message.error('Please switch to the configured network in your wallet')
      }
      throw error
    }
  }

  return ethProvider
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
  const provider = getReadOnlyProvider()
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

  public clearCachedContracts() {
    this.Contracts = {}
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

  // BDT
  public getNormalTokenContract = this.generateContract(abis, 'NORMAL_TOKEN', this.NORMAL_TOKEN)

  // BDDT
  public getDevTokenContract = this.generateContract(abis, 'DEV_TOKEN', this.DEV_TOKEN)
  public getAcquiredContract = this.generateContract(abis, 'ACQUIRED', this.ACQUIRED)
}

export const contractService = new ContractService()




// // Export individual functions for backward compatibility if needed, or remove them if not.
