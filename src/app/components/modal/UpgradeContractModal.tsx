import { Dispatch, SetStateAction, useState } from 'react'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, Input, Button, message, Spin } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import useUserStore from '@hooks/useUserStore'
import { showErrorMessage, transactionWait } from '@utils/index'
import { proposalSetExtraAndParams } from '@services/index'
import { contractService } from '@contracts/index'

const UpgradeContractModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const user = useUserStore()

  const onCreateProposal = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    const fn = async () => {
      const comitteeContract = await contractService.getCommitteeContract()
      const tx = await comitteeContract.prepareContractUpgrade(
        values.contractProxyAddress,
        values.implAddress,
      )

      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        console.warn('transaction status:', receipt?.status, tx)
        message.error(
          `Create upgrade contract proposal failed[3][${receipt?.status}]`,
        )
        return
      }
      const result = await proposalSetExtraAndParams(
        user.jwt,
        [values.contractProxyAddress, values.implAddress, 'upgradeContract'],
        values.title,
        values.content,
        receipt.hash,
      )
      if (result.code !== 0) {
        message.error(
          'Create upgrade contract proposal failed[4], please try again later',
        )
      } else {
        message.success('Create upgrade contract proposal success')
        setShowModal(false)
      }
    }

    try {
      await fn()
    } catch (e) {
      showErrorMessage(e, "Create proposal failed[1]")
    }

    setIsSubmitting(false)
  }

  return (
    <Modal
      title='Create upgrade contract proposal'
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
          <Form.Item
            name='contractProxyAddress'
            rules={[
              {
                required: true,
                message: 'contract proxy address  is required ',
              },
            ]}
          >
            <Input className='' placeholder='contract proxy address' />
          </Form.Item>

          <Form.Item
            name='implAddress'
            rules={[{ required: true, message: 'impl address is required ' }]}
          >
            <Input className='' placeholder='impl address' />
          </Form.Item>
          <Form.Item
            name='title'
            rules={[{ required: true, message: 'title  is required ' }]}
          >
            <Input className='' placeholder='proposal title' />
          </Form.Item>

          <Form.Item name='content'>
            <TextArea
              className=''
              placeholder='proposal content'
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>

          <div className='flex justify-center'>
            <Button loading={isSubmitting} type='primary' htmlType='submit'>
              Create Proposal
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default UpgradeContractModal
