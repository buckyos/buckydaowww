'use client'
import { useState } from 'react'
import useUserStore from '@hooks/useUserStore'
import HeaderUserAvatar from './HeaderUserAvatar'
import { useAsyncEffect } from 'ahooks'
import { contractService } from '@contracts/index'
import { formatUnits } from 'ethers'
import { Tag, Spin } from 'antd'

const HeaderRight = () => {
  const user = useUserStore()
  const [loading, setLoading] = useState<boolean>(false)
  const [tokenAmount, setTokenAmount] = useState<string>('')

  const reload = async () => {
    if (user.user.address) {
      setLoading(true)
      const devToken = await contractService.getDevTokenContract()
      const normalToken = await contractService.getNormalTokenContract()
      const token = await Promise.all([
        devToken.balanceOf(user.user.address),
        normalToken.balanceOf(user.user.address)
      ]) 
      console.log('token', token)
      setTokenAmount(parseFloat(formatUnits(token[0], 18)).toFixed(2))
      setLoading(false)
    }
  }

  useAsyncEffect(async () => {
    await reload()
  }, [user])

  return (
    <>
      <div className='flex-center gap-2'>
        <div className='flex-center' onClick={() => reload()}>
          {loading && <Spin size='small' />}
          {!loading && <div>{tokenAmount ? tokenAmount : 0}</div>}
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
