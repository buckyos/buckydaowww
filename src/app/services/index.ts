import { transformNumber, bigTransformPercentNumber } from '@utils/index'
import {
  buildPendingMetadataKey,
  getPendingMetadataSubmissions,
  hasPendingMetadataSubmissions,
  removePendingMetadataSubmission,
  upsertPendingMetadataSubmission,
} from './metadataOutbox'

async function parseJsonResponse<T>(
  resp: Response,
  fallbackMessage: string,
): Promise<T> {
  const text = await resp.text()

  if (!text) {
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('Please login first')
    }

    throw new Error(
      resp.ok
        ? `${fallbackMessage}: empty response body`
        : `${fallbackMessage} [${resp.status}]`,
    )
  }

  try {
    return JSON.parse(text) as T
  } catch (_error) {
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('Please login first')
    }

    if (!resp.ok) {
      throw new Error(text)
    }

    throw new Error(`${fallbackMessage}: invalid JSON response`)
  }
}

function persistPendingMetadataSubmission(payload: {
  kind:
    | 'proposal_extra_and_params'
    | 'proposal_params_only'
    | 'project_extra'
    | 'investment_extra'
    | 'token_release'
  txHash: string
  title?: string
  extra?: string
  params?: any[]
  pname?: string
  version?: string
  issueLink?: string
  addresses?: string[]
  amounts?: string[]
}) {
  const { kind, txHash, ...rest } = payload
  upsertPendingMetadataSubmission({
    key: buildPendingMetadataKey(kind, txHash),
    kind,
    txHash,
    createdAt: Date.now(),
    ...rest,
  })
}

function clearPendingMetadataSubmission(
  kind:
    | 'proposal_extra_and_params'
    | 'proposal_params_only'
    | 'project_extra'
    | 'investment_extra'
    | 'token_release',
  txHash: string,
) {
  removePendingMetadataSubmission(buildPendingMetadataKey(kind, txHash))
}

// 获取DAO成员列表
export async function fetchMembers() {
  const resp = await fetch('/api/committee/members')
  const data = (await resp.json()) as MemberResponse
  return data
}

// 获取提案详情
export async function fetchProposalId(proposalId: string) {
  const resp = await fetch('/api/proposal/' + proposalId)
  const data = await resp.json()
  return data
}

// 获取项目（仓库）列表
export async function fetchRepositoryList(): Promise<
  CommonResponse<RepositoryItem[]>
> {
  const resp = await fetch('/api/repo/detail')
  const data = await resp.json()
  return data
}

export async function fetchOwnedRepositoryList(
  owner: string,
): Promise<CommonResponse<RepositoryItem[]>> {
  const query = new URLSearchParams({ owner })
  const resp = await fetch(`/api/repo/detail?${query.toString()}`)
  const data = await resp.json()
  return data
}

export function decodeProjectProfile(item: RepositoryItem): ProjectItem {
  const detail = JSON.parse(item.detail) as Partial<ProjectItem>
  const projectId =
    detail.project_id
    || detail.id
    || item.projectId
    || item.name

  return {
    id: projectId,
    project_id: projectId,
    project_name: detail.project_name || item.name,
    state: detail.state || 'unknown',
    date: detail.date || '',
    current_version: detail.current_version || '-',
    stage: detail.stage || '-',
    github_url: detail.github_url || '',
    description: detail.description || '',
    project_logs: detail.project_logs || [],
    owner: item.owner,
    updatedBy: item.updatedBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    legacy: item.legacy,
  }
}

export async function upsertProjectDetail(
  jwt: string,
  payload: {
    name: string
    detail: string
  },
): Promise<CommonResponse<any>> {
  const resp = await fetch('/api/repo/detail', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  return parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to save project profile',
  )
}

function mapContractTokenInfo(data: ResponseTokenInfo): ContractTokenInfo {
  const devTotalSupply = transformNumber(data.devTokenTotalSupply, data.devTokenDecimals)
  const normalTotalSupply = transformNumber(data.normalTokenTotalSupply, data.normalTokenDecimals)
  const devTotalReleased = transformNumber(data.devTokenTotalReleased, data.devTokenDecimals)
  const devTokenTotalUnreleased = transformNumber(data.devTokenTotalUnreleased, data.devTokenDecimals)
  const devTotalReleasedPercent = bigTransformPercentNumber(
    BigInt(data.devTokenTotalReleased),
    BigInt(data.devTokenTotalSupply),
  )
  const devTokenBalancePercent = bigTransformPercentNumber(
    BigInt(data.devTokenTotalUnreleased),
    BigInt(data.devTokenTotalSupply),
  )

  return {
    normal: {
      totalSupply: normalTotalSupply,
      symbol: data.normalTokenSymbol,
      decimals: data.normalTokenDecimals,
    },
    dev: {
      totalSupply: devTotalSupply,
      symbol: data.devTokenSymbol,
      decimals: data.devTokenDecimals,
      totalReleased: devTotalReleased,
      totalReleasedPercent: devTotalReleasedPercent,
      unrelease: devTokenTotalUnreleased,
      unreleasePercent: devTokenBalancePercent,
    },
  }
}

