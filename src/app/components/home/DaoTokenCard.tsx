import React, { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { Progress, Spin, Tooltip } from 'antd'
import {
  fetchTokenInfo,
} from '@contracts/index'
import {
  formatAmount
} from '@utils/numberConverter'
import useContractStore from '@hooks/useContract'
import { InfoCircleOutlined } from '@ant-design/icons'


const DaoTokenAmountCard: React.FC<{}> = () => {
  const { update } = useContractStore((state) => ({
    update: state.update,
  }))
  const [info, setInfo] = useState<ContractTokenInfo>()
  useAsyncEffect(async () => {
    const token = await fetchTokenInfo()
    console.log(token)
    setInfo(token)
    const devToken = token.dev
    update(devToken.totalSupply, devToken.totalReleased, token.normal.totalSupply, devToken.symbol, devToken.decimals)
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
      <div className='w-48 h-[90px] flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex items-baseline gap-1'>
          <div className='text-xl font-medium'>{formatAmount(info?.dev.totalSupply, 3, false)}</div>
          <div className='font-bold text-cyfs-green'>{info?.dev.symbol}</div>
        </div>
        <Tooltip title={`BDDT is a non-circulating equity token. Developers obtain it through project settlement and have greater rights when voting.
Currently: 1 vote of BDDT = 4 votes of BDT`}>
          <div className='text-sm text-black-secondary'>Total
            <InfoCircleOutlined />
          </div>
        </Tooltip>
      </div>
      <div className='w-48 h-[90px] flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex items-baseline gap-1'>
          <div className='text-xl font-medium'>{formatAmount(info?.normal.totalSupply, 3, false)}</div>
          <div className='font-bold text-cyfs-green'>{info?.normal.symbol}</div>
        </div>
        <Tooltip title={`BDT is a common circulated token. BDDT can be exchanged for BDT in a 1:1 one-way manner
Currently: 1 vote of BDDT = 4 votes of BDT`}>
          <div className='text-sm text-black-secondary'>Circulation
            <InfoCircleOutlined />
          </div>
        </Tooltip>
      </div>
      <div className='w-48 h-[90px] flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
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
      <div className='w-48 h-[90px] flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
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
    </React.Fragment>
  )
}

export default DaoTokenAmountCard
