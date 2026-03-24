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

type SnapshotCard = {
  label: string
  value: string
  caption: string
  href: string
}

const placeholderCards: SnapshotCard[] = [
  {
    label: 'Indexed proposals',
    value: '...',
    caption: 'Governance items currently indexed by the frontend.',
    href: '/proposals',
  },
  {
    label: 'Committee members',
    value: '...',
    caption: 'Current committee identities visible to the DAO interface.',
    href: '/#members',
  },
  {
    label: 'Project profiles',
    value: '...',
    caption: 'Top-level project profiles that route into active versions.',
    href: '/projects',
  },
  {
    label: 'Active funding rounds',
    value: '...',
    caption: 'Investment rounds still open in step 1 or step 2.',
    href: '/funding',
  },
  {
    label: 'Versions in development',
    value: '...',
    caption: 'Project versions currently progressing through delivery.',
    href: '/projects',
  },
  {
    label: 'Waiting settlement',
    value: '...',
    caption: 'Versions that have moved past delivery and now await settlement.',
    href: '/projects',
  },
]

export default function OverviewSnapshot() {
  const [cards, setCards] = useState<SnapshotCard[]>(placeholderCards)
  const [error, setError] = useState<string>('')

  useAsyncEffect(async () => {
    try {
      const [proposals, members, repositories, funding] = await Promise.all([
        getProposals(1, 1),
        fetchMembers(),
        fetchRepositoryList(),
        fetchFundingOverview(),
      ])

      if (
        proposals.code !== 0
        || members.code !== 0
        || repositories.code !== 0
        || funding.code !== 0
      ) {
        throw new Error('Failed to load overview snapshot')
      }

      setCards([
        {
          label: 'Indexed proposals',
          value: proposals.data.totalSize.toString(),
          caption: 'Governance items currently indexed by the frontend.',
          href: '/proposals',
        },
        {
          label: 'Committee members',
          value: members.data.length.toString(),
          caption: 'Current committee identities visible to the DAO interface.',
          href: '/#members',
        },
        {
          label: 'Project profiles',
          value: repositories.data.length.toString(),
          caption: 'Top-level project profiles that route into active versions.',
          href: '/projects',
        },
        {
          label: 'Active funding rounds',
          value: funding.data.rounds.activeCount.toString(),
          caption: 'Investment rounds still open in step 1 or step 2.',
          href: '/funding',
        },
        {
          label: 'Versions in development',
          value: funding.data.pipeline.developing.length.toString(),
          caption: 'Project versions currently progressing through delivery.',
          href: '/projects',
        },
        {
          label: 'Waiting settlement',
          value: funding.data.pipeline.waitingSettlement.length.toString(),
          caption: 'Versions that have moved past delivery and now await settlement.',
          href: '/projects',
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
            See the protocol before diving into a single workspace
          </h2>
        </div>
        <div className='max-w-xl text-sm leading-7 text-black-secondary'>
          A first-time visitor should be able to see how much governance,
          project delivery, and funding activity already exists before choosing
          the next page.
        </div>
      </div>

      <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {cards.map((card) => (
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

      {error ? (
        <div className='mt-5 text-sm text-[#8c8c8c]'>{error}</div>
      ) : null}
    </section>
  )
}
