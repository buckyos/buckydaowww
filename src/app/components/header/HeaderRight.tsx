'use client'
import { useBindWalletAddress } from '@hooks/index'
import HeaderInfo from '@components/header/HeaderInfo'
import { message, Tooltip } from 'antd'

const HeaderRight = () => {
  const userBind = useBindWalletAddress()
  const isLocalChainMode = process.env.NEXT_PUBLIC_NETWORK_ID === '31337'

  const handleLogin = async () => {
    if (isLocalChainMode) {
      await userBind.handleLocalLogin()
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const callbackUrl = process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL

    if (!clientId || !callbackUrl) {
      message.error('Missing GitHub OAuth configuration')
      return
    }

    const redirectUrl = new URL(callbackUrl)
    redirectUrl.searchParams.set('redirect', window.location.href)

    const redirectUri = redirectUrl.toString()
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`
    window.location.href = url
  }

  if (userBind.sessionState === 'authenticated') {
    return <HeaderInfo />
  }

  return (
    <>
      {userBind.sessionState === 'anonymous' ? (
        <Tooltip title={userBind.displayAddress}>
          <div className='flex-center border border-cyfs-green text-cyfs-green h-9 px-4 rounded-lg cursor-default text-sm'>
            Wallet {userBind.addressEllipsis()}
          </div>
        </Tooltip>
      ) : (
        <div></div>
      )}
      <div
        className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-9 px-4 rounded-lg cursor-pointer text-sm'
        onClick={() => {
          void handleLogin()
        }}
      >
        Login
      </div>
      <div></div>
    </>
  )
}

export default HeaderRight
