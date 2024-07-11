'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import { getTwoStepInvestmentDetail } from '@services/index'
import InvestmentSubscriptionModal from '@components/modal/InvestmentSubscriptionModal'

// project detail page render fn
const InvestDetailPage = () => {
  const { id } = useParams()
  const [showModal, setShowModal] = useState(false)

  useAsyncEffect(async () => {
    if (typeof id == 'string' && id != '') {
      const result = await getTwoStepInvestmentDetail(id)
      console.log('🍻 result :', result)
    }
  }, [id])

  const onSubscribe = async () => {}

  //
  return (
    <>
      <InvestmentSubscriptionModal
        showModal={showModal}
        setShowModal={setShowModal}
      />

      <div>invest ID {id}</div>

      <div className='flex-center'>
        <div className='flex items-center mt-10 gap-4'>
          <div
            onClick={onSubscribe}
            className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
          >
            Subscribe
          </div>
        </div>
      </div>
    </>
  )
}

export default InvestDetailPage
