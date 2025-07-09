import React, { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { Progress, Spin } from 'antd'
import {
  fetchTokenInfo,
} from '@contracts/index'
import {
  formatAmount
} from '@utils/numberConverter'

const DaoTokenAmountCard: React.FC<{}> = () => {
  const [info, setInfo] = useState<ContractTokenInfo>()
  useAsyncEffect(async () => {
    const token = await fetchTokenInfo()
    console.log(token)
    setInfo(token)
  }, [])

  if (!info?.dev || !info.normal) {
    return (
      <React.Fragment>
        <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
        <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
        <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
        <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
      <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline gap-1'>
            <div className='text-xl font-medium'>{formatAmount(info?.dev.totalSupply, 3, false)}</div>
            <div className='font-bold text-cyfs-green'>{info?.dev.symbol}</div>
          </div>
          <div className='text-sm text-black-secondary'>Total</div>
        </div>
      </div>
      <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline gap-1'>
            <div className='text-xl font-medium'>{formatAmount(info?.normal.totalSupply, 3, false)}</div>
            <div className='font-bold text-cyfs-green'>{info?.normal.symbol}</div>
          </div>
          <div className='text-sm text-black-secondary'>Destroyed</div>
        </div>
      </div>
      <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline gap-1'>
            <div className='text-xl font-medium'>{formatAmount(info?.dev.totalReleased, 3, false)}</div>
            <div className='font-bold text-cyfs-green'>{info?.dev.symbol}</div>
          </div>
          <div className=' absolute top-0 right-0 scale-75'>
            <Progress
              steps={4}
              percent={info?.dev.totalReleasedPercent}
              size='small'
              status='active'
            />
          </div>
          <div className='text-sm text-black-secondary'>Released</div>
        </div>
      </div>
      <div className='w-48 h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline gap-1'>
            <div className='text-xl font-medium'>{formatAmount(info?.dev.unrelease, 3, false)}</div>
            <div className='font-bold text-cyfs-green'>{info?.dev.symbol}</div>
          </div>
          <div className=' absolute top-0 right-0 scale-75'>
            <Progress
              steps={4}
              percent={info?.dev.unreleasePercent}
              size='small'
              status='active'
            />
          </div>
          <div className='text-sm text-black-secondary'>Unreleased</div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default DaoTokenAmountCard
