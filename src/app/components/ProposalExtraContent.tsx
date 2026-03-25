'use client'
import { useMemo, useState } from 'react'
import { Tag } from 'antd'
import { wrapUnits } from '@utils/numberConverter'
import _ from 'lodash'
import {
  getProposalType,
  proposalTypeMap,
  decodePaddedAddress,
  extractUpgradeCalldataFromExtra,
  hasTrustedProposalMetadata,
} from '@utils/index'
import useContractStore from '@hooks/useContract'
import Link from 'next/link'
import VersionDescription from '@components/VersionDesciption'
import { getVersionSettlementInfo } from '@contracts/index'
import { useAsyncEffect } from 'ahooks'

type CommitteeDiffStatus = 'added' | 'removed' | 'unchanged'

const committeeDiffTag = (status: CommitteeDiffStatus) => {
  if (status === 'added') {
    return <Tag color='green'>Added</Tag>
  }
  if (status === 'removed') {
    return <Tag color='red'>Removed</Tag>
  }
  return <Tag color='blue'>Unchanged</Tag>
}

const CommitteeAddressRow: React.FC<{
  address: string
  status: CommitteeDiffStatus
  member?: CommitteeMember
}> = ({ address, status, member }) => {
  const displayName = member?.nickname || member?.github_account || ''

  return (
    <div className='flex flex-wrap items-center gap-3 rounded-lg border border-solid border-[#F0F0F0] px-4 py-3'>
      <Tag>{displayName ? 'Member' : 'Address'}</Tag>
      {displayName && <span className='font-medium'>{displayName}</span>}
      <code className='break-all text-sm text-cyfs-gray'>{address}</code>
      {committeeDiffTag(status)}
    </div>
  )
}

const CommitteeListSection: React.FC<{
  title: string
  addresses: string[]
  resolveStatus: (address: string) => CommitteeDiffStatus
  memberByAddress: Map<string, CommitteeMember>
  emptyText: string
}> = ({ title, addresses, resolveStatus, memberByAddress, emptyText }) => {
  return (
    <div className='mt-10'>
      <div className='text-2xl font-medium'>{title}</div>
      <div className='mt-4 flex flex-col gap-3'>
        {addresses.length === 0 && (
          <div className='text-cyfs-gray'>{emptyText}</div>
        )}
        {addresses.map((address) => (
          <CommitteeAddressRow
            key={`${title}-${address}`}
            address={address}
            status={resolveStatus(address)}
            member={memberByAddress.get(address.toLowerCase())}
          />
        ))}
      </div>
    </div>
  )
}

function parseNumberishId(value?: string | number) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  try {
    return Number(BigInt(value.toString()))
  } catch {
    return null
  }
}

const ProposalSettlementContent: React.FC<{
  versionID: string
  project?: ProjectVersionProps
}> = ({ versionID, project }) => {
  const [contributions, setContributions] = useState<ContributionInfoV2[]>([])
  const numericProjectId = useMemo(() => parseNumberishId(versionID), [versionID])

  useAsyncEffect(async () => {
    if (numericProjectId === null) {
      return
    }
    const result = await getVersionSettlementInfo(numericProjectId)
    setContributions(result.contributions)
  }, [numericProjectId])


  return (
    <>
      <div className='pt-20'>
        <div className='text-2xl '>Link:</div>

        {project ? (
          <Link
            href={`/projects/${encodeURIComponent(project.pname)}/version/${project.id}`}
            target='_blank'
          >
            Corresponding settlement version information
          </Link>
        ) : (
          <span className='text-cyfs-gray'>
            Version detail link is unavailable for this legacy settlement proposal.
          </span>
        )}

        <div className='text-2xl mt-10'>
          Corresponding contribution value of contributors in project
          settlement:
        </div>
        {contributions.map(
          (item: ContributionInfoV2, index: number) => {
            return (
              <div key={index} className='flex items-center mt-4'>
                <div className='w-[400px]'>
                  Contributor <Tag>{item.contributor}</Tag>
                </div>
                <div className='mx-2'>
                  value:
                  <Tag>{item.value.toString()}</Tag>
                </div>
              </div>
            )
          },
        )}
      </div>
    </>
  )
}

