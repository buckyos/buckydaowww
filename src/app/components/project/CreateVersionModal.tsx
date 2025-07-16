import {
  Button,
  Modal,
  message,
  Form,
  Input,
  InputNumber,
  DatePicker,
} from 'antd'
import { useState } from 'react'
import useUserStore from '@hooks/useUserStore'
import useContractStore from '@hooks/useContract'
import dayjs from 'dayjs'
import { create } from 'zustand'
import { unwrapUnits } from '@utils/numberConverter'
import { createProjectVersionExtra, proposalSetExtraAndParams } from '@services/index'
import TextArea from 'antd/es/input/TextArea'
import { transactionWait, convertVersion, showErrorMessage } from '@utils/index'
import { contractService } from '@contracts/index'
import { ethers } from 'ethers'

interface CreateVersionModalProps {
  visible: boolean
  project_name: string
  project_id: number
  show: (project_name: string, project_id: number) => void
  close: () => void
}

const useCreateVersionModalStore = create<CreateVersionModalProps>((set) => ({
  visible: false,
  project_name: '',
  project_id: 0,
  show: (project_name: string, project_id: number) =>
    set({
      project_name: project_name,
      project_id: project_id,
      visible: true,
    }),
  close: () =>
    set({
      project_name: '',
      project_id: 0,
      visible: false,
    }),
}))

// 按照主版本号.次版本号.修订号的规则来校验
const simpleVersionRegex = /^(\d+)\.(\d+)\.(\d+)$/

const CreateVersionModal = () => {
  const { visible, project_name, close, project_id } = useCreateVersionModalStore()
  const contract = useContractStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { jwt } = useUserStore((state) => {
    return { jwt: state.jwt }
  })

  const onFinish = async (values: any) => {
    setIsSubmitting(true)
    const fn = async () => {
      if (!project_name) {
        message.error('error: missing project name')
        return
      }
      const startDate = dayjs(values.startDate).unix()
      const endDate = dayjs(values.endDate).unix()
      // TODO mark update decimals
      const budget = unwrapUnits(values.budget, contract.decimals)
      // const issueId = values.issueId as number
      const issueLink = values.issueLink

      // 合约
      const projectContract = await contractService.getProjectContract()
      console.log('values', values, startDate, endDate)
      // function createProject(uint budget, bytes32 name, uint64 version, uint64 startDate, uint64 endDate, address[] calldata extraTokens, uint256[] calldata extraTokenAmunts) external nonReentrant returns(uint ProjectId)
      const tx = await projectContract.createProject(
        budget,
        ethers.encodeBytes32String(project_name),
        convertVersion(values.version),
        startDate,
        endDate,
        [],
        []
      )
      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        console.warn('transaction status:', receipt?.status, tx)
        message.error(`Create project version failed[3][${receipt?.status}]`)
        return false
      }

      // service
      const result = await createProjectVersionExtra(
        jwt,
        values.title,
        values.extra,
        project_name,
        values.version,
        issueLink,
        receipt.hash,
      )
      if (result.code !== 0) {
        message.error('Create project version failed, please try again later')
        return false
      }
      const result2 = await proposalSetExtraAndParams(
        jwt,
        [project_id, budget, startDate, endDate, "createProject"],
        values.title,
        "",
        receipt.hash,
      )
      if (result2.code !== 0) {
        message.error('Create project version failed, please try again later')
        return false
      }

      message.success('Create project version success')
      close()
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
      title='Create the project version'
      open={visible}
      onCancel={() => {
        close()
      }}
      confirmLoading={isSubmitting}
      footer={null}
    >
      <div className='text-sm text-gray-500'>
        <p>
          You can apply for a token budget when creating a version. After
          submission, a version proposal will be automatically generated, and
          the creation will only be considered successful if the proposal is
          passed.
        </p>
      </div>
      <Form
        onFinish={onFinish}
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
          name='version'
          rules={[
            { required: true, message: 'version is required' },
            {
              pattern: simpleVersionRegex,
              message:
                'Please enter a valid version number (MAJOR.MINOR.PATCH)!',
            },
          ]}
        >
          <Input className='' placeholder='project version' />
        </Form.Item>

        <Form.Item
          name='title'
          rules={[{ required: true, message: 'title is required' }]}
        >
          <Input className='' placeholder='projec version title' />
        </Form.Item>
        <Form.Item
          name='budget'
          className='w-full'
          rules={[
            {
              required: true,
              message: 'budget is required',
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            placeholder='Budget token applied for the project version'
          />
        </Form.Item>

        <Form.Item
          name='startDate'
          rules={[
            {
              required: true,
              message: 'start date is required',
            },
          ]}
        >
          <DatePicker className='w-full' placeholder='start time' />
        </Form.Item>
        <Form.Item
          name='endDate'
          rules={[
            {
              required: true,
              message: 'end date is required',
            },
          ]}
        >
          <DatePicker className='w-full' placeholder='end time' />
        </Form.Item>
        <Form.Item
          name='issueLink'
          className='w-full'
          rules={[
            {
              required: true,
              message: 'issue link is required',
            },
          ]}
        >
          <Input className='' placeholder='version issue link' />
        </Form.Item>
        <Form.Item name='extra'>
          <TextArea
            className=''
            placeholder='version description'
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>

        <div className='flex justify-center'>
          <Button loading={isSubmitting} type='primary' htmlType='submit'>
            Submit
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export { useCreateVersionModalStore }
export default CreateVersionModal
