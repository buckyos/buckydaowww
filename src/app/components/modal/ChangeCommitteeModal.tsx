'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import TextArea from 'antd/es/input/TextArea'
import { useAsyncEffect } from 'ahooks'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, Input, Button, message, Spin, Switch } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useUserStore } from '@hooks/index'
import { extractMessage } from '@utils/index'
import { fetchMembers } from '@services/index'
import { chnageCommitteeProposal } from '@contracts/index'
import _ from 'lodash'

const ChangeCommitteeModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [committee, setCommittee] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    // 检查委员会地址不重复
    const addresses = (values.committee as CommitteeMember[]).map(
      (item) => item.address,
    )
    const hasDuplicates = _.uniq(addresses).length !== addresses.length
    if (hasDuplicates) {
      message.error('Committee address cannot be repeated')
      return
    }

    // 检查委员会成员数量
    // if (addresses.length < 3) {
    //   message.error('At least three committee members must be ensured.')
    //   return
    // }

    setIsSubmitting(true)

    try {
      // 提交委员会变更提案
      const isOk = await chnageCommitteeProposal(values, user.jwt)
      if (isOk) {
        message.success(
          'Change committee proposal submitted successfully, reloading...',
        )
        setTimeout(() => {
          setShowModal(false)
        }, 1500)
      }
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
          <Form.Item
            name='title'
            rules={[{ required: true, message: 'Please input title ' }]}
          >
            <Input className='' placeholder='title' />
          </Form.Item>

          <Form.Item name='content'>
            <TextArea
              className=''
              placeholder='proposal'
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>

          {loading && (
            <div className='flex-center py-10'>
              <Spin />
            </div>
          )}

          {committee.length > 0 && (
            <Form.List
              name='committee'
              initialValue={committee.map((item) => ({
                address: item.address,
              }))}
            >
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

          <Form.Item
            name="isFullProposal"
            label="Enable full voting"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Enable"
              unCheckedChildren="Disable"
              defaultChecked={false}
            />
          </Form.Item>

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
