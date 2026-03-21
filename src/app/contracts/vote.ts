import { ethers } from 'ethers'
import { contractService } from './contract'
import {
  convertVersion,
  getProposalType,
  proposalTypeMap,
  zeroPadLeft,
} from '@utils/index'
import { decodeIfEncoded } from '@utils/encode'

type VoteAction = 'support' | 'reject'

function encodeProposalFlag(value: unknown) {
  return ethers.encodeBytes32String(decodeIfEncoded(String(value)))
}

function encodeAddressParam(value: unknown) {
  return ethers.zeroPadValue(String(value), 32)
}

function encodeUintParam(value: unknown) {
  return zeroPadLeft(String(value))
}

function encodeProjectProposalParams(params: any[]) {
  return [
    encodeUintParam(params[0]),
    encodeProposalFlag(params[1]),
    encodeUintParam(convertVersion(String(params[2]))),
    encodeUintParam(params[3]),
    encodeUintParam(params[4]),
    encodeProposalFlag(params[5]),
  ]
}

function encodeProposalParamsForVote(proposal: ProposalResponseData) {
  const proposalType = getProposalType(proposal)

  if (proposalType === proposalTypeMap.ChangeCommittee) {
    return [
      ...proposal.params
        .slice(0, -1)
        .map((value) => encodeAddressParam(value)),
      encodeProposalFlag(proposal.params[proposal.params.length - 1]),
    ]
  }

  if (proposalType === proposalTypeMap.UpgradeContract) {
    const encodedParams = [
      encodeAddressParam(proposal.params[0]),
      encodeAddressParam(proposal.params[1]),
    ]

    if (proposal.params.length >= 4) {
      encodedParams.push(String(proposal.params[2]))
    }

    encodedParams.push(
      encodeProposalFlag(proposal.params[proposal.params.length - 1]),
    )
    return encodedParams
  }

  if (
    proposalType === proposalTypeMap.CreateVersion ||
    proposalType === proposalTypeMap.SettlementVersion
  ) {
    return encodeProjectProposalParams(proposal.params)
  }

  throw new Error('Web voting is not supported for this proposal type yet')
}

function supportsProposalVotingOnWeb(proposal: ProposalResponseData) {
  const proposalType = getProposalType(proposal)

  return (
    proposalType === proposalTypeMap.ChangeCommittee ||
    proposalType === proposalTypeMap.UpgradeContract ||
    proposalType === proposalTypeMap.CreateVersion ||
    proposalType === proposalTypeMap.SettlementVersion
  )
}

async function voteProposal(
  proposal: ProposalResponseData,
  action: VoteAction,
) {
  const committeeContract = await contractService.getCommitteeContract()
  const encodedParams = encodeProposalParamsForVote(proposal)

  if (action === 'support') {
    return committeeContract.support(proposal.id, encodedParams)
  }

  return committeeContract.reject(proposal.id, encodedParams)
}

export {
  encodeProposalParamsForVote,
  supportsProposalVotingOnWeb,
  voteProposal,
}
