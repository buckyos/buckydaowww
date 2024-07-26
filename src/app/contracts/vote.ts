import { ethers } from 'ethers'

async function voteChangeCommittee(
  contract: ContractStoreDefine,
  proposalId: string,
  params: any[],
) {
  const committeeContract = await contract.getSignerComitteeContract()
  const tx = await committeeContract.support(proposalId, params)

  return tx
}

async function voteUpgradeContract(
  contract: ContractStoreDefine,
  proposalId: string,
  params: any[],
) {
  const committeeContract = await contract.getSignerComitteeContract()
  const contractProxyAddress = params[0]
  const implAddress = params[1]
  const upgradeContract = params[2]
  const tx = await committeeContract.support(proposalId, [
    ethers.zeroPadValue(contractProxyAddress as string, 32),
    ethers.zeroPadValue(implAddress as string, 32),
    ethers.encodeBytes32String(upgradeContract),
  ])
  return tx
}

export { voteChangeCommittee, voteUpgradeContract }
