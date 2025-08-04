export enum InvestmentState {
  PREPARE, // 准备中:投资的参数已经确认，还未开始，可能在等待投资通过决议
  STARTED, // 开始融资:投资人可以认购
  SUCCESSFUL, // 融资成功:融资目标达成，投资人可以提取自己认筹的部分
  FAILED, // 融资失败:融资目标未达成，投资人可以收回自己投入的资产
}

export enum ProposalState {
  NotFound,
  InProgress,
  Accepted,
  Rejected,
  Executed,
  Expired,
}

export enum ProposalResult {
  NoResult,
  Accept,
  Reject,
  Expired,
  NotMatch,
  Executed,
}

// 项目版本的结果，评级
export enum ProjectVersionResult {
  // still in progress, no result
  InProgress,
  // over time after endDate
  Expired,
  // project failed
  Failed,
  // a normal result
  Normal,
  // a good result
  Good,
  // a excellent result
  Excellent
}

// 版本状态
export enum ProjectVersionState {
  // wating committe votes for start this project
  Preparing,
  // in development
  Developing,
  // waiting committe votes for project's result
  Accepting,
  // project has finished, check its result
  Finished,
  // project failed
  Rejected
}