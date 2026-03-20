import { useState } from 'react'
import { Button, message, Tooltip } from 'antd'
import { useBindWalletAddress, useCommittee } from '@hooks/index'
import useUserStore from '@hooks/useUserStore'
import _ from 'lodash'
import {
  extractMessage,
  getProposalType,
  proposalTypeMap,
  transactionWait,
  decodePaddedAddress,
} from '@utils/index'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import {
  executeChangeCommittee,
  executeUpgradeContract,
  contractService,
} from '@contracts/index'

interface ExecuteProposalButtonProps {
  proposal: ProposalResponseData
  disabled: boolean
}

const ExecuteProposalButton: React.FC<ExecuteProposalButtonProps> = ({
  proposal,
  disabled,
}) => {
  const user = useUserStore()
  const { governanceAddress, hasActiveWallet } = useBindWalletAddress()
  // const contract = useContractStore()
  const { isCommittee } = useCommittee(governanceAddress)
  const [loading, setLoading] = useState(false)

  const executeProposal = async () => {
    setLoading(true)
    if (!hasActiveWallet) {
      message.error('Please connect your browser wallet first')
      setLoading(false)
      return
    }

    if (!isCommittee) {
      message.error('You are not a committee member')
      setLoading(false)
      return
    }

    try {
      const proposalType = getProposalType(proposal)
      if (proposalType === proposalTypeMap.releaseTokens) {
        await executeReleaseToken()
      } else if (proposalType === proposalTypeMap.CreateVersion) {
        await executeCreateVersion('Execute create version proposal success')
      } else if (proposalType === proposalTypeMap.SettlementVersion) {
        // 前端显示 acceptProject
        await executeCreateVersion(
          'Execute settlement version proposal success',
        )
      } else if (proposalType === proposalTypeMap.UpgradeContract) {
        await executeUpgradeContract(
          proposal.params[0],
          proposal.params[1],
          proposal.extra,
          proposal.params.length >= 4 ? proposal.params[2] : undefined,
        )
      } else if (proposalType === proposalTypeMap.ChangeCommittee) {
        await executeChangeCommittee(
          proposal.id.toString(),
          // remove the last element which is the type of the proposal
          proposal.params
            .filter((_, index) => index < proposal.params.length - 1)
            .map((paddedAddress) =>
              decodePaddedAddress(paddedAddress),
            ) as string[],
          'Execute change committee proposal success',
        )
      } else {
        message.error('This proposal type error')
      }
    } catch (e) {
      const msg = extractMessage(e)
      message.error(msg)
    }

    setLoading(false)
  }

  // const executeUpgradeContract = async () => {
  //   const proxyContract = await contractProxyContract(proposal.params[0])
  //   console.log('🍻 proposal :', proxyContract)
  //   const tx = await proxyContract.upgradeToAndCall(
  //     proposal.params[1],
  //     new Uint8Array(0),
  //   )
  //   const receipt = await transactionWait(tx)
  //   if (receipt?.status !== 1) {
  //     console.warn('transaction status:', receipt?.status, tx)
  //     message.error(`execute failed[3][${receipt?.status}]`)
  //     return
  //   }
  //   message.success('Execute upgrade contract  proposal success')
  // }

  const executeCreateVersion = async (msg: string) => {
    const projectContract = await contractService.getProjectContract()
    if (!proposal.project) {
      message.error('error: missing project name')
      return
    }
    console.log(
      'projectContract.promoteProject id',
      proposal.project.id,
      proposal,
    )
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
    message.warning("current type no support")
  }

  // if (proposal.state > ProposalState.InProgress) {
  //   return null
  // }

  return (
    <div className='flex-center gap-1'>
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
        placement='top'
        title={'Can only be implemented after voting'}
      >
        <ExclamationCircleOutlined />
      </Tooltip>
    </div>
  )
}

export default ExecuteProposalButton
