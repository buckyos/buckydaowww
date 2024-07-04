import { StoreValue } from 'antd/es/form/interface'
import { message } from 'antd'
import { toBigInt, getAddress, parseUnits } from 'ethers'
import dayjs from 'dayjs'
import { transactionWait } from '@utils/index'

async function createWhitelistInvestment(
  values: StoreValue,
  contract: ContractStoreDefine,
) {
  console.log('🍻 createWhitelistInvestment values :', values)
  // const title = values.title
  // const content = values.content
  //
  const totlePercent = values.whitelist.reduce((acc: number, cur: any) => {
    return acc + cur.percent
  }, 0)
  console.log('🍻 totlePercent :', totlePercent)
  if (totlePercent !== 100) {
    message.error('error: total percent must be 100')
    return false
  }

  if (!values.endTime) {
    message.error('error: missing end time')
    return false
  }

  if (values.endTime2 < values.endTime) {
    message.error('error: second end time must be greater than end time')
    return false
  }

  const now = dayjs().unix()
  const step1Duration = toBigInt(dayjs(values.endTime).unix() - now)
  const step2Duration = toBigInt(dayjs(values.endTime2).unix() - now)

  console.log('🍻 step1Duration :', step1Duration, step2Duration)

  const startParams = {
    whitelist: values.whitelist.map((item: any) => getAddress(item.address)),
    firstPercent: values.whitelist.map((item: any) =>
      parseUnits(item.percent, 0),
    ),
    tokenAddress: values.tokenAddress,
    tokenAmount: parseUnits(values.tokenAmount, 0),
    tokenRatio: {
      tokenAmount: parseUnits(values.assetTokenAmount, 0),
      daoTokenAmount: parseUnits(values.daoTokenAmount, 0),
    },
    step1Duration,
    step2Duration,
  }
  console.log('🍻 createWhitelistInvestment startParams :', startParams)

  const twoStepInvestmentContract =
    await contract.getTwoStepInvestMentContract()

  const tx = await twoStepInvestmentContract.startInvestment(startParams)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`settlement project version failed[3][${receipt?.status}]`)
    return false
  }

  return true
}

export { createWhitelistInvestment }
