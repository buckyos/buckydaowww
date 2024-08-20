'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import TextArea from 'antd/es/input/TextArea'
import { StoreValue } from 'antd/es/form/interface'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  message,
  Spin,
} from 'antd'
import useContractStore from '@hooks/useContract'
import { unwrapUnits, parseToBigInt } from '@utils/numberConverter'
import { toBigInt } from 'ethers'
import dayjs from 'dayjs'
import useUserStore from '@hooks/useUserStore'
import { createInvestmentExtra } from '@services/index'

import { getAddressOfMain } from '@contracts/index'

enum InvestmentPriceType {
  Fixed, // 固定价格融资
  Floating, // 浮动价格融资
}

const CreateProposalModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTx, setloadingTx] = useState(false)
  const contract = useContractStore()
  const user = useUserStore()

  const onCreateProposal = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    const mainAddress = getAddressOfMain()
    const proposalDuration = values.proposalDuration * 24 * 60 * 60
    const daoTokenDecimals = contract.decimals
    const assetTokenDecimals = 18
    const totalTokenAmount = unwrapUnits(
      values.totalTokenAmount,
      daoTokenDecimals,
    )
    const goalAssetAmount = parseToBigInt(
      unwrapUnits(values.goalAssetAmount, assetTokenDecimals),
    )
    const priceType = InvestmentPriceType.Fixed
    const tokenExchangeRate = parseToBigInt(
      unwrapUnits(values.tokenExchangeRate, daoTokenDecimals),
    )
    const assetExchangeRate = parseToBigInt(
      unwrapUnits(values.assetExchangeRate, assetTokenDecimals),
    )
    const startTime = 0n // 0: 投票结束后可以直接开始融资
    const endTime = toBigInt(dayjs(values.endTime).unix())
    const onlyWhitelist = true
    // TODO
    const minAssetPerInvestor = 500000n
    const maxAssetPerInvestor = 1000000n
    const title = values.title
    const content = values.content

    // 判断货币转换后的数量 totalTokenAmount >= goalAssetAmount
    if (
      (totalTokenAmount * assetExchangeRate) / tokenExchangeRate <
      goalAssetAmount
    ) {
      message.warning('Total amount must greater than Target amount')
      setIsSubmitting(false)
      return
    }

    // 访问合约,创建投资
    const investmentData: InvestmentParamsDefine = {
      totalTokenAmount,
      priceType,
      tokenExchangeRate,
      assetExchangeRate,
      startTime,
      endTime,
      minAssetPerInvestor,
      maxAssetPerInvestor,
      goalAssetAmount,
      assetAddress: mainAddress,
      onlyWhitelist,
    }
    setloadingTx(true)
    console.log('🍻 investmentData :', investmentData)
    const investmentContract = await contract.getInvestMentContract()
    const tx = await investmentContract.createInvestment(
      proposalDuration,
      investmentData,
    )
    console.log('🍻 contract createInvestment result :', tx)

    const receipt = await tx.wait(1, 60000)

    if (receipt?.status !== 1) {
      console.warn('transaction status:', receipt?.status, tx)
      message.error(`Create Investment failed[3][${receipt?.status}]`)
      setloadingTx(false)
      setIsSubmitting(false)
      return
    }
    // 访问后端
    console.log('🍻 receipt :', receipt)
    const result = await createInvestmentExtra(
      user.jwt,
      title,
      content,
      receipt.hash,
    )
    console.log('🍻 createInvestmentExtra service result :', result)

    if (result.code !== 0) {
      message.error('Create Investment failed[4], please try again later')
    } else {
      message.success('Create Investment success')
      setShowModal(false)
    }

    setloadingTx(false)
    setIsSubmitting(false)
  }

  return (
    <Modal
      title='Create proposal'
      open={showModal}
      onCancel={() => {
        setShowModal(false)
      }}
      footer={null}
    >
      <Spin tip='Waiting for confirmation...' spinning={loadingTx}>
        <Form
          onFinish={onCreateProposal}
          className='mt-6'
          name='create-proposal'
          style={{ width: '100%' }}
          autoComplete='off'
          initialValues={{
            category: 'investment',
            remember: true,
          }}
        >
          <Form.Item
            name='title'
            rules={[{ required: true, message: 'Please input title ' }]}
          >
            <Input className='' placeholder='title' />
          </Form.Item>
          <Form.Item name='category'>
            <Input className='' disabled />
          </Form.Item>

          <Form.Item
            name='proposalDuration'
            rules={[
              {
                required: true,
                message: 'Please input duration of proposal ',
              },
            ]}
          >
            <InputNumber
              min={1}
              className='w-full'
              placeholder='duration of proposal'
              addonAfter='Days'
            />
          </Form.Item>
          <Form.Item
            name='endTime'
            rules={[
              {
                required: true,
                message: 'Please input investment end time ',
              },
            ]}
          >
            <DatePicker className='w-full' placeholder='Investment end time' />
          </Form.Item>
          <Form.Item
            name='goalAssetAmount'
            rules={[
              {
                required: true,
                message: 'Please input target fundarising amount',
              },
            ]}
          >
            <Input
              className=''
              placeholder='Target fundarising amount'
              addonAfter='USDT'
            />
          </Form.Item>

          <Form.Item
            name='totalTokenAmount'
            rules={[
              {
                required: true,
                message: 'Please input number of investment tokens',
              },
            ]}
          >
            <Input
              className=''
              placeholder='Number of investment tokens (greater than Target)'
              addonAfter='CDT'
            />
          </Form.Item>

          <div className='flex justify-between'>
            <label className='mt-1'>exchange rate</label>
            <div className='flex '>
              <Form.Item
                name='tokenExchangeRate'
                rules={[
                  {
                    required: true,
                    message: 'rate is required',
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  className='w-36'
                  placeholder='-'
                  addonAfter={contract.symbol}
                />
              </Form.Item>
              <span className='mx-3 mt-1'>=</span>

              <Form.Item
                name='assetExchangeRate'
                rules={[
                  {
                    required: true,
                    message: 'rate is required',
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  className='w-36'
                  placeholder='-'
                  addonAfter='USDT'
                />
              </Form.Item>
            </div>
          </div>
          <Form.Item name='content'>
            <TextArea
              className=''
              placeholder='proposal'
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

export default CreateProposalModal
