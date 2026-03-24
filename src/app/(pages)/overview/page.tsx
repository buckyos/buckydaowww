import Link from 'next/link'
import { ArrowRightOutlined } from '@ant-design/icons'
import LatestProposals from '@components/LatestProposals'
import DaoMembers from '@components/DaoMembers'
import OverviewSnapshot from '@components/governance2/OverviewSnapshot'

const primaryActions = [
  {
    href: '/proposals',
    title: 'Explore Proposals',
    description:
      'See active governance decisions, review proposal details, and follow voting outcomes.',
  },
  {
    href: '/projects',
    title: 'View Projects',
    description:
      'Track project profiles, version lifecycles, and settlement progress across the DAO.',
  },
  {
    href: '/funding',
    title: 'Open Treasury & Funding',
    description:
      'Understand capital flow, funding rounds, and the project release pipeline.',
  },
  {
    href: '/token',
    title: 'Visit Token Center',
    description:
      'Review balances, voting power, lockups, dividends, and protocol token mechanics.',
  },
  {
    href: '/#members',
    title: 'Meet Members',
    description:
      'See the current committee roster and navigate directly into the visible governance identities.',
  },
]

const systemMap = [
  {
    title: 'Projects',
    description:
      'Top-level project profiles frame the roadmap and route visitors into concrete version work.',
  },
  {
    title: 'Versions',
    description:
      'Each version defines budget, manager, time window, and delivery scope.',
  },
  {
    title: 'Proposals',
    description:
      'Governance proposals decide whether versions, treasury actions, and committee changes move forward.',
  },
  {
    title: 'Release',
    description:
      'Accepted work can unlock settlement, contribution withdrawal, and token release timing.',
  },
  {
    title: 'Treasury',
    description:
      'Funding rounds, dividend cycles, and token balances show how capital moves through the DAO.',
  },
]

const intentPaths = [
  {
    title: 'I am new and want the big picture',
    description:
      'Start with the governance guide, then scan proposals and the token center once the vocabulary is clear.',
    links: [
      { href: '/governance_introducing', label: 'Read governance guide' },
      { href: '/token', label: 'Open token center' },
    ],
  },
  {
    title: 'I want to follow live governance',
    description:
      'Review active proposals, voting state, and your personal action queue before opening specific items.',
    links: [
      { href: '/proposals', label: 'Open proposals' },
      { href: '/me', label: 'Open my dashboard' },
    ],
  },
  {
    title: 'I want to track roadmap execution',
    description:
      'Projects and versions show which work is waiting for votes, in delivery, or approaching settlement.',
    links: [
      { href: '/projects', label: 'Browse projects' },
      { href: '/funding', label: 'See release pipeline' },
    ],
  },
  {
    title: 'I want capital and token flow',
    description:
      'Funding explains acquisition rounds and treasury buckets, while Token Center shows balances and release mechanics.',
    links: [
      { href: '/funding', label: 'Funding overview' },
      { href: '/invest', label: 'Investment rounds' },
    ],
  },
]

const corePrinciples = [
  {
    title: 'Decisions Converge',
    description:
      'Governance should resolve proposals instead of leaving protocol actions permanently undecided.',
  },
  {
    title: 'Majority Constrained',
    description:
      'Voting power matters, but explicit rules should still limit majoritarian overreach.',
  },
  {
    title: 'Core Rules Stay Stable',
    description:
      'The constitutional layer should be difficult to mutate casually or opportunistically.',
  },
  {
    title: 'Flows Stay Auditable',
    description:
      'Projects, funding, token release, and treasury movement should remain transparent end to end.',
  },
]

const guideLinks = [
  { href: '/governance_introducing', label: 'Current Governance Guide' },
  { href: '/token', label: 'Token Center' },
  { href: '/projects', label: 'Project & Version Workspace' },
  { href: '/funding', label: 'Treasury & Funding Overview' },
  { href: '/proposals', label: 'Proposal Workbench' },
]

const linkClass =
  'inline-flex items-center gap-2 rounded-full border border-[#d9d9d9] px-4 py-2 text-sm font-medium text-black-primary no-underline transition hover:border-[#141414] hover:text-black'