// 获取合约代币信息
export async function fetchContractTokenInfo(): Promise<
  CommonResponse<ContractTokenInfo>
> {
  const resp = await fetch('/api/contract/token')
  if (resp.status != 200) {
    throw Error("failed")
  }
  const result = await resp.json()
  const data = result as ResponseTokenInfo
  const reponseData = mapContractTokenInfo(data)

  return {
    code: 0,
    msg: "",
    data: reponseData
  }
}

export async function fetchFundingOverview(): Promise<
  CommonResponse<FundingOverviewData>
> {
  const resp = await fetch('/api/funding/overview')
  const result = await parseJsonResponse<CommonResponse<FundingOverviewResponseData>>(
    resp,
    'Failed to fetch funding overview',
  )
  const data = result.data
  const tokenInfo = mapContractTokenInfo(data.tokenInfo)

  return {
    ...result,
    data: {
      tokenInfo,
      treasury: {
        bddtReleased: tokenInfo.dev.totalReleased,
        bddtUnreleased: tokenInfo.dev.unrelease,
        bdtInDividend: transformNumber(
          data.treasury.bdtInDividend,
          data.tokenInfo.normalTokenDecimals,
        ),
        bdtInAcquired: transformNumber(
          data.treasury.bdtInAcquired,
          data.tokenInfo.normalTokenDecimals,
        ),
        bdtInProject: transformNumber(
          data.treasury.bdtInProject,
          data.tokenInfo.normalTokenDecimals,
        ),
      },
      rounds: {
        activeCount: data.rounds.activeCount,
        closedCount: data.rounds.closedCount,
        totalCount: data.rounds.totalCount,
        totalSubscribedDao: transformNumber(
          data.rounds.totalSubscribedDao,
          data.tokenInfo.normalTokenDecimals,
        ),
        activeRounds: data.rounds.activeRounds,
        historyRounds: data.rounds.historyRounds,
      },
      pipeline: data.pipeline,
    },
  }
}


// 获取项目（版本）列表
// export async function fetchProjectList(): Promise<ProjectItem[]> {
//   const resp = await fetch('/api/project')
//   const result = await resp.json()
//
//   // 这个OPENDAN aios项目固定
//   if (result.data.items.length == 0) {
//     return [
//       {
//         project_id: '1',
//         ...project_data,
//       },
//     ]
//   } else {
//     return result.data.items
//   }
// }

