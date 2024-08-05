'use client'
import { useState } from 'react'
import useUserStore from '@hooks/useUserStore'
import HeaderUserAvatar from './HeaderUserAvatar'
import { useAsyncEffect } from 'ahooks'
import { getTokenContract } from '@contracts/index'
import { formatUnits } from 'ethers'
import { Tag } from 'antd'

const HeaderRight = () => {
  const user = useUserStore()
  const [tokenAmount, setTokenAmount] = useState<string>('')

  useAsyncEffect(async () => {
    if (user.user.address) {
      const instance = await getTokenContract()
      const token = await instance.balanceOf(user.user.address)
      console.log('token', token)
      setTokenAmount(formatUnits(token, 18))
    }
  }, [user])
  return (
    <>
      <div className='flex-center gap-2'>
        <div className='flex-center'>
          <div>{tokenAmount ? tokenAmount : 0}</div>
          <Tag>BDT</Tag>
        </div>
        <HeaderUserAvatar />
      </div>
    </>
  )
}

const HeaderLogin = () => {
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
    return <HeaderRight />
  }

  return (
    <div
      className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-9 px-4 rounded-lg cursor-pointer text-sm'
      onClick={handleLoginGithub}
    >
      Login with GitHub
    </div>
  )
}

export default HeaderLogin
