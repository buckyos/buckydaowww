'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { Spin } from 'antd'
import { getSymbol, getDecimals } from '@contracts/index'
import { formatUnits } from 'ethers'

const TokenWithSymbol: React.FC<{
  tokenAddress: string
  totalAmount: string
  format?: boolean
}> = ({ tokenAddress, totalAmount, format = false }) => {
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState(0)
  const [loading, setLoading] = useState(false)
  useAsyncEffect(async () => {
    setLoading(true)

    const symbol = await getSymbol(tokenAddress)
    const tokenDecimals = await getDecimals(tokenAddress)

    setDecimals(tokenDecimals)
    setSymbol(symbol)
    setLoading(false)
  }, [tokenAddress, totalAmount])

  return (
    <div className='flex items-center gap-1'>
      <div>
        {format
          ? decimals == 0
            ? ''
            : formatUnits(totalAmount, decimals)
          : totalAmount}
      </div>
      {loading && <Spin></Spin>}
      {!loading && <div className='font-bold text-cyfs-green'>{symbol}</div>}
    </div>
  )
}

export default TokenWithSymbol
