'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import { Breadcrumb, Descriptions, Spin, Tag, Modal, message } from 'antd'
import type { DescriptionsProps } from 'antd'
import _ from 'lodash'
import dayjs from 'dayjs'

import { getTwoStepInvestmentDetail } from '@services/index'
import InvestmentSubscriptionModal from '@components/modal/InvestmentSubscriptionModal'
import { useUserStore, useContractStore } from '@hooks/index'
import { endInvestment, getAddressOfToken } from '@contracts/index'
import TokenWithSymbol from '@components/funding/TokenWithSymbol'

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

  const DAO_TOKEN_ADDRESS = getAddressOfToken()

  const items: DescriptionsProps['items'] = [
    {
      label: 'Tx',
      children: data.txHash,
    },
    {
      label: 'ID',
      children: data.id,
    },
    {
      label: 'Status',
      children: data.end ? <Tag>End</Tag> : <Tag>Processing</Tag>,
    },

    {
      label: 'Step 1 duration',
      children: dayjs(data.step1EndTime * 1000).format('YYYY-MM-DD'),
    },
    {
      label: 'Step 2 duration',
      children: dayjs(data.step2EndTime * 1000).format('YYYY-MM-DD'),
    },
    { key: '5', label: 'Token Address', children: data.tokenAddress },
    {
      key: '6',
      label: 'Token Amount',
      children: (
        <TokenWithSymbol
          totalAmount={data.totalAmount}
          tokenAddress={data.tokenAddress}
          format={true}
        />
      ),
    },
    {
      key: '7',
      label: 'DAO Token Amount',
      children: (
        <TokenWithSymbol
          totalAmount={data.daoTokenAmount}
          tokenAddress={DAO_TOKEN_ADDRESS}
        />
      ),
    },
    {
      key: '8',
      label: 'Token Ratio',
      children: (
        <div className='flex'>
          <TokenWithSymbol
            totalAmount={data.tokenRatio.daoAmount.toString()}
            tokenAddress={DAO_TOKEN_ADDRESS}
          />
          <div>=</div>
          <TokenWithSymbol
            totalAmount={data.tokenRatio.tokenAmount.toString()}
            tokenAddress={data.tokenAddress}
          />
        </div>
      ),
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
  const contract = useContractStore()

  const onSubscribe = async () => {
    if (data!.end) {
      message.info('Investment already end')
      return
    }

    setShowModal(true)
  }

  const onEndInvestment = async () => {
    if (data?.end) {
      message.info('Investment already end')
      return
    }

    Modal.confirm({
      title: 'Are you sure to end the investment?',
      onOk: async () => {
        console.log('🍻 onEndInvestment data :', data)
        // end investment
        if (data && data.id) {
          const result = await endInvestment(data.id.toString(), contract)
          if (result) {
            message.success('End investment success')
          }
        }
      },
    })
  }

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
          <div className='flex items-center py-2 gap-4'>
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