// edit user info
// 修改用户信息
export async function PostUserExtraInfo(
  jwt: string,
  nickname: string,
  job: string,
  desc: string,
) {
  const resp = await fetch('/api/user/edit', {
    method: 'POST',
    body: JSON.stringify({ nickname, job, desc }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = (await resp.json()) as MemberResponse
  return data
}

// 绑定钱包地址
export async function bindAddress(sign: string, jwt: string): Promise<number> {
  const resp = await fetch('/api/user/bind', {
    method: 'POST',
    body: JSON.stringify({ sign }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  return resp.status
  // const data = (await resp.json()) as MemberResponse
  // return data
}

export async function devLogin(
  address: string,
): Promise<CommonResponse<string>> {
  const query = new URLSearchParams({ address })
  const resp = await fetch(`/api/user/devlogin?${query.toString()}`)

  const text = await resp.text()
  if (!text) {
    return {
      code: resp.ok ? 0 : resp.status,
      msg: resp.ok ? '' : `dev login failed [${resp.status}]`,
      data: '',
    }
  }

  try {
    return JSON.parse(text) as CommonResponse<string>
  } catch (_error) {
    return {
      code: resp.ok ? 0 : resp.status,
      msg: text,
      data: '',
    }
  }
}

export async function beginGithubLogin(
  redirect?: string,
  options?: {
    forceAccountSelection?: boolean
  },
): Promise<CommonResponse<string>> {
  const query = new URLSearchParams()
  if (redirect) {
    query.set('redirect', redirect)
  }
  if (options?.forceAccountSelection) {
    query.set('prompt', 'select_account')
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const resp = await fetch(`/api/user/githubauthorize${suffix}`, {
    credentials: 'same-origin',
  })

  return parseJsonResponse<CommonResponse<string>>(
    resp,
    'Failed to initialize GitHub login',
  )
}

export async function completeGithubLogin(
  code: string,
  state: string,
): Promise<CommonResponse<string>> {
  const query = new URLSearchParams({ code, state })
  const resp = await fetch(`/api/user/githublogin?${query.toString()}`, {
    credentials: 'same-origin',
  })

  return parseJsonResponse<CommonResponse<string>>(
    resp,
    'Failed to complete GitHub login',
  )
}

// 更新提案信息
export async function updateProposalInfomation(
  proposalId: string,
  jwt: string,
  title: string,
  extra: string,
) {
  const resp = await fetch(`/api/proposal/${proposalId}`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      extra,
    }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to update proposal information',
  )
  return data
}

// 创建投资
export async function createInvestmentExtra(
  jwt: string,
  title: string,
  extra: string,
  txHash: string,
) {
  persistPendingMetadataSubmission({
    kind: 'investment_extra',
    txHash,
    title,
    extra,
  })

  const resp = await fetch('/api/investment/extra', {
    method: 'POST',
    body: JSON.stringify({
      title,
      extra,
      txHash,
    }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to create investment metadata',
  )
  if (data.code === 0) {
    clearPendingMetadataSubmission('investment_extra', txHash)
  }
  return data
}

export async function proposalSetparams(
  jwt: string,
  params: any[],
  txHash: string,
) {
  persistPendingMetadataSubmission({
    kind: 'proposal_params_only',
    txHash,
    params,
  })

  const resp = await fetch('/api/proposal/setparams', {
    method: 'POST',
    body: JSON.stringify(
      {
        params,
        txHash,
      },
      // JSON.stringify()方法不能直接处理BigInt类型的值
      // 通过replacer 处理
      (_, v) => (typeof v === 'bigint' ? v.toString() : v),
    ),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to submit proposal params',
  )
  if (data.code === 0) {
    clearPendingMetadataSubmission('proposal_params_only', txHash)
  }
  return data
}

export async function proposalSetExtraAndParams(
  jwt: string,
  params: any[],
  title: string,
  content: string,
  txHash: string,
) {
  persistPendingMetadataSubmission({
    kind: 'proposal_extra_and_params',
    txHash,
    title,
    extra: content,
    params,
  })

  const resp = await fetch('/api/proposal/extra', {
    method: 'POST',
    body: JSON.stringify(
      {
        title,
        extra: content,
        params,
        txHash,
      },
      // JSON.stringify()方法不能直接处理BigInt类型的值
      // 通过replacer 处理
      (_, v) => (typeof v === 'bigint' ? v.toString() : v),
    ),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to submit proposal metadata',
  )
  if (data.code === 0) {
    clearPendingMetadataSubmission('proposal_extra_and_params', txHash)
  }
  return data
}

// 创建token释放
export async function createReleaseToken(
  jwt: string,
  title: string,
  extra: string,
  addresses: string[],
  amounts: string[],
  txHash: string,
) {
  persistPendingMetadataSubmission({
    kind: 'token_release',
    txHash,
    title,
    extra,
    addresses,
    amounts,
  })

  const resp = await fetch('/api/token/release', {
    method: 'POST',
    body: JSON.stringify({
      title,
      extra,
      addresses,
      amounts,
      txHash,
    }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to create token release metadata',
  )
  if (data.code === 0) {
    clearPendingMetadataSubmission('token_release', txHash)
  }
  return data
}

// 获取投资
export async function getInvestments() {
  const resp = await fetch('/api/investment', {
    method: 'GET',
  })
  const data = await resp.json()
  return data
}

// 获取合约基本信息（地址）
export async function getContractInfo(): Promise<ContractInfomationResponse> {
  const resp = await fetch('/api/contract/info', {
    method: 'GET',
  })
  const data = await resp.json()
  return data
}

// 获取提案列表
export async function getProposals(
  page: number,
  size: number,
  filters?: {
    creator?: string
    state?: number
  },
): Promise<CommonListResponse<ProposalResponseData>> {
  const query = new URLSearchParams({
    pageNo: page.toString(),
    pageSize: size.toString(),
  })
  if (filters?.creator) {
    query.set('creator', filters.creator)
  }
  if (filters?.state !== undefined) {
    query.set('state', filters.state.toString())
  }
  const resp = await fetch(`/api/proposal?${query.toString()}`)
  const data = await resp.json()
  return data
}

export async function getRecentProposalVotes(
  address: string,
  page = 1,
  size = 10,
): Promise<CommonListResponse<ProposalVoteRecord>> {
  const query = new URLSearchParams({
    pageNo: page.toString(),
    pageSize: size.toString(),
  })
  const resp = await fetch(
    `/api/proposal/votes/${encodeURIComponent(address)}?${query.toString()}`,
  )
  const data = await resp.json()
  return data
}

// 获取两步投资的列表
export async function getTwoStepInvestment(): Promise<
  CommonListResponse<TwoStepInvestmentData>
> {
  const resp = await fetch('/api/twostep')
  const data = await resp.json()
  return data
}

// 获取两步投资的详情
export async function getTwoStepInvestmentDetail(
  id: string,
): Promise<CommonResponse<TwoStepInvestmentData>> {
  const resp = await fetch('/api/twostep/' + id)
  const data = await resp.json()
  return data
}

// 项目下面的版本列表
export async function getProjectVersions(project_name: string) {
  //  `/project/${params.pname}`
  const resp = await fetch('/api/project/' + project_name, {
    method: 'GET',
  })
  const data = await resp.json()
  return data
}

export async function getManagedProjectVersions(
  manager: string,
  page = 1,
  size = 20,
): Promise<CommonListResponse<ProjectVersionProps>> {
  const query = new URLSearchParams({
    pageNo: page.toString(),
    pageSize: size.toString(),
    manager,
  })
  const resp = await fetch(`/api/project?${query.toString()}`, {
    method: 'GET',
  })
  const data = await resp.json()
  return data
}

// 版本详情
export async function getProjectVersionDetail(versionId: string) {
  let normalizedVersionId = versionId
  if (/^0x[0-9a-fA-F]{64}$/.test(versionId)) {
    try {
      normalizedVersionId = BigInt(versionId).toString()
    } catch {
      normalizedVersionId = versionId
    }
  }
  // `/project/${params.versionId}`
  const resp = await fetch('/api/project/' + normalizedVersionId, {
    method: 'GET',
  })
  const data = await resp.json()
  return data
}

export async function createProjectVersionExtra(
  jwt: string,
  title: string,
  extra: string,
  pname: string,
  version: string,
  issueLink: string,
  txHash: string,
) {
  persistPendingMetadataSubmission({
    kind: 'project_extra',
    txHash,
    title,
    extra,
    pname,
    version,
    issueLink,
  })

  const resp = await fetch('/api/project/extra', {
    method: 'POST',
    body: JSON.stringify({
      title,
      extra,
      pname,
      version,
      issueLink,
      txHash,
    }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to submit project metadata',
  )
  if (data.code === 0) {
    clearPendingMetadataSubmission('project_extra', txHash)
  }
  return data
}

export async function getVersionContributionInfo(
  versionId: string,
): Promise<CommonResponse<ContributionItem[]>> {
  const resp = await fetch('/api/contribution/' + versionId)
  const data = await resp.json()
  return data
}

export async function getWithdrawableContributions(
  address: string,
): Promise<CommonResponse<WithdrawableContributionItem[]>> {
  const resp = await fetch(
    `/api/contribution/withdrawable/${encodeURIComponent(address)}`,
  )
  const data = await resp.json()
  return data
}

export async function postContributionWithdraw(
  jwt: string,
  projectId: number[],
) {
  const resp = await fetch('/api/contribution/withdraw', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
    }),
    headers: {
      'DAO-TOKEN': jwt,
    },
  })
  const data = await parseJsonResponse<CommonResponse<any>>(
    resp,
    'Failed to withdraw contribution',
  )
  return data
}

export { hasPendingMetadataSubmissions }

export async function retryPendingMetadataSubmissions(
  txHash: string,
  jwt: string,
) {
  const items = getPendingMetadataSubmissions(txHash)

  for (const item of items) {
    if (item.kind === 'proposal_extra_and_params') {
      const result = await proposalSetExtraAndParams(
        jwt,
        item.params || [],
        item.title || '',
        item.extra || '',
        item.txHash,
      )
      if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to submit proposal metadata')
      }
      continue
    }

    if (item.kind === 'proposal_params_only') {
      const result = await proposalSetparams(jwt, item.params || [], item.txHash)
      if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to submit proposal params')
      }
      continue
    }

    if (item.kind === 'project_extra') {
      const result = await createProjectVersionExtra(
        jwt,
        item.title || '',
        item.extra || '',
        item.pname || '',
        item.version || '',
        item.issueLink || '',
        item.txHash,
      )
      if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to submit project metadata')
      }
      continue
    }

    if (item.kind === 'investment_extra') {
      const result = await createInvestmentExtra(
        jwt,
        item.title || '',
        item.extra || '',
        item.txHash,
      )
      if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to submit investment metadata')
      }
      continue
    }

    if (item.kind === 'token_release') {
      const result = await createReleaseToken(
        jwt,
        item.title || '',
        item.extra || '',
        item.addresses || [],
        item.amounts || [],
        item.txHash,
      )
      if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to submit token release metadata')
      }
    }
  }

  return items.length
}
