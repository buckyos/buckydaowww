'use client'
import { create } from 'zustand'
import { ethers } from 'ethers'
import { abis } from '@contracts/abis'
import { persist } from 'zustand/middleware'
import { message } from 'antd'
import { getContractInfo } from '@services/index'
// import { MetaMaskSDK } from '@metamask/sdk'
// import detectEthereumProvider from '@metamask/detect-provider'

interface ContractStoreDefine {
  chainId: number
  mainAddress: string
  tokenAddress: string
  committeeAddress: string
  projectAddress: string
  investmentAddress: string
  lockupAddress: string
  totalSupply: number
  totalReleased: number
  totalUnreleased: number
  symbol: string
  decimals: number
  expiration: number
  fetchContractAddress: () => Promise<void>
  fetchToken: () => Promise<any>
  getComitteeContract: () => Promise<ethers.Contract>
  getSignerComitteeContract: () => Promise<ethers.Contract>
  getInvestMentContract: () => Promise<ethers.Contract>
}

//
export async function getProvider() {
  if (window.ethereum) {
    try {
      //   const MMSDK = new MetaMaskSDK({
      //     dappMetadata: {
      //       name: 'Source Dao',
      //       url: window.location.host,
      //     },
      //   })
      //   await MMSDK.init()

      // const ethereum = MMSDK.getProvider()
      // console.log('🌍🌍🌍 useContractStore getProvider', ethereum)
      // const ethersProvider = new ethers.Web3Provider(provider)
      // let ethersProvider = new ethers.BrowserProvider(provider as any)
      // await ethereum.request({ method: 'eth_requestAccounts' })
      // await window.ethereum.enable()
      // const provider = new ethers.BrowserProvider(ethereum)
      const provider = new ethers.BrowserProvider(window.ethereum)
      return provider
    } catch (e) {
      message.error((e as any).toString())
      throw new Error('user reject connect wallet')
    }

    // const ethersProvider = new ethers.BrowserProvider(provider as any)
    // return ethersProvider
  } else {
    message.error('Please install MetaMask first')
    console.log('MetaMask not installed; using read-only defaults')
    throw new Error('MetaMask not installed; using read-only defaults')
    // let provider = ethers.getDefaultProvider()
    // return provider
  }
}

// 过期时间 5分钟
const EXPIRATION_DURATION = 5 * 60 * 1000

const useContractStore = create<ContractStoreDefine>()(
  persist(
    (set, get) => ({
      chainId: 0,
      mainAddress: '',
      tokenAddress: '',
      committeeAddress: '',
      projectAddress: '',
      investmentAddress: '',
      lockupAddress: '',
      totalSupply: 0,
      totalReleased: 0,
      totalUnreleased: 0,
      symbol: '',
      decimals: 0,
      expiration: 0,
      async fetchContractAddress() {
        const expiration = get().expiration
        // check expiration
        if (Date.now() > expiration && expiration !== 0) {
          return
        }
        const expirationSetter = Date.now() + EXPIRATION_DURATION

        // // 版本号
        // const projectAddress = get().projectAddress
        // if (projectAddress) {
        //   console.log('🌍🌍🌍 useContractStore already address')
        //   return
        // }
        //
        // fetch
        const result = await getContractInfo()
        console.log('🌍🌍🌍 useContractStore  fetch getContractInfo', result)
        set({
          chainId: result.chainId,
          mainAddress: result.main,
          tokenAddress: result.token,
          committeeAddress: result.committee,
          projectAddress: result.project,
          investmentAddress: result.investment,
          lockupAddress: result.lockup,
          expiration: expirationSetter,
        })
      },
      async getComitteeContract() {
        let provider = await getProvider()
        let address = get().committeeAddress
        const contract = new ethers.Contract(address, abis, provider)
        return contract
      },
      async getSignerComitteeContract() {
        let provider = await getProvider()
        let address = get().committeeAddress
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(address, abis, signer)
        return contract
      },

      async getInvestMentContract() {
        let provider = await getProvider()
        let address = get().investmentAddress

        const signer = await provider.getSigner()
        const contract = new ethers.Contract(address, abis, signer)
        return contract
      },
      // fetch token's value in contract
      async fetchToken() {
        let provider = await getProvider()
        const tokenAddress = get().tokenAddress

        const daoTokenContract = new ethers.Contract(
          tokenAddress,
          abis,
          provider,
        )
        const token = await Promise.all([
          daoTokenContract.totalSupply(),
          daoTokenContract.totalReleased(),
          daoTokenContract.totalUnreleased(),
          daoTokenContract.symbol(),
          daoTokenContract.decimals(),
        ])
        console.log(
          '🐼 useContractStore fetchToken info symbol decimals',
          token,
          parseInt(token[4]),
        )
        set({
          totalSupply: token[0],
          totalReleased: token[1],
          totalUnreleased: token[2],
          symbol: token[3],
          decimals: parseInt(token[4]),
        })
        return {
          totalSupply: token[0],
          totalReleased: token[1],
          totalUnreleased: token[2],
          symbol: token[3],
          decimals: parseInt(token[4]),
        }
      },
    }),
    {
      name: 'contract_address',
      // omit
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              !['totalSupply', 'totalReleased', 'totalUnreleased'].includes(
                key,
              ),
          ),
        ),
    },
  ),
)

export async function getTokenContract(address: string) {
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(address, abis, signer)
  return contract
}

export async function getProjectContract(contractStrore: ContractStoreDefine) {
  const address = contractStrore.projectAddress
  // console.log('🐼 getProjectContract', address)
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(address, abis, signer)
  return contract
}

// for upgrade contract
export async function contractProxyContract(contractProxyAddress: string) {
  let provider = await getProvider()
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(contractProxyAddress, abis, signer)
  return contract
}

export default useContractStore
