'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import { Alert, Breadcrumb, Descriptions, Modal, Spin, Tag, message } from 'antd'
import type { DescriptionsProps } from 'antd'
import _ from 'lodash'
import dayjs from 'dayjs'
import { formatUnits } from 'ethers'

import { getTwoStepInvestmentDetail } from '@services/index'
import InvestmentSubscriptionModal from '@components/modal/InvestmentSubscriptionModal'
import { useBindWalletAddress, useUserStore } from '@hooks/index'
import { contractService, endInvestment, getDecimals, getSymbol } from '@contracts/index'
import TokenWithSymbol from '@components/funding/TokenWithSymbol'
import SubscribeProgress from '@components/invest/SubscribeProgress'
import { formatAmount, formatNumberWithCommas } from '@utils/numberConverter'

import InvestStatusTag from '@components/invest/InvestStatusTag'

type InvestmentStage = 'step1' | 'step2' | 'ended'

function getInvestmentStage(data: TwoStepInvestmentData): InvestmentStage {
  const now = Date.now()
  if (data.end || now >= data.step2EndTime * 1000) {
    return 'ended'
  }
  if (now < data.step1EndTime * 1000) {
    return 'step1'
  }
  return 'step2'
}

function subtractFloor(left: bigint, right: bigint) {
  return left > right ? left - right : 0n
}

function convertTokenToDaoAmount(
  tokenAmount: bigint,
  ratio: TwoStepTokenRatio,
  tokenDecimals: number,
  daoDecimals: number,
) {
  if (tokenAmount <= 0n) {
    return 0n
  }

  let numerator = tokenAmount * BigInt(ratio.daoAmount)
  if (daoDecimals > tokenDecimals) {
    numerator *= 10n ** BigInt(daoDecimals - tokenDecimals)
  }

  return numerator / BigInt(ratio.tokenAmount)
}

function formatBigAmount(value: bigint, decimals: number) {
  return formatNumberWithCommas(formatAmount(formatUnits(value, decimals), 3, true))
}

function formatRatioText(
  ratio: TwoStepTokenRatio,
  daoSymbol: string,
  tokenSymbol: string,
) {
  return `${ratio.daoAmount} ${daoSymbol} = ${ratio.tokenAmount} ${tokenSymbol}`
}

function ellipsisAddress(address?: string) {
  if (!address) {
    return '-'
  }
  if (address.length <= 15) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-5)}`
}

function getStageDescription(stage: InvestmentStage) {
  if (stage === 'step1') {
    return 'Step 1 is open. Whitelisted wallets can only subscribe within their own allocation bucket.'
  }
  if (stage === 'step2') {
    return 'Step 2 is open. Whitelisted wallets can compete for the remaining unsold amount.'
  }
  return 'This round is no longer open for new subscriptions. The investor can end it if it has not already been closed on-chain.'
}

function getInvestorEndDescription(data: TwoStepInvestmentData) {
  if (data.end) {
    return 'This round has already been ended by the investor.'
  }
  if (Date.now() >= data.step2EndTime * 1000) {
    return 'The investor can end the round now because step 2 has already closed.'
  }
  if (data.canEndEarly) {
    return 'This round allows early ending. The investor can close it before step 2 ends.'
  }
  return 'Before step 2 ends, the investor can only close this round early if it sold out completely or no one subscribed at all.'
}

function SummaryCard(props: {
  title: string
  value: string
  caption: string
}) {
  return (
    <div className='rounded-2xl border border-[#F0F0F0] bg-white p-5 shadow-sm'>
      <div className='text-xs uppercase tracking-wide text-[#8C8C8C]'>{props.title}</div>
      <div className='mt-3 text-xl font-semibold text-black-primary'>{props.value}</div>
      <div className='mt-2 text-sm leading-6 text-[#8C8C8C]'>{props.caption}</div>
    </div>
  )
}

const InvestDetailPageContent: React.FC<{
  data?: TwoStepInvestmentData
  assetSymbol: string
  daoSymbol: string
}> = ({ data, assetSymbol, daoSymbol }) => {
  if (!data) {
    return (
      <div className='flex-center pt-10'>
        <Spin />
      </div>
    )
  }

  const DAO_TOKEN_ADDRESS = contractService.getAddressOfDevToken()

  const items: DescriptionsProps['items'] = [
    {
      label: 'Tx',
      children: data.txHash,
    },
    {
      label: 'ID',
      children: data.id,
    },
    {
      label: 'Status',
      children: <InvestStatusTag data={data} />,
    },

    {
      label: 'Step 1 duration',
      children: dayjs(data.step1EndTime * 1000).format('YYYY-MM-DD HH:mm'),
    },
    {
      label: 'Step 2 duration',
      children: dayjs(data.step2EndTime * 1000).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: '5',
      label: 'Token Address',
      children: (
        <Link
          href={`${process.env.NEXT_PUBLIC_TOKEN_ADDRESS_LINK}${data.tokenAddress}`}
          target='_blank'
        >
          {data.tokenAddress}
        </Link>
      ),
    },
    {
      key: '6',
      label: 'Token Amount',
      children: (
        <TokenWithSymbol
          totalAmount={data.totalAmount}
          tokenAddress={data.tokenAddress}
          format={true}
        />
      ),
    },
    {
      key: '8',
      label: 'Token Ratio',
      children: (
        <div className='flex flex-col gap-1'>
          <div className='font-medium text-black-primary'>
            {formatRatioText(
              data.tokenRatio,
              daoSymbol || 'BDDT',
              assetSymbol || 'TOKEN',
            )}
          </div>
          <div className='text-xs text-[#8C8C8C]'>
            Ratio uses plain token units instead of wei precision.
          </div>
        </div>
      ),
    },
    {
      key: '7',
      label: 'Total subscribed DAO Amount',
      children: (
        <TokenWithSymbol
          totalAmount={data.daoTokenAmount}
          tokenAddress={DAO_TOKEN_ADDRESS}
          format={true}
        />
      ),
    },

    {
      key: '9',
      label: 'Total subscribed  Amount',
      children: (
        <SubscribeProgress
          totalAmount={data.totalAmount}
          investedAmount={data.investedAmount}
          tokenAddress={data.tokenAddress}
        />
      ),
    },
    { label: 'Investor', children: data.investor },
    {
      label: 'whitelist',
      children: (
        <div>
          {_.map(data.whitelist, (value, key) => {
            return (
              <div className='flex gap-2' key={key}>
                <div>
                  <Tag>address</Tag>
                  {key}
                </div>
                <div>
                  <Tag>percent</Tag>
                  {value[0] / 100} %
                </div>
                <div className='flex items-center'>
                  <Tag>subscribed</Tag>
                  <TokenWithSymbol
                    totalAmount={value[1]}
                    tokenAddress={data.tokenAddress}
                    format={true}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
  ]

  return <Descriptions bordered items={items} column={1} />
}

// project detail page render fn
const InvestDetailPage = () => {
  const { id } = useParams()
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<TwoStepInvestmentData>()
  const { user } = useUserStore()
  const [isInvestor, setIsInvestor] = useState(false)
  const [assetDecimals, setAssetDecimals] = useState(18)
  const [daoDecimals, setDaoDecimals] = useState(18)
  const [assetSymbol, setAssetSymbol] = useState('TOKEN')
  const [daoSymbol, setDaoSymbol] = useState('BDDT')
  const { activeAddress, hasActiveWallet } = useBindWalletAddress()
  const isWhitelisted = !!(data && activeAddress && data.whitelist[activeAddress])
  const stage = data ? getInvestmentStage(data) : 'ended'

  const currentWhitelist = useMemo(() => {
    if (!data || !activeAddress) {
      return undefined
    }
    return data.whitelist[activeAddress]
  }, [activeAddress, data])

  const investmentView = useMemo(() => {
    if (!data) {
      return null
    }

    const totalAmount = BigInt(data.totalAmount)
    const investedAmount = BigInt(data.investedAmount)
    const remainingAmount = subtractFloor(totalAmount, investedAmount)
    const subscribedAmount = currentWhitelist ? BigInt(currentWhitelist[1]) : 0n
    const allocationPercent = currentWhitelist ? currentWhitelist[0] : 0
    const step1CapAmount = currentWhitelist
      ? (totalAmount * BigInt(allocationPercent)) / 10000n
      : 0n
    const step1RemainingAmount = subtractFloor(step1CapAmount, subscribedAmount)
    const currentTokenCapacity =
      stage === 'step1'
        ? step1RemainingAmount
        : stage === 'step2' && currentWhitelist
        ? remainingAmount
        : 0n
    const currentDaoCapacity = convertTokenToDaoAmount(
      currentTokenCapacity,
      data.tokenRatio,
      assetDecimals,
      daoDecimals,
    )

    return {
      totalAmount,
      investedAmount,
      remainingAmount,
      subscribedAmount,
      allocationPercent,
      step1CapAmount,
      step1RemainingAmount,
      currentTokenCapacity,
      currentDaoCapacity,
    }
  }, [assetDecimals, currentWhitelist, daoDecimals, data, stage])

  const onSubscribe = async () => {
    if (data!.end) {
      message.info('Investment already end')
      return
    }
    if (!activeAddress || !hasActiveWallet) {
      message.info('Please connect your browser wallet first')
      return
    }
    if (!isWhitelisted) {
      message.info('Only whitelisted addresses can subscribe to this investment')
      return
    }

    setShowModal(true)
  }

  const onEndInvestment = async () => {
    if (data?.end) {
      message.info('Investment already end')
      return
    }

    Modal.confirm({
      title: 'Are you sure to end the investment?',
      onOk: async () => {
        console.log('🍻 onEndInvestment data :', data)
        // end investment
        if (data && data.id) {
          const result = await endInvestment(data.id.toString())
          if (result) {
            message.success('End investment success')
          }
        }
      },
    })
  }

  useAsyncEffect(async () => {
    if (typeof id == 'string' && id != '') {
      const result = await getTwoStepInvestmentDetail(id)
      console.log('🍻 result :', result)
      if (result.code == 0) {
        setData(result.data)

        const isInvestor = user.address == result.data.investor
        console.log('🍻 isInvestor :', isInvestor)
        setIsInvestor(isInvestor)
      }
    }
  }, [id, user])

  useAsyncEffect(async () => {
    if (!data) {
      return
    }

    const DAO_TOKEN_ADDRESS = contractService.getAddressOfDevToken()
    const [resolvedAssetSymbol, resolvedAssetDecimals, resolvedDaoSymbol, resolvedDaoDecimals] =
      await Promise.all([
        getSymbol(data.tokenAddress),
        getDecimals(data.tokenAddress),
        getSymbol(DAO_TOKEN_ADDRESS),
        getDecimals(DAO_TOKEN_ADDRESS),
      ])

    setAssetSymbol(resolvedAssetSymbol)
    setAssetDecimals(resolvedAssetDecimals)
    setDaoSymbol(resolvedDaoSymbol)
    setDaoDecimals(resolvedDaoDecimals)
  }, [data])

  //
  return (
    <>
      <InvestmentSubscriptionModal
        showModal={showModal}
        setShowModal={setShowModal}
        data={data}
      />

      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href='/invest'>Investment</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{id}</Breadcrumb.Item>
      </Breadcrumb>

      <div className='mt-4'>
        {isInvestor && (
          <div className='flex items-center py-2 gap-4'>
            <div>{getInvestorEndDescription(data!)}</div>
            <div
              onClick={onEndInvestment}
              className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-8 px-4 rounded-lg cursor-pointer text-sm'
            >
              End investment
            </div>
          </div>
        )}
      </div>

      {data && investmentView && (
        <>
          <div className='mt-6 rounded-3xl border border-[#F0F0F0] bg-white p-8 shadow-sm'>
            <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
              <div className='max-w-3xl'>
                <div className='text-2xl font-semibold text-black-primary'>
                  {data.title || `Investment Round #${data.id}`}
                </div>
                <div className='mt-3 text-sm leading-7 text-[#8C8C8C]'>
                  {data.extra || 'This two-step investment round lets whitelisted wallets subscribe with DAO tokens according to the configured ratio and phase rules.'}
                </div>
                <div className='mt-4 flex flex-wrap items-center gap-3'>
                  <InvestStatusTag data={data} />
                  <Tag color='blue'>{stage === 'step1' ? 'Step 1 allocation' : stage === 'step2' ? 'Step 2 open remainder' : 'Round closed'}</Tag>
                </div>
              </div>

              <div className='rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] px-5 py-4 text-sm'>
                <div className='text-[#8C8C8C]'>Human-readable ratio</div>
                <div className='mt-2 text-base font-medium text-black-primary'>
                  {formatRatioText(data.tokenRatio, daoSymbol, assetSymbol)}
                </div>
                <div className='mt-2 text-xs text-[#8C8C8C]'>
                  1 {daoSymbol} buys {(data.tokenRatio.tokenAmount / data.tokenRatio.daoAmount).toString().replace(/\.0+$/, '')} {assetSymbol} when the ratio is integral.
                </div>
              </div>
            </div>
          </div>

          <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <SummaryCard
              title='Raised DAO'
              value={`${formatBigAmount(BigInt(data.daoTokenAmount), daoDecimals)} ${daoSymbol}`}
              caption='DAO token amount already subscribed into this round.'
            />
            <SummaryCard
              title='Remaining Asset'
              value={`${formatBigAmount(investmentView.remainingAmount, assetDecimals)} ${assetSymbol}`}
              caption='Unsold asset amount still left in the round right now.'
            />
            <SummaryCard
              title='My Current Capacity'
              value={`${formatBigAmount(investmentView.currentDaoCapacity, daoDecimals)} ${daoSymbol}`}
              caption={
                !activeAddress
                  ? 'Connect a wallet to see your current subscription capacity.'
                  : isWhitelisted
                  ? 'Calculated from your current phase allowance and the round ratio.'
                  : 'The active wallet is not in the whitelist, so it cannot subscribe.'
              }
            />
            <SummaryCard
              title='Investor'
              value={ellipsisAddress(data.investor)}
              caption='Only the investor can end the round and reclaim unsold inventory after the allowed conditions are met.'
            />
          </div>

          <div className='mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]'>
            <div className='rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'>
              <div className='text-lg font-medium text-black-primary'>My Subscription Status</div>
              <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
                <SummaryCard
                  title='Wallet status'
                  value={
                    !activeAddress
                      ? 'Not connected'
                      : isWhitelisted
                      ? 'Whitelisted'
                      : 'Not whitelisted'
                  }
                  caption={
                    activeAddress
                      ? activeAddress
                      : 'Connect your browser wallet to evaluate this round from your own perspective.'
                  }
                />
                <SummaryCard
                  title='Step 1 allocation'
                  value={
                    currentWhitelist
                      ? `${currentWhitelist[0] / 100}%`
                      : '0%'
                  }
                  caption='Whitelist allocation only applies during step 1. Step 2 uses the remaining unsold pool.'
                />
                <SummaryCard
                  title='Already subscribed'
                  value={`${formatBigAmount(investmentView.subscribedAmount, assetDecimals)} ${assetSymbol}`}
                  caption='Current on-chain subscribed amount recorded under the active wallet.'
                />
                <SummaryCard
                  title='Step 1 remaining'
                  value={`${formatBigAmount(investmentView.step1RemainingAmount, assetDecimals)} ${assetSymbol}`}
                  caption='If step 1 is still open, this is the remaining asset amount reserved for your wallet.'
                />
              </div>
            </div>

            <div className='rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'>
              <div className='text-lg font-medium text-black-primary'>Timeline & Rules</div>
              <div className='mt-5 flex flex-col gap-4'>
                <Alert
                  showIcon
                  type={stage === 'ended' ? 'warning' : 'info'}
                  message='Current phase'
                  description={getStageDescription(stage)}
                />
                <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
                  <div className='rounded-xl border border-[#F5F5F5] px-4 py-4'>
                    <div className='text-[#8C8C8C]'>Step 1 closes</div>
                    <div className='mt-2 font-medium text-black-primary'>
                      {dayjs(data.step1EndTime * 1000).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                  <div className='rounded-xl border border-[#F5F5F5] px-4 py-4'>
                    <div className='text-[#8C8C8C]'>Step 2 closes</div>
                    <div className='mt-2 font-medium text-black-primary'>
                      {dayjs(data.step2EndTime * 1000).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
                <Alert
                  showIcon
                  type='warning'
                  message='Investor end rule'
                  description={getInvestorEndDescription(data)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className='py-2'>
        <InvestDetailPageContent
          data={data}
          assetSymbol={assetSymbol}
          daoSymbol={daoSymbol}
        />
      </div>

      <div className='flex-center'>
        <div className='flex items-center mt-10 gap-4'>
          <div
            onClick={onSubscribe}
            className={`flex-center h-8 px-4 rounded-lg text-sm ${
              data?.end || !hasActiveWallet || !isWhitelisted
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-cyfs-green hover:bg-cyfs-green2 text-white cursor-pointer'
            }`}
          >
            Subscribe
          </div>
        </div>
      </div>
      {!data?.end && hasActiveWallet && !isWhitelisted && (
        <div className='mt-3 text-center text-sm text-orange-500'>
          The current wallet is not in this investment whitelist.
        </div>
      )}
    </>
  )
}

export default InvestDetailPage
