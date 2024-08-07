'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { Spin } from 'antd'
import { getSymbol } from '@contracts/index'

const InvestDetailTokenDescription: React.FC<{
  data: TwoStepInvestmentData
}> = ({ data }) => {
  const [symbol, setSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  useAsyncEffect(async () => {
    setLoading(true)
    const symbol = await getSymbol(data.tokenAddress)
    setSymbol(symbol)
    setLoading(false)
  }, [data])
  return (
    <div className='flex-center gap-1'>
      <div>{data.totalAmount}</div>
      {loading && <Spin></Spin>}
      {!loading && <div>{symbol}</div>}
    </div>
  )
}

export default InvestDetailTokenDescription
