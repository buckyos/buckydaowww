import { transactionWait } from '@utils/index'
import { message } from 'antd'

async function executeChangeCommittee(
  contract: ContractStoreDefine,
  id: string,
  committeeList: string[],
  msg: string,
) {
  const committeeContract = await contract.getSignerComitteeContract()

  const tx = await committeeContract.setCommittees(committeeList, id)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`execute failed[3][${receipt?.status}]`)
    return false
  }
  message.success(msg)
  return true
}

export { executeChangeCommittee }
