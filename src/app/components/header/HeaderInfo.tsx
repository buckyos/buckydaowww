'use client'
import { useState } from 'react'
import useUserStore from '@hooks/useUserStore'
import HeaderUserAvatar from '../../header/HeaderUserAvatar'
import { useAsyncEffect } from 'ahooks'
import { contractService } from '@contracts/index'
import { formatUnits } from 'ethers'
import { Spin } from 'antd'
import HeaderTokenInfo from './HeaderTokenInfo'

const HeaderInfo = () => {
  const user = useUserStore()
  const [loading, setLoading] = useState<boolean>(false)
  const [devTokenAmount, setDevTokenAmount] = useState<string>('')
  const [normalTokenAmount, setNormalTokenAmount] = useState<string>('')

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
      setDevTokenAmount(parseFloat(formatUnits(token[0], 18)).toFixed(2))
      setNormalTokenAmount(parseFloat(formatUnits(token[1], 18)).toFixed(2))
      setLoading(false)
    }
  }

  useAsyncEffect(async () => {
    await reload()
  }, [user])
  
  return (
    <>
      <div className='flex-center gap-2'>
        <div className='flex-center' >
          {loading && <Spin className='mr-4' size='small' />}
          {!loading && <HeaderTokenInfo devTokenAmount={devTokenAmount} normalTokenAmount={normalTokenAmount} reload={reload}/>}
        </div>
        <HeaderUserAvatar />
      </div>
    </>
  )
}

export default HeaderInfo
