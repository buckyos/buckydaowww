'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import { Breadcrumb } from 'antd'
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

      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href='/invest'>Investment</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{id}</Breadcrumb.Item>
      </Breadcrumb>

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
