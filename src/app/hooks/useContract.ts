'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
// import { getContractInfo } from '@services/index'
import {
  getCommitteeContract,
  getInvestmentContract,
  getTokenContract,
} from '@contracts/index'

import {
  contractProxyContract,
  getProjectContract,
  getProvider,
} from './function'

// 过期时间 5分钟
// const EXPIRATION_DURATION = 5 * 60 * 1000

const useContractStore = create<ContractStoreDefine>()(
  persist(
    (set, get) => ({
      totalSupply: 0,
      totalReleased: 0,
      totalUnreleased: 0,
      symbol: '',
      decimals: 0,
      expiration: 0,
      async getSignerComitteeContract() {
        const contract = await getCommitteeContract()
        return contract
      },

      // 获取投资合约实例
      async getInvestMentContract() {
        const contract = await getInvestmentContract()
        return contract
      },

      // fetch token's value in contract
      async fetchToken() {
        const daoTokenContract = await getTokenContract()
        const token = await Promise.all([
          daoTokenContract.totalSupply(),
          daoTokenContract.totalReleased(),
          daoTokenContract.totalUnreleased(),
          daoTokenContract.symbol(),
          daoTokenContract.decimals(),
        ])

        // console.log( '🐼 useContractStore fetchToken info symbol decimals', token, parseInt(token[4]),)
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

export default useContractStore
export { contractProxyContract, getProjectContract, getProvider }
