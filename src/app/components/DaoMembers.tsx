'use client'
import { useState } from 'react'
import cx from 'classnames'
import UserAvatar from '@components/UserAvatar'
import { useAsyncEffect } from 'ahooks'
import { fetchMembers } from '@services/index'
import { Tooltip, Tag } from 'antd'

interface MemberCardProps {
  item: CommitteeMember
}

const MemberCard = ({ item }: MemberCardProps) => {
  const encryptedUserDisplayed = () => {
    const displayed = item.nickname ? item.nickname : item.address

    if (displayed.length < 15) {
      return displayed
    }
    return `${displayed.slice(0, 6)}...${displayed.slice(displayed.length - 5)}`
  }
  const handleCardClicked = () => {
    if (item.homepage && item.homepage !== '') {
      window.open(item.homepage, '_blank')
    }
  }

  return (
    <Tooltip title={item.address} placement='bottom'>
      <div
        className={cx(
          'flex justify-center items-center',
          'border border-solid rounded-lg border-[#F0F0F0]',
          'max-w-full p-4',
          { 'cursor-pointer': item.homepage && item.homepage !== '' },
        )}
        onClick={handleCardClicked}
        aria-hidden
      >
        <div className='flex flex-col justify-center items-center gap-1.5'>
          <UserAvatar avatar={item.avatar} />
          <div className='font-medium text-cyfs-green cursor-default'>
            {encryptedUserDisplayed()}
            {item.nickname && (
              <span className='text-cyfs-gray'>
                ({item.address.slice(0, 6)}...
                {item.address.slice(item.address.length - 5)})
              </span>
            )}
          </div>
          {!!item.job && (
            <div className='mt-1 text-sm text-black-secondary'>
              <Tag color='green'>Position: {item.job}</Tag>
            </div>
          )}

          {!!item.desc && (
            <div className='text-sm scale-75 origin-center'>{item.desc}</div>
          )}
        </div>
      </div>
    </Tooltip>
  )
}

const DaoMembers = () => {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(
    [],
  )
  useAsyncEffect(async () => {
    const data = await fetchMembers()
    setCommitteeMembers(data.data)
  }, [])

  return (
    <div id='members'>
      <div className='text-2xl font-medium my-6'>DAO Members</div>
      <div className='grid grid-cols-2 gap-[18px] md:grid-cols-4'>
        {committeeMembers.map((item) => (
          <MemberCard item={item} key={item.address} />
        ))}
      </div>
    </div>
  )
}

export default DaoMembers
