import { Tag } from 'antd'
import { wrapUnits } from '@utils/numberConverter'
import _ from 'lodash'
import { getProposalType, proposalTypeMap } from '@utils/index'
import useContractStore from '@hooks/useContract'
import Link from 'next/link'
import VersionDescription from '@components/VersionDesciption'

const ProposalExtraContent: React.FC<{ proposal: ProposalResponseData }> = ({
  proposal,
}) => {
  const proposalType = getProposalType(proposal)
  const contract = useContractStore()

  return (
    <>
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
              href={`/projects/1/version/${
                (proposal.project as ProjectVersionProps).id
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
        <>
          <div className='pt-20'>
            <div className='text-2xl '>Link:</div>

            <Link
              href={`/projects/1/version/${proposal.params[0].projectId}`}
              target='_blank'
            >
              Corresponding settlement version infomation
            </Link>

            <div className='text-2xl mt-10'>
              Corresponding contribution value of contributors in project
              settlement:
            </div>
            {(proposal.params[0].contributions as ContributionInfo[]).map(
              (item: ContributionInfo, index: number) => {
                return (
                  <div key={index} className='flex items-center mt-4'>
                    <div className='w-[400px]'>
                      Contributor <Tag>{item.contributor}</Tag>
                    </div>
                    <div className='mx-2'>
                      value:
                      <Tag>{item.value}</Tag>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </>
      )}
    </>
  )
}

export default ProposalExtraContent