export default function OverviewPage() {
  return (
    <div className='flex flex-col gap-16 py-8'>
      <section className='grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-start'>
        <div className='max-w-4xl'>
          <div className='mb-4 text-sm font-medium uppercase tracking-[0.24em] text-[#8c8c8c]'>
            BuckyDAO Overview
          </div>
          <h1 className='mb-6 max-w-4xl text-5xl font-semibold leading-[1.08] text-black-primary'>
            Govern BuckyOS in public, with proposals, project milestones, and
            token-backed coordination.
          </h1>
          <p className='max-w-3xl text-lg leading-8 text-black-secondary'>
            BuckyDAO connects software delivery, capital allocation, and token
            release through transparent on-chain decisions. This page is meant
            to orient a first-time visitor before they enter the more specific
            workspaces.
          </p>

          <div className='mt-8'>
            <div className='mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
              Core Principles
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              {corePrinciples.map((principle) => (
                <div
                  key={principle.title}
                  className='rounded-[20px] border border-[#ececec] bg-[#f5f7fb] p-5'
                >
                  <div className='text-base font-semibold text-black-primary'>
                    {principle.title}
                  </div>
                  <p className='mb-0 mt-2 text-sm leading-7 text-black-secondary'>
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-8 flex flex-wrap gap-3'>
            <Link href='/proposals' className={linkClass}>
              Explore proposals
              <ArrowRightOutlined />
            </Link>
            <Link href='/projects' className={linkClass}>
              View projects
              <ArrowRightOutlined />
            </Link>
            <Link href='/governance_introducing' className={linkClass}>
              Read current guide
              <ArrowRightOutlined />
            </Link>
          </div>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
          {primaryActions.map((action) => (
            <Link
              href={action.href}
              key={action.href}
              className='no-underline rounded-[24px] border border-[#ececec] bg-white p-5 text-black-primary transition hover:-translate-y-0.5 hover:border-[#d9d9d9] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]'
            >
              <div className='flex items-center justify-between gap-4'>
                <div className='text-lg font-semibold'>{action.title}</div>
                <ArrowRightOutlined className='text-[#8c8c8c]' />
              </div>
              <p className='mb-0 mt-3 text-sm leading-7 text-black-secondary'>
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <OverviewSnapshot />

      <section>
        <div className='mb-6 flex items-end justify-between gap-6'>
          <div>
            <div className='text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
              System Map
            </div>
            <h2 className='mt-3 text-3xl font-semibold text-black-primary'>
              A first-time visitor should understand the protocol graph
            </h2>
          </div>
          <div className='hidden max-w-xl text-sm leading-7 text-black-secondary xl:block'>
            This section is less about process ceremony and more about how
            projects, proposals, release, and treasury state connect to each
            other.
          </div>
        </div>

        <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-5'>
          {systemMap.map((step, index) => (
            <div
              key={step.title}
              className='rounded-[24px] border border-[#ececec] bg-[#fafafa] p-6'
            >
              <div className='mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white'>
                {index + 1}
              </div>
              <h3 className='mb-2 text-xl font-semibold text-black-primary'>
                {step.title}
              </h3>
              <p className='mb-0 text-sm leading-7 text-black-secondary'>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className='rounded-[28px] border border-[#ececec] bg-white p-7'>
        <div className='text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
          Choose Your Path
        </div>
        <h2 className='mt-3 text-3xl font-semibold text-black-primary'>
          Start from intent, not from a menu full of unexplained tabs
        </h2>
        <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {intentPaths.map((path) => (
            <div
              key={path.title}
              className='rounded-[22px] border border-[#efefef] bg-[#fafafa] p-5'
            >
              <div className='text-lg font-semibold text-black-primary'>
                {path.title}
              </div>
              <p className='mb-0 mt-3 text-sm leading-7 text-black-secondary'>
                {path.description}
              </p>
              <div className='mt-4 flex flex-wrap gap-2'>
                {path.links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className='rounded-full bg-white px-3 py-2 text-sm font-medium text-black-primary no-underline ring-1 ring-[#e6e6e6] transition hover:ring-[#141414]'
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='rounded-[28px] border border-[#ececec] bg-white p-7'>
        <div className='text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
          Recommended Next Steps
        </div>
        <h2 className='mt-3 text-3xl font-semibold text-black-primary'>
          Keep the deep links, but use them as guided exits from the overview
        </h2>
        <div className='mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
          {guideLinks.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className='group rounded-[22px] border border-[#efefef] p-5 text-black-primary no-underline transition hover:border-[#141414] hover:bg-[#fafafa]'
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='text-base font-semibold'>{guide.label}</div>
                <ArrowRightOutlined className='text-[#8c8c8c] transition group-hover:translate-x-0.5' />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className='rounded-[28px] border border-[#ececec] bg-white p-7'>
          <div className='text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
            Live Activity
          </div>
          <div className='mt-3 text-3xl font-semibold text-black-primary'>
            A small slice of current governance is enough here
          </div>
          <p className='mb-0 mt-4 max-w-2xl text-sm leading-7 text-black-secondary'>
            The overview page should prove that the protocol is alive without
            forcing a new visitor to scan a long proposal wall. Four recent
            items are enough to signal motion and provide a clean path into the
            full governance workspace.
          </p>
          <div className='mt-8'>
            <LatestProposals
              showButton={true}
              showPage={false}
              pageSize={4}
            />
          </div>
        </div>

        <div className='mt-8 rounded-[28px] border border-[#ececec] bg-[#f7f9fc] p-7'>
          <div className='text-sm font-medium uppercase tracking-[0.2em] text-[#8c8c8c]'>
            Committee Today
          </div>
          <div className='mt-3 text-3xl font-semibold text-black-primary'>
            Governance becomes more legible when the people are visible
          </div>
          <p className='mb-0 mt-4 max-w-3xl text-sm leading-7 text-black-secondary'>
            The committee is the daily decision layer of the DAO. Showing this
            roster here helps first-time visitors connect proposals, execution
            responsibility, and real contributors instead of treating
            governance as an abstract wallet list.
          </p>

          <div className='mt-6 grid gap-3 xl:grid-cols-3'>
            <div className='rounded-[18px] bg-white p-4 text-sm leading-7 text-black-secondary shadow-[0_8px_24px_rgba(0,0,0,0.04)]'>
              Member cards surface nicknames, jobs, and profile notes when
              available so governance reads as a team, not just a checksum.
            </div>
            <div className='rounded-[18px] bg-white p-4 text-sm leading-7 text-black-secondary shadow-[0_8px_24px_rgba(0,0,0,0.04)]'>
              This section works best as context for the proposal workbench,
              where committee members appear as the actors behind routine
              execution and decision-making.
            </div>
            <div className='rounded-[18px] bg-white p-4 text-sm leading-7 text-black-secondary shadow-[0_8px_24px_rgba(0,0,0,0.04)]'>
              Visitors who want the full constitutional framing can continue
              into the governance guide after orienting themselves here.
            </div>
          </div>

          <div className='mt-8'>
            <DaoMembers showTitle={false} />
          </div>
        </div>
      </section>
    </div>
  )
}
