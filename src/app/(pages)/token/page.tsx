'use client'

import { useState } from 'react'
import Link from 'next/link'
import { decodeBytes32String } from 'ethers'
import { Button, Modal, Tag, Tooltip, Spin, message } from 'antd'
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAsyncEffect } from 'ahooks'
import { fetchTokenInfo, getDevRatio, newProviderContract, contractService } from '@contracts/index'
import { abis, erc20, ISourceProject, ProjectManagement } from '@contracts/abis'
import { useBindWalletAddress, useLockToken } from '@hooks/index'
import { showErrorMessage, transactionWait } from '@utils/index'
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

function decodeProjectName(bytes32Name: string) {
  try {
    return decodeBytes32String(bytes32Name)
  } catch {
    return bytes32Name
  }
}

const cardClassName =
  'rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'

type RewardTokenMetadata = {
  symbol: string
  decimals: number
}

type RewardAmount = {
  token: string
  amount: bigint
  withdrawed?: boolean
}

export default function TokenCenterPage() {
  const {
    governanceAddress,
    activeAddress,
    boundAddress,
    hasActiveWallet,
    handleConnectWallet,
  } =
    useBindWalletAddress()
  const { token: lockupToken } = useLockToken(governanceAddress)
  const [loading, setLoading] = useState(true)
  const [submittingAction, setSubmittingAction] = useState<
    '' | 'claim-lockup' | 'withdraw-dividend'
  >('')
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
  const [lockupDetails, setLockupDetails] = useState<{
    canClaim: bigint
    unlockProjectName: string
    unlockProjectVersion: bigint
    releasedAt: bigint
  }>({
    canClaim: 0n,
    unlockProjectName: '',
    unlockProjectVersion: 0n,
    releasedAt: 0n,
  })
  const [dividendOverview, setDividendOverview] = useState<{
    currentCycleIndex: bigint
    startBlocktime: bigint
    totalStaked: bigint
    currentUserStake: bigint
    previousUserStake: bigint
    rewardCount: number
    rewards: RewardAmount[]
    previousCycleIndex: bigint
    estimatedPreviousRewards: RewardAmount[]
  }>({
    currentCycleIndex: 0n,
    startBlocktime: 0n,
    totalStaked: 0n,
    currentUserStake: 0n,
    previousUserStake: 0n,
    rewardCount: 0,
    rewards: [],
    previousCycleIndex: 0n,
    estimatedPreviousRewards: [],
  })
  const [rewardTokenMeta, setRewardTokenMeta] = useState<Record<string, RewardTokenMetadata>>({})

  const resolveRewardTokenMetadata = async (
    tokens: string[],
    info: ContractTokenInfo,
  ) => {
    const uniqueTokens = [...new Set(tokens)]
    const entries = await Promise.all(
      uniqueTokens.map(async (tokenAddress) => {
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
          return [tokenAddress, { symbol: 'Native', decimals: 18 }] as const
        }

        if (tokenAddress.toLowerCase() === contractService.getAddressOfNormalToken().toLowerCase()) {
          return [tokenAddress, { symbol: info.normal.symbol, decimals: info.normal.decimals }] as const
        }

        if (tokenAddress.toLowerCase() === contractService.getAddressOfDevToken().toLowerCase()) {
          return [tokenAddress, { symbol: info.dev.symbol, decimals: info.dev.decimals }] as const
        }

        try {
          const token = await newProviderContract(tokenAddress, erc20)
          const [symbolRaw, decimalsRaw] = await Promise.all([
            token.symbol(),
            token.decimals(),
          ])
          return [
            tokenAddress,
            { symbol: String(symbolRaw), decimals: Number(decimalsRaw) },
          ] as const
        } catch {
          return [tokenAddress, { symbol: ellipsisAddress(tokenAddress), decimals: 18 }] as const
        }
      }),
    )

    return Object.fromEntries(entries)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [info, ratio] = await Promise.all([fetchTokenInfo(), getDevRatio()])
      setTokenInfo(info)
      const normalizedRatio = BigInt(ratio.toString())
      setDevRatio(normalizedRatio)

      if (governanceAddress) {
        const lockupContract = await newProviderContract(
          contractService.getAddressOfLockup(),
          abis,
        )
        const lockupInfoContract = await newProviderContract(
          contractService.getAddressOfLockup(),
          [
            'function unlockProjectName() view returns (bytes32)',
            'function unlockProjectVersion() view returns (uint64)',
          ],
        )
        const dividendContract = await newProviderContract(
          contractService.getAddressOfDividend(),
          abis,
        )
        const projectContract = await newProviderContract(
          contractService.getAddressOfProject(),
          [...ISourceProject, ...ProjectManagement],
        )
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
        const [
          canClaimRaw,
          unlockProjectNameRaw,
          unlockProjectVersionRaw,
          currentCycleIndexRaw,
          currentCycle,
        ] = await Promise.all([
          lockupContract.getCanClaimTokens.staticCall({ from: governanceAddress }),
          lockupInfoContract.unlockProjectName(),
          lockupInfoContract.unlockProjectVersion(),
          dividendContract.getCurrentCycleIndex(),
          dividendContract.getCurrentCycle(),
        ])
        const dev = BigInt(devRaw.toString())
        const normal = BigInt(normalRaw.toString())
        const votingPower = normal + (dev * normalizedRatio) / 100n
        const currentCycleIndex = BigInt(currentCycleIndexRaw.toString())
        const previousCycleIndex = currentCycleIndex > 0n ? currentCycleIndex - 1n : 0n
        const [
          currentUserStakeRaw,
          previousUserStakeRaw,
          previousCycleInfos,
          releasedAtRaw,
        ] = await Promise.all([
          dividendContract.getStakeAmount.staticCall(currentCycleIndex, {
            from: governanceAddress,
          }),
          dividendContract.getStakeAmount.staticCall(previousCycleIndex, {
            from: governanceAddress,
          }),
          currentCycleIndex > 0n
            ? dividendContract.getCycleInfos(previousCycleIndex, previousCycleIndex)
            : Promise.resolve([]),
          projectContract.versionReleasedTime(
            unlockProjectNameRaw,
            unlockProjectVersionRaw,
          ),
        ])
        const previousCycle = previousCycleInfos[0]
        const previousCycleRewardTokens = previousCycle
          ? previousCycle.rewards.map((reward: any) => reward.token)
          : []
        const estimatedPreviousRewardsRaw =
          currentCycleIndex > 0n && previousCycleRewardTokens.length > 0
            ? await dividendContract.estimateDividends.staticCall(
                [previousCycleIndex],
                previousCycleRewardTokens,
                { from: governanceAddress },
              )
            : []
        const rewardTokens = [
          ...currentCycle.rewards.map((reward: any) => reward.token),
          ...estimatedPreviousRewardsRaw.map((reward: any) => reward.token),
        ]
        const rewardTokenMetadata = await resolveRewardTokenMetadata(
          rewardTokens,
          info,
        )

        setWalletBalances({
          dev,
          normal,
          votingPower,
        })
        setLockupDetails({
          canClaim: BigInt(canClaimRaw.toString()),
          unlockProjectName: decodeProjectName(String(unlockProjectNameRaw)),
          unlockProjectVersion: BigInt(unlockProjectVersionRaw.toString()),
          releasedAt: BigInt(releasedAtRaw.toString()),
        })
        setDividendOverview({
          currentCycleIndex,
          startBlocktime: BigInt(currentCycle.startBlocktime.toString()),
          totalStaked: BigInt(currentCycle.totalStaked.toString()),
          currentUserStake: BigInt(currentUserStakeRaw.toString()),
          previousUserStake: BigInt(previousUserStakeRaw.toString()),
          rewardCount: currentCycle.rewards.length,
          rewards: currentCycle.rewards.map((reward: any) => ({
            token: reward.token,
            amount: BigInt(reward.amount.toString()),
          })),
          previousCycleIndex,
          estimatedPreviousRewards: estimatedPreviousRewardsRaw.map((reward: any) => ({
            token: reward.token,
            amount: BigInt(reward.amount.toString()),
            withdrawed: Boolean(reward.withdrawed),
          })),
        })
        setRewardTokenMeta(rewardTokenMetadata)
      } else {
        setWalletBalances({
          dev: 0n,
          normal: 0n,
          votingPower: 0n,
        })
        setLockupDetails({
          canClaim: 0n,
          unlockProjectName: '',
          unlockProjectVersion: 0n,
          releasedAt: 0n,
        })
        setDividendOverview({
          currentCycleIndex: 0n,
          startBlocktime: 0n,
          totalStaked: 0n,
          currentUserStake: 0n,
          previousUserStake: 0n,
          rewardCount: 0,
          rewards: [],
          previousCycleIndex: 0n,
          estimatedPreviousRewards: [],
        })
        setRewardTokenMeta({})
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
  const withdrawableRewards = dividendOverview.estimatedPreviousRewards.filter(
    (reward) => !reward.withdrawed && reward.amount > 0n,
  )

  const claimLockup = async () => {
    if (!hasActiveWallet) {
      const connected = await handleConnectWallet()
      if (!connected) {
        return
      }
    }

    if (lockupDetails.canClaim <= 0n || !tokenInfo) {
      message.info('No claimable lockup tokens are available right now')
      return
    }

    Modal.confirm({
      centered: true,
      title: 'Claim lockup tokens',
      okText: 'Claim now',
      cancelText: 'Cancel',
      content: (
        <div className='mt-4 flex flex-col gap-3 text-sm'>
          <div>
            You are about to claim your currently unlocked lockup allocation.
          </div>
          <div>
            <b>Claimable now:</b>{' '}
            {formatTokenBigInt(lockupDetails.canClaim, normalDecimals, 4)}{' '}
            {tokenInfo.normal.symbol}
          </div>
          <div>
            <b>Unlock target:</b>{' '}
            {lockupDetails.unlockProjectName
              ? `${lockupDetails.unlockProjectName} v${lockupDetails.unlockProjectVersion.toString()}`
              : 'Unknown'}
          </div>
          <div className='text-cyfs-gray'>
            Your wallet will open for the on-chain claim transaction after you confirm.
          </div>
        </div>
      ),
      onOk: async () => {
        try {
          setSubmittingAction('claim-lockup')
          const lockupContract = await contractService.getLockupContract()
          const tx = await lockupContract.claimTokens(lockupDetails.canClaim)
          const receipt = await transactionWait(tx)
          if (receipt?.status !== 1) {
            message.error(`Claim lockup failed [${receipt?.status}]`)
            return
          }
          message.success('Lockup tokens claimed successfully')
          await load()
        } catch (error) {
          showErrorMessage(error, 'Failed to claim lockup tokens')
        } finally {
          setSubmittingAction('')
        }
      },
    })
  }

  const withdrawDividends = async () => {
    if (!hasActiveWallet) {
      const connected = await handleConnectWallet()
      if (!connected) {
        return
      }
    }

    if (withdrawableRewards.length === 0 || dividendOverview.currentCycleIndex === 0n) {
      message.info('No withdrawable dividend rewards are available right now')
      return
    }

    const tokens = withdrawableRewards.map((reward) => reward.token)

    Modal.confirm({
      centered: true,
      title: 'Withdraw dividend rewards',
      okText: 'Withdraw rewards',
      cancelText: 'Cancel',
      content: (
        <div className='mt-4 flex flex-col gap-3 text-sm'>
          <div>
            You are about to withdraw all currently available dividend rewards for cycle #
            {dividendOverview.previousCycleIndex.toString()}.
          </div>
          <div>
            <b>Reward tokens:</b>
            <div className='mt-2 flex flex-wrap gap-2'>
              {withdrawableRewards.map((reward) => (
                <Tag key={`withdraw-${reward.token}`}>
                  {(rewardTokenMeta[reward.token]?.symbol ?? ellipsisAddress(reward.token))}:{' '}
                  {formatTokenBigInt(
                    reward.amount,
                    rewardTokenMeta[reward.token]?.decimals ?? 18,
                    4,
                  )}
                </Tag>
              ))}
            </div>
          </div>
          <div className='text-cyfs-gray'>
            Your wallet will open for the on-chain withdrawal transaction after you confirm.
          </div>
        </div>
      ),
      onOk: async () => {
        try {
          setSubmittingAction('withdraw-dividend')
          const dividendContract = await contractService.getDividendContract()
          const tx = await dividendContract.withdrawDividends(
            [dividendOverview.previousCycleIndex],
            tokens,
          )
          const receipt = await transactionWait(tx)
          if (receipt?.status !== 1) {
            message.error(`Withdraw dividends failed [${receipt?.status}]`)
            return
          }
          message.success('Dividend rewards withdrawn successfully')
          await load()
        } catch (error) {
          showErrorMessage(error, 'Failed to withdraw dividends')
        } finally {
          setSubmittingAction('')
        }
      },
    })
  }

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
                {formatTokenBigInt(lockupToken.assigned, normalDecimals, 2)}
              </div>
              <div className='mt-1 text-sm text-gray-500'>
                Claimed {formatTokenBigInt(lockupToken.claimed, normalDecimals, 2)} / Locked {formatTokenBigInt(lockupToken.locked, normalDecimals, 2)}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className={cardClassName}>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-medium'>Lockup Details</h2>
            <Tooltip title='Lockup releases NormalToken linearly over 6 months after the configured unlock condition is met. The current UI shows the amounts that are already assigned, claimed, locked, and claimable now.'>
              <InfoCircleOutlined />
            </Tooltip>
          </div>
          <div className='mt-4 space-y-4 text-sm text-gray-500'>
            <p>
              Locked allocations do not become immediately withdrawable. Once the target release condition is met,
              claimable amount increases linearly over 180 days.
            </p>
            {lockupDetails.unlockProjectName ? (
              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>Unlock Condition</div>
                <div className='mt-2 text-base font-medium text-black'>
                  Release of {lockupDetails.unlockProjectName} v{lockupDetails.unlockProjectVersion.toString()}
                </div>
                <div className='mt-2 text-sm text-gray-500'>
                  {lockupDetails.releasedAt > 0n
                    ? `Release detected at ${new Date(Number(lockupDetails.releasedAt) * 1000).toLocaleString()}`
                    : 'The target version has not been released on chain yet, so claimable amount remains zero.'}
                </div>
              </div>
            ) : null}
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                type='primary'
                disabled={lockupDetails.canClaim <= 0n}
                loading={submittingAction === 'claim-lockup'}
                onClick={() => void claimLockup()}
              >
                Claim Lockup
              </Button>
              <span className='text-sm text-gray-500'>
                {lockupDetails.canClaim > 0n
                  ? `Claimable now: ${formatTokenBigInt(lockupDetails.canClaim, normalDecimals, 4)} ${tokenInfo?.normal.symbol || ''}`
                  : 'No lockup tokens are claimable at the moment.'}
              </span>
            </div>
            {!governanceAddress ? (
              <p>Connect a wallet to see your lockup status.</p>
            ) : loading || !tokenInfo ? (
              <div className='flex justify-center py-8'>
                <Spin />
              </div>
            ) : (
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                  <div className='text-sm text-gray-500'>Assigned</div>
                  <div className='mt-2 text-2xl font-semibold'>
                    {formatTokenBigInt(lockupToken.assigned, normalDecimals, 2)}
                  </div>
                  <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.normal.symbol}</div>
                </div>
                <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                  <div className='text-sm text-gray-500'>Claimed</div>
                  <div className='mt-2 text-2xl font-semibold'>
                    {formatTokenBigInt(lockupToken.claimed, normalDecimals, 2)}
                  </div>
                  <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.normal.symbol}</div>
                </div>
                <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                  <div className='text-sm text-gray-500'>Still Locked</div>
                  <div className='mt-2 text-2xl font-semibold'>
                    {formatTokenBigInt(lockupToken.locked, normalDecimals, 2)}
                  </div>
                  <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.normal.symbol}</div>
                </div>
                <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                  <div className='text-sm text-gray-500'>Claimable Now</div>
                  <div className='mt-2 text-2xl font-semibold'>
                    {formatTokenBigInt(lockupDetails.canClaim, normalDecimals, 2)}
                  </div>
                  <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.normal.symbol}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={cardClassName}>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-medium'>Dividend Overview</h2>
            <Tooltip title='Dividend cycles distribute reward assets to stakers. Current-cycle stake affects the next cycle, so your previous cycle effective stake is often the more relevant number for expected rewards.'>
              <InfoCircleOutlined />
            </Tooltip>
          </div>
          <div className='mt-4 space-y-4 text-sm text-gray-500'>
            <p>
              Dividend stake and unstake activity updates cycle checkpoints. Rewards for a closed cycle are based on
              historical effective stake, not just your live wallet balance.
            </p>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                type='primary'
                disabled={withdrawableRewards.length === 0}
                loading={submittingAction === 'withdraw-dividend'}
                onClick={() => void withdrawDividends()}
              >
                Withdraw Dividends
              </Button>
              <span className='text-sm text-gray-500'>
                {withdrawableRewards.length > 0
                  ? `Withdraw ${withdrawableRewards.length} reward token(s) from cycle #${dividendOverview.previousCycleIndex.toString()}`
                  : 'No withdrawable dividend rewards are available right now.'}
              </span>
            </div>
            {loading ? (
              <div className='flex justify-center py-8'>
                <Spin />
              </div>
            ) : !tokenInfo ? null : (
              <>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                    <div className='text-sm text-gray-500'>Current Cycle</div>
                    <div className='mt-2 text-2xl font-semibold'>
                      #{dividendOverview.currentCycleIndex.toString()}
                    </div>
                    <div className='mt-1 text-sm text-gray-500'>
                      Started{' '}
                      {dividendOverview.startBlocktime > 0n
                        ? new Date(Number(dividendOverview.startBlocktime) * 1000).toLocaleString()
                        : '-'}
                    </div>
                  </div>
                  <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                    <div className='text-sm text-gray-500'>Current Total Staked</div>
                    <div className='mt-2 text-2xl font-semibold'>
                      {formatTokenBigInt(dividendOverview.totalStaked, normalDecimals, 2)}
                    </div>
                    <div className='mt-1 text-sm text-cyfs-green'>{tokenInfo.normal.symbol}</div>
                  </div>
                </div>

                {governanceAddress ? (
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                      <div className='text-sm text-gray-500'>My Current-Cycle Stake</div>
                      <div className='mt-2 text-2xl font-semibold'>
                        {formatTokenBigInt(dividendOverview.currentUserStake, normalDecimals, 2)}
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        Becomes effective for reward calculation in the next cycle.
                      </div>
                    </div>
                    <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                      <div className='text-sm text-gray-500'>My Previous-Cycle Effective Stake</div>
                      <div className='mt-2 text-2xl font-semibold'>
                        {formatTokenBigInt(dividendOverview.previousUserStake, normalDecimals, 2)}
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        This is the stake base that matters for the current closed-cycle reward estimate.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-6 py-8 text-sm text-gray-500'>
                    Connect a wallet to see your cycle-by-cycle dividend stake view.
                  </div>
                )}

                <div>
                  <div className='text-sm font-medium text-black'>Current Cycle Reward Pool</div>
                  {dividendOverview.rewardCount === 0 ? (
                    <div className='mt-2 text-sm text-gray-500'>No reward deposits recorded in the current cycle yet.</div>
                  ) : (
                    <div className='mt-3 space-y-2'>
                      {dividendOverview.rewards.map((reward) => (
                        <div
                          key={`${reward.token}-${reward.amount.toString()}`}
                          className='flex items-center justify-between gap-4 rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3'
                        >
                          <div>
                            <div className='text-sm font-medium text-black'>
                              {rewardTokenMeta[reward.token]?.symbol ?? ellipsisAddress(reward.token)}
                            </div>
                            <div className='font-mono text-xs text-gray-500 break-all'>
                              {reward.token === '0x0000000000000000000000000000000000000000'
                                ? '0x0000000000000000000000000000000000000000'
                                : reward.token}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-sm font-medium'>
                              {formatTokenBigInt(
                                reward.amount,
                                rewardTokenMeta[reward.token]?.decimals ?? 18,
                                4,
                              )}
                            </div>
                            <div className='text-xs text-gray-500'>Current cycle deposited total</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className='text-sm font-medium text-black'>Previous Closed-Cycle Reward Estimate</div>
                  {dividendOverview.currentCycleIndex === 0n ? (
                    <div className='mt-2 text-sm text-gray-500'>
                      Cycle 0 has no full-cycle stake history, so there is no claimable dividend estimate yet.
                    </div>
                  ) : dividendOverview.estimatedPreviousRewards.length === 0 ? (
                    <div className='mt-2 text-sm text-gray-500'>
                      No withdrawable reward is currently estimated for cycle #{dividendOverview.previousCycleIndex.toString()}.
                    </div>
                  ) : (
                    <div className='mt-3 space-y-2'>
                      {dividendOverview.estimatedPreviousRewards.map((reward) => (
                        <div
                          key={`${dividendOverview.previousCycleIndex.toString()}-${reward.token}-${reward.amount.toString()}`}
                          className='flex items-center justify-between gap-4 rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3'
                        >
                          <div>
                            <div className='text-sm font-medium text-black'>
                              {rewardTokenMeta[reward.token]?.symbol ?? ellipsisAddress(reward.token)}
                            </div>
                            <div className='font-mono text-xs text-gray-500 break-all'>
                              {reward.token}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-sm font-medium'>
                              {formatTokenBigInt(
                                reward.amount,
                                rewardTokenMeta[reward.token]?.decimals ?? 18,
                                4,
                              )}
                            </div>
                            <div className='mt-1'>
                              <Tag color={reward.withdrawed ? 'default' : 'green'}>
                                {reward.withdrawed ? 'Withdrawn' : 'Withdrawable'}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

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
            Lockup does not release instantly. Once its configured unlock condition is satisfied, NormalToken becomes
            claimable linearly over 6 months.
          </p>
          <p>
            Dividend rewards are cycle-based. Stake changes made in the current cycle affect the next cycle, so
            current-cycle stake and effective reward stake are intentionally not the same concept.
          </p>
          <p>
            Token Center reads on-chain contracts directly. Reward estimates reflect chain state at refresh time and do
            not depend on backend indexing.
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
