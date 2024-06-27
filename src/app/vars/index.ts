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

export const project_data = {
  project_name: 'OpenDAN AIOS',
  state: 'developing',
  date: '2023-05-13',
  current_version: '1.0.0',
  github_url: 'https://github.com/fiatrete/OpenDAN-Personal-AI-OS',
  descption: ` OpenDAN (Open and Do Anything Now with AI) is revolutionizing the AI
landscape with its Personal AI Operating System. Designed for seamless
integration of diverse AI modules, it ensures unmatched
interoperability. OpenDAN empowers users to craft powerful AI
agents—from butlers and assistants to personal tutors and digital
companions—all while retaining control. These agents can team up to
tackle complex challenges, integrate with existing services, and
command smart(IoT) devices. With OpenDAN, we're putting AI in your
hands, making life simpler and smarter. This project is still in its
very early stages, and there may be significant changes in the future.
    `,
}
