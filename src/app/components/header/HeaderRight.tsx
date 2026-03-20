'use client'
import { useUserStore } from '@hooks/index'
import HeaderInfo from '@components/header/HeaderInfo'
import { message } from 'antd'

const HeaderRight = () => {
  const user = useUserStore()
  const isLocalChainMode = process.env.NEXT_PUBLIC_NETWORK_ID === '31337'

  const handleLoginGithub = () => {
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

  if (user.isLogin() || isLocalChainMode) {
    return <HeaderInfo />
  }

  return (
    <>
      <div
        className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-9 px-4 rounded-lg cursor-pointer text-sm'
        onClick={handleLoginGithub}
      >
        Login with GitHub
      </div>
      <div></div>
    </>
  )
}

export default HeaderRight
