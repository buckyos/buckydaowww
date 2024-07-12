'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { StoreValue } from 'antd/es/form/interface'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  message,
  Spin,
  Checkbox,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { createWhitelistInvestment } from '@contracts/index'
import useContractStore from '@hooks/useContract'
import { extractMessage } from '@utils/index'

// 禁止选择今天之前的日期
function disabledDate(current: Dayjs) {
  // Can not select days before today and today
  // console.log('current :', current, dayjs().startOf('day'))
  return current && current <= dayjs().startOf('day')
}

const WhitelistInvestmentModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTx, setloadingTx] = useState(false)
  const contract = useContractStore()

  // 创建白名单投资
  const onCreateInvestment = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    setloadingTx(true)

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

    setIsSubmitting(false)
    setloadingTx(false)
  }

  let formListInitValues = [
    {
      address: '',
      percent: '',
    },
  ]

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
          onFinish={onCreateInvestment}
          className='mt-6'
          name='create-proposal'
          style={{ width: '100%' }}
          autoComplete='off'
        >
          <Form.List name='whitelist' initialValue={formListInitValues}>
            {(fields, { add, remove }) => (
              <>
                <div>
                  {fields.map(({ key, name }, index) => {
                    return (
                      <div
                        key={key}
                        className='flex items-center justify-between gap-10'
                      >
                        <Form.Item
                          className='w-full'
                          name={[name, 'address']}
                          rules={[
                            {
                              required: true,
                              message: 'address is required',
                            },
                          ]}
                        >
                          <Input placeholder='Whitelist address' />
                        </Form.Item>
                        <Form.Item
                          name={[name, 'percent']}
                          className='w-full'
                          rules={[
                            {
                              required: true,
                              message: 'percent is required',
                            },
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder='The percent of target address can take '
                          />
                        </Form.Item>

                        <MinusCircleOutlined
                          style={{ fontSize: '20px' }}
                          className='dynamic-delete-button mb-6 mr-6'
                          onClick={() => {
                            if (fields.length <= 1) {
                              message.error(
                                'At least input one whitelist address',
                              )
                            } else {
                              remove(index)
                            }
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                <Form.Item>
                  <Button onClick={() => add()} icon={<PlusOutlined />}>
                    Add one more whitelist address
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name='tokenAddress'
            rules={[
              {
                required: true,
                message: 'Please input token address',
              },
            ]}
          >
            <Input className='' placeholder="investor's token address" />
          </Form.Item>

          <Form.Item
            name='tokenAmount'
            rules={[
              {
                required: true,
                message: 'Please input number of investment tokens',
              },
            ]}
          >
            <Input className='' placeholder='Number of investment tokens ' />
          </Form.Item>

          <div className='flex justify-between'>
            <label className='mt-1'>exchange rate</label>
            <div className='flex '>
              <Form.Item
                name='daoTokenAmount'
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
                name='assetTokenAmount'
                rules={[
                  {
                    required: true,
                    message: 'rate is required',
                  },
                ]}
              >
                <InputNumber min={1} className='w-36' placeholder='-' />
              </Form.Item>
            </div>
          </div>

          <Form.Item
            name='endTime'
            rules={[
              {
                required: true,
                message: 'Please input investment end time ',
              },
            ]}
          >
            <DatePicker
              className='w-full'
              placeholder='Investment end time'
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            name='endTime2'
            rules={[
              {
                required: true,
                message: 'Please input second end time ',
              },
            ]}
          >
            <DatePicker
              className='w-full'
              placeholder='Investment second end time'
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            name='canEndEarly'
            label='Could terminated early'
            rules={[
              {
                required: true,
                message: '',
              },
            ]}
          >
            <Checkbox className='' defaultChecked={true} />
          </Form.Item>

          <div className='flex justify-center'>
            <Button loading={isSubmitting} type='primary' htmlType='submit'>
              Create Investment
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default WhitelistInvestmentModal
