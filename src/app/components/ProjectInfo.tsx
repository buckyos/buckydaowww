import {
  ProjectOutlined,
  LoadingOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Spin, Tag } from 'antd'
import Link from 'next/link'
import _ from 'lodash'
import Loading from '@components/Loading'
import dayjs from 'dayjs'

function ellipsisAddress(address?: string) {
  if (!address) {
    return ''
  }
  if (address.length <= 15) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-5)}`
}

function formatUserLabel(user?: User) {
  if (!user) {
    return '-'
  }

  if (user.nickname?.trim()) {
    return user.nickname.trim()
  }

  if (user.github_account?.trim()) {
    return user.github_account.trim()
  }

  if (user.address?.trim()) {
    return ellipsisAddress(user.address)
  }

  return '-'
}

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
    // 从当前URL中提取项目路径
    const currentPath = window.location.pathname
    const projectPath = currentPath.match(/\/projects\/\d+/)?.[0] || '/projects'
    items = _.initial(items)
    // 项目link
    items.push({
      title: (
        <Link href={projectPath} key='version1'>
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
  canEditProfile?: boolean
  onEditProfile?: () => void
}> = ({ project, loading, version, canEditProfile = false, onEditProfile }) => {
  return (
    <>
      <ProjectBreadcrumb project={project} version={version} />
      {loading && <Loading className='mt-10' />}
      {!loading && (
        <>
          <div className='flex items-center justify-between gap-4 mt-10 flex-wrap'>
            <div className='flex items-center'>
              <ProjectOutlined className='text-3xl mr-3 items-center flex' />
              <h1 className='text-3xl font-bold'>{project?.project_name}</h1>
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              <a
                className='text-sm text-cyfs-green underline underline-offset-2'
                href='https://github.com/buckyos/SourceDAO/blob/main/docs/ProjectVersionGuide.md'
                target='_blank'
              >
                Project / Version guide
              </a>
              {canEditProfile && onEditProfile ? (
                <button
                  className='btn-dan h-9 px-5'
                  type='button'
                  onClick={onEditProfile}
                >
                  Edit profile
                </button>
              ) : null}
            </div>
          </div>

          <div className='grid grid-cols-2 mt-6 gap-y-2'>
            <div>
              <label className='mr-6 text-lg'>State</label>
              <div className='inline-flex items-center gap-2'>
                <div className='py-1 px-2 text-sm bg-cyfs-green2 inline-block text-white rounded-full'>
                  {project?.state}
                </div>
                {project?.legacy ? (
                  <div className='py-1 px-2 text-xs bg-amber-50 text-amber-700 rounded-full border border-amber-200'>
                    legacy profile
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <label className='mr-6 text-lg'>Created</label>
              {project?.createdAt
                ? dayjs(project.createdAt * 1000).format('YYYY-MM-DD HH:mm')
                : project?.date}
            </div>
            <div>
              <label className='mr-6 text-lg'>Owner</label>
              <span>{formatUserLabel(project?.owner)}</span>
              {!!project?.owner?.address && (
                <span className='ml-3 font-mono text-sm text-cyfs-green'>
                  {ellipsisAddress(project.owner.address)}
                </span>
              )}
            </div>
            <div>
              <label className='mr-6 text-lg'>Updated</label>
              {project?.updatedAt
                ? dayjs(project.updatedAt * 1000).format('YYYY-MM-DD HH:mm')
                : '-'}
            </div>
            <div className='col-span-2'>
              <label className='mr-6 text-lg'>Updated by</label>
              <span>{formatUserLabel(project?.updatedBy)}</span>
              {!!project?.updatedBy?.address && (
                <span className='ml-3 font-mono text-sm text-cyfs-green'>
                  {ellipsisAddress(project.updatedBy.address)}
                </span>
              )}
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
