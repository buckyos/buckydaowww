'use client'
import { useState, Fragment } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { useCommittee, useUserStore } from '@hooks/index'
import { message, Descriptions } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useAsyncEffect } from 'ahooks'
import WhitelistInvestmentModal from '@components/modal/WhitelistInvestmentModal'
import { getTwoStepInvestment } from '@services/index'

const WhitelistInvestments: React.FC<{ data: TwoStepInvestmentData[] }> = ({
  data,
}) => {
  return (
    <div className='grid grid-cols-1 gap-[18px] md:grid-cols-2'>
      {data.map((item, key) => {
        const items: DescriptionsProps['items'] = [
          { key: '1', label: 'Tx', children: item.txHash },
          { key: '2', label: 'ID', children: item.id },
          { key: '3', label: 'Step 1 duration', children: item.step1EndTime },
          { key: '4', label: 'Step 2 duration', children: item.step2EndTime },
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

export default function Investment() {
  const user = useUserStore()
  const { isCommittee, isUnknown } = useCommittee(user.user)
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<TwoStepInvestmentData[]>([])

  useAsyncEffect(async () => {
    const result = await getTwoStepInvestment()
    if (result.code === 0) {
      setData(result.data.items)
    }
  }, [])

  const onShowCreateInvestmentModal = async () => {
    if (!user.isLogin()) {
      message.error('error: please login first')
      return
    }
    if (isUnknown) {
      message.warning(
        'loading committee status from contract, please try again later',
      )
      return
    }

    if (!isCommittee) {
      message.error('You are not a committee member')
      return
    }
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

      <WhitelistInvestments data={data} />
    </>
  )
}
