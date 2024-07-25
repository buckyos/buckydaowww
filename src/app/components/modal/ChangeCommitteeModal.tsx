import { Dispatch, SetStateAction, useState } from 'react'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, Input, Button, message, Spin } from 'antd'
import useContractStore from '@hooks/useContract'
import useUserStore from '@hooks/useUserStore'
import { extractMessage, transactionWait } from '@utils/index'
import { proposalSetExtraAndParams } from '@services/index'

const ChangeCommitteeModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contract = useContractStore()
  const user = useUserStore()

  const onCreateProposal = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    // const fn = async () => {
    //   const comitteeContract = await contract.getSignerComitteeContract()
    //   const tx = await comitteeContract.perpareContractUpgrade(
    //     values.contractProxyAddress,
    //     values.implAddress,
    //   )
    //
    //   const receipt = await transactionWait(tx)
    //   if (receipt?.status !== 1) {
    //     console.warn('transaction status:', receipt?.status, tx)
    //     message.error(
    //       `Create upgrade contract proposal failed[3][${receipt?.status}]`,
    //     )
    //     return
    //   }
    //   const result = await proposalSetExtraAndParams(
    //     user.jwt,
    //     [values.contractProxyAddress, values.implAddress, 'upgradeContract'],
    //     values.title,
    //     values.content,
    //     receipt.hash,
    //   )
    //   if (result.code !== 0) {
    //     message.error(
    //       'Create upgrade contract proposal failed[4], please try again later',
    //     )
    //   } else {
    //     message.success('Create upgrade contract proposal success')
    //     setShowModal(false)
    //   }
    // }

    try {
      // await fn()
    } catch (e) {
      let msg = extractMessage(e)
      message.error(`Create proposal failed[1][${msg}]`, 10)
    }

    setIsSubmitting(false)
  }

  return (
    <Modal
      title='Change committee proposal'
      open={showModal}
      onCancel={() => {
        setShowModal(false)
      }}
      footer={null}
    >
      <Spin tip='Waiting for confirmation...' spinning={isSubmitting}>
        <Form
          onFinish={onCreateProposal}
          className='mt-6'
          name=''
          style={{ width: '100%' }}
          autoComplete='off'
        >
          <div className='flex justify-center'>
            <Button loading={isSubmitting} type='primary' htmlType='submit'>
              Change Committee
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default ChangeCommitteeModal
