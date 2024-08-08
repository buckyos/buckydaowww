'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, InputNumber, Button, message, Spin } from 'antd'
import {
  subscribeInvestmentShare,
  // getSymbol,
  getDecimals,
  getAddressOfToken,
} from '@contracts/index'
import { useContractStore, useUserStore } from '@hooks/index'
import { extractMessage } from '@utils/index'
import { parseInt } from 'lodash'
import { formatUnits, parseUnits, toBigInt } from 'ethers'
import TokenWithSymbol from '@components/funding/TokenWithSymbol'

// 计算最大可认购的token数量
async function countMaxTokenAmount(
  token: string,
  data: TwoStepInvestmentData,
  address: string,
) {
  let maxTokenAmount = 0n
  const now = Date.now()
  const tokenDecimals = await getDecimals(data.tokenAddress)
  const totalAmount = parseUnits(token, tokenDecimals)

  //计算占百分比
  if (now < data.step1EndTime * 1000 /* 处理UTC  */) {
    const currentUser = data.whitelist[address]
    const percent = toBigInt(currentUser[0] / 100) // 百分比的精度是10000
    const hadSubscribe = parseUnits(currentUser[1], tokenDecimals)
    // still in step 1, check limit first.
    console.log('🍻 countMaxTokenAmount :', totalAmount, percent, hadSubscribe)
    maxTokenAmount = (totalAmount * percent) / 100n - hadSubscribe
  } else {
    maxTokenAmount = totalAmount - toBigInt(data.investedAmount)
  }

  // to number
  const maxTokenAmountNumber = Number(
    formatUnits(maxTokenAmount, tokenDecimals),
  )

  // 计算兑换比例
  let maxDaoTokenAmount =
    (maxTokenAmountNumber * data.tokenRatio.daoAmount) /
    data.tokenRatio.tokenAmount

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

  const DAO_TOKEN_ADDRESS = getAddressOfToken()

  useAsyncEffect(async () => {
    if (!data || !user.address) {
      return
    }
    console.log('🍻 cout max token amount data :', data)
    const tokenDecimals = await getDecimals(data.tokenAddress)

    const maxDaoTokenAmount = await countMaxTokenAmount(
      formatUnits(data.totalAmount, tokenDecimals),
      data,
      user.address,
    )
    setMaxTokenAmount(maxDaoTokenAmount)

    // 获取投资token的symbol
  }, [data, user])

  // 认购投资份额
  const onSubscribe = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    setloadingTx(true)

    try {
      const result = await subscribeInvestmentShare(
        values,
        data!.id.toString(),
        user.address,
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
        The max remaining token you can subscribe to is {maxTokenAmount}{' '}
        {contract.symbol}
      </div>

      <div className='flex mt-2'>
        <TokenWithSymbol
          totalAmount={data.tokenRatio.daoAmount.toString()}
          tokenAddress={DAO_TOKEN_ADDRESS}
        />
        <div>=</div>
        <TokenWithSymbol
          totalAmount={data.tokenRatio.tokenAmount.toString()}
          tokenAddress={data.tokenAddress}
        />
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
            className='flex items-center gap-2'
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
            <div>BDT</div>
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
