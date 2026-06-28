import { Button, Modal, Form, Input, message } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { Dispatch, SetStateAction, useState } from 'react'
import { useParams } from 'next/navigation'
import { updateProposalInfomation } from '@services/index'
import { useBindWalletAddress, useUserStore } from '@hooks/index'
import { extractMessage } from '@utils/index'

interface UpdateProposalModalProps {
  visible: boolean
  setVisible: Dispatch<SetStateAction<boolean>>
  fetchData: () => Promise<ProposalResponseData>
}

const UpdateProposalModal: React.FC<UpdateProposalModalProps> = ({
  visible,
  setVisible,
  fetchData,
}) => {
  const { proposalId } = useParams() as { proposalId: string }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { ensureAuthenticated } = useBindWalletAddress()

  const onUpdateProposal = async (values: any) => {
    setIsSubmitting(true)

    try {
      if (!(await ensureAuthenticated({ requireWallet: true }))) {
        return
      }

      const result = await updateProposalInfomation(
        proposalId,
        useUserStore.getState().jwt,
        values.title,
        values.content,
      )
      console.log('update result', result)
      if (result.code !== 0) {
        message.error('Failed to update proposal')
      } else {
        message.success('Update proposal successfully')
        setVisible(false)
        await fetchData()
      }
    } catch (error) {
      message.error(`Failed to update proposal[${extractMessage(error)}]`, 10)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title='Create proposal'
      open={visible}
      onCancel={() => {
        setVisible(false)
      }}
      footer={null}
    >
      <Form
        onFinish={onUpdateProposal}
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
        <Form.Item name='content'>
          <TextArea
            className=''
            placeholder='proposal'
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <div className='flex justify-center'>
          <Button loading={isSubmitting} type='primary' htmlType='submit'>
            Update Proposal Infomation
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default UpdateProposalModal
