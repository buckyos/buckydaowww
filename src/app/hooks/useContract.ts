'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  contractProxyContract,
} from './function'

// 过期时间 5分钟
// const EXPIRATION_DURATION = 5 * 60 * 1000

const useContractStore = create<ContractStoreDefine>()(
  persist(
    (set, get) => ({
      totalSupply: 0,
      totalReleased: 0,
      totalUnreleased: 0,
      symbol: 'BDT',
      decimals: 18, // 默认值设置一个18
      expiration: 0,
      // fetch token's value in contract
      // TODO remove
      update(totalSupply: number, totalReleased: number, totalUnreleased: number, symbol: string, decimals: number) {
        // console.log('update useContractStore', totalSupply, totalReleased, totalUnreleased, symbol, decimals)
        set({
          totalSupply,
          totalReleased,
          totalUnreleased,
          symbol,
          decimals,
        })
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
export { contractProxyContract }
