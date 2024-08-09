import {
  ProjectOutlined,
  LoadingOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Spin, Tag } from 'antd'
import Link from 'next/link'
import _ from 'lodash'
import Loading from '@components/Loading'

const ProjectBreadcrumb: React.FC<{
  project?: ProjectItem
  version?: ProjectVersionProps
}> = ({ project, version }) => {
  let items = [
    {
      title: (
        <Link href='/projects' key='home'>
          <div className='flex-center gap-2'>
            <HomeOutlined />
            <span>Project Dashboard</span>
          </div>
        </Link>
      ),
    },
    {
      title: (
        <div className='flex' key='project'>
          {project && <div>{project?.project_name}</div>}

          {!project && (
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
          )}
        </div>
      ),
    },
  ]

  if (version) {
    items = _.initial(items)
    items.push({
      title: (
        <Link href={`/projects/${project?.project_id}`} key='version1'>
          {project?.project_name}
        </Link>
      ),
    })
    items.push({
      title: (
        <div key='version2'>
          Version: <Tag>{version?.version}</Tag>
        </div>
      ),
    })
  }

  return (
    <>
      <Breadcrumb items={items} />
    </>
  )
}

const ProjectInfo: React.FC<{
  project?: ProjectItem
  loading: boolean
  version?: ProjectVersionProps
}> = ({ project, loading, version }) => {
  return (
    <>
      <ProjectBreadcrumb project={project} version={version} />
      {loading && <Loading className='mt-10' />}
      {!loading && (
        <>
          <div className='flex items-center mt-10'>
            <ProjectOutlined className='text-3xl mr-3 items-center flex' />
            <h1 className='text-3xl font-bold'>{project?.project_name}</h1>
          </div>

          <div className='grid grid-cols-2 mt-6 gap-y-2'>
            <div>
              <label className='mr-6 text-lg'>State</label>
              <div className='py-1 px-2 text-sm bg-cyfs-green2 inline-block text-white rounded-full'>
                {project?.state}
              </div>
            </div>
            <div>
              <label className='mr-6 text-lg'>Created</label>
              {project?.date}
            </div>
            {/* <div> */}
            {/*   <label className='mr-6 text-lg'>Version</label> */}
            {/*   {project?.current_version} */}
            {/* </div> */}
            <div className='col-span-2'>
              <label className='mr-6 text-lg'>Link</label>
              <a
                className='text-cyfs-green'
                href={project?.github_url}
                target='_blank'
              >
                {project?.github_url}
              </a>
            </div>
          </div>

          <div className='mt-10'>
            <h3 className='font-normal'>project description:</h3>
            <div className='text-sm mt-2 leading-8 text-gray-500'>
              {project?.description}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export { ProjectInfo }
