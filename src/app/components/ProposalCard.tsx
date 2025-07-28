'use client'
import React, { useCallback } from 'react'
import { Progress, Tag, Tooltip } from 'antd'
import { proposalExpiredTimeDisplay } from '@utils/index'
import UserAvatar from './UserAvatar'
import { useRouter } from 'next/navigation'
import ProposalStateTag from '@components/ProposalStateTag'


const ProposalCard: React.FC<ProposalCardProps> = ({ item, memberCount }) => {
  const router = useRouter()

  const proposalCreatorDisplay = useCallback(() => {
    const nickname = item.creator?.nickname
    const address = item.creator?.address ?? ''

    const title = nickname ?? address

    if (title.length < 15) {
      return title
    }

    return `${title.slice(0, 7)}......${title.slice(title.length - 5)}`
  }, [item.creator?.address, item.creator?.nickname])

  const proposalExtraDisplay = useCallback(() => {
    const extra = item?.extra ?? ''

    if (extra.length < 48) {
      return extra
    }

    return `${extra.slice(0, 48)}...`
  }, [item?.extra])

  const supportPercent = () => {
    return (item.supportCount / memberCount) * 100
  }

  const rejectPercent = () => {
    return (item.rejectCount / memberCount) * 100
  }

  const handleCardClicked = () => {
    router.push(`/proposal/${item.id}`)
  }

  return (
    <div
      className='flex items-center border border-solid rounded-lg border-[#F0F0F0] hover:border-cyfs-blue p-4 cursor-pointer'
      onClick={handleCardClicked}
      aria-hidden
    >
      <div className='w-full flex flex-col gap-1'>
        <div className='flex items-center'>
          <Tooltip title={item.creator?.address} placement='bottom'>
            <div className='flex items-center'>
              <UserAvatar size={24} avatar={item.creator?.avatar} />
              <div className='text-sm ml-2'>{proposalCreatorDisplay()}</div>
            </div>
          </Tooltip>
          <div className='flex-1'></div>
          {!!item.investment && <Tag color='green'>Investment</Tag>}
          <ProposalStateTag
            is_reject={item.full ? rejectPercent() > 50 : item.state == 3 }
            state={item.state}
          />
        </div>

        <div className='mt-2'>
          <span className='font-bold mr-2'>#{item.id}</span>
          {item?.title ?? ''}
        </div>

        <div className='text-sm text-black-secondary'>
          {proposalExtraDisplay()}
        </div>
        <div className='h-10 flex-center flex-col'>
          {!!item.full &&
            <>
              <div className='flex items-baseline gap-1 text-xs'>
                <Progress percent={supportPercent()} showInfo={false} />
                <div>{item.supportCount}</div>
                <div>agree</div>
              </div>

              <div className='flex items-baseline gap-1 text-xs'>
                <Progress percent={rejectPercent()} showInfo={false} />
                <div>{item.rejectCount}</div>
                <div>disagree</div>
              </div>
            </>
          }
        </div>

        <div className='text-sm text-black-secondary'>
          {proposalExpiredTimeDisplay(item.expired)}
        </div>
      </div>
    </div>
  )
}

export default ProposalCard
