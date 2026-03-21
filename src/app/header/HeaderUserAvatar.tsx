'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Dropdown, MenuProps, Tag, Tooltip } from 'antd'
import { LogoutOutlined, ContactsOutlined, UserOutlined } from '@ant-design/icons'
import ConnectWalletButton from '@components/header/ConnectWalletButton'
import useUserStore from '@hooks/useUserStore'
import { useCommittee, useBindWalletAddress } from '@hooks/index'

const HeaderUserAvatar = () => {
  const user = useUserStore()
  const userBind = useBindWalletAddress()
  const { isCommittee: isBoundCommittee } = useCommittee(userBind.boundAddress)
  const { isCommittee: isActiveCommittee } = useCommittee(userBind.activeAddress)
  const hasProfile = !!user.user.avatar && !!user.user.nickname
  const isLoggedIn = user.isLogin()
  const identityAddress = isLoggedIn
    ? userBind.boundAddress || userBind.activeAddress
    : userBind.activeAddress
  const hasGithubIdentity = !!user.user.github_account && !userBind.isLocalChainMode
  const displayName =
    user.user.nickname
    || (hasGithubIdentity ? user.user.github_account : '')
    || (identityAddress ? userBind.addressEllipsis(identityAddress) : 'Wallet')
  const identityHint = isLoggedIn
    ? userBind.isLocalChainMode
      ? 'Local session'
      : user.user.github_account
        ? `GitHub @${user.user.github_account}`
        : 'Authenticated account'
    : userBind.hasActiveWallet
      ? 'Connected wallet'
      : ''
  const mismatchMessage = userBind.isLocalChainMode
    ? 'Logged-in local account and active wallet are different. Logout and login again if you want to switch accounts.'
    : 'Logged-in account and active wallet are different. Switch back to the bound wallet or rebind this account.'

  const items: MenuProps['items'] = [
    {
      label: (
        <Link className='flex items-center' href='/user/info'>
          <ContactsOutlined className='mr-2' />
          userinfo
        </Link>
      ),
      key: 'userinfo',
    },

    {
      label: (
        <div className='py-2'>
          <ConnectWalletButton />
        </div>
      ),
      key: 'wallet',
    },
    isLoggedIn && userBind.shouldShowBindWalletAction ? {
      label: (
        <div
          className='flex items-center py-2'
          onClick={() => {
            void userBind.handleBindWallet()
          }}
        >
          <ContactsOutlined className='mr-2' />
          {userBind.bindWalletLabel}
        </div>
      ),
      key: 'bind-wallet',
    } : null,
    isLoggedIn ? {
      label: (
        <div
          className='flex items-center py-2'
          onClick={() => {
            user.logout()
          }}
        >
          <LogoutOutlined className='mr-2' />
          logout
        </div>
      ),
      key: 'logout',
    } : null,
  ].filter(Boolean)

  return (
    <Dropdown menu={{ items }} placement='bottomRight' arrow>
      <div className='flex items-start gap-2 py-1'>
        {hasProfile ? (
          <Image
            width={60}
            height={60}
            className='w-14 h-14 rounded-full overflow-hidden'
            src={user.user.avatar!}
            alt='avatar'
          />
        ) : (
          <div className='w-14 h-14 rounded-full overflow-hidden bg-gray-100 text-gray-500 flex items-center justify-center'>
            <UserOutlined className='text-xl' />
          </div>
        )}
        <div className='flex min-w-0 max-w-[340px] flex-col gap-1.5'>
          <div className='flex min-w-0 items-center gap-2'>
            <Tooltip
              title={
                !user.user.nickname && !user.user.github_account && identityAddress
                  ? identityAddress
                  : undefined
              }
            >
              <span className='min-w-0 truncate text-base font-medium cursor-default'>
                {displayName}
              </span>
            </Tooltip>
            {!userBind.isAddressMismatch && (isLoggedIn ? isBoundCommittee : isActiveCommittee) && (
              <Tag color='green'>committee</Tag>
            )}
          </div>

          {!!identityHint && (
            <div className='min-w-0 text-xs text-cyfs-gray truncate cursor-default'>
              {identityHint}
            </div>
          )}

          {isLoggedIn && userBind.boundAddress && (
            <div className='flex min-w-0 items-center gap-2 text-xs'>
              <span className='w-10 shrink-0 text-cyfs-gray'>Bound</span>
              <Tooltip title={userBind.boundAddress}>
                <div className='min-w-0 truncate font-mono text-cyfs-green'>
                  {userBind.addressEllipsis(userBind.boundAddress)}
                </div>
              </Tooltip>
              {isBoundCommittee && <Tag color='green'>committee</Tag>}
            </div>
          )}

          {userBind.hasActiveWallet && (!isLoggedIn || userBind.isAddressMismatch) && (
            <div className='flex min-w-0 items-center gap-2 text-xs'>
              <span className='w-10 shrink-0 text-cyfs-gray'>
                {isLoggedIn ? 'Active' : 'Wallet'}
              </span>
              <Tooltip title={userBind.activeAddress}>
                <div className={`min-w-0 truncate font-mono ${isLoggedIn ? 'text-blue-500' : 'text-cyfs-green'}`}>
                  {userBind.addressEllipsis(userBind.activeAddress)}
                </div>
              </Tooltip>
              {isLoggedIn && userBind.isAddressMismatch && isActiveCommittee && (
                <Tag color='blue'>active committee</Tag>
              )}
            </div>
          )}

          {userBind.isAddressMismatch && (
            <div className='max-w-[340px] rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700 cursor-default'>
              {mismatchMessage}
            </div>
          )}

          {!userBind.hasActiveWallet && (
            <div
              className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-6 px-4 rounded-lg cursor-pointer text-sm'
              onClick={() => {
                userBind.handleConnectWallet()
              }}
            >
              <span className='ml-1'>Connect</span>
            </div>
          )}
        </div>
      </div>
    </Dropdown>
  )
}

export default HeaderUserAvatar