// 提起的内容区，额外的内容
// 应该拆开每一个类型单独的组件
// 暂时先这样
const ProposalExtraContent: React.FC<{
  proposal: ProposalResponseData
  committeeMembers?: CommitteeMember[]
}> = ({
  proposal,
  committeeMembers = [],
}) => {
  const contract = useContractStore()

  if (!hasTrustedProposalMetadata(proposal)) {
    return null
  }

  const proposalType = getProposalType(proposal)
  const { calldata } = extractUpgradeCalldataFromExtra(proposal.extra || '')
  const proposedCommitteeAddresses = proposalType === proposalTypeMap.ChangeCommittee
    ? _.initial(proposal.params).map((paddedAddress: string) => decodePaddedAddress(paddedAddress))
    : []
  const currentCommitteeAddresses = committeeMembers.map((member) => member.address)
  const normalizedCurrent = new Set(currentCommitteeAddresses.map((address) => address.toLowerCase()))
  const normalizedProposed = new Set(proposedCommitteeAddresses.map((address) => address.toLowerCase()))
  const currentCommitteeByAddress = new Map(
    committeeMembers.map((member) => [member.address.toLowerCase(), member] as const),
  )
  const resolveCommitteeDiffStatus = (address: string): CommitteeDiffStatus => {
    const normalized = address.toLowerCase()
    const inCurrent = normalizedCurrent.has(normalized)
    const inProposed = normalizedProposed.has(normalized)

    if (inCurrent && inProposed) {
      return 'unchanged'
    }
    if (inProposed) {
      return 'added'
    }
    return 'removed'
  }
  const committeeDiffAddresses = [
    ...currentCommitteeAddresses,
    ...proposedCommitteeAddresses.filter(
      (address) => !normalizedCurrent.has(address.toLowerCase()),
    ),
  ]

  return (
    <>
      {proposalType === proposalTypeMap.ChangeCommittee && (
        <>
          <div className='pt-20'>
            <div className='text-3xl'>Committee change summary</div>
            <CommitteeListSection
              title='Current committee'
              addresses={currentCommitteeAddresses}
              resolveStatus={resolveCommitteeDiffStatus}
              memberByAddress={currentCommitteeByAddress}
              emptyText='Current committee list is unavailable.'
            />
            <CommitteeListSection
              title='Proposed committee'
              addresses={proposedCommitteeAddresses}
              resolveStatus={resolveCommitteeDiffStatus}
              memberByAddress={currentCommitteeByAddress}
              emptyText='No proposed committee addresses were decoded from this proposal.'
            />
            <CommitteeListSection
              title='Address diff'
              addresses={committeeDiffAddresses}
              resolveStatus={resolveCommitteeDiffStatus}
              memberByAddress={currentCommitteeByAddress}
              emptyText='No committee changes detected.'
            />
          </div>
        </>
      )}
      {proposalType === proposalTypeMap.releaseTokens && (
        <>
          <div className='pt-20'>
            <div className='text-3xl'>Release token proposal details:</div>
            {proposal.params[0].map((item: any, index: number) => {
              const token = proposal.params[1][index]
              return (
                <div key={index} className='mt-4'>
                  Transfer to <Tag>{item}</Tag> :
                  <span className='mx-2'>
                    {wrapUnits(token, contract.decimals)}
                    {contract.symbol}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {proposalType === proposalTypeMap.CreateVersion && (
        <>
          <div className='pt-20'>
            <div className='text-2xl '>Link:</div>

            <Link
              href={`/projects/1/version/${(proposal.project as ProjectVersionProps).id
                }`}
              target='_blank'
            >
              Corresponding Version
            </Link>

            <div className='mt-10'>
              <div className='text-2xl '>infomation:</div>
              <VersionDescription
                version={proposal.project as ProjectVersionProps}
                inProposalPage={true}
              />
            </div>
          </div>
        </>
      )}

      {proposalType === proposalTypeMap.SettlementVersion && (
        <ProposalSettlementContent
          versionID={proposal.params[0]}
          project={proposal.project as ProjectVersionProps | undefined}
        />
      )}

      {proposalType === proposalTypeMap.UpgradeContract && (
        <div className='pt-20'>
          <div className='text-3xl'>Upgrade proposal details:</div>
          <div className='mt-6 flex flex-col gap-3'>
            <div>
              Proxy Contract: <Tag>{proposal.params[0]}</Tag>
            </div>
            <div>
              New Implementation: <Tag>{proposal.params[1]}</Tag>
            </div>
            {proposal.params.length >= 4 && (
              <div>
                Approved Calldata Hash: <Tag>{proposal.params[2]}</Tag>
              </div>
            )}
            <div>
              Migration Calldata:{' '}
              <Tag color={calldata === '0x' ? 'default' : 'blue'}>
                {calldata}
              </Tag>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProposalExtraContent
