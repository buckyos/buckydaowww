'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, Input, Button, message, Spin } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import useContractStore from '@hooks/useContract'
import useUserStore from '@hooks/useUserStore'
import { extractMessage, transactionWait } from '@utils/index'
import { proposalSetExtraAndParams } from '@services/index'
import { fetchMembers } from '@services/index'

const ChangeCommitteeModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [committee, setCommittee] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const contract = useContractStore()
  const user = useUserStore()

  useAsyncEffect(async () => {
    if (!showModal) {
      return
    }
    setLoading(true)
    const data = await fetchMembers()
    setCommittee(data.data)
    setLoading(false)
  }, [showModal])

  const onChnageCommitteeProposal = async (values: StoreValue) => {
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
          onFinish={onChnageCommitteeProposal}
          className='mt-6'
          name=''
          style={{ width: '100%' }}
          autoComplete='off'
        >
          <div className='flex justify-center'>
            {loading && (
              <div className='flex-center py-10'>
                <Spin />
              </div>
            )}

            {committee.length > 0 && (
              <Form.List name='committee' initialValue={committee}>
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
                                  message: 'committee address is required',
                                },
                              ]}
                            >
                              <Input placeholder='Committee Address ' />
                            </Form.Item>

                            <MinusCircleOutlined
                              style={{ fontSize: '20px' }}
                              className='dynamic-delete-button mb-6 mr-6'
                              onClick={() => {
                                if (fields.length < 3) {
                                  message.error(
                                    'At least three committee members must be ensured.',
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
                        Add committee
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            )}
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
