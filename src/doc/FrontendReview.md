# BuckyDAO WWW 前端实现审查与改进跟踪

## 文档目的

这份文档用于记录 `buckydaowww/src` 当前实现的前端审查结论，并作为后续整改的跟踪基线。

后续原则：

1. 每完成一项整改，就在本文档中更新状态
2. 如果发现新的前端问题或与链上合约语义不一致的地方，也继续追加到本文档
3. 这份文档优先记录：
   - 钱包接入与链交互风险
   - 与当前 `SourceDAO` 合约实现的语义偏差
   - 页面行为缺陷
   - 可观测性、测试和工程化缺口

---

## 当前审查范围

本轮审查主要覆盖：

- 钱包接入与 provider / signer 管理
- proposal 页面与 full proposal 结算
- upgrade proposal 创建、投票、执行链路
- 合约 ABI / 前端语义对齐情况
- 错误 wiring、只读页面与合约读取依赖

说明：

- 本轮是静态 review，不是完整运行验证
- 当前 `buckydaowww/src` 目录下没有 `node_modules`
- 因此没有实际执行 `build` / `lint`

---

## 当前问题清单

### P0-01 Full Proposal 结算按钮实现错误

**状态**：已完成

**位置**

- `app/(pages)/proposal/[proposalId]/FullVoteExecuteButton.tsx`

**问题**

当前 full proposal 的结算逻辑存在两个直接问题：

1. 调用 `endFullPropose(...)` 时只传了 `proposal.support`
2. 投票未到期时按钮仍然可点击

这会导致：

- 反对票地址没有进入 settle 列表
- proposal 可能永远无法完成结算
- 用户会在错误时机发送无意义或失败交易

**建议**

1. 传入完整的待 settle voter 集合，而不是只传 support
2. 在 proposal 未过期时禁用按钮
3. 前端应显示：
   - 已过期 / 未过期
   - 已 settle 数
   - 还剩多少 voter 未 settle
4. 后续可再考虑 batch settle UI，而不是一次只传一整个数组

---

### P0-02 钱包检测与 provider 设计不符合当前目标

**状态**：部分完成

**位置**

- `app/contracts/contract.ts`

**问题**

当前实现把钱包检测和 provider 获取绑定得过紧，并且钱包识别逻辑带有明显 MetaMask 偏置：

1. `isBrowserHasWallet()` 依赖 `window.ethereum.isMetaMask`
2. `newProviderContract(...)` 也要求浏览器存在钱包
3. 没装钱包时，很多只读页面也无法正常读取链上状态

这与“支持 MetaMask / OKX 钱包”和“普通用户可浏览页面”的目标都不完全一致。

**建议**

1. 将只读 provider 与写入 signer 分离
2. 只读页面默认走 RPC provider，不依赖浏览器钱包
3. 钱包接入只在发交易时请求浏览器钱包
4. 钱包检测应按 EIP-1193 能力判断，而不是绑定 `isMetaMask`
5. 后续统一支持：
   - MetaMask
   - OKX Wallet
   - 其他兼容 `window.ethereum` 的 EIP-1193 钱包

---

### P0-03 合约实例缓存没有随账号和网络切换失效

**状态**：已完成

**位置**

- `app/contracts/contract.ts`

**问题**

当前 `contractService` 会缓存 signer-bound `ethers.Contract` 实例，但项目中没有：

- `accountsChanged` 监听
- `chainChanged` 监听
- signer / provider cache 清理逻辑

这会带来两个风险：

1. 用户切账号后，前端仍可能使用旧 signer 发交易
2. 用户切网络后，前端仍可能持有旧链上的 contract 实例

**建议**

1. 增加 provider / signer 生命周期管理
2. 监听：
   - `accountsChanged`
   - `chainChanged`
3. 事件触发后清空 contract cache
4. committee 身份和用户链上状态也应一起刷新

---

### P0-04 Upgrade proposal 流程已落后于当前合约语义

**状态**：部分完成

**位置**

- `app/components/modal/UpgradeContractModal.tsx`
- `app/contracts/vote.ts`
- `app/contracts/execute.ts`

**问题**

当前前端仍按旧版升级治理流程实现：

1. 创建提案只支持 `prepareContractUpgrade(proxy, implementation)`
2. 投票参数仍只编码 `proxy + implementation + "upgradeContract"`
3. 执行时固定 `upgradeToAndCall(..., emptyData)`

但当前 `SourceDAO` 链上实现已经改为：

- upgrade proposal 需要绑定 `implementation + calldataHash`

因此现在前端只能处理“空 calldata 升级”，无法正确处理带 migration data 的升级提案。

**建议**

1. 升级提案表单增加 migration calldata 输入或生成逻辑
2. 前端显式计算并展示 `keccak256(calldata)`
3. 投票参数、提案详情展示、执行逻辑都同步升级到新语义
4. 将“空 calldata”作为特例，而不是唯一模式

---

### P0-05 部分前端调用与当前合约 ABI / 方法名不一致

