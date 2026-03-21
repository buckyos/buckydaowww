'use client'
import { Breadcrumb, Button, Form, Input, message } from 'antd'
import Link from 'next/link'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import {
  decodeProjectProfile,
  fetchRepositoryList,
  upsertProjectDetail,
} from '@services/index'
import { useBindWalletAddress, useUserStore } from '@hooks/index'

function buildProjectSlug(projectName: string) {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || encodeURIComponent(projectName.trim())
}

// render
export default function CreateProjectPage() {
  const router = useRouter()
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
      .map((item) => decodeProjectProfile(item))
      .find((item) => {
        return (
          item.project_name.trim().toLowerCase() === projectName.toLowerCase()
          || String(item.id).trim().toLowerCase() === projectId.toLowerCase()
        )
      })

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
    router.push(`/projects/${encodeURIComponent(projectId)}`)
  }

  return (
    <main className='max-w-[90%] mx-auto my-6 md:max-w-[70%]'>
      <Breadcrumb
        items={[
          { title: <Link href='/projects'>Projects</Link> },
          { title: <div>Create</div> },
        ]}
      />
      <h2 className='mt-10 text-2xl font-bold text-center'>create project</h2>
      <div className='flex-center mt-20'>
        <Form
          name='basic'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          autoComplete='off'
          onFinish={onCreateProject}
        >
          <Form.Item
            label='project name'
            name='project_name'
            rules={[{ required: true, message: 'Please input project name' }]}
          >
            <Input className='ml-2' />
          </Form.Item>

          <Form.Item
            label='github url'
            name='github_url'
            rules={[{ required: true, message: 'Please input github url' }]}
          >
            <Input className='ml-2' />
          </Form.Item>

          <Form.Item label='description' name='description'>
            <Input.TextArea className='ml-2' rows={5} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type='primary' htmlType='submit'>
              Create project
            </Button>
          </Form.Item>
        </Form>
      </div>
    </main>
  )
}
