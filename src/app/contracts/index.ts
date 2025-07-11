import { StoreValue } from 'antd/es/form/interface'
import { message } from 'antd'
import { ethers, getAddress, parseUnits } from 'ethers'
import dayjs from 'dayjs'
import { transactionWait } from '@utils/index'
// import { getTokenContract } from '@hooks/index'
import { proposalSetExtraAndParams } from '@services/index'
import { parseInt } from 'lodash'
import { erc20 } from './abis'
import {
  contractService,
  newProviderContract,
  newSignerContract,
} from '@contracts/contract'
// import { getAddressOfToken } from './contract'

export * from './vote' // proposal 投票
export * from './execute'
export * from './contract'
export * from './token'

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
  const comitteeContract = await contractService.getCommitteeContract()
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
  // 检查localStorage中是否有缓存
  const cacheKey = 'tokenSymbol'
  let symbolCache = JSON.parse(localStorage.getItem(cacheKey) || '{}')

  // 检查缓存中是否已经有这个tokenAddress的symbol
  if (symbolCache[tokenAddress]) {
    // console.log('Fetching symbol from cache.', tokenAddress)
    return symbolCache[tokenAddress]
  }

  const tokenContract = await newProviderContract(tokenAddress, erc20)
  const symbol = await tokenContract.symbol()

  // 更新缓存对象
  symbolCache[tokenAddress] = symbol

  // 将更新后的缓存对象存储到localStorage中
  localStorage.setItem(cacheKey, JSON.stringify(symbolCache))
  console.log('Caching symbol to local storage.')

  return symbol
}

// 获取精度
async function getDecimals(tokenAddress: string): Promise<number> {
  // 检查localStorage中是否有缓存
  const cacheKey = 'tokenDecimals'
  let decimalsCache = JSON.parse(localStorage.getItem(cacheKey) || '{}')

  // 检查缓存中是否已经有这个tokenAddress的decimals
  if (decimalsCache[tokenAddress]) {
    // console.log('Fetching decimals from cache.', tokenAddress)
    return decimalsCache[tokenAddress]
  }

  const tokenContract = await newProviderContract(tokenAddress, erc20)
  const decimals = await tokenContract.decimals()

  // 更新缓存对象
  decimalsCache[tokenAddress] = Number(decimals)

  // 将更新后的缓存对象存储到localStorage中
  localStorage.setItem(cacheKey, JSON.stringify(decimalsCache))
  console.log('Caching decimals to local storage.')

  return decimals
}

// 结束两步投资
async function endInvestment(id: string) {
  const twoStepInvestmentContract = await contractService.getAcquiredContract()
  const tx = await twoStepInvestmentContract.endInventment(id)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`End investment failed [${receipt?.status}]`)
    return false
  }

  return true
}

// 认购份额 (白名单地址才能认购)
async function subscribeInvestmentShare(
  values: StoreValue,
  id: string,
  ownerAddress: string,
) {
  // const amount = values.tokenAmount.toString()
  const daoTokenAddress = contractService.getAddressOfNormalToken()
  const decimals = await getDecimals(daoTokenAddress)
  const daoAmount = parseUnits(values.tokenAmount.toString(), decimals)
  const twostepInvestmentAddress = contractService.getAddressOfAquired()
  console.log(
    '🍻 subscribeInvestmentShare values :',
    values,
    '. DAO token amount:',
    daoAmount,
  )

  // 授权token
  {
    const daoTokenContract = await contractService.getNormalTokenContract()
    const allow = await daoTokenContract.allowance(
      ownerAddress,
      twostepInvestmentAddress,
    )
    console.log('🍻 contract allow :', allow, daoAmount)
    if (allow < daoAmount) {
      const tx = await daoTokenContract.approve(
        twostepInvestmentAddress,
        daoAmount,
      )
      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        message.error('token approve failed')
        console.warn('transaction status:', receipt?.status, tx)
        return false
      }
    }
  }

  // 认购份额
  const twoStepInvestmentContract = await contractService.getAcquiredContract()
  const tx = await twoStepInvestmentContract.invest(id, daoAmount)
  const receipt = await transactionWait(tx)
  if (receipt?.status !== 1) {
    console.warn('transaction status:', receipt?.status, tx)
    message.error(`Subscribe invest shares failed [${receipt?.status}]`)
    return false
  }

  return true
}

// 创建
// 创建白名单投资
async function createWhitelistInvestment(
  values: StoreValue,
  ownerAddress: string,
  // contract: ContractStoreDefine,
) {
  const twoStepInvestmentAddress = contractService.getAddressOfAquired()
  console.log('🍻 createWhitelistInvestment values :', values)

  const totlePercent = values.whitelist.reduce((acc: number, cur: any) => {
    return acc + cur.percent
  }, 0)
  // console.log('🍻 totlePercent :', totlePercent)
  if (totlePercent > 100) {
    message.error('error: total percent must be 100 or less 100')
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

  const tokenDecimals = await getDecimals(values.tokenAddress)

  {
    // 查看授权额度
    // approve token, (eg usdt)
    const tokenContract = await newSignerContract(
      values.tokenAddress,
      erc20,
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
        parseUnits(values.tokenAmount, tokenDecimals),
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
  const step1Duration = dayjs(values.endTime).unix() - now
  const step2Duration = dayjs(values.endTime2).unix() - now

  console.log('🍻 step1Duration :', step1Duration, step2Duration)

  const startParams = {
    whitelist: values.whitelist.map((item: any) => getAddress(item.address)),
    firstPercent: values.whitelist.map((item: any) =>
      parseInt((item.percent * 100).toString()),
    ),
    tokenAddress: getAddress(values.tokenAddress),
    tokenAmount: parseUnits(values.tokenAmount, tokenDecimals),
    tokenRatio: {
      tokenAmount: parseInt(values.assetTokenAmount),
      daoTokenAmount: parseInt(values.daoTokenAmount),
    },
    step1Duration,
    step2Duration,
    canEndEarly: values.canEndEarly,
  }
  console.log('🍻 createWhitelistInvestment startParams :', startParams)

  // 启动两步投资
  const twoStepInvestmentContract = await contractService.getAcquiredContract() // await contract.getTwoStepInvestMentContract()
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
  getDecimals,
  createWhitelistInvestment,
  subscribeInvestmentShare,
  endInvestment,
  chnageCommitteeProposal,
}
