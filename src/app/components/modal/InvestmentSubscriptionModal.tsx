'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, InputNumber, Button, message, Spin } from 'antd'
import { createWhitelistInvestment } from '@contracts/index'
import useContractStore from '@hooks/useContract'
import { extractMessage } from '@utils/index'

const InvestmentSubscriptionModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTx, setloadingTx] = useState(false)
  const contract = useContractStore()

  const onSubscribe = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)

    try {
      const result = await createWhitelistInvestment(values, contract)
      if (result) {
        message.success('Create Investment success')
        setShowModal(false)
      }
    } catch (e) {
      console.error('onCreateInvestment', e)
      message.error(extractMessage(e))
    }

    // setloadingTx(false)
    setIsSubmitting(false)
  }

  return (
    <Modal
      title='Create Whitelist Investment'
      width={800}
      open={showModal}
      onCancel={() => {
        setShowModal(false)
      }}
      footer={null}
    >
      <Spin tip='Waiting for confirmation...' spinning={loadingTx}>
        <Form
          onFinish={onSubscribe}
          className='mt-6'
          name='create-proposal'
          style={{ width: '100%' }}
          autoComplete='off'
        >
          <Form.Item
            name='tokenAmount'
            rules={[
              {
                required: true,
                message: 'Please input number of investment tokens',
              },
            ]}
          >
            <InputNumber min={1} placeholder='-' />
          </Form.Item>

          <div className='flex justify-center'>
            <Button loading={isSubmitting} type='primary' htmlType='submit'>
              Subscribe for Shares
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default InvestmentSubscriptionModal
