# 钱包连接与签名绑定拆分改造方案

## 文档目的

这份文档用于记录前端将“连接浏览器钱包”和“签名绑定钱包地址”拆分的原因、目标状态和实施方案。

本文档是一个待实施设计文档，不代表当前代码已经完成对应改造。

相关文档：

- [WalletInteractionDesign.md](./WalletInteractionDesign.md)
- [FrontendReview.md](./FrontendReview.md)
- [LocalChainTesting.md](./LocalChainTesting.md)

---

## 背景

当前前端在 `useBindWalletAddress().handleConnect()` 中，把两件事放在了一次点击里：

1. 连接浏览器钱包
2. 使用当前 `jwt` 发起签名并调用 `/api/user/bind`

这意味着用户第一次点击 `Connect Wallet` 时，并不是只建立钱包会话，而是同时进入了账号绑定流程。

在原型阶段这条路径可以工作，但随着前端开始同时支持：

- 只读链上浏览
- 本地链联调
- 浏览器钱包切换
- GitHub 登录后的账号绑定

这套交互已经不够清晰。

---

## 当前问题

### 1. 连接和绑定是两种不同动作

“连接钱包”解决的是：

- 当前页面能否读取浏览器注入 provider
- 当前活动地址是谁
- 当前 signer 是否可用

“绑定钱包”解决的是：

- 当前登录用户是否声明某个地址归自己所有
- 后端 `user.address` 是否应该更新

它们不是同一个层级的动作，不应被同一个按钮同时触发。

### 2. 第一次连接钱包就要求签名，用户心智不清晰

当前用户只想做下面这些事情时：

- 查看当前活动钱包地址
- 切换 committee 身份
- 本地链联调
- 浏览 proposal 页面

也会被立即要求签名。

这会让用户难以理解：

- 为什么只是 connect wallet 就要签名
- 这个签名到底是在登录、绑定还是发起交易

### 3. 本地链联调不应被绑定流程卡住

在 `31337 / Hardhat Local` 模式下，前端已经支持跳过 GitHub 登录，直接测试链交互。

但如果 `Connect Wallet` 仍然默认触发签名绑定，那么本地链测试仍然会被：

- `/api/user/bind`
- `jwt`
- 后端用户态

这些链外交互阻塞。

这和本地链模式“只测链交互”的目标不一致。

### 4. 当前 UI 状态表达还不够完整

现在虽然已经区分了：

- `boundAddress`
- `activeAddress`

但“什么时候只是连接、什么时候需要绑定、什么时候提示 rebind”还没有独立交互入口。

---

## 改造目标

这次改造的目标是：

1. `Connect Wallet` 只负责连接浏览器钱包，不触发签名
2. `Bind Wallet` 作为独立动作，只在需要时显式触发
3. Header 和用户页明确区分：
   - 当前活动钱包
   - 后端已绑定地址
4. 本地链测试模式下允许完全跳过绑定流程
5. 保持生产环境的 GitHub 登录和后端用户态不变

---

## 非目标

本次改造不包含以下内容：

1. 不修改后端 `/api/user/bind` 协议
2. 不把当前绑定签名立即升级成 EIP-712
3. 不改变生产环境必须先登录 GitHub 的整体产品语义
4. 不引入新的钱包 SDK

---

## 新的状态模型

建议前端显式维护以下 4 类状态：

### 1. 登录用户状态

来自后端用户体系：

- `jwt`
- `user.nickname`
- `user.address` 作为已绑定地址

### 2. 当前钱包会话状态

来自浏览器注入 provider：

- `hasWallet`
- `initialized`
- `chainId`
- `activeAddress`

### 3. 绑定关系状态

由以下关系推导：

- 是否已绑定：`!!boundAddress`
- 是否已连接：`!!activeAddress`
- 是否 mismatch：`activeAddress !== boundAddress`

### 4. 本地链测试模式

由环境决定：

- `NEXT_PUBLIC_NETWORK_ID === '31337'`

该模式下允许：

- 未登录也能看到钱包入口
- 只连接钱包，不强制绑定

---

## 推荐交互方案

### 状态 A：未登录、未连接钱包

界面：

- 正常环境：显示 `Login with GitHub`
- 本地链模式：显示 `Connect Wallet`

行为：

- 不触发签名绑定

