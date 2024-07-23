import { project_data } from '@vars/index'

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
  CommonResponse<ProjectItem[]>
> {
  const resp = await fetch('/api/repo/detail')
  const data = await resp.json()
  return data
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
  job: string,
  desc: string,
) {
  const resp = await fetch('/api/user/edit', {
    method: 'POST',
    body: JSON.stringify({ job, desc }),
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
  const data = await resp.json()
  return data
}

// 创建投资
export async function createInvestmentExtra(
  jwt: string,
  title: string,
  extra: string,
  txHash: string,
) {
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
  const data = await resp.json()
  return data
}

export async function proposalSetparams(
  jwt: string,
  params: any[],
  txHash: string,
) {
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
  const data = await resp.json()
  return data
}

export async function proposalSetExtraAndParams(
  jwt: string,
  params: any[],
  title: string,
  content: string,
  txHash: string,
) {
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
  const data = await resp.json()
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
  const data = await resp.json()
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

// 版本详情
export async function getProjectDetail(
  projectId: string,
): Promise<CommonResponse<ProjectItem>> {
  if (projectId == '1') {
    return {
      code: 0,
      msg: '',
      data: {
        project_id: '1',
        ...project_data,
      },
    }
  }

  const resp = await fetch(`/api/project/${projectId}`)
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

// 创建token释放
export async function createProjectVersionExtra(
  jwt: string,
  title: string,
  extra: string,
  pname: string,
  version: string,
  issueLink: string,
  txHash: string,
) {
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
  const data = await resp.json()
  return data
}
