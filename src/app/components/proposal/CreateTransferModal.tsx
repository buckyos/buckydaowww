'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import TextArea from 'antd/es/input/TextArea'
import { StoreValue } from 'antd/es/form/interface'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { Modal, Form, Input, Button, message, Spin, InputNumber } from 'antd'
import useContractStore from '@hooks/useContract'
import useUserStore from '@hooks/useUserStore'
import { createReleaseToken, proposalSetparams } from '@services/index'
import dayjs from 'dayjs'
import { getAddress } from 'ethers'
import { unwrapUnits } from '@utils/numberConverter'
import { extractMessage } from '@utils/index'
import { getTokenContract } from '@contracts/index'

interface TokenDefined {
  address: string
  amounts: number
}

const CreateTransferModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contract = useContractStore()
  const user = useUserStore()

  const onCreateReleaseToken = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    const title = values.title
    const content = values.content

    if (title.length > 45) {
      setIsSubmitting(false)
      message.error('Title is too long', 5)
      return
    }

    const { address, amounts } = (values.token as TokenDefined[]).reduce(
      (result, value) => {
        result.address.push(getAddress(value.address))

        // token要处理精度
        // 合约接口按最小精度
        const amount = unwrapUnits(value.amounts, contract.decimals)
        result.amounts.push(amount)
        return result
      },
      { address: [] as string[], amounts: [] as bigint[] },
    )
    const tokenContract = await getTokenContract()
    // 7days
    const duration = 60 * 60 * 24 * 7

    let tx
    try {
      tx = await tokenContract.prepareReleaseTokens(duration, address, amounts)
    } catch (error) {
      let msg = extractMessage(error)
      message.error(`Create transfer failed[1][${msg}]`, 10)
      setIsSubmitting(false)
      return
    }

    const receipt = await tx.wait(1, 60000)
    console.log(
      '🍻 contract prepareReleaseTokens result :',
      tx,
      address,
      amounts,
    )

    if (receipt?.status !== 1) {
      console.warn('transaction status:', receipt?.status, tx)
      message.error(`Create transfer failed[3][${receipt?.status}]`)
      setIsSubmitting(false)
      return
    }
    // 访问后端
    console.log('🍻 receipt :', receipt)
    const result = await createReleaseToken(
      user.jwt,
      title,
      content,
      address,
      amounts.map((amount) => amount.toString()),
      receipt.hash,
    )
    console.log('🍻 createInvestmentExtra service result :', result)
    const setparamResult = await proposalSetparams(
      user.jwt,
      [address, amounts, 'releaseTokens'],
      receipt.hash,
    )
    console.log('🍻 proposalSetparams service result :', setparamResult)

    if (result.code !== 0) {
      message.error('Create transfer failed[4], please try again later')
    } else {
      message.success('Create transfer success')
      setShowModal(false)
    }

    setIsSubmitting(false)
  }

  let formListInitValues = [
    {
      address: '',
      amounts: '',
    },
  ]

  return (
    <Modal
      width={800}
      title='Create release token proposal'
      open={showModal}
      onCancel={() => {
        setShowModal(false)
      }}
      footer={null}
    >
      <Spin tip='Waiting for confirmation...' spinning={isSubmitting}>
        <Form
          onFinish={onCreateReleaseToken}
          className='mt-6'
          name='create-proposal'
          style={{ width: '100%' }}
          autoComplete='off'
          initialValues={{
            title:
              'Release token proposal [' + dayjs().format('YYYY-MM-DD') + ']',
          }}
        >
          <Form.Item
            name='title'
            rules={[{ required: true, message: 'Please input title ' }]}
          >
            <Input className='' placeholder='title' />
          </Form.Item>

          <Form.List name='token' initialValue={formListInitValues}>
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
                          <Input placeholder='Address ' />
                        </Form.Item>
                        <Form.Item
                          name={[name, 'amounts']}
                          className='w-full'
                          rules={[
                            {
                              required: true,
                              message: 'amount is required',
                            },
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder='release token amount'
                          />
                        </Form.Item>

                        <MinusCircleOutlined
                          style={{ fontSize: '20px' }}
                          className='dynamic-delete-button mb-6 mr-6'
                          onClick={() => {
                            if (fields.length <= 1) {
                              message.error('At least input one address')
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
                    Add one more address
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name='content'>
            <TextArea
              className=''
              placeholder='proposal'
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
          <div className='flex justify-center'>
            <Button loading={isSubmitting} type='primary' htmlType='submit'>
              Create Release Token Proposal
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default CreateTransferModal
