'use client'
import useContractStore from '@hooks/useContract'
import { useLayoutEffect } from 'react'
import { fetchTokenInfo } from '@contracts/token'
import { getVersionSettlementInfo } from '@contracts/index'

export default function Fetcher() {
  const { update } = useContractStore((state) => ({
    update: state.update,
  }))

  // header 最前面的地方先获取合约地址
  useLayoutEffect(() => {
    getVersionSettlementInfo(4).then(result => {
      console.log('getVersionSettlementInfo', result)
      result.contributions.map((item)=> {
        console.log('result.contributions', item.contributor, item.hasClaim, item.value)
      })
    })

    fetchTokenInfo().then(result => {
      const token = result.dev
      update(token.totalSupply, token.totalReleased,result.normal.totalSupply, token.symbol, token.decimals)
    })
    // fetchToken()

    window.ethereum.request({ method: 'eth_chainId' }).then((chainId: any) => {
      console.log('当前连接的网络ID是：', chainId)
    })
  }, [])

  return <></>
}
