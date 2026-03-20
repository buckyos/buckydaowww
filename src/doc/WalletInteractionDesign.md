# 浏览器钱包交互与用户地址管理说明

## 文档目的

这份文档用于记录 `buckydaowww/src` 当前与浏览器钱包交互、用户地址绑定、链上身份缓存的实现现状，并作为后续整改的设计基线。

与 [FrontendReview.md](./FrontendReview.md) 的区别：

- `FrontendReview.md` 侧重问题列表和优先级
- 本文档侧重当前实现路径、状态流和重构建议

---

## 2026-03-20 当前状态更新

本轮已经完成第一阶段重构，当前前端状态与本文档前半部分的“原始问题描述”相比有以下变化：

1. 只读 provider 与 signer 已分层
   - 只读调用默认走 `ethers.JsonRpcProvider`
   - 发交易和签名仍走 `ethers.BrowserProvider(window.ethereum)`

2. 浏览器钱包状态已独立表达
   - `activeAddress`
   - `chainId`
   - `hasWallet`
   - `initialized`

3. `committee` 身份不再跨地址持久化
   - 不再使用全局 `committee-type`
   - 当前实现改为按地址实时查询 `committee.isMember(...)`

4. 页面层已开始区分两类地址
   - 后端绑定地址 `boundAddress`
   - 浏览器当前活动地址 `activeAddress`

5. 交易型入口已开始收紧到当前活动钱包
   - `CreateButtons`
   - `ExecuteProposalButton`
   - `WhitelistInvestmentModal`
   - `InvestmentSubscriptionModal`

6. GitHub OAuth redirect_uri 构造已修正
   - 不再把 `?redirect=...` 编码进 callback path
   - 改为基于 `URL` 正常拼接 query 参数

7. 本地链模式支持跳过 GitHub 登录
   - 仅当 `NEXT_PUBLIC_NETWORK_ID === '31337'`
   - Header 直接进入钱包/链交互模式
   - 目的仅是支持本地 `Hardhat Local` 联调

因此，本文档下面的“当前实现概览”和“当前设计的主要问题”部分，既包含历史基线，也包含仍然值得继续优化的剩余问题。

---

## 当前实现概览

当前前端**没有使用 MetaMask SDK**，而是直接依赖浏览器钱包插件注入的 `window.ethereum`。

也就是说，只要浏览器插件实现了 EIP-1193 风格的注入接口，前端就会尝试通过：

1. `window.ethereum`
2. `ethers.BrowserProvider(window.ethereum)`
3. `provider.getSigner()`

来完成：

- 链上只读调用
- 钱包地址读取
- 签名
- 发交易

当前实现路径主要集中在：

- `app/contracts/contract.ts`
- `app/hooks/index.ts`
- `app/hooks/useUserStore.ts`
- `app/hooks/useCommittee.ts`
- `app/header/Fetcher.tsx`

---

## GitHub 登录与本地链测试边界

当前前端有两套不同的入口语义：

### 1. 正常登录模式

适用于：

- 生产网络
- 测试网
- 任何需要后端用户态的环境

流程是：

1. 点击 `Login with GitHub`
2. 跳转 GitHub OAuth
3. GitHub 回调到 `NEXT_PUBLIC_GITHUB_CALLBACK_URL`
4. 前端从 `/api/user/githublogin?code=...` 换取 jwt
5. 再通过 `/api/user/info` 获取用户资料
6. 之后用户再绑定钱包地址

这条路径依赖：

- GitHub OAuth 应用配置
- callback URL 与 GitHub 配置完全匹配
- 后端 `/api/user/githublogin`

### 2. 本地链测试模式

适用于：

- `Hardhat Local`
- 只验证钱包和链交互
- 不依赖后端用户体系

触发条件：

- `NEXT_PUBLIC_NETWORK_ID === '31337'`

行为：

- Header 不再阻塞在 GitHub 登录
- 直接展示钱包入口和链上读取入口
- 用户可以只用浏览器钱包完成本地联调

这条模式的边界非常明确：

- 只服务本地开发和手工 smoke
- 不改变生产或测试网的登录流程
- 不替代真实的 GitHub 登录与 wallet bind

---

## 当前交互流程

### 1. 钱包检测

文件：

- `app/contracts/contract.ts`

当前 `isBrowserHasWallet()` 的逻辑是：

1. 检查 `window.ethereum` 是否存在
2. 检查 `window.ethereum.request` 是否存在
3. 额外检查 `window.ethereum.isMetaMask !== undefined`

这意味着当前代码虽然底层在使用通用注入 provider，但检测逻辑又带有明显的 MetaMask 偏置。

