'use client'
import { useRouter } from 'next/navigation'
import { useAsyncEffect } from 'ahooks'
import { useState } from 'react'
import Tag from '@components/Tag'
import { GithubOutlined } from '@ant-design/icons'
import { decodeProjectProfile, fetchRepositoryList } from '@services/index'
import { message } from 'antd'

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const router = useRouter()
  useAsyncEffect(async () => {
    const result = await fetchRepositoryList()
    if (result.code == 0) {
      const data = result.data.map((item) => decodeProjectProfile(item))
      console.log('ProjectList result', result, data)
      setProjects(data)
    } else {
      message.error(result.msg)
    }
  }, [])

  // const onCreateVersion = () => {
  // router.push('/projects/version/create')
  // }

  return (
    <div className='border border-solid border-gray-100 rounded-xl py-10 px-2 shadow-gray-200 min-h-[400px]'>
      <div className='grid grid-cols-6 text-center font-bold mb-4'>
        <div>Project name</div>
        <div>Date</div>
        <div>Repo</div>
        <div>Stage</div>
        <div>Version</div>
        <div>Status</div>
      </div>

      {projects.map((item) => {
        return (
          <div
            className='grid grid-cols-6 text-center py-4 text-black-primary'
            key={item.project_name}
          >
            <div
              onClick={() => {
                router.push(`/projects/${item.id}`)
              }}
              className='text-cyfs-green font-bold hover:underline cursor-pointer'
            >
              {item.project_name}
            </div>
            <div>{item.date}</div>
            <div>
              <div className='text-cyfs-green underline cursor-pointer'>
                <a href={item.github_url} target='_blank'>
                  <GithubOutlined className='text-cyfs-green' />
                </a>
              </div>
            </div>

            <div>{item.current_version}</div>
            <div>{item.stage}</div>
            <div className='flex-center'>
              <Tag text={item.state} color='green' />
            </div>
          </div>
        )
      })}
    </div>
  )
}
