import { StoreValue } from 'antd/es/form/interface'
import { message } from 'antd'
import { ethers, toBigInt, getAddress, parseUnits } from 'ethers'
import dayjs from 'dayjs'
import { transactionWait } from '@utils/index'
import { getProvider } from '@hooks/useContract'
import { parseInt } from 'lodash'
import { erc20 } from './abis'

async function createWhitelistInvestment(
  values: StoreValue,
  contract: ContractStoreDefine,
) {
  console.log('🍻 createWhitelistInvestment values :', values)

  const totlePercent = values.whitelist.reduce((acc: number, cur: any) => {
    return acc + cur.percent
  }, 0)
  // console.log('🍻 totlePercent :', totlePercent)
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

  {
    // approve token, (eg usdt)
    let provider = await getProvider()
    const signer = await provider.getSigner()
    const tokenContract = new ethers.Contract(
      values.tokenAddress,
      erc20,
      signer,
    )

    // 查看授权额度
    const allow = await tokenContract.allowance(
      values.tokenAddress,
      contract.twostepInvestmentAddress,
    )
    console.log('🍻 contract allow :', allow.toString(), values.tokenAmount)
    if (allow < values.tokenAmount) {
      // 额度不足， 让用户授权额度
      const tx = await tokenContract.approve(
        contract.twostepInvestmentAddress,
        parseUnits(values.tokenAmount.toString(), 18),
      )
      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        message.error('token approve failed')
        console.warn('transaction status:', receipt?.status, tx)
        return false
      }
    }
  }

  const now = dayjs().unix()
  const step1Duration = toBigInt(dayjs(values.endTime).unix() - now).toString()
  const step2Duration = toBigInt(dayjs(values.endTime2).unix() - now).toString()

  console.log('🍻 step1Duration :', step1Duration, step2Duration)

  const startParams = {
    whitelist: values.whitelist.map((item: any) => getAddress(item.address)),
    firstPercent: values.whitelist.map((item: any) => parseInt(item.percent)),
    tokenAddress: getAddress(values.tokenAddress),
    tokenAmount: toBigInt(values.tokenAmount).toString(),
    tokenRatio: {
      tokenAmount: toBigInt(values.assetTokenAmount).toString(),
      daoTokenAmount: toBigInt(values.daoTokenAmount).toString(),
    },
    step1Duration,
    step2Duration,
    canEndEarly: values.canEndEarly,
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
