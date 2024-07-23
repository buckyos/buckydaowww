'use client'
import Link from 'next/link'
import { useState, Fragment } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { message, Descriptions, Spin } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useAsyncEffect } from 'ahooks'
import dayjs from 'dayjs'
import WhitelistInvestmentModal from '@components/modal/WhitelistInvestmentModal'
import { getTwoStepInvestment } from '@services/index'
import { useCommittee, useUserStore } from '@hooks/index'
// import { getSymbol } from '@contracts/index'

// 投资列表(grid)
const WhitelistInvestments: React.FC<{ data: TwoStepInvestmentData[] }> = ({
  data,
}) => {
  return (
    <div className='grid grid-cols-1 gap-[18px] md:grid-cols-2'>
      {data.map((item, key) => {
        const items: DescriptionsProps['items'] = [
          {
            key: '1',
            label: 'Tx',
            children: <Link href={`invest/${item.id}`}>{item.txHash}</Link>,
          },
          { key: '2', label: 'ID', children: item.id },
          {
            label: 'Step 1 duration',
            children: dayjs(item.step1EndTime * 1000).format('YYYY-MM-DD'),
          },
          {
            label: 'Step 2 duration',
            children: dayjs(item.step2EndTime * 1000).format('YYYY-MM-DD'),
          },
          { key: '5', label: 'Token Address', children: item.tokenAddress },
          { key: '6', label: 'Token Amount', children: item.totalAmount },
          {
            key: '7',
            label: 'DAO Token Amount',
            children: item.daoTokenAmount,
          },
          {
            key: '8',
            label: 'Token Ratio',
            children: `${item.tokenRatio.daoAmount} = ${item.tokenRatio.tokenAmount}`,
          },
          { key: '9', label: 'Investment', children: item.investedAmount },
          { key: '10', label: 'Investor', children: item.investor },
        ]

        return (
          <Fragment key={key}>
            <Descriptions bordered items={items} column={1} />
          </Fragment>
        )
      })}
    </div>
  )
}

// main page
export default function InvestmentPage() {
  const user = useUserStore()
  const { isCommittee, isUnknown } = useCommittee(user.user)
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<TwoStepInvestmentData[]>([])
  const [loading, setLoading] = useState(false)

  useAsyncEffect(async () => {
    setLoading(true)
    const result = await getTwoStepInvestment()
    if (result.code === 0) {
      setData(result.data.items)
    }
    setLoading(false)
  }, [])

  const onShowCreateInvestmentModal = async () => {
    if (!user.isLogin()) {
      message.error('error: please login first')
      return
    }

    // 不需要委员会成员身份，但是如果没有限制，也会有问题
    // 后面再看看吧
    // if (isUnknown) {
    //   message.warning(
    //     'loading committee status from contract, please try again later',
    //   )
    //   return
    // }
    //
    // if (!isCommittee) {
    //   message.error('You are not a committee member')
    //   return
    // }
    setShowModal(true)
  }

  return (
    <>
      <WhitelistInvestmentModal
        showModal={showModal}
        setShowModal={setShowModal}
      />
      <h1 className='text-2xl mt-10'>Two-round whitelist investment</h1>

      <div className='flex items-center mt-10 gap-4'>
        <div
          onClick={onShowCreateInvestmentModal}
          className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
        >
          <PlusOutlined className='mr-1' />
          Create Investment
        </div>
      </div>

      <div className='mt-10'></div>

      <div className='flex-center'>
        {loading && <Spin>Loading...</Spin>}
        {!loading && data.length === 0 && <div>No data</div>}
        {!loading && data.length != 0 && <WhitelistInvestments data={data} />}
      </div>
    </>
  )
}
