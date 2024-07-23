'use client'
import { useRouter } from 'next/navigation'
import { useAsyncEffect } from 'ahooks'
import { useState } from 'react'
import Tag from '@components/Tag'
import { GithubOutlined } from '@ant-design/icons'
import { fetchRepositoryList } from '@services/index'
import { message } from 'antd'

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const router = useRouter()
  useAsyncEffect(async () => {
    const result = await fetchRepositoryList()
    if (result.code == 0) {
      const data = result.data.map((item) => {
        return JSON.parse(item.detail) as ProjectItem
      })
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
      <div className='grid grid-cols-4 text-center font-bold mb-4'>
        <div>Project name</div>
        <div>Date</div>
        {/* <div>Version</div> */}
        <div>Repo</div>
        <div>Status</div>
        <div></div>
      </div>

      {projects.map((item) => {
        return (
          <div
            className='grid grid-cols-4 text-center py-4 text-black-primary'
            key={item.project_name}
          >
            <div
              onClick={() => {
                router.push(`/projects/${item.project_id}`)
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
            <div className='flex-center'>
              <Tag text={item.state} color='green' />
            </div>
            {/* <div> */}
            {/*   <a */}
            {/*     className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg cursor-pointer text-sm' */}
            {/*     onClick={onCreateVersion} */}
            {/*   > */}
            {/*     create version */}
            {/*   </a> */}
            {/* </div> */}
          </div>
        )
      })}
    </div>
  )
}