**状态**：部分完成

**位置**

- `app/contracts/index.ts`
- `app/hooks/index.ts`

**问题**

目前已经看到至少两处明显漂移：

1. 调用了 `endInventment(...)`，而当前合约方法是 `endInvestment(...)`
2. 仍然尝试读取 `totalUnlocked / totalLocked`，但当前 lockup 合约暴露的是：
   - `totalAssigned`
   - `totalClaimed`
   - `getCanClaimTokens`

这类问题会导致前端在运行时直接报错，或静默展示错误数据。

**建议**

1. 系统性核对前端 ABI 与当前合约实现
2. 清理掉旧接口和历史命名
3. 后续建立一份“前端依赖的链上接口清单”，避免再次漂移

---

### P1-01 committee 身份缓存会跨用户污染

**状态**：待处理

**位置**

- `app/hooks/useCommittee.ts`
- `app/hooks/index.ts`

**问题**

当前 `committee-type` 被持久化到 localStorage，而且 `ensureFetched()` 只要发现不是 `unknown` 就不再重新查询。

这意味着：

- 一个 committee member 登录过后
- 即使用户切成普通地址
- 前端仍可能继续显示 committee-only 功能

这会造成权限 UI 偏差，虽然链上最终会拒绝，但交互体验和安全感知都不好。

**建议**

1. 将 committee 身份绑定到当前钱包地址
2. 地址变更后强制重新查询
3. 不要把单一布尔状态跨账号持久化

---

### P1-02 Full proposal 票数展示不是当前链上结果的权威视图

**状态**：待处理

**位置**

- `app/(pages)/proposal/[proposalId]/ProposalHeaderContent.tsx`

**问题**

当前 full proposal 页面是按“当前余额 + 当前 devRatio”实时估算支持/反对票数。

这和当前链上语义并不完全一致：

- `endFullPropose(...)` 是分批 settle 的
- 结算结果取决于 settle 时点的余额
- 当前项目里还保留了“full proposal 票重快照问题”作为已知议题

因此这个页面只能算“估算视图”，不能当成权威结果。

**建议**

1. 页面文案明确标识为 estimated view
2. 如果后端能返回已 settle 的 `agree/reject`，优先展示链上已结算结果
3. 后续如果 full proposal 改为统一快照计票，前端也要同步改展示模型

---

### P1-03 网络切换流程过于粗糙

**状态**：待处理

**位置**

- `app/contracts/contract.ts`

**问题**

当前网络不匹配时直接调用 `wallet_switchEthereumChain`，然后延时刷新页面。

问题在于：

1. 没有处理用户拒绝切链
2. 没有处理钱包尚未添加该链的场景
3. 页面刷新前后没有明确状态恢复策略

**建议**

1. 完整处理 `wallet_switchEthereumChain` 异常
2. 对未添加链的情况提供 `wallet_addEthereumChain`
3. 将链状态提示成明确的 UI，而不是只靠 toast + reload

---

### P2-01 环境配置和部署配置组织较弱

**状态**：待处理

**位置**

- `src/.env`
- `src/next.config.js`

**问题**

当前前端把实际部署地址和后端地址直接放在 `.env` 中，且 `productionBrowserSourceMaps` 已打开。

这不一定是立即漏洞，但对管理后台来说默认偏宽松。

**建议**

1. 明确区分：
   - 本地开发配置
   - 测试环境配置
   - 生产环境配置
2. 评估是否真的需要生产 source map
3. 后续考虑把部署环境文档化，而不是靠当前文件直接承载全部上下文

---

### P2-02 文档和代码状态还偏原型化

**状态**：待处理

**位置**

- `src/README.md`
- 全项目

**问题**

当前项目还处在“能跑一部分”的原型阶段，文档和代码里都还保留了明显的未完成痕迹：

- TODO 风格说明较多
- 有重复组件路径
- 有旧接口残留
- 没有构建/测试基线文档

**建议**

1. 给前端单独补一份开发说明文档
2. 明确：
   - 当前支持的钱包
   - 当前支持的 proposal 类型
   - 当前与链上合约对齐的功能范围
3. 后续每做一轮整改，同步更新本文档状态

---

## 推荐整改顺序

### 第一阶段：先修关键交互错误

1. 修 `FullVoteExecuteButton`
2. 修 ABI / 方法名漂移
3. 修 upgrade proposal 的新语义支持

### 第二阶段：重构钱包和链交互基础层

1. 只读 provider 与 signer 分离
2. accounts / chain 变更监听
3. contract cache 失效机制
4. committee 身份状态重构

### 第三阶段：补工程化与测试

1. 增加最小 `build` / `lint` 基线
2. 增加钱包与 proposal 的前端集成测试
3. 建立前端依赖的链上接口清单

---

## 后续更新规则

后续每次推进建议按以下格式更新本文档：

### YYYY-MM-DD 某项整改记录

