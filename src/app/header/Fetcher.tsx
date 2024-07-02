'use client'
import useContractStore from '@hooks/useContract'
import { useLayoutEffect } from 'react'

export default function Fetcher() {
  const { fetchContractAddress, fetchToken } = useContractStore((state) => ({
    fetchContractAddress: state.fetchContractAddress,
    fetchToken: state.fetchToken,
  }))

  // header 最前面的地方先获取合约地址
  useLayoutEffect(() => {
    console.log('🍻 Fetcher: get global data')
    fetchContractAddress()
    fetchToken()

    window.ethereum.request({ method: 'eth_chainId' }).then((chainId: any) => {
      console.log('当前连接的网络ID是：', chainId)
    })
  }, [fetchContractAddress, fetchToken])

  return <></>
}
