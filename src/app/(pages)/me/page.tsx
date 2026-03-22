'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Button, Spin, Tag, message } from 'antd'
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons'
import ProposalStateTag from '@components/ProposalStateTag'
import {
  fetchRepositoryList,
  getProjectVersions,
  getProposals,
  beginGithubLogin,
  decodeProjectProfile,
} from '@services/index'
import {
  contractService,
  fetchTokenInfo,
  getDevRatio,
  newProviderContract,
} from '@contracts/index'
import { abis } from '@contracts/abis'
import {
  useBindWalletAddress,
  useCommittee,
  useUserStore,
} from '@hooks/index'
import { ProposalState } from '@vars/index'
import {
  getProposalType,
  hasTrustedProposalMetadata,
  transformVersionStateWord,
} from '@utils/index'
import { formatAmount, wrapUnits } from '@utils/numberConverter'

const cardClassName =
  'rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-sm'

type AssetSummary = {
  normal: bigint
  dev: bigint
  votingPower: bigint
  claimableLockup: bigint
  withdrawableDividendCount: number
  withdrawableDividendCycle: bigint
}

type ManagedVersionItem = ProjectVersionProps & {
  projectId: string
  projectName: string
}

function normalizeAddress(address?: string) {
  return address?.trim().toLowerCase() || ''
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

function formatTokenBigInt(
  rawValue: bigint,
  decimals: number,
  fractionDigits = 4,
) {
  return Number.parseFloat(wrapUnits(rawValue, decimals)).toFixed(fractionDigits)
}

function matchesCurrentIdentity(
  candidate: User | undefined,
  addresses: string[],
  githubAccount: string,
) {
  if (!candidate) {
    return false
  }

  const candidateAddress = normalizeAddress(candidate.address)
  if (candidateAddress && addresses.includes(candidateAddress)) {
    return true
  }

  if (
    githubAccount &&
    candidate.github_account &&
    candidate.github_account === githubAccount
  ) {
    return true
  }

  return false
}

function getLoginLabel(useLocalDevLogin: boolean) {
  return useLocalDevLogin ? 'Login with Wallet' : 'Login with GitHub'
}

export default function MePage() {
  const userStore = useUserStore()
  const user = userStore.user
  const {
    governanceAddress,
    activeAddress,
    boundAddress,
    hasActiveWallet,
    isAddressMismatch,
    sessionState,
    useLocalDevLogin,
    shouldShowBindWalletAction,
    bindWalletLabel,
    handleConnectWallet,
    handleLocalLogin,
    handleBindWallet,
  } = useBindWalletAddress()
  const { isCommittee } = useCommittee(governanceAddress)
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [assets, setAssets] = useState<AssetSummary>({
    normal: 0n,
    dev: 0n,
    votingPower: 0n,
    claimableLockup: 0n,
    withdrawableDividendCount: 0,
    withdrawableDividendCycle: 0n,
  })
  const [tokenDecimals, setTokenDecimals] = useState({
    normal: 18,
    dev: 18,
    normalSymbol: 'BDT',
    devSymbol: 'BDDT',
  })
  const [allProposals, setAllProposals] = useState<ProposalResponseData[]>([])
  const [allProjects, setAllProjects] = useState<ProjectItem[]>([])
  const [managedVersions, setManagedVersions] = useState<ManagedVersionItem[]>([])

  useEffect(() => {
    let cancelled = false

    const loadAssets = async () => {
      if (!governanceAddress) {
        if (!cancelled) {
          setAssets({
            normal: 0n,
            dev: 0n,
            votingPower: 0n,
            claimableLockup: 0n,
            withdrawableDividendCount: 0,
            withdrawableDividendCycle: 0n,
          })
          setAssetsLoading(false)
        }
        return
      }

      setAssetsLoading(true)

      try {
        const [tokenInfo, ratio] = await Promise.all([
          fetchTokenInfo(),
          getDevRatio(),
        ])

        const normalDecimals = tokenInfo.normal.decimals
        const devDecimals = tokenInfo.dev.decimals
        const normalizedRatio = BigInt(ratio.toString())
        const normalToken = await newProviderContract(
          contractService.getAddressOfNormalToken(),
          abis,
        )
        const devToken = await newProviderContract(
          contractService.getAddressOfDevToken(),
          abis,
        )
        const lockupContract = await newProviderContract(
          contractService.getAddressOfLockup(),
          abis,
        )
        const dividendContract = await newProviderContract(
          contractService.getAddressOfDividend(),
          abis,
        )

        const [normalRaw, devRaw, claimableRaw, currentCycleIndexRaw] =
          await Promise.all([
            normalToken.balanceOf(governanceAddress),
            devToken.balanceOf(governanceAddress),
            lockupContract.getCanClaimTokens.staticCall({ from: governanceAddress }),
            dividendContract.getCurrentCycleIndex(),
          ])

        const normal = BigInt(normalRaw.toString())
        const dev = BigInt(devRaw.toString())
        const claimableLockup = BigInt(claimableRaw.toString())
        const votingPower = normal + (dev * normalizedRatio) / 100n
        const currentCycleIndex = BigInt(currentCycleIndexRaw.toString())
        const previousCycleIndex = currentCycleIndex > 0n ? currentCycleIndex - 1n : 0n

        let withdrawableDividendCount = 0
        if (currentCycleIndex > 0n) {
          const previousCycleInfos = await dividendContract.getCycleInfos(
            previousCycleIndex,
            previousCycleIndex,
          )
          const previousCycle = previousCycleInfos[0]
          const rewardTokens = previousCycle?.rewards?.map((reward: any) => reward.token) || []
          if (rewardTokens.length > 0) {
            const estimatedRewards = await dividendContract.estimateDividends.staticCall(
              [previousCycleIndex],
              rewardTokens,
              { from: governanceAddress },
            )
            withdrawableDividendCount = estimatedRewards.filter(
              (reward: any) => !reward.withdrawed && BigInt(reward.amount.toString()) > 0n,
            ).length
          }
        }

        if (!cancelled) {
          setTokenDecimals({
            normal: normalDecimals,
            dev: devDecimals,
            normalSymbol: tokenInfo.normal.symbol,
            devSymbol: tokenInfo.dev.symbol,
          })
          setAssets({
            normal,
            dev,
            votingPower,
            claimableLockup,
            withdrawableDividendCount,
            withdrawableDividendCycle: previousCycleIndex,
          })
        }
      } catch (error) {
        console.warn('load /me assets failed', error)
      } finally {
        if (!cancelled) {
          setAssetsLoading(false)
        }
      }
    }

    void loadAssets()

    return () => {
      cancelled = true
    }
  }, [governanceAddress])

  useEffect(() => {
    let cancelled = false
    const addresses = [
      normalizeAddress(governanceAddress),
      normalizeAddress(boundAddress),
      normalizeAddress(activeAddress),
    ].filter(Boolean)

    if (addresses.length === 0 && !user.github_account) {
      setAllProposals([])
      setAllProjects([])
      setManagedVersions([])
      setDashboardLoading(false)
      return () => {
        cancelled = true
      }
    }

    setDashboardLoading(true)
    const loadDashboard = async () => {
      try {
        const [proposalResult, projectResult] = await Promise.all([
          getProposals(1, 100),
          fetchRepositoryList(),
        ])

        const proposals = proposalResult?.data?.items || []
        const projects = (projectResult?.data || []).map((item) =>
          decodeProjectProfile(item),
        )

        const versionLists = await Promise.all(
          projects.map(async (project) => {
            try {
              const result = await getProjectVersions(project.project_name)
              const items = result?.data?.items || []
              return items.map((version: ProjectVersionProps) => ({
                ...version,
                projectId: project.project_id,
                projectName: project.project_name,
              }))
            } catch (error) {
              console.warn('load project versions failed', project.project_name, error)
              return []
            }
          }),
        )

        if (!cancelled) {
          setAllProposals(proposals)
          setAllProjects(projects)
          setManagedVersions(versionLists.flat())
        }
      } catch (error) {
        console.warn('load /me dashboard failed', error)
      } finally {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [governanceAddress, boundAddress, activeAddress, user.github_account])

  const identityAddresses = [
    normalizeAddress(governanceAddress),
    normalizeAddress(boundAddress),
    normalizeAddress(activeAddress),
  ].filter(Boolean)

  const myProjects = allProjects.filter((project) =>
    matchesCurrentIdentity(project.owner, identityAddresses, user.github_account),
  )

  const myProposals = allProposals
    .filter((proposal) =>
      matchesCurrentIdentity(proposal.creator, identityAddresses, user.github_account),
    )
    .sort((a, b) => Number(b.id) - Number(a.id))

  const awaitingMyVote = allProposals
    .filter((proposal) => {
      if (!hasTrustedProposalMetadata(proposal)) {
        return false
      }
      if (proposal.state !== ProposalState.InProgress) {
        return false
      }

      const normalizedGovernanceAddress = normalizeAddress(governanceAddress)
      if (!normalizedGovernanceAddress) {
        return false
      }

      const hasVoted =
        proposal.support.some(
          (address) => normalizeAddress(address) === normalizedGovernanceAddress,
        ) ||
        proposal.reject.some(
          (address) => normalizeAddress(address) === normalizedGovernanceAddress,
        )

      if (hasVoted) {
        return false
      }

      if (proposal.full) {
        return assets.votingPower > 0n
      }

      return isCommittee
    })
    .sort((a, b) => a.expired - b.expired)

  const executableProposals = allProposals
    .filter((proposal) => {
      if (!hasTrustedProposalMetadata(proposal)) {
        return false
      }

      if (proposal.full) {
        return proposal.state === ProposalState.InProgress && proposal.expired * 1000 < Date.now()
      }

      return isCommittee && proposal.state === ProposalState.Accepted
    })
    .sort((a, b) => Number(b.id) - Number(a.id))

  const myManagedVersions = managedVersions
    .filter((version) =>
      identityAddresses.includes(normalizeAddress(version.manager)),
    )
    .sort((a, b) => b.id - a.id)

  const displayName =
    user.nickname
    || user.github_account
    || ellipsisAddress(boundAddress || activeAddress)
    || 'Guest'

  const loginLabel = getLoginLabel(useLocalDevLogin)

  const handleLogin = async () => {
    if (useLocalDevLogin) {
      await handleLocalLogin()
      return
    }

    const result = await beginGithubLogin(window.location.href)
    if (result.code !== 0 || !result.data) {
      message.error(result.msg || 'Failed to initialize GitHub login')
      return
    }

    window.location.href = result.data
  }

  const handleSwitchGithubAccount = async () => {
    const result = await beginGithubLogin(window.location.href, {
      forceAccountSelection: true,
    })
    if (result.code !== 0 || !result.data) {
      message.error(result.msg || 'Failed to switch GitHub account')
      return
    }

    window.location.href = result.data
  }

  return (
    <div className='space-y-8 py-8'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-3xl font-semibold'>Me</h1>
          <p className='mt-2 max-w-3xl text-sm leading-7 text-gray-500'>
            Personal dashboard for identity, token summary, current actions, and recent DAO activity.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Link href='/token'>
            <Button>Open Token Center</Button>
          </Link>
          <Link href='/user/info'>
            <Button type='primary' ghost>
              User Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_1fr]'>
        <section className={cardClassName}>
          <div className='flex items-start gap-4'>
            <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500'>
              <UserOutlined className='text-2xl' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-2xl font-medium'>{displayName}</h2>
                {isCommittee && <Tag color='green'>committee</Tag>}
                {sessionState === 'authenticated' ? (
                  <Tag color='blue'>authenticated</Tag>
                ) : sessionState === 'anonymous' ? (
                  <Tag color='gold'>anonymous</Tag>
                ) : (
                  <Tag>disconnected</Tag>
                )}
              </div>
              <div className='mt-2 space-y-2 text-sm text-gray-500'>
                {user.github_account && <div>GitHub: @{user.github_account}</div>}
                <div>
                  Bound wallet:{' '}
                  <span className='font-mono text-cyfs-green'>{boundAddress || '-'}</span>
                </div>
                <div>
                  Active wallet:{' '}
                  <span className='font-mono text-cyfs-green'>{activeAddress || '-'}</span>
                </div>
                {isAddressMismatch && (
                  <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700'>
                    Active wallet differs from the logged-in/bound address. Switch back, rebind, or switch GitHub account.
                  </div>
                )}
              </div>
              <div className='mt-4 flex flex-wrap gap-3'>
                {!hasActiveWallet && (
                  <Button onClick={() => void handleConnectWallet()}>
                    Connect Wallet
                  </Button>
                )}
                {sessionState !== 'authenticated' && (
                  <Button type='primary' onClick={() => void handleLogin()}>
                    {loginLabel}
                  </Button>
                )}
                {shouldShowBindWalletAction && (
                  <Button onClick={() => void handleBindWallet()}>
                    {bindWalletLabel}
                  </Button>
                )}
                {sessionState === 'authenticated' && !useLocalDevLogin && (
                  <Button onClick={() => void handleSwitchGithubAccount()}>
                    Switch GitHub account
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={cardClassName}>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div>
              <h2 className='text-xl font-medium'>My Assets</h2>
              <p className='mt-1 text-sm text-gray-500'>
                Wallet-level summary. Open Token Center for full details.
              </p>
            </div>
            <Link className='text-cyfs-green' href='/token'>
              View details <ArrowRightOutlined />
            </Link>
          </div>

          {!governanceAddress ? (
            <div className='mt-6 rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] px-6 py-8 text-sm text-gray-500'>
              Connect or bind a wallet to see your personal token summary.
            </div>
          ) : assetsLoading ? (
            <div className='flex justify-center py-16'>
              <Spin />
            </div>
          ) : (
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>BDT</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenBigInt(assets.normal, tokenDecimals.normal, 4)}
                </div>
                <div className='mt-1 text-sm text-cyfs-green'>{tokenDecimals.normalSymbol}</div>
              </div>
              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>BDDT</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenBigInt(assets.dev, tokenDecimals.dev, 4)}
                </div>
                <div className='mt-1 text-sm text-cyfs-green'>{tokenDecimals.devSymbol}</div>
              </div>
              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>Voting Power</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenBigInt(assets.votingPower, tokenDecimals.normal, 4)}
                </div>
                <div className='mt-1 text-sm text-gray-500'>Current full-vote weight</div>
              </div>
              <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
                <div className='text-sm text-gray-500'>Claimable Lockup</div>
                <div className='mt-2 text-2xl font-semibold'>
                  {formatTokenBigInt(assets.claimableLockup, tokenDecimals.normal, 4)}
                </div>
                <div className='mt-1 text-sm text-gray-500'>
                  Withdrawable dividends: {assets.withdrawableDividendCount}
                  {assets.withdrawableDividendCount > 0
                    ? ` token(s) from cycle #${assets.withdrawableDividendCycle.toString()}`
                    : ' token(s)'}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className={cardClassName}>
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div>
            <h2 className='text-xl font-medium'>Action Queue</h2>
            <p className='mt-1 text-sm text-gray-500'>
              The highest-signal items that likely need your attention now.
            </p>
          </div>
        </div>

        {dashboardLoading ? (
          <div className='flex justify-center py-16'>
            <Spin />
          </div>
        ) : (
          <div className='mt-6 grid gap-4 xl:grid-cols-3'>
            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <div className='text-base font-medium'>Awaiting My Vote</div>
                <Tag>{awaitingMyVote.length}</Tag>
              </div>
              <div className='mt-4 space-y-3'>
                {awaitingMyVote.length === 0 ? (
                  <div className='text-sm text-gray-500'>No proposal currently requires your vote.</div>
                ) : (
                  awaitingMyVote.slice(0, 5).map((proposal) => (
                    <Link
                      key={`vote-${proposal.id}`}
                      href={`/proposal/${proposal.id}`}
                      className='block rounded-lg border border-white bg-white px-4 py-3 hover:border-[#D9D9D9]'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='font-medium text-black'>
                          {proposal.title?.trim() || `Proposal #${proposal.id}`}
                        </div>
                        <ProposalStateTag proposal={proposal} state={proposal.state} />
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        {String(getProposalType(proposal))} · ends {dayjs(proposal.expired * 1000).format('MM-DD HH:mm')}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <div className='text-base font-medium'>Execution / Settlement</div>
                <Tag>{executableProposals.length}</Tag>
              </div>
              <div className='mt-4 space-y-3'>
                {executableProposals.length === 0 ? (
                  <div className='text-sm text-gray-500'>No proposal currently looks ready for your execution path.</div>
                ) : (
                  executableProposals.slice(0, 5).map((proposal) => (
                    <Link
                      key={`execute-${proposal.id}`}
                      href={`/proposal/${proposal.id}`}
                      className='block rounded-lg border border-white bg-white px-4 py-3 hover:border-[#D9D9D9]'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='font-medium text-black'>
                          {proposal.title?.trim() || `Proposal #${proposal.id}`}
                        </div>
                        {proposal.full ? (
                          <Tag color='blue'>Settle full vote</Tag>
                        ) : (
                          <Tag color='green'>Ready to execute</Tag>
                        )}
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        {String(getProposalType(proposal))}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className='rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <div className='text-base font-medium'>Managed Versions</div>
                <Tag>{myManagedVersions.length}</Tag>
              </div>
              <div className='mt-4 space-y-3'>
                {myManagedVersions.length === 0 ? (
                  <div className='text-sm text-gray-500'>No project version currently points to your address as manager.</div>
                ) : (
                  myManagedVersions.slice(0, 5).map((version) => (
                    <Link
                      key={`version-${version.id}`}
                      href={`/projects/${version.projectId}/version/${version.id}`}
                      className='block rounded-lg border border-white bg-white px-4 py-3 hover:border-[#D9D9D9]'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='font-medium text-black'>
                          {version.projectName} {version.version}
                        </div>
                        <Tag color={version.state === 1 ? 'processing' : 'default'}>
                          {transformVersionStateWord(version.state)}
                        </Tag>
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        Budget {formatAmount(Number(wrapUnits(version.budget, tokenDecimals.normal)), 2, false)} {tokenDecimals.normalSymbol}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className={cardClassName}>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-xl font-medium'>My Proposals</h2>
              <p className='mt-1 text-sm text-gray-500'>Recent proposals attributable to your current identity.</p>
            </div>
            <Link className='text-cyfs-green' href='/proposals'>
              View all <ArrowRightOutlined />
            </Link>
          </div>

          <div className='mt-6 space-y-3'>
            {dashboardLoading ? (
              <div className='flex justify-center py-8'>
                <Spin />
              </div>
            ) : myProposals.length === 0 ? (
              <div className='text-sm text-gray-500'>No proposal currently matches your logged-in identity or wallet.</div>
            ) : (
              myProposals.slice(0, 5).map((proposal) => (
                <Link
                  key={`my-proposal-${proposal.id}`}
                  href={`/proposal/${proposal.id}`}
                  className='block rounded-lg border border-[#F3F4F6] px-4 py-3 hover:border-[#D9D9D9]'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div className='font-medium text-black'>
                      {proposal.title?.trim() || `Proposal #${proposal.id}`}
                    </div>
                    <ProposalStateTag proposal={proposal} state={proposal.state} />
                  </div>
                  <div className='mt-1 text-sm text-gray-500'>
                    #{proposal.id} · {String(getProposalType(proposal))}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className={cardClassName}>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-xl font-medium'>My Projects</h2>
              <p className='mt-1 text-sm text-gray-500'>Project profiles you own or that match your current GitHub identity.</p>
            </div>
            <Link className='text-cyfs-green' href='/projects'>
              View all <ArrowRightOutlined />
            </Link>
          </div>

          <div className='mt-6 space-y-3'>
            {dashboardLoading ? (
              <div className='flex justify-center py-8'>
                <Spin />
              </div>
            ) : myProjects.length === 0 ? (
              <div className='text-sm text-gray-500'>No project profile currently matches your identity.</div>
            ) : (
              myProjects.slice(0, 5).map((project) => (
                <Link
                  key={`my-project-${project.project_id}`}
                  href={`/projects/${project.project_id}`}
                  className='block rounded-lg border border-[#F3F4F6] px-4 py-3 hover:border-[#D9D9D9]'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div className='font-medium text-black'>{project.project_name}</div>
                    {project.legacy && <Tag>legacy</Tag>}
                  </div>
                  <div className='mt-1 text-sm text-gray-500'>
                    {project.state} · updated {project.updatedAt ? dayjs(project.updatedAt * 1000).format('YYYY-MM-DD') : '-'}
                  </div>
                  {project.github_url && (
                    <div className='mt-1 truncate text-sm text-cyfs-green'>
                      {project.github_url}
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
