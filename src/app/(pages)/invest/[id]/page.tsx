'use client'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import { getTwoStepInvestmentDetail } from '@services/index'

// project detail page render fn
const InvestDetailPage = () => {
  const { id } = useParams()
  useAsyncEffect(async () => {
    if (typeof id == 'string' && id != '') {
      const result = await getTwoStepInvestmentDetail(id)
      console.log('🍻 result :', result)
    }
  }, [id])

  //
  return (
    <>
      <div>invest ID {id}</div>
    </>
  )
}

export default InvestDetailPage
