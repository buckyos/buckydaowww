'use client'
import { useUserStore } from '@hooks/index'
import HeaderInfo from '@components/header/HeaderInfo'

const HeaderRight = () => {
  const user = useUserStore()
  const handleLoginGithub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri =
      process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL +
      encodeURIComponent('?redirect=' + window.location.href)
    console.log('clientId', clientId, redirectUri)
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`
    // TODO 小窗处理
    window.location.href = url
  }

  if (user.isLogin()) {
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
