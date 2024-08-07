'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { Spin } from 'antd'
import { getSymbol } from '@contracts/index'

const TokenWithSymbol: React.FC<{
  tokenAddress: string
  totalAmount: string
}> = ({ tokenAddress, totalAmount }) => {
  const [symbol, setSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  useAsyncEffect(async () => {
    setLoading(true)
    const symbol = await getSymbol(tokenAddress)
    setSymbol(symbol)
    setLoading(false)
  }, [tokenAddress, totalAmount])

  return (
    <div className='flex items-center gap-1'>
      <div>{totalAmount}</div>
      {loading && <Spin></Spin>}
      {!loading && <div className='font-bold text-cyfs-green'>{symbol}</div>}
    </div>
  )
}

export default TokenWithSymbol
