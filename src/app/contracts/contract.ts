import { ethers } from 'ethers'
import { message } from 'antd'
import { abis } from '@contracts/abis'

class ContractService {
  private COMMITTEE = process.env.NEXT_PUBLIC_COMMITTEE
  private DIVIDEND = process.env.NEXT_PUBLIC_DIVIDEND
  private INVESTMENT = process.env.NEXT_PUBLIC_INVESTMENT
  private LOCKUP = process.env.NEXT_PUBLIC_LOCKUP
  private MAIN = process.env.NEXT_PUBLIC_MAIN
  private PROJECT = process.env.NEXT_PUBLIC_PROJECT
  private NORMAL_TOKEN = process.env.NEXT_PUBLIC_NORMAL_TOKEN
  private DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN
  private ACQUIRED = process.env.NEXT_PUBLIC_ACQUIRED
  private NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID

  private Contracts: { [key: string]: ethers.Contract | undefined } = {}

  constructor() {
    console.log('🔡 COMMITTEE contract address', this.COMMITTEE)
    console.log('🔡 DIVIDEND contract address', this.DIVIDEND)
    console.log('🔡 INVESTMENT contract address', this.INVESTMENT)
    console.log('🔡 LOCKUP contract address', this.LOCKUP)
    console.log('🔡 MAIN contract address', this.MAIN)
    console.log('🔡 PROJECT contract address', this.PROJECT)
    console.log('🔡 NORMAL_TOKEN contract address', this.NORMAL_TOKEN)
    console.log('🔡 DEV_TOKEN contract address', this.DEV_TOKEN)
    console.log('🔡 ACQUIRED contract address', this.ACQUIRED)
    console.log('🔡 NETWORK_ID contract address', this.NETWORK_ID)
  }

  public getAddressOfToken() {
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

  public getNetworkId() {
    if (!this.NETWORK_ID) throw new Error('NETWORK_ID is undefined')
    return this.NETWORK_ID
  }

  private async getProvider() {
    if (!window.ethereum) {
      message.error('Please install MetaMask first')
      console.log('MetaMask not installed; using read-only defaults')
      throw new Error('MetaMask not installed')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    console.log('provider', provider)

    await this.checkEthNetworkId(provider)

    return provider
  }

  private async checkEthNetworkId(ethProvider: ethers.BrowserProvider) {
    if (!ethProvider) return

    const chainId = await ethProvider
      .getNetwork()
      .then((network) => network.chainId.toString())

    const networkId = this.NETWORK_ID || '196'
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

  private generateContract(abi: any, key?: string, address?: string) {
    if (address === undefined) throw new Error('address is undefined')
    if (key === undefined) throw new Error('key is undefined')

    return async (): Promise<ethers.Contract> => {
      if (this.Contracts[key] !== undefined) {
        console.log('[', key, '] get contract instance ', address, 'from cache')
        return this.Contracts[key] as ethers.Contract
      }

      let provider = await this.getProvider()
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(address, abi, signer)
      console.log('[', key, '] contract initialized', address)

      this.Contracts[key] = contract
      return contract
    }
  }

  public getCommitteeContract = this.generateContract(abis, 'COMMITTEE', this.COMMITTEE)
  public getDividendContract = this.generateContract(abis, 'DIVIDEND', this.DIVIDEND)
  public getInvestmentContract = this.generateContract(abis, 'INVESTMENT', this.INVESTMENT)
  public getLockupContract = this.generateContract(abis, 'LOCKUP', this.LOCKUP)
  public getMainContract = this.generateContract(abis, 'MAIN', this.MAIN)
  public getProjectContract = this.generateContract(abis, 'PROJECT', this.PROJECT)
  public getTokenContract = this.generateContract(abis, 'NORMAL_TOKEN', this.NORMAL_TOKEN)
  public getDevTokenContract = this.generateContract(abis, 'DEV_TOKEN', this.DEV_TOKEN)
  public getAcquiredContract = this.generateContract(abis, 'ACQUIRED', this.ACQUIRED)
}

export const contractService = new ContractService()

// // Export individual functions for backward compatibility if needed, or remove them if not.
// export const getAddressOfToken = contractService.getAddressOfToken
// export const getAddressOfMain = contractService.getAddressOfMain
// export const getAddressOfLockup = contractService.getAddressOfLockup
// export const getNetworkId = contractService.getNetworkId
// export const getCommitteeContract = contractService.getCommitteeContract
// export const getDividendContract = contractService.getDividendContract
// export const getInvestmentContract = contractService.getInvestmentContract
// export const getLockupContract = contractService.getLockupContract
// export const getMainContract = contractService.getMainContract
// export const getProjectContract = contractService.getProjectContract
// export const getTokenContract = contractService.getTokenContract
