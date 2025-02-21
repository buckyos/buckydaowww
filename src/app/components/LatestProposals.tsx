'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import cx from 'classnames'
import { Button, Empty, message, Pagination } from 'antd'
import images from '@images'
import { useAsyncEffect } from 'ahooks'
import ProposalCard from './ProposalCard'
import { fetchMembers, getProposals } from '@services/index'
import _ from 'lodash'

type LastestProposalsProps = {
  showButton: boolean
  showPage: boolean
}

const LatestProposals: React.FC<LastestProposalsProps> = ({
  showButton,
  showPage,
}) => {
  const router = useRouter()
  const [proposals, setProposals] = useState<ProposalResponseData[]>([])

  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [memberCount, setMemberCount] = useState<number>(0)

  const handleMoreVotes = () => {
    router.push('/proposals')
  }

  useAsyncEffect(async () => {
    const [result, memberResult] = await Promise.all([
      getProposals(page, 10),
      fetchMembers(),
    ])
    if (result.code !== 0 || memberResult.code !== 0) {
      message.error('server error')
      return
    }
    // const result = await getProposals(page, 10)
    const proposals = result.data.items as ProposalResponseData[]

    // 处理投票数量（普通地址投票无效，要委员会的成员地址）
    setProposals(proposals.map(proposal => {
      return {
        ...proposal,
        supportCount: proposal.support.filter(address => {
          return _.find(memberResult.data, (member) => member.address == address)
        }).length
      }
    }))
    setTotal(result.data.totalSize)
    setMemberCount(memberResult.data.length)
    // console.log('🍻 proposal :', data)
  }, [page])

  return (
    <div>
      {proposals.length ? (
        <>
          <div className='grid grid-cols-1 gap-[18px] md:grid-cols-2'>
            {proposals.map((item) => (
              <ProposalCard
                item={item}
                key={item.id}
                memberCount={memberCount}
              />
            ))}
          </div>

          {showPage && (
            <div className='flex justify-center mt-10'>
              <Pagination
                current={page}
                total={total}
                pageSize={10}
                onChange={(page) => {
                  setPage(page)
                }}
              />
            </div>
          )}

          {showButton && (
            <Button className='my-6' onClick={handleMoreVotes}>
              <div className='flex-center'>
                <Image
                  src={images.IconArrowRight}
                  alt='icon'
                  width={14}
                  height={14}
                />
                More Votes
              </div>
            </Button>
          )}
        </>
      ) : (
        <div className='flex-center'>
          <Empty description=''>
            <div className={cx('text-black-secondary')}>Data Not Found</div>
          </Empty>
        </div>
      )}
    </div>
  )
}

export default LatestProposals
