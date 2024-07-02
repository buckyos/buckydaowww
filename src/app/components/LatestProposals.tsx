'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import cx from 'classnames'
import { Button, Empty, message, Pagination } from 'antd'
import images from '@images'
import { useAsyncEffect } from 'ahooks'
import ProposalCard from './ProposalCard'
import { fetchMembers } from '@services/index'

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
    const resp = await fetch(`/api/proposal?pageNo=${page}&pageSize=10`)
    const result = await resp.json()
    if (result.code !== 0) {
      message.error('Get proposal failed')
    } else {
      // const proposals = (result.data.items as ProposalResponseData[]).filter(
      //   (items) => items.title != '',
      // )
      const proposals = result.data.items as ProposalResponseData[]
      setProposals(proposals)
      setTotal(result.data.totalSize)
    }

    const data = await fetchMembers()
    const memberCount = data.data.length
    setMemberCount(memberCount)
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
