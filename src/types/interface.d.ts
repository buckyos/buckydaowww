interface Window {
  ethereum: any
}

interface CommonResponse<T> {
  code: number
  msg: string
  data: T
}

// MARK
type CommonListResponse<T> = CommonResponse<{
  items: T[]
  pageNo: number
  pageSize: number
  totalPages: number
  totalSize: number
}>

interface DaoTokenAmountCardItem {
  title: string
  amount: number
  percent?: number
}

interface DaoTokenAmountCardProps {
  item: DaoTokenAmountCardItem
  symbol: string
}

interface InvestmentResponseData {
  id: string
  title: string
  extra: string
  investmentId: string
  state: number
  assetAddress: string
  totalTokenAmount: string
  goalAmount: string
  startTime: number
  endTime: number
  maxAssetPerInvestor: string
  minAssetPerInvestor: string
  onlyWhitelist: boolean
  assetExchangeRate: number
  tokenExchangeRate: number
  priceType: number
  goalAssetAmount: string
}

interface User {
  address: string
  nickname?: string
  avatar?: string
  github_account: string
  job: string
  desc: string
  signature?: string
}

interface CommitteeMember extends User {
  job?: string
  homepage?: string
}

interface ProposalResponseData {
  id: string
  title: string
  extra: string
  proposalId: string
  investmentId: string
  result: string
  state: number
  fromGroup: string
  expired: number
  supportCount: number
  rejectCount: number
  support: string[]
  reject: string[]
  creator?: User
  investment?: InvestmentResponseData
  project?: ProjectVersionProps
  paramroot?: string
  params: any[]
}

interface ProposalListResponseData {
  items: ProposalResponseData[]
  pageNo: number
  pageSize: number
  totalPages: number
  totalSize: number
}

interface ProposalDetailResponseData {
  code: number
  msg: string
  data: ProposalResponseData
}

interface ProposalCardProps {
  item: ProposalResponseData
  memberCount: number
}

interface ProposalStateTagProps {
  state: ProposalState
}

interface UserAvatar {
  avatar?: string
  size?: number
}

interface WalletStoreDefine {
  defaultChannelIdentifier: string
  connectingChannelIdentifier: string
  isConnecting: () => boolean
  setConnectingChannel: (channel: string) => void
}

type UserLoginData = User
interface UserStoreDefine {
  user: User
  jwt: string
  expiration: number
  updateUser: () => Promise<number>
  updateJwt: (jwt: string) => void
  // login: (data: UserLoginData) => Promise<void>
  isConnect: () => boolean
  isLogin: () => boolean
  logout: () => void
}

interface CreateVersionDefine {
  project_name: string
  github_url: string
  descption: string
}

interface ProjectItem {
  project_id: string
  project_name: string
  state: string
  date: string
  current_version: string
  github_url: string
  descption: string
  project_logs?: ProjectLogsDefine[]
}

interface ProjectLogsDefine {
  event_name: string
  date: string
  descption: string
  link: string
}

interface ProjectsListResponse {
  items: ProjectItem[]
  pageNo: number
  pageSize: number
  totalPages: number
  totalSize: number
}

interface UserinfoResponse {
  code: number
  msg: string
  data: User
}

interface MemberResponse {
  code: number
  msg: string
  data: CommitteeMember[]
}

interface ContractInfomationResponse {
  chainId: number
  committee: string
  dividend: string
  investment: string
  lockup: string
  main: string
  project: string
  token: string
  twostep_investment: string
}

interface InvestmentParamsDefine {
  // 用来融资的DaoToken总额，以最小精度计
  totalTokenAmount: bigint
  // 融资类型
  priceType: InvestmentPriceType

  // assetExchangeRate与tokenExchangeRate一起可以计算token的单价
  // 兑换比率均以最小精度计
  // 例如当融资Ether时，1个Ether的最小单位（即1Wei），可以兑换10个DaoToken的最小单位，那么tokenExchangeRate就为10，assetExchangeRate就为1
  // DaoToken的兑换比率，该参数仅在固定价格融资中有效
  tokenExchangeRate: bigint
  // 投资资产的兑换比率，该参数仅在固定价格融资中有效
  assetExchangeRate: bigint

  // 融资开始时间，如果是0，表示决议通过后可以立即开始（需要调用startInvestment）
  startTime: bigint
  // 融资结束时间，单位: 秒
  endTime: bigint

  // 每个投资人最小投入的资金额度。这里规定:每个投资人的第一笔投资一定要大于该数值，以asset的最小精度计
  minAssetPerInvestor: bigint
  // 每个投资人最大投入的资金额度，投资人累计投资额度不能超过该值，以asset最小精度计
  maxAssetPerInvestor: bigint

  // 目标融资额度。在融资结束时，融到的资产达到此数值才算融资成功，以asset最小精度计
  goalAssetAmount: bigint
  // 本次投资接受的资产类型地址，可以是ERC20的合约地址，也可以是ETH: address(0)
  assetAddress: string
  // 是否只接收白名单投资
  onlyWhitelist: boolean
}

interface ProjectVersionProps {
  budget: string
  end_date: number
  extra: string
  id: number
  issue: number
  issue_link: string
  manager: string
  pname: string
  proposal_id: number
  accept_proposal_id: number
  result: number
  start_date: number
  state: number
  title: string
  version: string
}

interface ContributionInfo {
  contributor: string
  value: number
  hasClaim: boolean
}

interface SettlementVersionProposalParams {
  result: number
  projectId: number
  startDate: number
  endDate: number
  budget: string
}

interface ContractStoreDefine {
  chainId: number
  mainAddress: string
  tokenAddress: string
  committeeAddress: string
  projectAddress: string
  investmentAddress: string
  lockupAddress: string
  twostepInvestmentAddress: string
  totalSupply: number
  totalReleased: number
  totalUnreleased: number
  symbol: string
  decimals: number
  expiration: number
  fetchContractAddress: () => Promise<void>
  fetchToken: () => Promise<any>
  getComitteeContract: () => Promise<ethers.Contract>
  getSignerComitteeContract: () => Promise<ethers.Contract>
  getInvestMentContract: () => Promise<ethers.Contract>
  getTwoStepInvestMentContract: () => Promise<ethers.Contract>
}

interface TwoStepTokenRatio {
  daoAmount: number
  tokenAmount: number
}

interface TwoStepWhitelist {
  [address: string]: [number, string]
}

interface TwoStepInvestmentData {
  daoTokenAmount: string
  extra: string
  id: number
  txHash: string
  investedAmount: string
  investor: string
  step1EndTime: number
  step2EndTime: number
  title: string
  tokenAddress: string
  tokenRatio: TwoStepTokenRatio
  totalAmount: string
  whitelist: TwoStepWhitelist
  canEndEarly: boolean
  end: boolean
}
