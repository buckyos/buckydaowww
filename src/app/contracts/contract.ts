import { ethers } from 'ethers'
import { message } from 'antd'
import { abis, ITwoStepWhitelistInvestment } from '@contracts/abis'
// NEXT_PUBLIC_COMMITTEE = '0x2fc3186176B80EA829A7952b874F36f7cb8bd184'
// NEXT_PUBLIC_DIVIDEND = '0x13EE4A506974a54E9eAA905C892Aa91664AaCcbA'
// NEXT_PUBLIC_INVESTMENT = '0xf2C90A9dB663759668A52a94f616725D84744b67'
// NEXT_PUBLIC_LOCKUP = '0x23d20B200D0a77138b3B354453F047fBdec68561'
// NEXT_PUBLIC_MAIN = '0xb91d38d7fAc9618A5480309b8b4b5d675D5Ae472'
// NEXT_PUBLIC_PROJECT = '0xb3C6876712142bC9161D6D357163E1A3a70179cC'
// NEXT_PUBLIC_TOKEN = '0x30e066C857B7eBbAB4649a29A01D43962D70e44D'
// NEXT_PUBLIC_TWOSTEP_INVESTMENT = '0xcBe0797b6206A955e12CD23706b370F8D1CEA34E'
const COMMITTEE = process.env.NEXT_PUBLIC_COMMITTEE
const DIVIDEND = process.env.NEXT_PUBLIC_DIVIDEND
const INVESTMENT = process.env.NEXT_PUBLIC_INVESTMENT
const LOCKUP = process.env.NEXT_PUBLIC_LOCKUP
const MAIN = process.env.NEXT_PUBLIC_MAIN
const PROJECT = process.env.NEXT_PUBLIC_PROJECT
const TOKEN = process.env.NEXT_PUBLIC_TOKEN
const TWOSTEP_INVESTMENT = process.env.NEXT_PUBLIC_TWOSTEP_INVESTMENT

const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID

console.log('🔡 COMMITTEE contract address', COMMITTEE)
console.log('🔡 DIVIDEND contract address', DIVIDEND)
console.log('🔡 INVESTMENT contract address', INVESTMENT)
console.log('🔡 LOCKUP contract address', LOCKUP)
console.log('🔡 MAIN contract address', MAIN)
console.log('🔡 PROJECT contract address', PROJECT)
console.log('🔡 TOKEN contract address', TOKEN)
console.log('🔡 TWOSTEP_INVESTMENT contract address', TWOSTEP_INVESTMENT)

function getAddressOfTwoStepInvestment() {
  if (!TWOSTEP_INVESTMENT) throw new Error('TWOSTEP_INVESTMENT is undefined')
  return TWOSTEP_INVESTMENT
}

function getAddressOfToken() {
  if (!TOKEN) throw new Error('TOKEN is undefined')
  return TOKEN
}

function getAddressOfMain() {
  if (!MAIN) throw new Error('MAIN is undefined')
  return MAIN
}

function getAddressOfLockup() {
  if (!LOCKUP) throw new Error('LOCKUP is undefined')
  return LOCKUP
}

function getNetworkId() {
  if (!NETWORK_ID) throw new Error('NETWORK_ID is undefined')
  return NETWORK_ID
}

// cache contract instance
const Contracts: {
  [key: string]: ethers.Contract | undefined
} = {
  COMMITTEE: undefined,
  DIVIDEND: undefined,
  INVESTMENT: undefined,
  LOCKUP: undefined,
  MAIN: undefined,
  PROJECT: undefined,
  TOKEN: undefined,
  TWOSTEP_INVESTMENT: undefined,
}

function generateContract(abi: any, key?: string, address?: string) {
  if (address === undefined) throw new Error('address is undefined')
  if (key === undefined) throw new Error('key is undefined')

  return async function (): Promise<ethers.Contract> {
    if (Contracts[key] !== undefined) {
      console.log('[', key, '] get contract instance ', address, 'from cache')
      return Contracts[key] as ethers.Contract
    }

    let provider = await getProvider()
    // const network = await provider.getNetwork()
    // console.log(network)

    const signer = await provider.getSigner()
    const contract = new ethers.Contract(address, abi, signer)
    console.log('[', key, '] contract initialized', address)

    Contracts[key] = contract
    return contract
  }
}

async function getProvider() {
  if (!window.ethereum) {
    message.error('Please install MetaMask first')
    console.log('MetaMask not installed; using read-only defaults')
    throw new Error('MetaMask not installed')
    // let provider = ethers.getDefaultProvider(network)
    // return provider
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  console.log('provider', provider)

  // check
  await checkEthNetworkId(provider)

  return provider
}

async function checkEthNetworkId(ethProvider: ethers.BrowserProvider) {
  if (!ethProvider) return

  const chainId = await ethProvider
    .getNetwork()
    .then((network) => network.chainId.toString())

  // polygan
  const networkId = NETWORK_ID || '196'
  let hexString = Number(networkId).toString(16)
  let hexStringWithPrefix = '0x' + hexString
  console.log('networkId: ', hexStringWithPrefix) // 输出 "0x89"

  console.log('current network chainId', chainId, networkId)
  if (chainId !== networkId) {
    message.info('current network is not correct, switch to correct network...')
    const result = await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexStringWithPrefix }],
    })
    console.log('wallet_switchEthereumChain result', result)
    message.info('network switched, window reloading...')
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }
}

const getCommitteeContract = generateContract(abis, 'COMMITTEE', COMMITTEE)
const getDividendContract = generateContract(abis, 'DIVIDEND', DIVIDEND)
const getInvestmentContract = generateContract(abis, 'INVESTMENT', INVESTMENT)
const getLockupContract = generateContract(abis, 'LOCKUP', LOCKUP)
const getMainContract = generateContract(abis, 'MAIN', MAIN)
const getProjectContract = generateContract(abis, 'PROJECT', PROJECT)
const getTokenContract = generateContract(abis, 'TOKEN', TOKEN)
const getTwoStepInvestmentContract = generateContract(
  ITwoStepWhitelistInvestment,
  'TWOSTEP_INVESTMENT',
  TWOSTEP_INVESTMENT,
)

export {
  getCommitteeContract,
  getDividendContract,
  getInvestmentContract,
  getLockupContract,
  getMainContract,
  getProjectContract,
  getTokenContract,
  getTwoStepInvestmentContract,

  // address
  getAddressOfToken,
  getAddressOfTwoStepInvestment,
  getAddressOfMain,
  getAddressOfLockup,
  getNetworkId,

  // provider
  getProvider,
}
