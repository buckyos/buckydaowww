'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Alert, Empty, message, Spin, Tag } from 'antd'
import { useAsyncEffect } from 'ahooks'
import dayjs from 'dayjs'
import WhitelistInvestmentModal from '@components/modal/WhitelistInvestmentModal'
import { getTwoStepInvestment } from '@services/index'
import { useBindWalletAddress } from '@hooks/index'
import TokenWithSymbol from '@components/funding/TokenWithSymbol'
import SubscribeProgress from '@components/invest/SubscribeProgress'
import { contractService, getSymbol } from '@contracts/index'
import InvestStatusTag from '@components/invest/InvestStatusTag'
import { formatAmount, formatNumberWithCommas } from '@utils/numberConverter'
import { formatUnits } from 'ethers'

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

function ellipsisAddress(address?: string) {
  if (!address) {
    return '-'
  }
  if (address.length <= 15) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-5)}`
}

function formatRatioText(
  ratio: TwoStepTokenRatio,
  daoSymbol: string,
  tokenSymbol: string,
) {
  return `${ratio.daoAmount} ${daoSymbol} = ${ratio.tokenAmount} ${tokenSymbol}`
}

function getStageCaption(stage: InvestmentStage) {
  if (stage === 'step1') {
    return 'Whitelist-only allocation window'
  }
  if (stage === 'step2') {
    return 'Whitelist wallets compete for remaining inventory'
  }
  return 'Round closed for new subscriptions'
}

function formatDaoAmount(value: string, decimals: number) {
  return formatNumberWithCommas(formatAmount(formatUnits(value, decimals), 3, true))
}

function StatCard(props: {
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

function InvestmentCard(props: {
  item: TwoStepInvestmentData
  activeAddress?: string
  hasActiveWallet: boolean
  daoSymbol: string
  eligibleAssetSymbols: Record<string, string>
}) {
  const { item, activeAddress, hasActiveWallet, daoSymbol, eligibleAssetSymbols } = props
  const stage = getInvestmentStage(item)
  const isWhitelisted = !!(activeAddress && item.whitelist[activeAddress])
  const myWhitelist = activeAddress ? item.whitelist[activeAddress] : undefined
  const assetSymbol = eligibleAssetSymbols[item.tokenAddress] || 'TOKEN'

  return (
    <div className='rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='min-w-0'>
          <Link
            href={`/invest/${item.id}`}
            className='block truncate text-lg font-medium text-black-primary no-underline hover:text-cyfs-green'
          >
            {item.title || `Round #${item.id}`}
          </Link>
          <div className='mt-2 text-sm text-[#8C8C8C]'>
            Investor <span className='font-mono text-black-primary'>{ellipsisAddress(item.investor)}</span>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <InvestStatusTag data={item} />
          <Tag color={stage === 'step1' ? 'green' : stage === 'step2' ? 'cyan' : 'magenta'}>
            {getStageCaption(stage)}
          </Tag>
        </div>
      </div>

      <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='rounded-xl border border-[#F5F5F5] px-4 py-4'>
          <div className='text-[#8C8C8C]'>Human-readable ratio</div>
          <div className='mt-2 font-medium text-black-primary'>
            {formatRatioText(item.tokenRatio, daoSymbol, assetSymbol)}
          </div>
        </div>
        <div className='rounded-xl border border-[#F5F5F5] px-4 py-4'>
          <div className='text-[#8C8C8C]'>My whitelist status</div>
          <div className='mt-2 font-medium text-black-primary'>
            {!hasActiveWallet
              ? 'Connect wallet'
              : isWhitelisted
              ? `Whitelisted (${(myWhitelist?.[0] || 0) / 100}%)`
              : 'Not whitelisted'}
          </div>
        </div>
      </div>

      <div className='mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4'>
        <div>
          <div className='text-[#8C8C8C]'>Offered asset</div>
          <div className='mt-1'>
            <TokenWithSymbol
              totalAmount={item.totalAmount}
              tokenAddress={item.tokenAddress}
              format={true}
            />
          </div>
        </div>
        <div>
          <div className='text-[#8C8C8C]'>Raised DAO amount</div>
          <div className='mt-1 font-medium text-black-primary'>
            {formatDaoAmount(item.daoTokenAmount, 18)} {daoSymbol}
          </div>
        </div>
        <div>
          <div className='text-[#8C8C8C]'>Step 1 closes</div>
          <div className='mt-1 text-black-primary'>
            {dayjs(item.step1EndTime * 1000).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
        <div>
          <div className='text-[#8C8C8C]'>Step 2 closes</div>
          <div className='mt-1 text-black-primary'>
            {dayjs(item.step2EndTime * 1000).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      </div>

      <div className='mt-5'>
        <div className='mb-2 text-sm text-[#8C8C8C]'>Subscription progress</div>
        <SubscribeProgress
          totalAmount={item.totalAmount}
          investedAmount={item.investedAmount}
          tokenAddress={item.tokenAddress}
        />
      </div>

      <div className='mt-5 flex items-center justify-between gap-4'>
        <div className='text-sm text-[#8C8C8C]'>
          {!hasActiveWallet
            ? 'Connect a wallet to evaluate your own subscription eligibility.'
            : isWhitelisted
            ? 'Open the round detail page to see your exact remaining allocation and subscribe.'
            : 'This wallet is outside the whitelist for the current round.'}
        </div>
        <Link
          href={`/invest/${item.id}`}
          className='text-sm font-medium text-cyfs-green no-underline hover:text-cyfs-green2'
        >
          Open round detail
        </Link>
      </div>
    </div>
  )
}

