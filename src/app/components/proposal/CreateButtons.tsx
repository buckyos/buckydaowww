'use client'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import CreateProposalModal from '@components/proposal/CreateProposalModal'
import CreateTransferModal from '@components/proposal/CreateTransferModal'
import { useCommittee, useUserStore } from '@hooks/index'
import { message } from 'antd'
import UpgradeContractModal from '@components/modal/UpgradeContractModal'

const CreateButtons = () => {
  const user = useUserStore()
  const [showModal, setShowModal] = useState(false)
  const [showTranferModal, setShowTranferModal] = useState(false)
  const [showUpgradeContractModal, setShowUpgradeContractModal] =
    useState(false)
  const { isCommittee } = useCommittee(user.user)

  const generateCheck = (fn: any) => {
    return () => {
      if (!user.isLogin()) {
        message.error('error: please login first')
        return
      }

      if (!isCommittee) {
        message.error('You are not a committee member')
        return
      }
      fn()
    }
  }

  const onShowCreateInvestmentModal = generateCheck(() => {
    setShowModal(true)
  })

  const onShowTranferModal = generateCheck(() => {
    setShowTranferModal(true)
  })

  const onShowUpgradeContractModal = generateCheck(() => {
    setShowUpgradeContractModal(true)
  })

  return (
    <>
      <div className='flex items-center mt-10 gap-4'>
        <div
          onClick={onShowCreateInvestmentModal}
          className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
        >
          <PlusOutlined className='mr-1' />
          Create Investment
        </div>

        <div
          onClick={onShowTranferModal}
          className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
        >
          <PlusOutlined className='mr-1' />
          Create Transfer
        </div>

        <div
          onClick={onShowUpgradeContractModal}
          className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
        >
          <PlusOutlined className='mr-1' />
          Upgrade Contract
        </div>
      </div>

      <CreateProposalModal showModal={showModal} setShowModal={setShowModal} />
      <CreateTransferModal
        showModal={showTranferModal}
        setShowModal={setShowTranferModal}
      />
      <UpgradeContractModal
        showModal={showUpgradeContractModal}
        setShowModal={setShowUpgradeContractModal}
      />
    </>
  )
}

export default CreateButtons
