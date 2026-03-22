import Link from 'next/link'
import { Button, Descriptions, Tooltip } from 'antd'
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
import { useBindWalletAddress } from '@hooks/index'
import { transformVersionStateWord } from '@utils/index'

interface VersionDescriptionProps {
  version?: ProjectVersionProps
  inProposalPage?: boolean
}

function ellipsisAddress(address?: string) {
  if (!address) {
    return '-'
  }
  if (address.length <= 15) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-5)}`
}

function normalizeAddress(address?: string) {
  return address?.trim().toLowerCase() || ''
}

const VersionDescription: React.FC<VersionDescriptionProps> = ({
  version,
  inProposalPage = false,
}) => {
  const { show } = useVersionSettlementModalStore()
  const { ensureAuthenticated, activeAddress } = useBindWalletAddress()
  const { decimals, symbol } = useContractStore((state) => ({
    decimals: state.decimals,
    symbol: state.symbol,
  }))

  const onCreateSettlementProposal = async () => {
    if (!(await ensureAuthenticated({ requireWallet: true }))) {
      return
    }

    if (version) {
      show(version)
    }
  }

  if (version === undefined) {
    return <Loading className='mt-20' />
  }

  const isManagerWallet =
    !!activeAddress &&
    normalizeAddress(activeAddress) === normalizeAddress(version.manager)
  const settlementBlockers: string[] = []

  if (version.state !== 1) {
    settlementBlockers.push(
      'Settlement proposal can only be created after the version proposal passes and the version enters Developing state.',
    )
  }

  if (!activeAddress) {
    settlementBlockers.push('Connect the manager wallet before creating a settlement proposal.')
  } else if (!isManagerWallet) {
    settlementBlockers.push('Only the version manager wallet can create the settlement proposal.')
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
          <span className='ml-2'>#{version.issue_link.split('/').pop()}</span>
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
  items.push({ 
    key: '8', label: 'state', children: transformVersionStateWord(version?.state) 
  })
  items.push({
    label: (
      <>
        <Tooltip title='The wallet address of the person responsible for creating the version'>
          <span className='mr-1'>manager</span>
          <InfoCircleOutlined />
        </Tooltip>
      </>
    ),
    children: (
      <Tooltip title={version?.manager}>
        <span className='font-mono text-sm text-cyfs-green'>
          {ellipsisAddress(version?.manager)}
        </span>
      </Tooltip>
    ),
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
          <div className='space-y-3'>
            <div className='flex items-center gap-4 flex-wrap'>
              <div>No settlement proposal</div>
              <Button
                className='btn-dan w-60 h-9'
                type='primary'
                disabled={settlementBlockers.length > 0}
                onClick={onCreateSettlementProposal}
              >
                Create settlement proposal
              </Button>
            </div>
            {settlementBlockers.length > 0 ? (
              <div className='rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                <div className='font-medium mb-2'>Settlement proposal is not available yet.</div>
                <ul className='list-disc pl-5 space-y-1'>
                  {settlementBlockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className='text-sm text-gray-500'>
                Create the settlement proposal after development is complete, then submit contributor points for committee review.
              </div>
            )}
          </div>
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
