'use client'
import { Modal, Form, Input, message } from 'antd'
import { create } from 'zustand'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { fetchRepositoryList, upsertProjectDetail } from '@services/index'
import { useBindWalletAddress, useUserStore } from '@hooks/index'

interface CreateProjectModalStore {
  visible: boolean
  show: () => void
  close: () => void
}

const useCreateProjectModalStore = create<CreateProjectModalStore>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  close: () => set({ visible: false }),
}))

function buildProjectSlug(projectName: string) {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || encodeURIComponent(projectName.trim())
}

const CreateProjectModal = () => {
  const router = useRouter()
  const { visible, close } = useCreateProjectModalStore()
  const { ensureAuthenticated } = useBindWalletAddress()

  const onCreateProject = async (values: {
    project_name: string
    github_url: string
    description?: string
  }) => {
    if (!(await ensureAuthenticated({ requireWallet: true }))) {
      return
    }

    const projectName = values.project_name.trim()
    const githubUrl = values.github_url.trim()
    const description = values.description?.trim() || ''
    const projectId = buildProjectSlug(projectName)

    const existing = await fetchRepositoryList()
    if (existing.code !== 0) {
      message.error(existing.msg || 'Failed to load existing projects')
      return
    }

    const duplicated = existing.data
      .map((item) => JSON.parse(item.detail) as ProjectItem)
      .find(
        (item) =>
          item.project_name.trim().toLowerCase() === projectName.toLowerCase()
          || String(item.id).trim().toLowerCase() === projectId.toLowerCase(),
      )

    if (duplicated) {
      message.error('A project profile with the same name already exists')
      return
    }

    const jwt = useUserStore.getState().jwt
    const projectDetail: ProjectItem = {
      id: projectId,
      project_id: projectId,
      project_name: projectName,
      state: 'draft',
      date: dayjs().format('YYYY-MM-DD'),
      current_version: '-',
      stage: '-',
      github_url: githubUrl,
      description,
      project_logs: [],
    }

    const result = await upsertProjectDetail(jwt, {
      name: projectName,
      detail: JSON.stringify(projectDetail),
    })

    if (result.code !== 0) {
      message.error(result.msg || 'Failed to create project profile')
      return
    }

    message.success('Project profile created')
    close()
    router.push(`/projects/${encodeURIComponent(projectId)}`)
  }

  return (
    <Modal
      title='Create project'
      open={visible}
      onCancel={close}
      footer={null}
    >
      <div className='text-sm text-gray-500'>
        <p>
          This step creates an empty project profile. Versions are still created
          inside the project detail page.
        </p>
      </div>
      <Form
        onFinish={onCreateProject}
        className='mt-6'
        name='create-project'
        style={{ width: '100%' }}
        autoComplete='off'
      >
        <Form.Item
          name='project_name'
          rules={[{ required: true, message: 'project name is required' }]}
        >
          <Input placeholder='project name' />
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
            Create project
          </button>
        </div>
      </Form>
    </Modal>
  )
}

export { useCreateProjectModalStore }
export default CreateProjectModal
