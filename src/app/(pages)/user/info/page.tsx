'use client'
import useUserStore from '@hooks/useUserStore'
import { Button, Tag, Input, message } from 'antd'
import { useBindWalletAddress, useLockToken } from '@hooks/index'
import { parseToFloat, wrapUnits } from '@utils/numberConverter'
import { useCommittee } from '@hooks/index'
import useContractStore from '@hooks/useContract'
import TextArea from 'antd/es/input/TextArea'
import { create } from 'zustand'
import { PostUserExtraInfo } from '@services/index'
import { useEffect, useState } from 'react'

const useUserinfo = create<{
  job: string
  desc: string
  isEdit: boolean
  setIsEdit: (isEdit: boolean) => void
  setJob: (job: string) => void
  setDesc: (desc: string) => void
}>((set) => ({
  job: '',
  desc: '',
  isEdit: false,
  setIsEdit: (isEdit: boolean) => set({ isEdit }),
  setJob: (job: string) => set({ job }),
  setDesc: (desc: string) => set({ desc }),
}))

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
        {!isEdit && <div>{user.user.job}</div>}
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
        {!isEdit && <div>{user.user.desc}</div>}
      </div>
    </>
  )
}

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

export default function UserInfoPage() {
  const user = useUserStore()
  const contract = useContractStore()
  const { handleConnect } = useBindWalletAddress()
  const { token } = useLockToken(user.user.address)
  const { isCommittee } = useCommittee(user.user)

  return (
    <div className='flex flex-col px-40 mt-20 pb-80'>
      <div className='flex items-center'>
        <img
          className='w-16 h-16 rounded-full overflow-hidden'
          src={user.user.avatar}
          alt=''
        />
        <h2 className='ml-4 text-2xl cursor-default text-cyfs-green'>
          {user.user.nickname}
        </h2>
        {isCommittee && (
          <div className='ml-2'>
            <Tag color='green'>committee</Tag>
          </div>
        )}
      </div>

      <div className='leading-10'>
        <UserInfoInput />

        <div className=''>
          <label className='inline-block w-48 font-bold'>
            github account id
          </label>
          <span>{user.user.github_account}</span>
        </div>

        <div>
          <label className='inline-block w-48 font-bold'>wallet address</label>
          <span>{user.user.address}</span>

          {user.user.address && (
            <Button className='ml-10' type='primary' onClick={handleConnect}>
              Change wallet
            </Button>
          )}
        </div>
        {user.user.address && (
          <>
            <div>
              <label className='inline-block w-48 font-bold'>Total Token</label>
              {wrapUnits(token.token, contract.decimals)}
              {contract.symbol}
            </div>
            <div>
              <label className='inline-block w-48 font-bold'>
                Unlocked Token
              </label>
              {parseToFloat(token.unlocked)}
              {contract.symbol}
            </div>

            <div>
              <label className='inline-block w-48 font-bold'>
                Locked Token
              </label>
              {parseToFloat(token.locked)}
              {contract.symbol}
            </div>
          </>
        )}
      </div>
      <UserInfoButton />
    </div>
  )
}
