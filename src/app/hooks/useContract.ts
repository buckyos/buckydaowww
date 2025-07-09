'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
// import { getContractInfo } from '@services/index'
import {
  contractService,
} from '@contracts/index'

import {
  contractProxyContract,
  // getProjectContract,
  // getProvider,
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
      // fetch token's value in contract
      // TODO remove
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
