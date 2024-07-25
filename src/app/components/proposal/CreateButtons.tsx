'use client'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useCommittee, useUserStore } from '@hooks/index'
import CreateProposalModal from '@components/proposal/CreateProposalModal'
import CreateTransferModal from '@components/proposal/CreateTransferModal'
import UpgradeContractModal from '@components/modal/UpgradeContractModal'
import ChangeCommitteeModal from '@components/modal/ChangeCommitteeModal'

const CreateButtons = () => {
  const user = useUserStore()
  const [showModal, setShowModal] = useState(false)
  const [showTranferModal, setShowTranferModal] = useState(false)
  const [showUpgradeContractModal, setShowUpgradeContractModal] =
    useState(false)
  const [showChangeCommitteeModal, setChangeCommitteeModal] = useState(false)
  const { isCommittee } = useCommittee(user.user)

  const generateCheck = (fn: any) => {
    return () => {
      if (!user.isLogin()) {
        message.error('error: please login first')
        return
      }

      if (!isCommittee) {
        message.error(
          'Proposals of the current type need to be initiated by the committee',
        )
        return
      }
      fn()
    }
  }

  // 创建投资提案
  const onShowCreateInvestmentModal = generateCheck(() => {
    setShowModal(true)
  })

  // 分配token提案
  const onShowTranferModal = generateCheck(() => {
    setShowTranferModal(true)
  })

  // 升级合约提案
  const onShowUpgradeContractModal = generateCheck(() => {
    setShowUpgradeContractModal(true)
  })

  // 变更委员会成员提案
  const onShowChangeCommitteeModal = generateCheck(() => {
    setChangeCommitteeModal(true)
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

        <div
          onClick={onShowChangeCommitteeModal}
          className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
        >
          <PlusOutlined className='mr-1' />
          Change Committee
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
      <ChangeCommitteeModal
        showModal={showChangeCommitteeModal}
        setShowModal={setChangeCommitteeModal}
      />
    </>
  )
}

export default CreateButtons
