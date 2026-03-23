# Treasury / Funding / Investment 总览设计

这份文档记录 `Treasury / Funding / Investment` 相关页面的目标、信息架构和第一阶段改造方案。

## 1. 目标

当前网页里：

- `/funding` 基本还是占位页
- `/invest` 已经承载了两步投资（Acquired / Two-step investment）的详情和参与流程
- `/token` 已经负责协议 token 与个人 token 资产视图

因此，`/funding` 更适合升级成一个**总览页**，而不是继续做某一轮融资的详情页。

这个页面的目标是回答四类问题：

1. DAO 当前的 treasury / funding 相关资产大致分布在哪里
2. 现在有哪些融资轮正在进行
3. 历史上有哪些 acquisition / funding round
4. project / version 的推进与 token release 有什么关系

## 2. 页面职责划分

### `/funding`

定位：
- Treasury / Funding 总览页
- 侧重“看全局”

展示重点：
- 协议资金快照
- 活跃融资轮
- 融资历史摘要
- project version release pipeline

### `/invest`

定位：
- 具体投资轮详情与参与页
- 侧重“看某一轮 / 参与某一轮”

展示重点：
- two-step investment 列表
- 每轮详情
- whitelist / subscribe / end investment 操作

### `/token`

定位：
- 协议 token 与个人 token 资产页
- 侧重“看 token、操作 token”

展示重点：
- BDT / BDDT
- lockup / dividend
- claim / withdraw

## 3. 第一阶段信息架构

第一阶段先不新增 backend 聚合接口，而是直接复用现有前端可拿到的数据，先把页面跑通。

### 3.1 Treasury Snapshot

建议展示：

- `BDDT Released`
- `BDDT Unreleased`
- `BDT in Dividend`
- `BDT held by Acquired`
- `BDT held by Project`
- `Active funding rounds`

说明：
- `BDDT Released / Unreleased` 来自 `/api/contract/token`
- 合约持有的 `BDT` 余额可直接链上读取 `balanceOf`
- 这是“协议资金快照”，不是完整财务报表

### 3.2 Active Funding

展示当前仍在进行中的 two-step investment rounds：

- title
- investor
- status
- token being sold
- raised DAO amount
- subscribed progress
- step1 / step2 截止时间
- 详情入口

### 3.3 Funding History

展示历史 acquisition / funding round 摘要：

- round id
- title
- investor
- token
- total offered
- subscribed amount
- status
- time range

第一阶段只做列表摘要，不做统计图和复杂筛选。

### 3.4 Project Release Pipeline

展示 project version 与 token release 的关系，核心含义如下：

- `Waiting vote`
  - 版本 proposal 尚未通过
  - 不会触发 release
- `Developing`
  - 版本已经开始开发
  - 还未进入 release 结果
- `Waiting settlement vote`
  - version 已发起结算 proposal
  - token release 取决于结算投票结果
- `Version settled`
  - version 已完成
  - 对应项目版本 release time 已在链上记录
  - lockup 若绑定到该项目/版本，可进入后续解锁流程

第一阶段建议展示：

- 各状态 version 数量
- 最近的 `Developing / Waiting settlement vote / Version settled` 列表

## 4. 第一阶段数据来源

### 现有可复用数据

- `/api/contract/token`
  - 协议 token 总量、已释放、未释放
- `/api/twostep`
  - two-step investment 列表
- `/api/repo/detail`
  - project profile 列表
- `/api/project/:projectName`
  - 某个 project 下的 version 列表
- 链上只读：
  - `NormalToken.balanceOf(dividend)`
  - `NormalToken.balanceOf(acquired)`
  - `NormalToken.balanceOf(project)`

### 第一阶段不做的事情

- 不做新的 backend treasury 聚合接口
- 不做完整财务报表
- 不做多资产 treasury 统一折算
- 不做复杂图表和时间序列
- 不做 project/version 的 release 时间精确回放视图

## 5. 页面交互建议

第一阶段建议在 `/funding` 顶部提供这些导航：

- `View investment rounds` -> `/invest`
- `Open token center` -> `/token`
- `Read overview guide` -> 当前文档

这样页面职责会更清楚：

- 总览看 `/funding`
- 具体 round 看 `/invest`
- token 资产和操作看 `/token`

## 6. 第二阶段候选增强

第二阶段不再只是继续堆总览卡片，而是把 `/funding` 和 `/invest` 分别往“决策总览”和“round 工作台”推进。

### 6.1 Funding 第二阶段

目标：

- 把前端 fan-out 聚合迁移到更稳定的 backend summary
- 让 treasury 与 project release 的关系更可读

建议优先级：

1. backend 聚合接口
   - `/treasury/overview`
   - `/funding/overview`
   - `/funding/release-pipeline`
2. treasury 资产图表
   - 合约余额分布
   - 历史融资量趋势
3. release 关联增强
   - 最近 release 版本时间线
   - release token proposal 摘要
   - lockup / contribution withdraw 的关联说明

### 6.2 Invest 第二阶段

目标：

- 把 `/invest/[id]` 从“原始详情页”升级成真正的 round 工作台
- 优先回答当前用户最关心的问题：
  - 我能不能认购？
  - 我现在处于哪个阶段？
  - 我还能认购多少？
  - investor 什么时候可以结束本轮？

建议拆成这些区块：

1. `Round Summary`
   - round title / status
   - human-readable ratio
   - remaining inventory
   - investor
2. `My Subscription Status`
   - 当前钱包是否在 whitelist
   - step 1 配额
   - 已认购数量
   - 当前最大可认购数量
3. `Timeline & Rules`
   - step 1 / step 2 / end 时间
   - 当前阶段说明
   - investor end 条件说明
4. `Whitelist Allocation`
   - 当前 round whitelist 摘要
   - 已认购进度

### 6.3 当前建议的实施顺序

1. 先做 `/invest/[id]` 工作台化改造
2. 再补 backend treasury / funding summary
3. 最后上图表和 release ledger

## 7. 当前取舍

第一阶段的核心取舍是：

- **优先做出一个结构清晰的总览页**
- **不在第一步就把 treasury 做成复杂财务系统**

这样可以先把已有链上与 backend 数据组织起来，快速提升页面完整度，再决定哪些统计和聚合值得继续沉淀到 backend。
