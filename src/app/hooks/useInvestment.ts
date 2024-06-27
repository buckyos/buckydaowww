import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'

export function useInvestment() {
  const [latestInvestment, setLatestInvestment] =
    useState<InvestmentResponseData | null>(null)

  useAsyncEffect(async () => {
    const resp = await fetch('/api/investment/latest')
    const result = await resp.json()
    setLatestInvestment(result.data)
    console.log('🍻 _latestInvestment :', result.data)
  }, [])

  return {
    latestInvestment: latestInvestment,
  }
}
