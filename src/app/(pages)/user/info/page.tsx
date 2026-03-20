'use client'
import { Button, Tag, Input, message } from 'antd'
import {
  useCommittee,
  useContractStore,
  useBindWalletAddress,
  useLockToken,
  useUserStore,
} from '@hooks/index'
import { parseToFloat, wrapUnits } from '@utils/index'
import UserInfoButton from './UserInfoButton'
import UserInfoInput from './UserInfoInput'


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
              <label className='inline-block w-48 font-bold'>Assigned Lockup</label>
              {parseToFloat(token.assigned)}
              {contract.symbol}
            </div>

            <div>
              <label className='inline-block w-48 font-bold'>Claimed Lockup</label>
              {parseToFloat(token.claimed)}
              {contract.symbol}
            </div>

            <div>
              <label className='inline-block w-48 font-bold'>Remaining Locked</label>
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
