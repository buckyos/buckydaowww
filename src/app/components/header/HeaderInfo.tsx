'use client'
import { useState } from 'react'
import { useBindWalletAddress } from '@hooks/index'
import HeaderUserAvatar from '../../header/HeaderUserAvatar'
import { useAsyncEffect } from 'ahooks'
import { abis } from '@contracts/abis'
import { contractService, newProviderContract } from '@contracts/index'
import { formatUnits } from 'ethers'
import { Spin } from 'antd'
import HeaderTokenInfo from './HeaderTokenInfo'

const HeaderInfo = () => {
  const { displayAddress } = useBindWalletAddress()
  const [loading, setLoading] = useState<boolean>(false)
  const [devTokenAmount, setDevTokenAmount] = useState<string>('')
  const [normalTokenAmount, setNormalTokenAmount] = useState<string>('')

  const reload = async () => {
    if (displayAddress) {
      setLoading(true)
      const devToken = await newProviderContract(contractService.getAddressOfDevToken(), abis)
      const normalToken = await newProviderContract(contractService.getAddressOfNormalToken(), abis)
      const token = await Promise.all([
        devToken.balanceOf(displayAddress),
        normalToken.balanceOf(displayAddress)
      ])
      // console.log('token', token)
      setDevTokenAmount(parseFloat(formatUnits(token[0], 18)).toFixed(2))
      setNormalTokenAmount(parseFloat(formatUnits(token[1], 18)).toFixed(2))
      setLoading(false)
      return
    }

    setDevTokenAmount('')
    setNormalTokenAmount('')
  }

  useAsyncEffect(async () => {
    await reload()
  }, [displayAddress])
  
  return (
    <>
      <div className='flex items-start gap-3'>
        <div className='flex items-center pt-2' >
          {loading && <Spin className='mr-4' size='small' />}
          {!loading && <HeaderTokenInfo devTokenAmount={devTokenAmount} normalTokenAmount={normalTokenAmount} reload={reload}/>}
        </div>
        <HeaderUserAvatar />
      </div>
    </>
  )
}

export default HeaderInfo