### 状态 B：已登录、未连接钱包

界面：

- Header 显示 `Connect Wallet`
- 用户页显示：
  - `bound wallet`
  - `active wallet: -`

行为：

- 点击 `Connect Wallet` 只请求钱包授权
- 成功后只更新 `activeAddress`

### 状态 C：已连接钱包，但未绑定

界面：

- Header 显示当前 `active wallet`
- 用户页显示：
  - `bound wallet: -`
  - `active wallet: 0x...`
  - 一个主按钮：`Bind Wallet`

行为：

- 点击 `Bind Wallet` 时才发起签名
- 成功后刷新 `/api/user/info`

### 状态 D：已绑定，且当前活动钱包与绑定地址一致

界面：

- Header 显示当前地址
- 用户页显示：
  - `bound wallet`
  - `active wallet`
  - 状态标签：`Bound`

行为：

- 不需要额外提示

### 状态 E：已绑定，但当前活动钱包与绑定地址不一致

界面：

- 用户页明确显示 warning：
  - `Active wallet differs from bound address`
- 提供两个动作：
  - `Switch Wallet`
  - `Bind Current Wallet` 或 `Rebind Wallet`

行为：

- 交易入口继续只认 `activeAddress`
- 但账号绑定关系保持明确可见

---

## 页面变化建议

### Header

职责：

- 展示当前活动钱包或登录入口
- 不承担绑定动作主入口

建议：

1. `Connect Wallet`
   - 只连接
2. 已连接后显示 `activeAddress`
3. 如果存在 mismatch，只显示轻量提示，不在 Header 里塞复杂绑定动作

### 用户页 `/user/info`

职责：

- 展示绑定关系
- 提供绑定/重绑定主入口

建议新增或明确展示：

1. `bound wallet`
2. `active wallet`
3. `wallet status`
4. `Bind Wallet`
5. `Rebind Wallet`

### 本地链模式

在 `31337` 下：

- Header 直接允许连接钱包
- 用户页可以隐藏绑定按钮，或显示为禁用并说明“Local test mode does not require wallet binding”

推荐第一版使用更简单的行为：

- 本地链模式直接不展示 `Bind Wallet`

---

## 实施建议

### 第一步：拆分动作

把当前：

- `handleConnect()`

拆成两个方法：

- `handleConnectWallet()`
- `handleBindWallet()`

其中：

- `handleConnectWallet()` 只做：
  - 获取 provider
  - 获取 signer
  - 获取地址
  - 更新 `activeAddress / chainId`

- `handleBindWallet()` 才做：
  - 检查已登录
  - 读取当前 signer
  - `signMessage(jwt)`
  - 调 `/api/user/bind`
  - `updateUser()`

### 第二步：调整按钮入口

1. Header 的 `Connect Wallet` 只连钱包
2. 用户页新增 `Bind Wallet`
3. mismatch 时用户页新增 `Rebind Wallet`

### 第三步：补齐本地链模式分支

在 `31337` 下：

- 不要求绑定
- 交易入口只依赖 `activeAddress`
- 用户页不因为没有 `boundAddress` 而阻塞

---

## 对现有逻辑的影响

### 正向影响

1. 用户第一次 connect 不再被意外要求签名
2. 本地链联调可以真正只测链交互
3. 登录用户、绑定地址、活动钱包三者边界更清晰
4. 后续如果升级 challenge-based bind，会更容易落地

### 需要注意的点

1. 有些页面目前仍默认把 `activeAddress || boundAddress` 当成同一展示地址
2. 拆分后，所有“发交易”入口都应优先使用 `activeAddress`
3. 绑定动作必须要求：
   - 已登录
   - 当前有活动钱包

---

## 建议的实施顺序

1. 先完成这次交互拆分
2. 再补一次本地链手工 smoke：
   - connect
   - switch wallet
   - committee 身份刷新
   - user/info 状态展示
3. 最后再考虑把当前 `signMessage(jwt)` 升级成 challenge / nonce 模型

---

## 当前结论

这次改造的核心不是增加更多按钮，而是把两类本质不同的动作彻底分开：

- `Connect Wallet`：建立钱包会话
- `Bind Wallet`：确认用户与地址绑定关系

对当前前端来说，这是比继续微调 `handleConnect()` 更重要的一次状态边界收口。
