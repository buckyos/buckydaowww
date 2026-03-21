'use client'
import { useBindWalletAddress } from '@hooks/index'
import HeaderInfo from '@components/header/HeaderInfo'
import { message, Tooltip } from 'antd'
import { beginGithubLogin } from '@services/index'

const HeaderRight = () => {
  const userBind = useBindWalletAddress()
  const isLocalChainMode = process.env.NEXT_PUBLIC_NETWORK_ID === '31337'
  const useLocalDevLogin =
    isLocalChainMode && process.env.NEXT_PUBLIC_LOCAL_AUTH_MODE !== 'github'
  const loginLabel = useLocalDevLogin ? 'Login with Wallet' : 'Login with GitHub'

  const handleLogin = async () => {
    if (useLocalDevLogin) {
      await userBind.handleLocalLogin()
      return
    }

    const result = await beginGithubLogin(window.location.href)
    if (result.code !== 0 || !result.data) {
      message.error(result.msg || 'Failed to initialize GitHub login')
      return
    }

    window.location.href = result.data
  }

  if (userBind.sessionState === 'authenticated') {
    return <HeaderInfo />
  }

  return (
    <div className='flex flex-wrap items-center justify-end gap-3'>
      {userBind.sessionState === 'anonymous' ? (
        <Tooltip title={userBind.displayAddress}>
          <div className='flex-center border border-cyfs-green text-cyfs-green h-9 px-4 rounded-lg cursor-default text-sm'>
            Wallet {userBind.addressEllipsis()}
          </div>
        </Tooltip>
      ) : (
        <div />
      )}
      <div
        className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-9 px-4 rounded-lg cursor-pointer text-sm'
        onClick={() => {
          void handleLogin()
        }}
      >
        {loginLabel}
      </div>
    </div>
  )
}

export default HeaderRight
