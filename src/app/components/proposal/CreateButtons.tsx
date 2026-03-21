'use client'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useBindWalletAddress, useCommittee, useUserStore } from '@hooks/index'
import UpgradeContractModal from '@components/modal/UpgradeContractModal'
import ChangeCommitteeModal from '@components/modal/ChangeCommitteeModal'

const CreateButtons = () => {
  const user = useUserStore()
  const { governanceAddress, hasActiveWallet, ensureAuthenticated } =
    useBindWalletAddress()
  const [showUpgradeContractModal, setShowUpgradeContractModal] =
    useState(false)
  const [showChangeCommitteeModal, setChangeCommitteeModal] = useState(false)
  const { isCommittee } = useCommittee(governanceAddress)

  const generateCheck = (fn: any) => {
    return async () => {
      if (!(await ensureAuthenticated({ requireWallet: true }))) {
        return
      }

      if (!hasActiveWallet) {
        message.error('Please connect your browser wallet first')
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
