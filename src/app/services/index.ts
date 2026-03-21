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
  const reponseData: ContractTokenInfo = {
    normal: {  // BDT
      totalSupply: normalTotalSupply,
      symbol: data.normalTokenSymbol,
      decimals: data.normalTokenDecimals,
    },
    dev: {  // BDDT
      totalSupply: devTotalSupply,
      symbol: data.devTokenSymbol,
      decimals: data.devTokenDecimals,
      totalReleased: devTotalReleased,
      totalReleasedPercent: devTotalReleasedPercent,
      unrelease: devTokenTotalUnreleased,
      unreleasePercent: devTokenBalancePercent,

    }
  }

  return {
    code: 0,
    msg: "",
    data: reponseData
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
): Promise<CommonListResponse<ProposalResponseData>> {
  const resp = await fetch(`/api/proposal?pageNo=${page}&pageSize=${size}`)
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

// 版本详情
export async function getProjectVersionDetail(versionId: string) {
  // `/project/${params.versionId}`
  const resp = await fetch('/api/project/' + versionId, {
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
