'use client'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { useCommittee, useUserStore } from '@hooks/index'
import { message } from 'antd'
import { useAsyncEffect } from 'ahooks'
import WhitelistInvestmentModal from '@components/modal/WhitelistInvestmentModal'
import { getTwoStepInvestment } from '@services/index'

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

      <div className='grid grid-cols-1 gap-[18px] md:grid-cols-2'>
        {data.map((item) => (
          <div
            className='flex items-center border border-solid rounded-lg border-[#F0F0F0] p-4 cursor-pointer'
            aria-hidden
            key={item.id}
          >
            <div className='w-full flex flex-col gap-1'>
              <div>Tx hash: {item.txHash}</div>
              <div>Investment ID: {item.id}</div>
              <div>Step 1 duration: {item.step1EndTime}</div>
              <div>Step 2 duration: {item.step2EndTime}</div>
              <div>Token Address: {item.tokenAddress}</div>
              <div>Token Amount: {item.daoTokenAmount}</div>
              <div>
                Token Ratio: {item.tokenRatio.daoAmount} ={' '}
                {item.tokenRatio.tokenAmount}
              </div>

              <div>Investment {item.investedAmount}</div>
              <div>Investor {item.investor}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
