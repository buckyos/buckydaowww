'use client'
import { useState } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'next/navigation'
import {
  fetchProposalId,
  fetchMembers,
} from '@services/index'
import { message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ProposalExtraContent from '@components/ProposalExtraContent'
import ProposalHeaderContent from './ProposalHeaderContent'

dayjs.extend(relativeTime)

export default function ProposalDetailPage() {
  const { proposalId } = useParams() as { proposalId: string }
  const [proposal, setProposal] = useState<ProposalResponseData>()
  const [members, setMembers] = useState<CommitteeMember[]>([])
  
  const fetchData = async () => {
    const result = await fetchProposalId(proposalId)
    // console.log('result', result)
    const proposal = result.data as ProposalResponseData
    setProposal(proposal)
    return proposal
  }

  useAsyncEffect(async () => {
    const [_proposal, memberResp] = await Promise.all([
      fetchData(),
      fetchMembers(),
    ])
    setMembers(memberResp.data)
  }, [])

  if (!proposal) {
    return (<div className='w-[1000px] mx-auto flex-center'>
      loading proposal...
    </div>)
  }

  return (
    <>
      <div className='w-[1000px] mx-auto'>
        <h2 className='text-4xl font-medium'>{proposal.title}</h2>
        <ProposalHeaderContent
          proposal={proposal}
          members={members}
          fetchData={fetchData}
        />
        <ProposalExtraContent proposal={proposal} />

        <div className='mt-20 pt-20'>{proposal.extra}</div>
        <div className='my-20 border-b border-solid border-[#F0F0F0]'></div>
        <div className='flex flex-col gap-4'>
          <div className='flex relative'>
            <label className='font-bold w-28'>params:</label>
            <div className='text-cyfs-gray'>{proposal.params.map((item, index) => <div key={index}>{JSON.stringify(item, null, 2)}</div>)}</div>
            <CopyOutlined
              className='absolute right-2 top-2 cursor-pointer hover:text-blue-500'
              onClick={() => {
                // 复制params到剪贴板
                navigator.clipboard.writeText(JSON.stringify(proposal.params, null, 2))
                  .then(() => message.success('Params Copied to clipboard'))
                  .catch(() => message.error('Failed to copy'))
              }}
            />
          </div>
          <div className='flex'>
            <label className='font-bold w-28'>paramroot:</label>
            <span className='text-cyfs-gray'>{proposal.paramroot}</span>
          </div>
          <div className='flex'>
            <label className='font-bold w-28'>from group:</label>
            <span className='text-cyfs-gray'>{proposal.fromGroup}</span>
          </div>
        </div>
      </div>
    </>
  )
}
