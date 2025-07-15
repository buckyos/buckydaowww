'use client'
import { useEffect, useState } from 'react'
import { Button, Tag, Input, message } from 'antd'
import {
  useCommittee,
  useContractStore,
  useBindWalletAddress,
  useLockToken,
  useUserStore,
} from '@hooks/index'
import TextArea from 'antd/es/input/TextArea'
import { useUserinfo } from './useUserInfo'

const UserInfoInput = () => {
  const { isEdit, setJob, setDesc, job, desc } = useUserinfo()
  const user = useUserStore()
  useEffect(() => {
    setJob(user.user.job)
    setDesc(user.user.desc)
  }, [user.user.job, user.user.desc, setJob, setDesc])

  return (
    <>
      <div className='mt-20 flex items-center'>
        <label className='inline-block w-48 font-bold flex-shrink-0'>
          position
        </label>
        {isEdit && (
          <Input value={job} onChange={(e) => setJob(e.target.value)}></Input>
        )}
        {!isEdit && <div>{user.user.job ? user.user.job : '---'}</div>}
      </div>

      <div className='flex  py-4'>
        <label className='inline-block w-48 font-bold flex-shrink-0'>
          description
        </label>
        {isEdit && (
          <TextArea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 5 }}
          ></TextArea>
        )}
        {!isEdit && <div>{user.user.desc ? user.user.desc : '---'}</div>}
      </div>
    </>
  )
}

export default UserInfoInput