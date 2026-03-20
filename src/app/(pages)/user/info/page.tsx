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
  const {
    handleConnect,
    boundAddress,
    activeAddress,
    governanceAddress,
    hasActiveWallet,
    isAddressMismatch,
  } = useBindWalletAddress()
  const { token } = useLockToken(governanceAddress)
  const { isCommittee } = useCommittee(governanceAddress)

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
          <label className='inline-block w-48 font-bold'>bound wallet</label>
          <span>{boundAddress || '-'}</span>
        </div>

        <div>
          <label className='inline-block w-48 font-bold'>active wallet</label>
          <span>{activeAddress || '-'}</span>

          {(boundAddress || hasActiveWallet) && (
            <Button className='ml-10' type='primary' onClick={handleConnect}>
              {hasActiveWallet ? 'Switch wallet' : 'Connect wallet'}
            </Button>
          )}
        </div>
        {isAddressMismatch && (
          <div>
            <label className='inline-block w-48 font-bold'>wallet status</label>
            <Tag color='warning'>Active wallet differs from bound address</Tag>
          </div>
        )}
        {governanceAddress && (
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
