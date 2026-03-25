'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import {
  fetchFundingOverview,
  fetchMembers,
  fetchRepositoryList,
  getProposals,
} from '@services/index'
import { formatAmount } from '@utils/numberConverter'
import { getEffectiveProposalState } from '@utils/index'
import { ProposalState } from '@vars/index'

type MetricCard = {
  label: string
  value: string
  caption: string
  href: string
}

type StatusLine = {
  label: string
  value: string
}

type StatusPanel = {
  title: string
  description: string
  href: string
  lines: StatusLine[]
}

const placeholderMetrics: MetricCard[] = [
  {
    label: 'Open proposals',
    value: '...',
    caption: 'Governance items still inside an active voting window.',
    href: '/proposals',
  },
  {
    label: 'Versions in development',
    value: '...',
    caption: 'Project delivery currently moving through active work.',
    href: '/projects',
  },
  {
    label: 'Active funding rounds',
    value: '...',
    caption: 'Investment rounds still open in step 1 or step 2.',
    href: '/funding',
  },
  {
    label: 'Released BDDT',
    value: '...',
    caption: 'Developer token already released into the protocol.',
    href: '/token',
  },
]

const placeholderPanels: StatusPanel[] = [
  {
    title: 'Governance Now',
    description: 'Loading current governance state...',
    href: '/proposals',
    lines: [],
  },
  {
    title: 'Delivery Now',
    description: 'Loading current project delivery state...',
    href: '/projects',
    lines: [],
  },
  {
    title: 'Treasury Now',
    description: 'Loading treasury and funding state...',
    href: '/funding',
    lines: [],
  },
]

export default function OverviewSnapshot() {
  const [metrics, setMetrics] = useState<MetricCard[]>(placeholderMetrics)
  const [panels, setPanels] = useState<StatusPanel[]>(placeholderPanels)
  const [error, setError] = useState<string>('')

  useAsyncEffect(async () => {
    try {
      const [proposalResp, members, repositories, funding] = await Promise.all([
        getProposals(1, 50),
        fetchMembers(),
        fetchRepositoryList(),
        fetchFundingOverview(),
      ])

      if (
        proposalResp.code !== 0
        || members.code !== 0
        || repositories.code !== 0
        || funding.code !== 0
      ) {
        throw new Error('Failed to load overview snapshot')
      }

      const proposals = proposalResp.data.items || []
      const openProposalCount = proposals.filter(
        (proposal) =>
          getEffectiveProposalState(proposal) === ProposalState.InProgress,
      ).length
      const acceptedProposalCount = proposals.filter(
        (proposal) =>
          getEffectiveProposalState(proposal) === ProposalState.Accepted,
      ).length
      const releasedBddt = formatAmount(
        funding.data.treasury.bddtReleased,
        1,
      )

      setMetrics([
        {
          label: 'Open proposals',
          value: openProposalCount.toString(),
          caption: 'Governance items still inside an active voting window.',
          href: '/proposals',
        },
        {
          label: 'Versions in development',
          value: funding.data.pipeline.developing.length.toString(),
          caption: 'Project delivery currently moving through active work.',
          href: '/projects',
        },
        {
          label: 'Active funding rounds',
          value: funding.data.rounds.activeCount.toString(),
          caption: 'Investment rounds still open in step 1 or step 2.',
          href: '/funding',
        },
        {
          label: 'Released BDDT',
          value: releasedBddt,
          caption: 'Developer token already released into the protocol.',
          href: '/token',
        },
      ])

      setPanels([
        {
          title: 'Governance Now',
          description:
            'A first-time visitor should see whether decisions are actively moving through the DAO right now.',
          href: '/proposals',
          lines: [
            {
              label: 'Committee members',
              value: members.data.length.toString(),
            },
            {
              label: 'Accepted and awaiting execution',
              value: acceptedProposalCount.toString(),
            },
            {
              label: 'Indexed proposals',
              value: proposalResp.data.totalSize.toString(),
            },
          ],
        },
        {
          title: 'Delivery Now',
          description:
            'Project work becomes legible when visitors can distinguish active build, settlement, and finished versions.',
          href: '/projects',
          lines: [
            {
              label: 'Project profiles',
              value: repositories.data.length.toString(),
            },
            {
              label: 'Waiting settlement',
              value: funding.data.pipeline.waitingSettlement.length.toString(),
            },
            {
              label: 'Settled versions',
              value: funding.data.pipeline.settled.length.toString(),
            },
          ],
        },
        {
          title: 'Treasury Now',
          description:
            'Funding and token movement should read like a protocol balance sheet, not just a list of round ids.',
          href: '/funding',
          lines: [
            {
              label: 'BDT in dividend',
              value: formatAmount(funding.data.treasury.bdtInDividend, 1),
            },
            {
              label: 'BDT in acquired',
              value: formatAmount(funding.data.treasury.bdtInAcquired, 1),
            },
            {
              label: 'Subscribed DAO amount',
              value: formatAmount(funding.data.rounds.totalSubscribedDao, 1),
            },
          ],
        },
      ])
      setError('')
    } catch (_error) {
      setError('Live snapshot is temporarily unavailable.')
    }
  }, [])

  return (
    <section className='rounded-[28px] border border-[#ececec] bg-white p-7'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div>
          <div className='text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
            Live Snapshot
          </div>
          <h2 className='mt-3 text-3xl font-semibold text-black-primary'>
            Read the protocol like a lightweight dashboard before entering a workspace
          </h2>
        </div>
        <div className='max-w-xl text-sm leading-7 text-black-secondary'>
          This section should answer a visitor&apos;s first operational question:
          what is actually happening in governance, delivery, and treasury right
          now?
        </div>
      </div>

      <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {metrics.map((card) => (
          <Link
            href={card.href}
            key={card.label}
            className='rounded-[22px] border border-[#efefef] bg-[#fafafa] p-5 text-black-primary no-underline transition hover:border-[#141414] hover:bg-white'
          >
            <div className='text-sm font-medium uppercase tracking-[0.14em] text-[#8c8c8c]'>
              {card.label}
            </div>
            <div className='mt-3 text-4xl font-semibold leading-none'>
              {card.value}
            </div>
            <p className='mb-0 mt-4 text-sm leading-7 text-black-secondary'>
              {card.caption}
            </p>
          </Link>
        ))}
      </div>

      <div className='mt-8 grid gap-4 xl:grid-cols-3'>
        {panels.map((panel) => (
          <Link
            key={panel.title}
            href={panel.href}
            className='rounded-[24px] border border-[#efefef] bg-[#fcfcfc] p-5 text-black-primary no-underline transition hover:border-[#141414] hover:bg-white'
          >
            <div className='text-sm font-medium uppercase tracking-[0.14em] text-[#8c8c8c]'>
              {panel.title}
            </div>
            <p className='mb-0 mt-3 text-sm leading-7 text-black-secondary'>
              {panel.description}
            </p>
            <div className='mt-5 space-y-3'>
              {panel.lines.map((line) => (
                <div
                  key={`${panel.title}-${line.label}`}
                  className='flex items-baseline justify-between gap-4 rounded-[18px] bg-white px-4 py-3'
                >
                  <div className='text-sm text-[#8c8c8c]'>{line.label}</div>
                  <div className='text-lg font-semibold text-black-primary'>
                    {line.value}
                  </div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {error ? (
        <div className='mt-5 text-sm text-[#8c8c8c]'>{error}</div>
      ) : null}
    </section>
  )
}