直接影响：

- MetaMask 一般可用
- OKX 等钱包即使也注入了 `window.ethereum`，也可能被误判

---

### 2. Provider 获取

文件：

- `app/contracts/contract.ts`

`getProvider()` 当前直接返回：

- `new ethers.BrowserProvider(window.ethereum)`

然后立即调用 `checkEthNetworkId(provider)` 做链 ID 校验。

如果当前链不匹配：

1. 调 `wallet_switchEthereumChain`
2. 等待
3. `window.location.reload()`

这里的特点是：

- 没有只读 RPC provider
- 所有链交互都依赖浏览器钱包存在
- provider 获取和切链逻辑耦合在一起

---

### 3. 只读合约与可写合约

文件：

- `app/contracts/contract.ts`

当前有两个工厂方法：

- `newSignerContract(...)`
- `newProviderContract(...)`

但两者实际上都走 `getProvider()`，因此都依赖浏览器钱包。

这带来两个问题：

1. “只读合约”并不是真正的只读 provider，而是浏览器钱包 provider
2. 没装钱包时，普通浏览页面也会失败

---

### 4. 合约实例缓存

文件：

- `app/contracts/contract.ts`

`ContractService` 会缓存 signer-bound `ethers.Contract` 实例：

- `COMMITTEE`
- `DIVIDEND`
- `LOCKUP`
- `MAIN`
- `PROJECT`
- `NORMAL_TOKEN`
- `DEV_TOKEN`
- `ACQUIRED`

当前没有：

- `accountsChanged` 监听
- `chainChanged` 监听
- cache 失效逻辑

因此当前缓存模型默认认为：

- 钱包地址不变
- 网络不变
- signer 不变

这在真实浏览器钱包场景下是不成立的。

---

### 5. 用户地址绑定

文件：

- `app/hooks/index.ts`
- `app/hooks/useUserStore.ts`
- `app/services/index.ts`

当前钱包绑定流程是：

1. 用户登录后拿到后端发的 `jwt`
2. 前端在 `useBindWalletAddress().handleConnect()` 中调用：
   - `getProvider()`
   - `provider.getSigner()`
   - `signer.address`
   - `signer.signMessage(jwt)`
3. 将签名发到 `/api/user/bind`
4. 调 `updateUser()`，刷新后端保存的用户信息

也就是说：

- 用户身份主键仍然在后端登录体系
- 钱包地址是被“绑定”到用户资料上
- 当前签名消息就是原始 `jwt`

---

### 6. 用户信息缓存

文件：

- `app/hooks/useUserStore.ts`

`useUserStore` 通过 Zustand Persist 持久化：

- `user`
- `jwt`
- `expiration`

`isLogin()` 逻辑依赖：

- `expiration`
- `jwt`
- `user.nickname`

`logout()` 会清空：

- 用户信息
- `jwt`
- `committee-type` localStorage

但不会清理链交互层缓存，也不会主动断开浏览器钱包。

---

### 7. Committee 身份缓存

文件：

- `app/hooks/useCommittee.ts`
- `app/hooks/index.ts`

当前 committee 身份通过独立 Zustand Persist 存到：

- `committee-type`

`useCommittee(...)` 在用户地址存在时会查询一次：

- `committee.isMember(user.address)`

但只有当状态还是 `unknown` 时才会重新读取。

这意味着：

- 地址一旦切换
- 如果本地已有旧 `committee-type`
- 前端可能沿用上一个地址的 committee 身份 UI

---

### 8. Header 启动时的合约信息读取

文件：

- `app/header/Fetcher.tsx`

Header 启动时会：

1. 调 `isBrowserHasWallet()`
2. 如果为真，再调 `fetchTokenInfo()`
3. 然后更新 `useContractStore`

这意味着：

- 页面顶部 token 信息初始化也依赖浏览器钱包存在
- 与“公共只读页应该可访问”的目标不一致

---

## 当前设计的主要问题

### A. 钱包检测带 MetaMask 偏置

当前实现虽然不是 MetaMask SDK，但检测逻辑依赖：

- `window.ethereum.isMetaMask`

这会和“支持 OKX / 通用 EIP-1193 钱包”的目标冲突。

---

### B. 只读和写入没有分层

现在：

- 只读调用
- 签名
- 发交易

都依赖浏览器钱包 provider。

更合理的设计应该是：

- 只读：RPC provider
- 写入：BrowserProvider + signer

---

### C. 合约缓存和钱包状态脱节

当前 `ContractService` 缓存的是 signer-bound contract。

一旦用户：

