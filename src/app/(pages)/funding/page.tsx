'use client'
import Link from 'next/link'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import {
  Alert,
  Empty,
  Spin,
  Tag,
} from 'antd'
import {
  BankOutlined,
  FundOutlined,
  NodeIndexOutlined,
  RightOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import TokenWithSymbol from '@components/funding/TokenWithSymbol'
import SubscribeProgress from '@components/invest/SubscribeProgress'
import InvestStatusTag from '@components/invest/InvestStatusTag'
import {
  fetchFundingOverview,
} from '@services/index'
import {
  formatAmount,
  formatNumberWithCommas,
  wrapUnits,
} from '@utils/numberConverter'
import { transformVersionStateWord } from '@utils/index'

const OVERVIEW_DOC_URL =
  'https://github.com/buckyos/buckydaowww/blob/beta2/doc/TreasuryFundingOverview.md'

function formatTokenAmount(value: number) {
  return formatNumberWithCommas(formatAmount(value, 3, true))
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

function TreasuryMetricCard(props: {
  title: string
  value: string
  caption: string
}) {
  return (
    <div className='rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'>
      <div className='text-sm text-black-secondary'>{props.title}</div>
      <div className='mt-3 text-2xl font-semibold text-black-primary'>
        {props.value}
      </div>
      <div className='mt-2 text-xs leading-5 text-[#8C8C8C]'>{props.caption}</div>
    </div>
  )
}

function SectionTitle(props: { title: string; caption?: string }) {
  return (
    <div className='mb-6'>
      <div className='text-xl font-medium text-black-primary'>
        <RightOutlined /> {props.title}
      </div>
      {props.caption && (
        <div className='mt-2 text-sm leading-6 text-[#8C8C8C]'>{props.caption}</div>
      )}
    </div>
  )
}

export default function Funding() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [overview, setOverview] = useState<FundingOverviewData | null>(null)

  useAsyncEffect(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const fundingOverview = await fetchFundingOverview()
      setOverview(fundingOverview.data)
    } catch (error: any) {
      console.error('failed to load funding overview', error)
      setLoadError(error?.message || 'Failed to load treasury and funding overview')
    } finally {
      setLoading(false)
    }
  }, [])

  const now = Date.now()
  const tokenInfo = overview?.tokenInfo || null
  const treasury = overview?.treasury || null
  const activeRounds = overview?.rounds.activeRounds || []
  const historyRounds = overview?.rounds.historyRounds || []
  const pipeline = overview?.pipeline || {
    waitingVote: [],
    developing: [],
    waitingSettlement: [],
    settled: [],
  }
  const totalRounds = overview?.rounds.totalCount || 0
  const closedRounds = overview?.rounds.closedCount || 0
  const totalRaisedDao = overview?.rounds.totalSubscribedDao || 0

  return (
    <main className='w-full max-w-[1200px] mx-auto my-10 px-4'>
      <div className='flex flex-col gap-4 rounded-3xl border border-[#F0F0F0] bg-white p-8 shadow-sm md:flex-row md:items-end md:justify-between'>
        <div className='max-w-3xl'>
          <div className='flex items-center gap-3 text-3xl font-semibold text-black-primary'>
            <BankOutlined className='text-cyfs-green' />
            <span>Treasury & Funding</span>
          </div>
          <div className='mt-4 text-sm leading-7 text-[#8C8C8C]'>
            This page focuses on protocol-level treasury context: token release status, active funding rounds,
            acquisition history, and how project versions move toward on-chain release milestones.
          </div>
        </div>

        <div className='flex flex-wrap gap-3 text-sm'>
          <Link
            href='/token'
            className='rounded-full border border-[#D9D9D9] px-4 py-2 text-black-primary no-underline hover:border-cyfs-green hover:text-cyfs-green'
          >
            Open Token Center
          </Link>
          <Link
            href='/invest'
            className='rounded-full border border-[#D9D9D9] px-4 py-2 text-black-primary no-underline hover:border-cyfs-green hover:text-cyfs-green'
          >
            View Investment Rounds
          </Link>
          <a
            href={OVERVIEW_DOC_URL}
            target='_blank'
            rel='noreferrer'
            className='rounded-full border border-[#D9D9D9] px-4 py-2 text-black-primary no-underline hover:border-cyfs-green hover:text-cyfs-green'
          >
            Read Overview Guide
          </a>
        </div>
      </div>

      {loadError && (
        <Alert
          className='mt-8'
          type='warning'
          message='Funding overview is partially unavailable'
          description={loadError}
          showIcon
        />
      )}

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spin size='large' />
        </div>
      ) : (
        <>
          <section className='mt-12'>
            <SectionTitle
              title='Treasury Snapshot'
              caption='A first-phase snapshot of protocol token supply and the main contract buckets that currently hold BDT.'
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <TreasuryMetricCard
                title='BDDT Released'
                value={`${formatTokenAmount(treasury?.bddtReleased || 0)} ${tokenInfo?.dev.symbol || 'BDDT'}`}
                caption='Already allocated or minted into circulation according to current governance and project settlement results.'
              />
              <TreasuryMetricCard
                title='BDDT Unreleased'
                value={`${formatTokenAmount(treasury?.bddtUnreleased || 0)} ${tokenInfo?.dev.symbol || 'BDDT'}`}
                caption='Still sitting in the DevToken contract and not yet allocated through release logic.'
              />
              <TreasuryMetricCard
                title='BDT in Dividend'
                value={`${formatTokenAmount(treasury?.bdtInDividend || 0)} ${tokenInfo?.normal.symbol || 'BDT'}`}
                caption='NormalToken currently parked in the Dividend contract for staking rewards and withdrawals.'
              />
              <TreasuryMetricCard
                title='BDT held by Acquired'
                value={`${formatTokenAmount(treasury?.bdtInAcquired || 0)} ${tokenInfo?.normal.symbol || 'BDT'}`}
                caption='DAO tokens temporarily collected in active or not-yet-ended acquisition rounds.'
              />
              <TreasuryMetricCard
                title='BDT held by Project'
                value={`${formatTokenAmount(treasury?.bdtInProject || 0)} ${tokenInfo?.normal.symbol || 'BDT'}`}
                caption='Project contract balance related to version lifecycle and contribution withdrawals.'
              />
              <TreasuryMetricCard
                title='Active Funding Rounds'
                value={`${activeRounds.length}`}
                caption={`${closedRounds} closed / ${totalRounds} total rounds tracked in the current two-step investment history.`}
              />
            </div>
          </section>

          <section className='mt-14'>
            <SectionTitle
              title='Active Funding'
              caption='Rounds that are still open for step 1 or step 2 subscriptions. Use the investment page for full round detail and participation.'
            />

            {activeRounds.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-10'>
                <Empty description='No active funding rounds right now' />
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
                {activeRounds.map((item) => (
                  <div
                    key={item.id}
                    className='rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'
                  >
                    <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                      <div>
                        <div className='text-lg font-medium text-black-primary'>
                          {item.title || `Round #${item.id}`}
                        </div>
                        <div className='mt-2 text-sm text-[#8C8C8C]'>
                          Investor <span className='font-mono text-black-primary'>{ellipsisAddress(item.investor)}</span>
                        </div>
                      </div>
                      <InvestStatusTag data={item} />
                    </div>

                    <div className='mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
                      <div>
                        <div className='text-[#8C8C8C]'>Offered asset</div>
                        <div className='mt-1'>
                          <TokenWithSymbol
                            tokenAddress={item.tokenAddress}
                            totalAmount={item.totalAmount}
                            format={true}
                          />
                        </div>
                      </div>
                      <div>
                        <div className='text-[#8C8C8C]'>Raised DAO amount</div>
                        <div className='mt-1 font-medium text-black-primary'>
                          {formatTokenAmount(
                            Number(
                              wrapUnits(
                                item.daoTokenAmount,
                                tokenInfo?.normal.decimals || 18,
                              ),
                            ),
                          )}{' '}
                          {tokenInfo?.normal.symbol || 'BDT'}
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

                    <div className='mt-6'>
                      <div className='mb-2 text-sm text-[#8C8C8C]'>Subscription progress</div>
                      <SubscribeProgress
                        totalAmount={item.totalAmount}
                        investedAmount={item.investedAmount}
                        tokenAddress={item.tokenAddress}
                      />
                    </div>

                    <div className='mt-6'>
                      <Link
                        href={`/invest/${item.id}`}
                        className='text-sm font-medium text-cyfs-green no-underline hover:text-cyfs-green2'
                      >
                        Open round detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className='mt-14'>
            <SectionTitle
              title='Funding History'
              caption='A compact view of existing acquisition rounds. This first phase reuses the current two-step investment history rather than introducing a separate treasury ledger.'
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <TreasuryMetricCard
                title='Total Rounds'
                value={String(totalRounds)}
                caption='All indexed two-step investment rounds currently visible to the frontend.'
              />
              <TreasuryMetricCard
                title='Closed Rounds'
                value={String(closedRounds)}
                caption='Rounds that have ended or already passed their final subscription window.'
              />
              <TreasuryMetricCard
                title='Total Subscribed DAO'
                value={`${formatTokenAmount(totalRaisedDao)} ${tokenInfo?.normal.symbol || 'BDT'}`}
                caption='Sum of DAO tokens subscribed across the indexed two-step investment rounds.'
              />
            </div>

            <div className='mt-6 rounded-2xl border border-[#F0F0F0] bg-white shadow-sm'>
              <div className='grid grid-cols-[80px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-[#F0F0F0] px-6 py-4 text-xs font-medium uppercase tracking-wide text-[#8C8C8C]'>
                <div>ID</div>
                <div>Round</div>
                <div>Status</div>
                <div>DAO subscribed</div>
              </div>
              {historyRounds.length === 0 ? (
                <div className='p-10'>
                  <Empty description='No funding history yet' />
                </div>
              ) : (
                historyRounds.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className='grid grid-cols-[80px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-[#F5F5F5] px-6 py-4 last:border-b-0'
                  >
                    <div className='font-medium text-black-primary'>#{item.id}</div>
                    <div className='min-w-0'>
                      <Link
                        href={`/invest/${item.id}`}
                        className='block truncate font-medium text-black-primary no-underline hover:text-cyfs-green'
                      >
                        {item.title || `Round #${item.id}`}
                      </Link>
                      <div className='mt-1 text-xs text-[#8C8C8C]'>
                        Investor {ellipsisAddress(item.investor)}
                      </div>
                    </div>
                    <div className='flex items-center'>
                      <InvestStatusTag data={item} />
                    </div>
                    <div className='text-black-primary'>
                      {formatTokenAmount(
                        Number(
                          wrapUnits(
                            item.daoTokenAmount,
                            tokenInfo?.normal.decimals || 18,
                          ),
                        ),
                      )}{' '}
                      {tokenInfo?.normal.symbol || 'BDT'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className='mt-14 mb-14'>
            <SectionTitle
              title='Project Release Pipeline'
              caption='Project versions progress toward release through governance. This section focuses on where versions currently sit in that pipeline.'
            />

            <Alert
              showIcon
              type='info'
              className='mb-6'
              message='How version state relates to token release'
              description='Waiting vote means the version proposal has not passed. Developing means the version is active but not yet settled. Waiting settlement vote means the version is pending acceptance. Version settled means the version has finished and its release time can be referenced by on-chain lockup logic.'
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <TreasuryMetricCard
                title='Waiting vote'
                value={String(pipeline.waitingVote.length)}
                caption='Version proposals created but not yet accepted into active development.'
              />
              <TreasuryMetricCard
                title='Developing'
                value={String(pipeline.developing.length)}
                caption='Versions currently under active delivery and not yet in settlement voting.'
              />
              <TreasuryMetricCard
                title='Waiting settlement vote'
                value={String(pipeline.waitingSettlement.length)}
                caption='Versions that have entered acceptance review and are waiting for settlement vote outcome.'
              />
              <TreasuryMetricCard
                title='Version settled'
                value={String(pipeline.settled.length)}
                caption='Versions already finished. These are the closest proxy to completed release milestones in the current UI.'
              />
            </div>

            <div className='mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3'>
              {[
                {
                  title: 'Developing',
                  icon: <RiseOutlined className='text-cyfs-green' />,
                  items: pipeline.developing.slice(0, 5),
                },
                {
                  title: 'Waiting settlement vote',
                  icon: <FundOutlined className='text-[#FAAD14]' />,
                  items: pipeline.waitingSettlement.slice(0, 5),
                },
                {
                  title: 'Recently settled',
                  icon: <NodeIndexOutlined className='text-[#52C41A]' />,
                  items: pipeline.settled.slice(0, 5),
                },
              ].map((section) => (
                <div
                  key={section.title}
                  className='rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'
                >
                  <div className='flex items-center gap-2 text-base font-medium text-black-primary'>
                    {section.icon}
                    <span>{section.title}</span>
                  </div>

                  <div className='mt-5 flex flex-col gap-4'>
                    {section.items.length === 0 ? (
                      <div className='rounded-xl border border-dashed border-[#D9D9D9] px-4 py-6 text-sm text-[#8C8C8C]'>
                        No versions in this bucket right now.
                      </div>
                    ) : (
                      section.items.map((version) => (
                        <div
                          key={version.id}
                          className='rounded-xl border border-[#F5F5F5] px-4 py-4'
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0'>
                              <div className='truncate font-medium text-black-primary'>
                                {version.pname} {version.version}
                              </div>
                              <div className='mt-1 text-xs text-[#8C8C8C]'>
                                Manager{' '}
                                <span className='font-mono text-black-primary'>
                                  {ellipsisAddress(version.manager)}
                                </span>
                              </div>
                            </div>
                            <Tag>{transformVersionStateWord(version.state)}</Tag>
                          </div>

                          <div className='mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#8C8C8C]'>
                            <span>
                              {dayjs(version.start_date * 1000).format('YYYY-MM-DD')}
                              {' -> '}
                              {dayjs(version.end_date * 1000).format('YYYY-MM-DD')}
                            </span>
                            <span>Proposal #{version.proposal_id}</span>
                            {version.accept_proposal_id > 0 && (
                              <span>Settlement #{version.accept_proposal_id}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-6 text-sm text-[#8C8C8C]'>
              This first phase uses current version state as the observable release pipeline. It does not yet expose a dedicated treasury-grade release ledger or historical release timeline.
            </div>
          </section>
        </>
      )}
    </main>
  )
}
