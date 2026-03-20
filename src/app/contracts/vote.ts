import { ethers } from 'ethers'
import { contractService } from '@contracts/index'

async function voteChangeCommittee(
  proposalId: string,
  params: any[],
) {
  const committeeContract = await contractService.getCommitteeContract()
  const tx = await committeeContract.support(proposalId, params)

  return tx
}

async function voteUpgradeContract(
  proposalId: string,
  params: any[],
) {
  const committeeContract = await contractService.getCommitteeContract()
  const contractProxyAddress = params[0]
  const implAddress = params[1]
  const upgradeContract = params[params.length - 1]
  const encodedParams = [
    ethers.zeroPadValue(contractProxyAddress as string, 32),
    ethers.zeroPadValue(implAddress as string, 32),
  ]

  if (params.length >= 4) {
    encodedParams.push(params[2] as string)
  }

  encodedParams.push(ethers.encodeBytes32String(upgradeContract))

  const tx = await committeeContract.support(proposalId, encodedParams)
  return tx
}

export { voteChangeCommittee, voteUpgradeContract }
