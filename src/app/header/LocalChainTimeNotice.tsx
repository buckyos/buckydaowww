'use client'

import { useEffect, useState } from 'react'
import { Alert } from 'antd'
import dayjs from 'dayjs'

type BackendStatusResponse = {
  cur_block: number
  cur_block_timestamp?: number
  total_propose: number
  total_project: number
  total_acquired: number
}

const LOCAL_CHAIN_ID = '31337'
const LARGE_TIME_SKEW_SECONDS = 24 * 60 * 60

function formatAbsoluteTime(timestamp: number) {
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm')
}

function formatSkewDuration(seconds: number) {
  const abs = Math.abs(seconds)
  const days = Math.floor(abs / (24 * 60 * 60))
  const hours = Math.floor((abs % (24 * 60 * 60)) / 3600)

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }

  return `${hours}h`
}

export default function LocalChainTimeNotice() {
  const [skewInfo, setSkewInfo] = useState<{
    chainTimestamp: number
    localTimestamp: number
    skewSeconds: number
  } | null>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NETWORK_ID !== LOCAL_CHAIN_ID) {
      return
    }

    let cancelled = false

    const loadStatus = async () => {
      try {
        const response = await fetch('/api/status')
        if (!response.ok) {
          return
        }

        const status = (await response.json()) as BackendStatusResponse
        const chainTimestamp = status.cur_block_timestamp
        if (!chainTimestamp) {
          return
        }

        const localTimestamp = Math.floor(Date.now() / 1000)
        const skewSeconds = chainTimestamp - localTimestamp

        if (!cancelled && Math.abs(skewSeconds) >= LARGE_TIME_SKEW_SECONDS) {
          setSkewInfo({
            chainTimestamp,
            localTimestamp,
            skewSeconds,
          })
        }
      } catch (error) {
        console.warn('failed to load local chain status', error)
      }
    }

    void loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  if (!skewInfo) {
    return null
  }

  const chainAhead = skewInfo.skewSeconds > 0
  const skewLabel = formatSkewDuration(skewInfo.skewSeconds)

  return (
    <div className='max-w-[1260px] mx-auto px-4 pt-2'>
      <Alert
        showIcon
        type='warning'
        message='Local chain time differs from your computer clock'
        description={
          <div className='leading-6'>
            <div>
              The local Hardhat chain is currently{' '}
              <b>{chainAhead ? 'ahead of' : 'behind'}</b> your computer by{' '}
              <b>{skewLabel}</b>.
            </div>
            <div>
              Chain time: <b>{formatAbsoluteTime(skewInfo.chainTimestamp)}</b>
              {' | '}
              Local time: <b>{formatAbsoluteTime(skewInfo.localTimestamp)}</b>
            </div>
            <div>
              Proposal expiry, investment phases, lockup claims, and settlement
              windows follow chain time.
            </div>
          </div>
        }
      />
    </div>
  )
}
