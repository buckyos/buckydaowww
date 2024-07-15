'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import { Breadcrumb, Descriptions, Spin, Tag } from 'antd'
import type { DescriptionsProps } from 'antd'
import _ from 'lodash'
import dayjs from 'dayjs'

import { getTwoStepInvestmentDetail } from '@services/index'
import InvestmentSubscriptionModal from '@components/modal/InvestmentSubscriptionModal'
import { useUserStore } from '@hooks/index'

const InvestDetailPageContent: React.FC<{
  data?: TwoStepInvestmentData
}> = ({ data }) => {
  if (!data) {
    return (
      <div className='flex-center pt-10'>
        <Spin />
      </div>
    )
  }

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: 'Tx',
      children: data.txHash,
    },
    { key: '2', label: 'ID', children: data.id },
    {
      key: '3',
      label: 'Step 1 duration',
      children: dayjs(data.step1EndTime).format('YYYY-MM-DD'),
    },
    {
      key: '4',
      label: 'Step 2 duration',
      children: dayjs(data.step2EndTime).format('YYYY-MM-DD'),
    },
    { key: '5', label: 'Token Address', children: data.tokenAddress },
    { key: '6', label: 'Token Amount', children: data.totalAmount },
    {
      key: '7',
      label: 'DAO Token Amount',
      children: data.daoTokenAmount,
    },
    {
      key: '8',
      label: 'Token Ratio',
      children: `${data.tokenRatio.daoAmount} = ${data.tokenRatio.tokenAmount}`,
    },
    { key: '9', label: 'Investment', children: data.investedAmount },
    { label: 'Investor', children: data.investor },
    {
      label: 'whitelist',
      children: (
        <div>
          {_.map(data.whitelist, (value, key) => {
            return (
              <div className='flex gap-2' key={key}>
                <div>
                  <Tag>address</Tag>
                  {key}
                </div>
                <div>
                  <Tag>percent</Tag>
                  {value[0]}
                </div>
                <div>
                  <Tag>subscribed</Tag>
                  {value[1]}
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
  ]

  return <Descriptions bordered items={items} column={1} />
}

// project detail page render fn
const InvestDetailPage = () => {
  const { id } = useParams()
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<TwoStepInvestmentData>()
  const { user } = useUserStore()
  const [isInvestor, setIsInvestor] = useState(false)

  const onSubscribe = async () => {
    setShowModal(true)
  }

  const onEndInvestment = async () => {}

  useAsyncEffect(async () => {
    if (typeof id == 'string' && id != '') {
      const result = await getTwoStepInvestmentDetail(id)
      console.log('🍻 result :', result)
      if (result.code == 0) {
        setData(result.data)

        const isInvestor = user.address == result.data.investor
        console.log('🍻 isInvestor :', isInvestor)
        setIsInvestor(isInvestor)
      }
    }
  }, [id, user])

  //
  return (
    <>
      <InvestmentSubscriptionModal
        showModal={showModal}
        setShowModal={setShowModal}
        data={data}
      />

      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href='/invest'>Investment</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{id}</Breadcrumb.Item>
      </Breadcrumb>

      <div className='mt-4'>
        {isInvestor && (
          <div className='flex items-center py-2'>
            <div>Investor can end the invest and get the dao token.</div>
            <div
              onClick={onEndInvestment}
              className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
            >
              End investment
            </div>
          </div>
        )}
      </div>

      <div className='py-2'>
        <InvestDetailPageContent data={data} />
      </div>

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
