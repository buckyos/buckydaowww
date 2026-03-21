# buckydaowww

SourceDAO Web Frontend.

线上站点：

- `https://dao.buckyos.org/`

这个仓库承载：

- DAO 首页与导航
- proposal 列表与详情
- 网页投票与执行入口
- project / version 页面
- investment 页面
- GitHub / local-dev 登录态与钱包交互

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Ant Design
- Tailwind CSS
- ethers v6
- Zustand

## 目录结构

- `src/`
  实际前端应用目录。`package.json`、Next.js 配置和页面代码都在这里。
- `doc/`
  前端设计、联调和交互方案文档。

## 快速开始

### 1. 安装依赖

```bash
cd src
npm install
```

### 2. 启动开发环境

```bash
cd src
npm run dev
```

默认地址：

- `http://127.0.0.1:3000`

### 3. 生产构建

```bash
cd src
npm run build
npm run start
```

默认 `start` 端口：

- `3050`

## 环境变量

前端主要依赖 `src/.env.local`。

常见字段包括：

- `NEXT_PUBLIC_CHAIN`
- `NEXT_PUBLIC_NETWORK_ID`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_SERVER`
- `NEXT_PUBLIC_MAIN`
- `NEXT_PUBLIC_COMMITTEE`
- `NEXT_PUBLIC_PROJECT`
- `NEXT_PUBLIC_DEV_TOKEN`
- `NEXT_PUBLIC_NORMAL_TOKEN`
- `NEXT_PUBLIC_LOCKUP`
- `NEXT_PUBLIC_DIVIDEND`
- `NEXT_PUBLIC_ACQUIRED`
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`
- `NEXT_PUBLIC_GITHUB_CALLBACK_URL`

本地完整联调时，这个文件通常由 `SourceDAO` 的脚本自动生成：

- [`SourceDAO/scripts/deploy_frontend_local.ts`](/home/bucky/work/SourceDAO/scripts/deploy_frontend_local.ts)
- [`SourceDAO/scripts/local_dev_stack.sh`](/home/bucky/work/SourceDAO/scripts/local_dev_stack.sh)

## 推荐开发方式

### 方式一：完整本地栈

如果你要同时联调：

- Hardhat 本地链
- SourceDAOBackend
- buckydaowww

推荐直接从 `SourceDAO` 仓库启动：

```bash
cd /home/bucky/work/SourceDAO
npm run stack:local
```

对应文档：

- [`SourceDAO/docs/LocalFullStackDev.md`](/home/bucky/work/SourceDAO/docs/LocalFullStackDev.md)

### 方式二：只启动前端

如果链和 backend 已经由别的终端启动，只需要：

```bash
cd src
npm run dev
```

但要先确认 `src/.env.local` 指向正确的：

- RPC URL
- backend URL
- 合约地址

## 当前交互模型

前端当前区分三种用户可见状态：

1. `disconnected`
   未连接钱包，未登录 backend
2. `anonymous`
   已连接钱包，但还没有 backend token
3. `authenticated`
   已完成 backend 登录，并与当前钱包地址一致

本地链模式下：

- 会通过 dev login 获取本地 token
- 不再依赖 GitHub OAuth 才能联调 proposal / project 等功能

更详细说明见：

- [`doc/WalletInteractionDesign.md`](/home/bucky/work/buckydaowww/doc/WalletInteractionDesign.md)
- [`SourceDAOBackend/doc/BackendAuthAndDevLogin.md`](/home/bucky/work/SourceDAOBackend/doc/BackendAuthAndDevLogin.md)

## 相关文档

- 本地链测试：
  [`doc/LocalChainTesting.md`](/home/bucky/work/buckydaowww/doc/LocalChainTesting.md)
- 钱包连接与绑定拆分方案：
  [`doc/WalletConnectBindSeparationProposal.md`](/home/bucky/work/buckydaowww/doc/WalletConnectBindSeparationProposal.md)
- 钱包交互设计：
  [`doc/WalletInteractionDesign.md`](/home/bucky/work/buckydaowww/doc/WalletInteractionDesign.md)
- 前端评审记录：
  [`doc/FrontendReview.md`](/home/bucky/work/buckydaowww/doc/FrontendReview.md)

## 常用排查

### proposal 创建后 metadata 提交失败

前端已经支持本地 `metadata outbox` 与 `Retry metadata`，但前提是：

- 链上交易成功
- 当前浏览器本地还保留当时的 metadata payload

### MetaMask 报 `eth_sendTransaction -> Failed to fetch`

先确认本地钱包网络是否仍指向：

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`

### Header 在中等宽度下容易拥挤

当前 header 已做响应式收敛，但如果继续加内容，优先原则仍然是：

- 不覆盖
- 允许多行
- 不强行保持单行布局
