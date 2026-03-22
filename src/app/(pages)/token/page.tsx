'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tag, Tooltip, Spin } from 'antd'
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAsyncEffect } from 'ahooks'
import { fetchTokenInfo, getDevRatio, newProviderContract, contractService } from '@contracts/index'
import { abis } from '@contracts/abis'
import { useBindWalletAddress, useLockToken } from '@hooks/index'
import { formatAmount, wrapUnits } from '@utils/numberConverter'

function ellipsisAddress(address?: string) {
  if (!address) {
    return '-'
  }

  if (address.length <= 15) {
    return address
  }

  return `${address.slice(0, 6)}...${address.slice(-5)}`
}

function formatPercentFromRatio(ratio: bigint) {
  return `${(Number(ratio) / 100).toFixed(2)}x`
}

function formatTokenNumber(value?: number) {
  if (value === undefined) {
    return '-'
  }
  return formatAmount(value, 3, false)
}

function formatTokenBigInt(
  rawValue: bigint,
  decimals: number,
  fractionDigits = 4,
) {
  return Number.parseFloat(wrapUnits(rawValue, decimals)).toFixed(fractionDigits)
}

const cardClassName =
  'rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'

export default function TokenCenterPage() {
  const { governanceAddress, activeAddress, boundAddress, hasActiveWallet } =
    useBindWalletAddress()
  const { token: lockupToken } = useLockToken(governanceAddress)
  const [loading, setLoading] = useState(true)
  const [tokenInfo, setTokenInfo] = useState<ContractTokenInfo>()
  const [devRatio, setDevRatio] = useState<bigint>(0n)
  const [walletBalances, setWalletBalances] = useState<{
    dev: bigint
    normal: bigint
    votingPower: bigint
  }>({
    dev: 0n,
    normal: 0n,
    votingPower: 0n,
  })

  const load = async () => {
    setLoading(true)
    try {
      const [info, ratio] = await Promise.all([fetchTokenInfo(), getDevRatio()])
      setTokenInfo(info)
      const normalizedRatio = BigInt(ratio.toString())
      setDevRatio(normalizedRatio)

      if (governanceAddress) {
        const devToken = await newProviderContract(
          contractService.getAddressOfDevToken(),
          abis,
        )
        const normalToken = await newProviderContract(
          contractService.getAddressOfNormalToken(),
          abis,
        )
        const [devRaw, normalRaw] = await Promise.all([
          devToken.balanceOf(governanceAddress),
          normalToken.balanceOf(governanceAddress),
        ])
        const dev = BigInt(devRaw.toString())
        const normal = BigInt(normalRaw.toString())
        const votingPower = normal + (dev * normalizedRatio) / 100n
        setWalletBalances({
          dev,
          normal,
          votingPower,
        })
      } else {
        setWalletBalances({
          dev: 0n,
          normal: 0n,
          votingPower: 0n,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useAsyncEffect(async () => {
    await load()
  }, [governanceAddress])

  const devDecimals = tokenInfo?.dev.decimals ?? 18
  const normalDecimals = tokenInfo?.normal.decimals ?? 18

  return (
    <div className='space-y-8 py-8'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-3xl font-semibold'>Token Center</h1>
          <p className='mt-2 max-w-3xl text-sm leading-7 text-gray-500'>
            Read-only token overview for the current chain. This page summarizes
            protocol token supply, current voting ratio, your wallet balances,
            and lockup-related numbers without depending on backend APIs.
          </p>
        </div>
        <button
          className='inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
          type='button'
          onClick={() => {
            void load()
          }}
        >
          <ReloadOutlined />
          Refresh
        </button>
      </div>

      <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
        <section className={cardClassName}>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div>
              <h2 className='text-xl font-medium'>Protocol Overview</h2>
              <p className='mt-1 text-sm text-gray-500'>
                Supply and voting-weight information from on-chain contracts.
              </p>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <span>{process.env.NEXT_PUBLIC_CHAIN}</span>
              <Tag>Network {process.env.NEXT_PUBLIC_NETWORK_ID}</Tag>
            </div>
          </div>

          {loading || !tokenInfo ? (
            <div className='flex justify-center py-16'>
              <Spin />
            </div>
          ) : (
            <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>BDDT Total Supply</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenNumber(tokenInfo.dev.totalSupply)}
                </div>
                <div className='mt-1 text-sm text-cyfs-green'>
                  {tokenInfo.dev.symbol}
                </div>
              </div>

              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>BDT Circulating Supply</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenNumber(tokenInfo.normal.totalSupply)}
                </div>
                <div className='mt-1 text-sm text-cyfs-green'>
                  {tokenInfo.normal.symbol}
                </div>
              </div>

              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>BDDT Released</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenNumber(tokenInfo.dev.totalReleased)}
                </div>
                <div className='mt-1 text-sm text-gray-500'>
                  {tokenInfo.dev.totalReleasedPercent.toFixed(2)}% of total
                </div>
              </div>

              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                  <span>Current Vote Weight</span>
                  <Tooltip title='Full-vote power is computed as BDT + (BDDT * devRatio / 100).'>
                    <InfoCircleOutlined />
                  </Tooltip>
                </div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatPercentFromRatio(devRatio)}
                </div>
                <div className='mt-1 text-sm text-gray-500'>1 BDDT vote weight multiplier</div>
              </div>
            </div>
          )}
        </section>

        <section className={cardClassName}>
          <h2 className='text-xl font-medium'>Contract Addresses</h2>
          <div className='mt-4 space-y-3 text-sm'>
            <div>
              <div className='text-gray-500'>Main</div>
              <a
                className='font-mono text-cyfs-green break-all'
                href={`${process.env.NEXT_PUBLIC_ADDRESS_LINK}${contractService.getAddressOfMain()}`}
                target='_blank'
              >
                {contractService.getAddressOfMain()}
              </a>
            </div>
            <div>
              <div className='text-gray-500'>BDT</div>
              <a
                className='font-mono text-cyfs-green break-all'
                href={`${process.env.NEXT_PUBLIC_TOKEN_ADDRESS_LINK}${contractService.getAddressOfNormalToken()}`}
                target='_blank'
              >
                {contractService.getAddressOfNormalToken()}
              </a>
            </div>
            <div>
              <div className='text-gray-500'>BDDT</div>
              <a
                className='font-mono text-cyfs-green break-all'
                href={`${process.env.NEXT_PUBLIC_TOKEN_ADDRESS_LINK}${contractService.getAddressOfDevToken()}`}
                target='_blank'
              >
                {contractService.getAddressOfDevToken()}
              </a>
            </div>
            <div>
              <div className='text-gray-500'>Lockup</div>
              <span className='font-mono break-all'>{contractService.getAddressOfLockup()}</span>
            </div>
            <div>
              <div className='text-gray-500'>Dividend</div>
              <span className='font-mono break-all'>{contractService.getAddressOfDividend()}</span>
            </div>
            <div>
              <div className='text-gray-500'>Committee</div>
              <span className='font-mono break-all'>{contractService.getAddressOfCommittee()}</span>
            </div>
          </div>
        </section>
      </div>

      <section className={cardClassName}>
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div>
            <h2 className='text-xl font-medium'>My Wallet Snapshot</h2>
            <p className='mt-1 text-sm text-gray-500'>
              Current balances and voting power for the active governance address.
            </p>
          </div>
          <div className='text-sm text-gray-500'>
            {governanceAddress ? (
              <div className='space-y-1 text-right'>
                <div>
                  Wallet: <span className='font-mono text-cyfs-green'>{ellipsisAddress(governanceAddress)}</span>
                </div>
                {boundAddress && boundAddress !== governanceAddress ? (
                  <div>
                    Bound: <span className='font-mono'>{ellipsisAddress(boundAddress)}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              'Connect a wallet to see personal balances'
            )}
          </div>
        </div>

        {!governanceAddress ? (
          <div className='mt-6 rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-6 py-8 text-sm text-gray-500'>
            No wallet is currently connected. You can still use the protocol overview above, but
            personal token balances, lockup status, and voting power require a connected wallet.
          </div>
        ) : loading || !tokenInfo ? (
          <div className='flex justify-center py-16'>
            <Spin />
          </div>
        ) : (
          <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='text-sm text-gray-500'>My BDT</div>
              <div className='mt-2 text-2xl font-semibold'>
                {formatTokenBigInt(walletBalances.normal, normalDecimals)}
              </div>
              <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.normal.symbol}</div>
            </div>

            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='text-sm text-gray-500'>My BDDT</div>
              <div className='mt-2 text-2xl font-semibold'>
                {formatTokenBigInt(walletBalances.dev, devDecimals)}
              </div>
              <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.dev.symbol}</div>
            </div>

            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='flex items-center gap-1 text-sm text-gray-500'>
                <span>My Voting Power</span>
                <Tooltip title='Computed as BDT + (BDDT * devRatio / 100) using current on-chain balances.'>
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
              <div className='mt-2 text-2xl font-semibold'>
                {formatTokenBigInt(walletBalances.votingPower, normalDecimals)}
              </div>
              <div className='mt-1 text-sm text-gray-500'>Current full-vote weight</div>
            </div>

            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='text-sm text-gray-500'>Lockup Assigned / Claimed</div>
              <div className='mt-2 text-2xl font-semibold'>
                {formatTokenBigInt(lockupToken.assigned, devDecimals, 2)}
              </div>
              <div className='mt-1 text-sm text-gray-500'>
                Claimed {formatTokenBigInt(lockupToken.claimed, devDecimals, 2)} / Locked {formatTokenBigInt(lockupToken.locked, devDecimals, 2)}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={cardClassName}>
        <h2 className='text-xl font-medium'>Notes</h2>
        <div className='mt-4 space-y-2 text-sm leading-7 text-gray-500'>
          <p>
            BDDT is the non-circulating developer equity token. BDT is the circulating common token.
          </p>
          <p>
            For full-community votes, the current vote weight is computed from the live on-chain ratio:
            {' '}<span className='font-mono'>BDT + (BDDT * devRatio / 100)</span>.
          </p>
          <p>
            For proposal workflows and project/version governance, see{' '}
            <Link className='text-cyfs-green underline underline-offset-2' href='/projects'>
              Project pages
            </Link>
            {' '}or the{' '}
            <a
              className='text-cyfs-green underline underline-offset-2'
              href='https://github.com/buckyos/SourceDAO/blob/main/docs/ProjectVersionGuide.md'
              target='_blank'
            >
              Project / Version guide
            </a>.
          </p>
          {!hasActiveWallet ? (
            <p>
              You can browse protocol-level token information without a wallet, but personal balance,
              lockup, and voting power require an active browser wallet connection.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
