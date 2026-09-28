'use client'
import React, { useEffect, useState } from 'react'
import { Progress, Spin, Tooltip } from 'antd'
import {
  formatAmount
} from '@utils/numberConverter'
import useContractStore from '@hooks/useContract'
import { InfoCircleOutlined } from '@ant-design/icons'
import { fetchContractTokenInfo } from '@services/index'


const DaoTokenAmountCard: React.FC<{}> = () => {
  const { update } = useContractStore((state) => ({
    update: state.update,
  }))
  const [info, setInfo] = useState<ContractTokenInfo>()
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let disposed = false
    let pending = false
    let activeController: AbortController | null = null

    const refresh = async () => {
      if (pending) return
      pending = true
      const controller = new AbortController()
      activeController = controller
      const timeout = window.setTimeout(() => controller.abort(), 15000)

      try {
        const result = await fetchContractTokenInfo(controller.signal)
        if (disposed) return
        const token = result.data
        setInfo(token)
        setRefreshFailed(false)
        const devToken = token.dev
        update(devToken.totalSupply, devToken.totalReleased, devToken.unrelease, devToken.symbol, devToken.decimals)
      } catch (error) {
        if (!disposed) {
          console.error('Failed to refresh DAO token info', error)
          setRefreshFailed(true)
        }
      } finally {
        window.clearTimeout(timeout)
        activeController = null
        pending = false
      }
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    const interval = window.setInterval(refreshIfVisible, 30000)
    window.addEventListener('focus', refreshIfVisible)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      disposed = true
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshIfVisible)
      document.removeEventListener('visibilitychange', refreshIfVisible)
      activeController?.abort()
    }
  }, [update, retryCount])

  if (!info?.dev || !info.normal) {
    if (refreshFailed) {
      return (
        <div className='col-span-full' role='status'>
          Token information is temporarily unavailable.{' '}
          <button type='button' className='text-cyfs-green underline' onClick={() => setRetryCount((count) => count + 1)}>
            Retry
          </button>
        </div>
      )
    }

    return (
      <React.Fragment>
        <div className='w-full h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
        <div className='w-full h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
        <div className='w-full h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
        <div className='w-full h-[90px] flex justify-center items-center border border-solid rounded-lg border-[#F0F0F0] relative'>
          <Spin />
        </div>
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
      <div className='w-full h-28 flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex items-baseline gap-1'>
          <div className='text-xl font-medium'>{formatAmount(info?.dev.totalSupply, 3, false)}</div>
          <div className='font-bold text-cyfs-green'>{info?.dev.symbol}</div>
        </div>
        <Tooltip title={
          <div style={{ whiteSpace: 'pre-line' }}>
            {`BDDT is a non-circulating equity token. Developers obtain it through project settlement and have greater rights when voting.
Currently: 1 vote of BDDT = 4 votes of BDT`}
          </div>
        }>
          <div className='text-sm text-black-secondary'>Total
            <InfoCircleOutlined className='ml-1' />
          </div>
        </Tooltip>
      </div>
      <div className='w-full h-28 flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
        <div className='flex items-baseline gap-1'>
          <div className='text-xl font-medium'>{formatAmount(info?.normal.totalSupply, 3, false)}</div>
          <div className='font-bold text-cyfs-green'>{info?.normal.symbol}</div>
        </div>
        <Tooltip title={
          <div style={{ whiteSpace: 'pre-line' }}>
            {`BDT is a common circulated token. BDDT can be exchanged for BDT in a 1:1 one-way manner
Currently: 1 vote of BDDT = 4 votes of BDT`}
          </div>
        }>
          <div className='text-sm text-black-secondary'>Circulation
            <InfoCircleOutlined className='ml-1' />
          </div>
        </Tooltip>
      </div>
      <div className='w-full h-28 flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
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
      <div className='w-full h-28 flex-center flex-col gap-2 border border-solid rounded-lg border-[#F0F0F0] relative'>
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
      {refreshFailed && (
        <div className='col-span-full text-sm' role='status'>
          Token information could not be refreshed.{' '}
          <button type='button' className='text-cyfs-green underline' onClick={() => setRetryCount((count) => count + 1)}>
            Retry
          </button>
        </div>
      )}
    </React.Fragment>
  )
}

export default DaoTokenAmountCard
