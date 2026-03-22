'use client'
import { useEffect } from 'react'
import { Form, Input, Modal, message } from 'antd'
import { upsertProjectDetail } from '@services/index'
import { useBindWalletAddress, useUserStore } from '@hooks/index'

interface EditProjectProfileModalProps {
  open: boolean
  project?: ProjectItem
  onCancel: () => void
  onSaved: () => Promise<void> | void
}

const EditProjectProfileModal: React.FC<EditProjectProfileModalProps> = ({
  open,
  project,
  onCancel,
  onSaved,
}) => {
  const [form] = Form.useForm()
  const { ensureAuthenticated } = useBindWalletAddress()

  useEffect(() => {
    if (!open || !project) {
      return
    }

    form.setFieldsValue({
      project_name: project.project_name,
      github_url: project.github_url,
      description: project.description,
    })
  }, [form, open, project])

  const onFinish = async (values: {
    github_url: string
    description?: string
  }) => {
    if (!project) {
      return
    }

    if (!(await ensureAuthenticated())) {
      return
    }

    const jwt = useUserStore.getState().jwt
    const payload: ProjectItem = {
      ...project,
      github_url: values.github_url.trim(),
      description: values.description?.trim() || '',
    }

    const result = await upsertProjectDetail(jwt, {
      name: project.project_name,
      detail: JSON.stringify(payload),
    })

    if (result.code !== 0) {
      message.error(result.msg || 'Failed to update project profile')
      return
    }

    message.success('Project profile updated')
    onCancel()
    await onSaved()
  }

  return (
    <Modal
      title='Edit project profile'
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <div className='text-sm text-gray-500'>
        <p>
          This step only updates the top-level project profile. Version data and
          proposal history stay unchanged.
        </p>
      </div>

      <Form
        form={form}
        onFinish={onFinish}
        className='mt-6'
        name='edit-project-profile'
        style={{ width: '100%' }}
        autoComplete='off'
      >
        <Form.Item label='Project name' name='project_name'>
          <Input disabled />
        </Form.Item>

        <Form.Item
          name='github_url'
          rules={[{ required: true, message: 'github url is required' }]}
        >
          <Input placeholder='github url' />
        </Form.Item>

        <Form.Item name='description'>
          <Input.TextArea placeholder='project description' rows={5} />
        </Form.Item>

        <div className='flex justify-center'>
          <button className='btn-dan w-32 h-9' type='submit'>
            Save profile
          </button>
        </div>
      </Form>
    </Modal>
  )
}

export default EditProjectProfileModal
