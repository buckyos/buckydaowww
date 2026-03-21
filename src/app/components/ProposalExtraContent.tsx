'use client'
import { useState } from 'react'
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



const ProposalSettlementContent: React.FC<{ versionID: string }> = ({ versionID }) => {
  const [contributions, setContributions] = useState<ContributionInfoV2[]>([])

  useAsyncEffect(async () => {
    if (!versionID) {
      return
    }
    const result = await getVersionSettlementInfo(Number(versionID))
    setContributions(result.contributions)
  }, [versionID])


  return (
    <>
      <div className='pt-20'>
        <div className='text-2xl '>Link:</div>

        <Link
          href={`/projects/1/version/${versionID}`}
          target='_blank'
        >
          Corresponding settlement version infomation
        </Link>

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
const ProposalExtraContent: React.FC<{ proposal: ProposalResponseData }> = ({
  proposal,
}) => {
  const contract = useContractStore()

  if (!hasTrustedProposalMetadata(proposal)) {
    return null
  }

  const proposalType = getProposalType(proposal)
  const { calldata } = extractUpgradeCalldataFromExtra(proposal.extra || '')

  return (
    <>
      {proposalType === proposalTypeMap.ChangeCommittee && (
        <>
          <div className='pt-20'>
            <div className='text-3xl'>New Committee list:</div>
            <div className='flex flex-col mt-10 gap-4'>
              {_.initial(proposal.params).map((paddedAddress: string, index: number) => {
                return (
                  <div key={index} className='flex gap-2' >
                    <Tag>Committe Address:</Tag>
                    <div>{decodePaddedAddress(paddedAddress)}</div>
                  </div>
                )
              })}
            </div>
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
        <ProposalSettlementContent versionID={proposal.params[0]} />
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