export default function InvestmentPage() {
  const { activeAddress, governanceAddress, ensureAuthenticated, hasActiveWallet } =
    useBindWalletAddress()
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<TwoStepInvestmentData[]>([])
  const [loading, setLoading] = useState(false)
  const [daoSymbol, setDaoSymbol] = useState('BDDT')
  const [assetSymbols, setAssetSymbols] = useState<Record<string, string>>({})

  useAsyncEffect(async () => {
    setLoading(true)
    const result = await getTwoStepInvestment()
    if (result.code === 0) {
      setData(result.data.items)
    }
    setLoading(false)
  }, [])

  useAsyncEffect(async () => {
    const DAO_TOKEN_ADDRESS = contractService.getAddressOfDevToken()
    const symbols = await Promise.all([
      getSymbol(DAO_TOKEN_ADDRESS),
      ...Array.from(new Set(data.map((item) => item.tokenAddress))).map((address) =>
        getSymbol(address),
      ),
    ])

    const nextAssetSymbols: Record<string, string> = {}
    Array.from(new Set(data.map((item) => item.tokenAddress))).forEach(
      (address, index) => {
        nextAssetSymbols[address] = symbols[index + 1]
      },
    )

    setDaoSymbol(symbols[0] || 'BDDT')
    setAssetSymbols(nextAssetSymbols)
  }, [data])

  const now = Date.now()
  const activeRounds = useMemo(
    () => data.filter((item) => !item.end && now < item.step2EndTime * 1000),
    [data, now],
  )
  const endedRounds = useMemo(
    () => data.filter((item) => item.end || now >= item.step2EndTime * 1000),
    [data, now],
  )
  const myEligibleRounds = useMemo(() => {
    if (!activeAddress) {
      return 0
    }
    return activeRounds.filter((item) => item.whitelist[activeAddress]).length
  }, [activeAddress, activeRounds])
  const myInvestorRounds = useMemo(() => {
    const target = governanceAddress || activeAddress || ''
    if (!target) {
      return 0
    }
    return data.filter((item) => item.investor.toLowerCase() === target.toLowerCase()).length
  }, [activeAddress, data, governanceAddress])

  const onShowCreateInvestmentModal = async () => {
    if (!(await ensureAuthenticated({ requireWallet: true }))) {
      return
    }

    setShowModal(true)
  }

  return (
    <>
      <WhitelistInvestmentModal
        showModal={showModal}
        setShowModal={setShowModal}
      />

      <div className='mt-10 rounded-3xl border border-[#F0F0F0] bg-white p-8 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='max-w-3xl'>
            <div className='text-3xl font-semibold text-black-primary'>Investment Rounds</div>
            <div className='mt-4 text-sm leading-7 text-[#8C8C8C]'>
              This page focuses on round-level participation. Use it to review whitelist funding rounds,
              see whether the active wallet can subscribe, and jump into the detailed workflow for a
              specific round.
            </div>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Link
              href='/funding'
              className='rounded-full border border-[#D9D9D9] px-4 py-2 text-black-primary no-underline hover:border-cyfs-green hover:text-cyfs-green'
            >
              Open Funding Overview
            </Link>
            <div
              onClick={onShowCreateInvestmentModal}
              className='flex-center rounded-full bg-cyfs-green px-4 py-2 text-sm text-white cursor-pointer hover:bg-cyfs-green2'
            >
              <PlusOutlined className='mr-1' />
              Create Acquired
            </div>
          </div>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Active rounds'
          value={String(activeRounds.length)}
          caption='Rounds still open in step 1 or step 2.'
        />
        <StatCard
          title='Ended rounds'
          value={String(endedRounds.length)}
          caption='Rounds already closed or fully beyond their subscription window.'
        />
        <StatCard
          title='My eligible rounds'
          value={hasActiveWallet ? String(myEligibleRounds) : 'Connect wallet'}
          caption='How many active rounds currently include the active wallet in the whitelist.'
        />
        <StatCard
          title='My investor rounds'
          value={String(myInvestorRounds)}
          caption='Rounds where the active governance identity is the investor that can close the round.'
        />
      </div>

      {!hasActiveWallet && (
        <Alert
          className='mt-6'
          showIcon
          type='info'
          message='Connect a wallet to evaluate your whitelist eligibility'
          description='The round list is public, but subscription eligibility and investor ownership become much clearer once the page can compare the active wallet against each round.'
        />
      )}

      <div className='mt-10'>
        {loading && (
          <div className='flex-center py-20'>
            <Spin>Loading...</Spin>
          </div>
        )}
        {!loading && data.length === 0 && (
          <div className='rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-10'>
            <Empty description='No investment rounds yet' />
          </div>
        )}
        {!loading && data.length !== 0 && (
          <div className='grid grid-cols-1 gap-8 xl:grid-cols-2'>
            {data.map((item) => (
              <InvestmentCard
                key={item.id}
                item={item}
                activeAddress={activeAddress}
                hasActiveWallet={hasActiveWallet}
                daoSymbol={daoSymbol}
                eligibleAssetSymbols={assetSymbols}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
