import { useState } from 'react'
import { Button, message, Tooltip } from 'antd'
import { useCommittee } from '@hooks/index'
import useUserStore from '@hooks/useUserStore'
import useContractStore, {
  getTokenContract,
  getProjectContract,
  contractProxyContract,
} from '@hooks/useContract'
import _ from 'lodash'
import {
  extractMessage,
  getProposalType,
  proposalTypeMap,
  transactionWait,
} from '@utils/index'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { ProposalState } from '@vars/index'

interface ExecuteProposalButtonProps {
  proposal: ProposalResponseData
  disabled: boolean
}

const ExecuteProposalButton: React.FC<ExecuteProposalButtonProps> = ({
  proposal,
  disabled,
}) => {
  const user = useUserStore()
  const contract = useContractStore()
  const { isCommittee } = useCommittee(user.user)
  const [loading, setLoading] = useState(false)

  const executeProposal = async () => {
    setLoading(true)
    if (!isCommittee) {
      message.error('You are not a committee member')
      return
    }

    try {
      const proposalType = getProposalType(proposal)
      if (proposalType === proposalTypeMap.releaseTokens) {
        await executeReleaseToken()
      } else if (proposalType === proposalTypeMap.CreateVersion) {
        await executeCreateVersion('Execute create version proposal success')
      } else if (proposalType === proposalTypeMap.SettlementVersion) {
        await executeCreateVersion(
          'Execute settlement version proposal success',
        )
      } else if (proposalType === proposalTypeMap.UpgradeContract) {
        await executeUpgradeContract()
      } else {
        message.error('This proposal type error')
      }
    } catch (e) {
      const msg = extractMessage(e)
      message.error(msg)
    }

    setLoading(false)
  }

  const executeUpgradeContract = async () => {
    const proxyContract = await contractProxyContract(proposal.params[0])
    console.log('🍻 proposal :', proxyContract)
    const tx = await proxyContract.upgradeToAndCall(
      proposal.params[1],
      new Uint8Array(0),
    )
    const receipt = await transactionWait(tx)
    if (receipt?.status !== 1) {
      console.warn('transaction status:', receipt?.status, tx)
      message.error(`execute failed[3][${receipt?.status}]`)
      return
    }
    message.success('Execute upgrade contract  proposal success')
  }

  const executeCreateVersion = async (msg: string) => {
    const projectContract = await getProjectContract(contract)
    if (!proposal.project) {
      message.error('error: missing project name')
      return
    }
    const tx = await projectContract.promoteProject(proposal.project.id)
    const receipt = await transactionWait(tx)
    if (receipt?.status !== 1) {
      console.warn('transaction status:', receipt?.status, tx)
      message.error(`execute failed[3][${receipt?.status}]`)
      return
    }
    message.success(msg)
  }

  const executeReleaseToken = async () => {
    const tokenContract = await getTokenContract(contract.tokenAddress)

    const address = proposal?.params[0]
    const amounts = proposal?.params[1]

    const tx = await tokenContract.releaseTokens(proposal.id, address, amounts)
    console.log('🍻 contract releaseTokens result :', tx, address, amounts)
    const receipt = await transactionWait(tx)
    if (receipt?.status !== 1) {
      console.warn('transaction status:', receipt?.status, tx)
      message.error(`Create Investment failed[3][${receipt?.status}]`)
      return
    }
    message.success('Execute proposal success')
  }

  if (proposal.state > ProposalState.InProgress) {
    return null
  }

  return (
    <div className='flex-center mt-10'>
      <Button
        loading={loading}
        disabled={disabled}
        type='primary'
        onClick={executeProposal}
        className=''
      >
        Execute proposal
      </Button>

      <Tooltip
        className='ml-4'
        placement='top'
        title={'Can only be implemented after voting'}
      >
        <ExclamationCircleOutlined />
      </Tooltip>
    </div>
  )
}

export default ExecuteProposalButton
