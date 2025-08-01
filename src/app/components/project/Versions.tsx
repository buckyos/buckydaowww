import { message, Table } from 'antd'
import { useParams } from 'next/navigation'
import { useCreateVersionModalStore } from '@components/project/CreateVersionModal'
import { getProjectVersions } from '@services/index'
import { useAsyncEffect } from 'ahooks'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import useContractStore from '@hooks/useContract'
import { parseToFloat, wrapUnits } from '@utils/numberConverter'
import Link from 'next/link'
// import ProposalStateTag from '@components/ProposalStateTag'
import dayjs from 'dayjs'
import {
  GithubOutlined,
  SolutionOutlined,
  ContainerOutlined,
  NodeIndexOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import useUserStore from '@hooks/useUserStore'
import { transformVersionStateWord, formatNumberWithCommas } from '@utils/index'

interface VersionsProps {
  project_name?: string
}

const Versions: React.FC<VersionsProps> = ({ project_name }) => {
  const { projectId } = useParams()
  const { show } = useCreateVersionModalStore()
  const [data, setData] = useState<ProjectVersionProps[]>([])
  const [loading, setLoading] = useState(false)
  const { decimals, symbol } = useContractStore((state) => ({
    decimals: state.decimals,
    symbol: state.symbol,
  }))
  const isLogin = useUserStore((state) => state.isLogin)

  useAsyncEffect(async () => {
    if (project_name) {
      setLoading(true)
      const result = await getProjectVersions(project_name)
      console.log('project versions', result)
      setData(result.data.items)
      setLoading(false)
    }
  }, [project_name])

  const onCreateVersion = () => {
    if (!isLogin()) {
      message.error('error: please login first')
      return
    }

    if (project_name && projectId) {
      show(project_name, Number(projectId))
    } else {
      message.error('error: missing project name')
    }
  }

  // table columns
  const columns: ColumnsType<ProjectVersionProps> = [
    {
      title: 'version',
      render: (record: ProjectVersionProps) => {
        return (
          <div>
            <Link href={`/projects/${projectId}/version/${record.id}`}>
              <NodeIndexOutlined />
              <span className='ml-2'>{record.version}</span>
            </Link>
          </div>
        )
      },
    },
    {
      title: 'budget',
      dataIndex: 'budget',
      render: (budget: number) => {
        const display = formatNumberWithCommas(parseToFloat(wrapUnits(budget, decimals)))
        return (
          <div>
            {display} {symbol}
          </div>
        )
      },
    },
    {
      title: 'time',
      render: (record: ProjectVersionProps) => {
        return (
          <div className='flex gap-1'>
            <CalendarOutlined />
            <div>{dayjs(record.start_date * 1000).format('YYYY-MM-DD')}</div>
            <div>--</div>
            <div>{dayjs(record.end_date * 1000).format('YYYY-MM-DD')}</div>
          </div>
        )
      },
    },
    {
      // TODO 这个是version的状态，不是proposal的状态
      title: 'version state',
      dataIndex: 'state',
      render: (state: number) => {
        return <div className='w-32'>{transformVersionStateWord(state)}</div>
      },
    },
    {
      title: '',
      render: (record: ProjectVersionProps) => {
        return (
          <div>
            <div>
              <Link
                className='flex items-center text-cyfs-green'
                href={`/projects/${projectId}/version/${record.id}`}
              >
                <ContainerOutlined />
                <span className='ml-2'>version detail</span>
              </Link>
            </div>
            <div>
              <a
                className='text-cyfs-green'
                href={record.issue_link}
                target='_blank'
              >
                <GithubOutlined />
                <span className='ml-2'>issue</span>
              </a>
            </div>

            <Link
              className='flex items-center text-cyfs-green'
              href={`/proposal/${record.proposal_id}`}
            >
              <SolutionOutlined />
              <span className='ml-2'>proposal</span>
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <div className='flex mt-10 items-center'>
        <a className='btn-dan w-36 h-9' onClick={onCreateVersion}>
          create version
        </a>

        <p className='text-sm text-gray-300 ml-4'>
          Version is a settlement unit of Source Dao.
        </p>
      </div>
      <div className='mt-10'>
        <Table columns={columns} dataSource={data} loading={loading} />
      </div>
    </>
  )
}

export default Versions
