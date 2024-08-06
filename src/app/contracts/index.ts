import { StoreValue } from 'antd/es/form/interface'
import { message } from 'antd'
import { ethers, toBigInt, getAddress, parseUnits } from 'ethers'
import dayjs from 'dayjs'
import { transactionWait } from '@utils/index'
import { getProvider, getTokenContract } from '@hooks/index'
import { proposalSetExtraAndParams } from '@services/index'
import { parseInt } from 'lodash'
import { erc20 } from './abis'
import {
  getTwoStepInvestmentContract,
  getAddressOfTwoStepInvestment,
} from '@contracts/index'

export * from './vote' // proposal 投票
export * from './execute'
export * from './contract'

async function chnageCommitteeProposal(
  values: StoreValue,
  contract: ContractStoreDefine,
  jwt: string,
) {
  const addresses = (values.committee as CommitteeMember[]).map(
    (item) => item.address,
  )
  const title = values.title
  if (!title) {
    message.error('Please enter a title')
    return false
  }
  const content = values.content || ''

  // create proposal
  const comitteeContract = await contract.getSignerComitteeContract()
  const tx = await comitteeContract.prepareSetCommittees(addresses)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(
      `Create upgrade contract proposal failed[3][${receipt?.status}]`,
    )
    return false
  }

  // make vote params
  const params = addresses.map((addr) => ethers.zeroPadValue(addr, 32))
  params.push(ethers.encodeBytes32String('setCommittees'))

  const result = await proposalSetExtraAndParams(
    jwt,
    params,
    title,
    content,
    receipt.hash,
  )
  if (result.code !== 0) {
    message.error(
      'Create change committee proposal failed, please try again later',
    )
    return false
  }

  return true
}

// 获取token 的symbol
async function getSymbol(tokenAddress: string): Promise<string> {
  let provider = await getProvider()
  const tokenContract = new ethers.Contract(tokenAddress, erc20, provider)
  const symbol = await tokenContract.symbol()
  return symbol
}

// 结束两步投资
async function endInvestment(id: string, contract: ContractStoreDefine) {
  const twoStepInvestmentContract =
    await contract.getTwoStepInvestMentContract()
  const tx = await twoStepInvestmentContract.endInventment(id)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`End investment failed [${receipt?.status}]`)
    return false
  }

  return true
}

// 认购份额(白名单)
async function subscribeInvestmentShare(
  values: StoreValue,
  contract: ContractStoreDefine,
  id: string,
) {
  console.log('🍻 subscribeInvestmentShare values :', values)
  const amount = values.tokenAmount.toString()

  // 授权token
  {
    const daoTokenContract = await getTokenContract(contract.tokenAddress)
    const tx = await daoTokenContract.approve(
      contract.twostepInvestmentAddress,
      parseUnits(amount, 18),
    )
    const receipt = await transactionWait(tx)
    if (receipt?.status !== 1) {
      message.error('token approve failed')
      console.warn('transaction status:', receipt?.status, tx)
      return false
    }
  }

  // 认购份额
  const twoStepInvestmentContract =
    await contract.getTwoStepInvestMentContract()
  // const amount = parseUnits(values.tokenAmount.toString(), 18)
  const tx = await twoStepInvestmentContract.invest(id, amount)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`Subscribe invest shares failed [${receipt?.status}]`)
    return false
  }

  return true
}

// 创建白名单投资
async function createWhitelistInvestment(
  values: StoreValue,
  ownerAddress: string,
  // contract: ContractStoreDefine,
) {
  const twoStepInvestmentAddress = getAddressOfTwoStepInvestment()
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
    // 查看授权额度
    // approve token, (eg usdt)
    let provider = await getProvider()
    const signer = await provider.getSigner()
    const tokenContract = new ethers.Contract(
      values.tokenAddress,
      erc20,
      signer,
    )
    const allow = await tokenContract.allowance(
      ownerAddress,
      twoStepInvestmentAddress,
    )
    console.log('🍻 contract allow :', allow, values.tokenAmount)
    if (allow < values.tokenAmount) {
      // 额度不足， 让用户授权额度
      const tx = await tokenContract.approve(
        twoStepInvestmentAddress,
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

  // 结束时间
  const now = dayjs().unix()
  const step1Duration = toBigInt(dayjs(values.endTime).unix() - now).toString()
  const step2Duration = toBigInt(dayjs(values.endTime2).unix() - now).toString()

  console.log('🍻 step1Duration :', step1Duration, step2Duration)

  const startParams = {
    whitelist: values.whitelist.map((item: any) => getAddress(item.address)),
    firstPercent: values.whitelist.map((item: any) => item.percent.toString()),
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

  // 启动两步投资
  const twoStepInvestmentContract = await getTwoStepInvestmentContract() // await contract.getTwoStepInvestMentContract()
  const tx = await twoStepInvestmentContract.startInvestment(startParams)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`Create whitelist investment failed [${receipt?.status}]`)
    return false
  }

  return true
}

export {
  getSymbol,
  createWhitelistInvestment,
  subscribeInvestmentShare,
  endInvestment,
  chnageCommitteeProposal,
}
