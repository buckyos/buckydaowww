'use client'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { useCommittee, useUserStore } from '@hooks/index'
import { message } from 'antd'
import WhitelistInvestmentModal from '@components/modal/WhitelistInvestmentModal'

export default function Investment() {
  const user = useUserStore()
  const { isCommittee, isUnknown } = useCommittee(user.user)
  const [showModal, setShowModal] = useState(false)

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
    </>
  )
}
