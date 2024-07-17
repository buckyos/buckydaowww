'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, InputNumber, Button, message, Spin } from 'antd'
import { subscribeInvestmentShare, getSymbol } from '@contracts/index'
import { useContractStore, useUserStore } from '@hooks/index'
import { extractMessage } from '@utils/index'
import { parseInt } from 'lodash'

// 计算最大可认购的token数量
function countMaxTokenAmount(data: TwoStepInvestmentData, address: string) {
  let maxTokenAmount = 0
  const now = Date.now()
  const totalAmount = parseInt(data.totalAmount)

  if (now < data.step1EndTime) {
    const currentUser = data.whitelist[address]
    const percent = currentUser[0]
    const hadSubscribe = parseInt(currentUser[1])
    // still in step 1, check limit first.
    maxTokenAmount = (totalAmount * percent) / 100 - hadSubscribe
  } else {
    maxTokenAmount = totalAmount - parseInt(data.investedAmount)
  }

  let maxDaoTokenAmount =
    (maxTokenAmount * data.tokenRatio.daoAmount) / data.tokenRatio.tokenAmount

  return maxDaoTokenAmount
}

// 认购投资份额 弹窗
const InvestmentSubscriptionModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
  data?: TwoStepInvestmentData
}> = ({ showModal, setShowModal, data }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTx, setloadingTx] = useState(false)
  const contract = useContractStore()
  const [maxTokenAmount, setMaxTokenAmount] = useState(0)
  const { user } = useUserStore()
  const [symbol, setSymbol] = useState('')

  useAsyncEffect(async () => {
    if (!data || !user.address) {
      return
    }
    console.log('🍻 cout max token amount data :', data)

    const maxDaoTokenAmount = countMaxTokenAmount(data, user.address)
    setMaxTokenAmount(maxDaoTokenAmount)

    // 获取投资token的symbol
    const symbol = await getSymbol(contract.tokenAddress)
    setSymbol(symbol)
  }, [data, user])

  // 认购投资份额
  const onSubscribe = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    setloadingTx(true)

    try {
      const result = await subscribeInvestmentShare(
        values,
        contract,
        data!.id.toString(),
      )
      if (result) {
        message.success('Create Investment success')
        setShowModal(false)
      }
    } catch (e) {
      console.error('onCreateInvestment', e)
      message.error(extractMessage(e))
    }

    setloadingTx(false)
    setIsSubmitting(false)
  }

  if (!data) {
    return null
  }

  return (
    <Modal
      title='Subscribe Investment Shares'
      width={800}
      open={showModal}
      onCancel={() => {
        setShowModal(false)
      }}
      footer={null}
    >
      <div>
        The max remaining token you can subscribe to is
        {maxTokenAmount} {contract.symbol}
      </div>
      <div>
        1 {contract.symbol} = {data.tokenRatio.daoAmount} {symbol}
      </div>
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
            label='Subscribe Shares'
            rules={[
              {
                required: true,
                message: 'Please input number of tokens',
              },
            ]}
          >
            <InputNumber
              className='w-72'
              min={0}
              max={maxTokenAmount}
              placeholder='Input number of token to subscribe the investment shares'
            />
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
