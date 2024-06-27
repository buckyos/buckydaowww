import Link from 'next/link'
import { Descriptions, Tooltip } from 'antd'
import type { DescriptionsProps } from 'antd'
import { parseToFloat, wrapUnits } from '@utils/numberConverter'
import useContractStore from '@hooks/useContract'
import dayjs from 'dayjs'
import {
  GithubOutlined,
  SolutionOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import Loading from '@components/Loading'
import { useVersionSettlementModalStore } from '@hooks/modal'
import useUserStore from '@hooks/useUserStore'
import { message } from 'antd'

interface VersionDescriptionProps {
  version?: ProjectVersionProps
  inProposalPage?: boolean
}

const VersionDescription: React.FC<VersionDescriptionProps> = ({
  version,
  inProposalPage = false,
}) => {
  const { show } = useVersionSettlementModalStore()
  const { decimals, symbol } = useContractStore((state) => ({
    decimals: state.decimals,
    symbol: state.symbol,
  }))
  const { isLogin } = useUserStore((state) => ({ isLogin: state.isLogin }))

  const onCreateSettlementProposal = () => {
    if (!isLogin()) {
      message.error('error: please login first')
      return
    }

    if (version) {
      show(version)
    }
  }

  if (version === undefined) {
    return <Loading className='mt-20' />
  }

  const items: DescriptionsProps['items'] = [
    { key: '1', label: 'title', children: version.title },
    { key: '2', label: 'version', children: version.version },
    {
      key: '3',
      label: 'budget',
      children: (
        <div>
          {parseToFloat(wrapUnits(version.budget, decimals))} {symbol}
        </div>
      ),
    },
    {
      key: '4',
      label: 'start',
      children: <>{dayjs(version.start_date * 1000).format('YYYY-MM-DD')}</>,
    },
    {
      key: '5',
      label: 'end',
      children: <>{dayjs(version.end_date * 1000).format('YYYY-MM-DD')}</>,
    },
    {
      key: '6',
      label: 'issue',
      children: (
        <a
          className='text-cyfs-green'
          href={version.issue_link}
          target='_blank'
        >
          <GithubOutlined />
          <span className='ml-2'>#{version.issue}</span>
        </a>
      ),
    },
  ]
  if (!inProposalPage) {
    // TODO
    items.push({
      key: '7',
      label: 'proposal',
      children: (
        <Link
          className='flex items-center text-cyfs-green'
          href={`/proposal/${version.proposal_id}`}
        >
          <SolutionOutlined />
          <span className='ml-2'>proposal #{version.proposal_id}</span>
        </Link>
      ),
    })
  }
  items.push({ key: '8', label: 'state', children: version?.state })
  items.push({
    label: (
      <>
        <Tooltip title='The wallet address of the person responsible for creating the version'>
          <span className='mr-1'>manager</span>
          <InfoCircleOutlined />
        </Tooltip>
      </>
    ),
    children: version?.manager,
  })

  if (!inProposalPage) {
    if (version.accept_proposal_id) {
      items.push({
        label: 'settlement proposal',
        children: (
          <Link
            className='flex items-center text-cyfs-green'
            href={`/proposal/${version.accept_proposal_id}`}
          >
            <SolutionOutlined />
            <span className='ml-2'>proposal #{version.accept_proposal_id}</span>
          </Link>
        ),
      })
    } else {
      items.push({
        label: 'settlement status',
        children: (
          <>
            <div>
              <div className='flex-center gap-4'>
                <div>No settlement proposal</div>
                <a
                  className='btn-dan w-60 h-9'
                  onClick={onCreateSettlementProposal}
                >
                  Create settlement proposal
                </a>
              </div>
            </div>
          </>
        ),
      })
    }
  }
  return (
    <>
      <Descriptions bordered items={items} />
    </>
  )
}

export default VersionDescription
