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
import { PostUserExtraInfo } from '@services/index'
import { useUserinfo } from './useUserInfo'



const UserInfoButton = () => {
  const { isEdit, setIsEdit, job, desc } = useUserinfo()
  const { jwt, updateUser } = useUserStore((state) => ({
    jwt: state.jwt,
    updateUser: state.updateUser,
  }))
  const [loading, setLoading] = useState(false)

  const onSubmitChange = async () => {
    setLoading(true)
    const result = await PostUserExtraInfo(jwt, job, desc)
    console.log('onSubmitChange', result)
    if (result.code === 0) {
      message.success('update user info success')
    } else {
      message.error('update user info failed ' + result.msg)
    }
    await updateUser()

    setLoading(false)
    setIsEdit(false)
  }

  return (
    <div className='flex-center mt-10'>
      {isEdit && (
        <Button loading={loading} type='primary' onClick={onSubmitChange}>
          Submit Change
        </Button>
      )}
      {!isEdit && (
        <Button
          type='primary'
          onClick={() => {
            setIsEdit(true)
          }}
        >
          Edit
        </Button>
      )}
    </div>
  )
}

export default UserInfoButton