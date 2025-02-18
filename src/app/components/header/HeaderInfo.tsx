'use client'
import { useState } from 'react'
import useUserStore from '@hooks/useUserStore'
import HeaderUserAvatar from '../../header/HeaderUserAvatar'
import { useAsyncEffect } from 'ahooks'
import { getTokenContract } from '@contracts/index'
import { formatUnits } from 'ethers'
import { Tag, Spin } from 'antd'

const HeaderInfo = () => {
  const user = useUserStore()
  const [loading, setLoading] = useState<boolean>(false)
  const [tokenAmount, setTokenAmount] = useState<string>('')

  const reload = async () => {
    if (user.user.address) {
      setLoading(true)
      const instance = await getTokenContract()
      const token = await instance.balanceOf(user.user.address)
      console.log('token', token)
      setTokenAmount(parseFloat(formatUnits(token, 18)).toFixed(2))
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

export default HeaderInfo