- 切钱包地址
- 切链
- 在钱包里断开授权

前端仍可能继续拿旧缓存做后续交易。

---

### D. 用户身份和钱包地址是“绑定关系”，但前端状态管理没有体现这个边界

现在前端容易把两件事混淆：

1. 当前登录用户
2. 当前浏览器钱包地址

而实际上它们可能不同步：

- 用户登录后还没绑钱包
- 用户绑定过一个地址后又在钱包里切到了另一个地址
- 后端 `user.address` 和当前 `signer.address` 不一致

当前状态流对这些分叉没有单独表达。

---

### E. 签名文案和绑定流程过于原型化

当前绑定直接签：

- `jwt`

从工程规范上看，这不够清晰。

后续更推荐改成结构化签名消息，例如明确包含：

- 站点名
- 动作类型（Bind Wallet）
- 当前登录用户标识
- 时间戳或 nonce

这不一定要立刻升级为 EIP-712，但至少不应长期停留在“直接签原始 JWT”。

---

## 推荐重构方向

### 第一阶段：结构分层

先把交互层拆成三类：

1. `readonly provider`
2. `wallet provider`
3. `signer session`

建议目标：

- 只读页面默认全部走 RPC provider
- 发交易和签名时才接入浏览器钱包
- `newProviderContract(...)` 不再依赖 `window.ethereum`

---

### 第二阶段：钱包状态中心化

建议新增独立的钱包状态层，例如：

- 当前是否检测到 EIP-1193 provider
- 当前链 ID
- 当前已授权地址
- 当前 signer 地址
- 最近一次钱包同步时间

并统一监听：

- `accountsChanged`
- `chainChanged`
- `disconnect`（若钱包支持）

事件发生后需要：

1. 清空 signer-bound contract cache
2. 重新拉取 committee 身份
3. 重新校验后端绑定地址与当前 signer 是否一致

---

### 第三阶段：用户身份与钱包绑定分离展示

建议 UI 上明确区分三件事：

1. 登录用户
2. 后端已绑定地址
3. 当前钱包活动地址

推荐状态判断：

- 未登录
- 已登录未绑钱包
- 已登录且钱包地址与绑定地址一致
- 已登录但钱包活动地址与绑定地址不一致

最后一种状态应该有明确提示，而不是静默继续使用旧绑定信息。

---

### 第四阶段：绑定签名规范化

后续建议把当前：

- `signMessage(jwt)`

重构为：

- 后端先下发一次性 nonce / challenge
- 前端签结构化 challenge
- 后端校验后完成绑定

最小版本也应至少包含：

- 动作名称
- 用户身份标识
- challenge / nonce
- 过期时间

---

## 建议的目录职责

如果后续继续重构，建议将相关逻辑按职责拆分：

- `app/contracts/contract.ts`
  - 只保留合约地址和 contract factory
- `app/wallet/provider.ts`
  - 处理浏览器钱包注入、EIP-1193 检测、链切换
- `app/wallet/session.ts`
  - 当前钱包地址、链 ID、监听和 cache invalidation
- `app/hooks/useWallet.ts`
  - 暴露页面层消费的钱包状态
- `app/hooks/useUserStore.ts`
  - 仅负责后端登录用户状态
- `app/hooks/useCommittee.ts`
  - 基于当前链上地址动态计算，不再做跨地址持久化缓存

---

## 建议的整改顺序

1. 去掉对 `window.ethereum.isMetaMask` 的依赖，改成通用 EIP-1193 检测
2. 引入只读 RPC provider，让只读页面脱离浏览器钱包
3. 为钱包地址和链切换增加监听与 contract cache 失效
4. 重构 committee 身份状态，不再跨地址 persist
5. 明确“登录用户 / 已绑定地址 / 当前钱包地址”的 UI 分层
6. 后续再升级绑定签名流程

---

## 当前结论

当前前端和浏览器钱包的交互，本质上是：

- 直接使用插件注入的 `window.ethereum`
- 通过 `ethers.BrowserProvider` 获取 signer
- 再完成链上读取、签名和交易发送

它不是 MetaMask SDK 模式，而是更轻量、也更原始的浏览器注入模式。

这条路径可以工作，但当前实现仍然有几个明显的问题：

1. 检测逻辑仍带 MetaMask 偏置
2. 只读和写入没有分层
3. contract cache 不会随账号和网络变化失效
4. 用户地址绑定和当前钱包活动地址没有被清晰区分

因此，后续这部分整改的核心，不是继续堆更多钱包判断分支，而是先把：

- provider 分层
- signer 生命周期
- 用户地址状态边界

这三件事理顺。