- 处理项：`P0-01`
- 改动文件：
- 修改内容：
- 是否影响用户行为：
- 是否与链上合约语义对齐：
- 验证方式：
- 当前状态：已完成 / 部分完成 / 待继续

---

## 整改记录

### 2026-03-20 P0-01 / P0-05 第一轮修正

- 处理项：`P0-01`, `P0-05`
- 改动文件：
  - `app/(pages)/proposal/[proposalId]/FullVoteExecuteButton.tsx`
  - `app/(pages)/proposal/[proposalId]/ProposalHeaderContent.tsx`
  - `app/contracts/index.ts`
  - `app/hooks/index.ts`
- 修改内容：
  - `FullVoteExecuteButton` 改为使用 `support + reject` 的完整 voter 集合结算 full proposal
  - proposal 未到期或已无 pending voter 时，结算按钮禁用并展示原因
  - 结算成功后自动刷新 proposal 数据
  - 修正 `endInventment(...)` 为当前合约 ABI 的 `endInvestment(...)`
  - `useLockToken` 改为基于当前 `TokenLockup` 的 `totalAssigned / totalClaimed`
  - 用户页锁仓信息同步改成 `Assigned Lockup / Claimed Lockup / Remaining Locked`，不再继续展示与当前 ABI 不一致的 `Unlocked Token`
- 是否影响用户行为：是
- 是否与链上合约语义对齐：是，已对齐当前 full proposal settle 和 lockup ABI
- 验证方式：静态代码核对；当前前端目录缺少 `node_modules`，尚未执行 build / lint
- 当前状态：
  - `P0-01` 已完成
  - `P0-05` 部分完成，upgrade proposal 相关 ABI 漂移仍待处理

### 2026-03-20 P0-04 升级提案语义对齐

- 处理项：`P0-04`
- 改动文件：
  - `app/components/modal/UpgradeContractModal.tsx`
  - `app/contracts/vote.ts`
  - `app/contracts/execute.ts`
  - `app/components/ExecuteProposalButton.tsx`
  - `app/components/ProposalExtraContent.tsx`
  - `app/(pages)/proposal/[proposalId]/page.tsx`
  - `app/utils/index.ts`
  - `app/contracts/Interface.sol/SourceDaoCommittee.json`
  - `app/contracts/Interface.sol/ISourceDaoCommittee.json`
- 修改内容：
  - 升级提案创建改为始终走 `prepareContractUpgrade(address,address,bytes32)`
  - proposal params 改为存储 `proxy + implementation + calldataHash + "upgradeContract"`
  - 提供可选 migration calldata 输入，并在前端计算 `keccak256(calldata)`
  - raw calldata 通过带标记的 metadata 附加到 proposal `extra` 中，执行时再解析回 `upgradeToAndCall(...)`
  - proposal 页面将 migration metadata 从正文中剥离，并单独展示 upgrade proposal details
  - 前端自带 `Committee` ABI 补齐三参 `prepareContractUpgrade` 和二参 `verifyContractUpgrade`
- 是否影响用户行为：是
- 是否与链上合约语义对齐：是，已对齐当前 `calldataHash` 治理模型
- 验证方式：静态代码核对；当前前端目录缺少 `node_modules`，尚未执行 build / lint
- 当前状态：已完成

### 2026-03-20 P0-02 / P0-03 第一轮钱包层重构

- 处理项：`P0-02`, `P0-03`
- 改动文件：
  - `package.json`
  - `app/contracts/contract.ts`
  - `app/header/Fetcher.tsx`
- 修改内容：
  - 移除了未实际使用的 `@metamask/sdk` 和 `@metamask/detect-provider`
  - 钱包检测改为通用 EIP-1193 注入检查，不再依赖 `window.ethereum.isMetaMask`
  - 增加只读 `JsonRpcProvider`，`newProviderContract(...)` 不再依赖浏览器钱包
  - signer contract cache 增加 `accountsChanged / chainChanged` 驱动的失效逻辑
  - header 初始化 token 信息改为默认走只读链路
- 是否影响用户行为：是
- 是否与链上合约语义对齐：是
- 验证方式：
  - `npm i`
  - `npm run build`
  - 当前 build 通过，仅剩一个既有的 `no-img-element` warning
- 当前状态：
  - `P0-02` 部分完成，仍缺更完善的切链错误处理和 OKX 实机验证
  - `P0-03` 部分完成，committee 身份和用户状态尚未完全跟随钱包事件刷新

---

## 当前结论

这个前端项目已经具备了一个基础管理台雏形，但还明显处在“原型 + 早期运维工具化页面”的阶段。

当前最重要的问题不是样式简陋，而是：

1. 钱包和 provider 层设计还不稳定
2. 部分链上调用已经和当前 `SourceDAO` 合约实现漂移
3. full proposal 和 upgrade proposal 这两条高风险治理路径，前端语义还没有完全跟上合约

因此后续应优先按本文档的 `P0 -> P1 -> P2` 顺序推进，而不是先做纯 UI 美化。
