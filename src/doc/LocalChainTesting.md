# 本地链交互联调说明

## 目标

这份文档用于说明如何用：

- `SourceDAO` 的本地 `hardhat node`
- 浏览器钱包（MetaMask / OKX Wallet）
- `buckydaowww/src` 前端

完成“链交互层”的本地联调。

这里的“链交互层”主要指：

- 浏览器钱包检测与连接
- 当前活动钱包地址同步
- committee 身份识别
- 只读合约数据读取
- 交易型入口对活动钱包的要求

不包括完整业务后端联调。  
像下面这些仍然依赖后端接口：

- GitHub 登录
- `/api/user/info`
- `/api/user/bind`
- proposal / repo / investment 列表和 metadata

---

## 本地测试模式说明

为了让“链交互层”测试不再被 GitHub OAuth 阻塞，前端现在支持一个**仅限本地链**的测试模式：

- 当 `NEXT_PUBLIC_NETWORK_ID === '31337'` 时
- Header 右上角会直接进入钱包/链交互模式
- 不再要求先完成 GitHub 登录

这条逻辑的目的只是方便本地手工验证：

- 钱包连接
- 当前活动地址
- committee 身份切换
- Header token 余额
- `/user/info` 的 lockup 信息
- 交易入口的 signer / 权限拦截

这**不是生产逻辑**，也不应用于测试网或正式网络。

换句话说：

- `31337 / Hardhat Local`：允许跳过 GitHub 登录，直接测钱包和链
- 其他网络：仍然按原本的登录流程，需要 GitHub 登录 + 后端用户态

---

## 1. 启动本地 Hardhat 节点

在 `SourceDAO` 目录执行：

```bash
bash -lc 'source "$HOME/.nvm/nvm.sh" && npm run node:local'
```

默认会监听：

- RPC: `http://127.0.0.1:8545`
- Chain ID: `31337`

启动后，终端会打印一组测试账户和私钥。  
后面需要把其中几个私钥导入浏览器钱包。

---

## 2. 部署一套前端可用的本地合约

在另一个终端里，仍然进入 `SourceDAO` 目录：

```bash
bash -lc 'source "$HOME/.nvm/nvm.sh" && npm run deploy:frontend-local'
```

如果希望部署完成后自动把前端 `.env.local` 写到默认位置
`/home/bucky/work/buckydaowww/src/.env.local`，可以直接使用：

```bash
bash -lc 'source "$HOME/.nvm/nvm.sh" && npm run deploy:frontend-local:write'
```

也支持显式控制输出路径：

```bash
bash -lc 'source "$HOME/.nvm/nvm.sh" && FRONTEND_ENV_OUTPUT=../buckydaowww/src/.env.local npm run deploy:frontend-local'
```

说明：

- `hardhat run` 本身不会透传自定义 CLI 参数，所以不推荐直接在 `hardhat run ... -- ...` 后面拼自定义 flag。
- 当前推荐的控制方式是：
  - 默认写入：`npm run deploy:frontend-local:write`
  - 自定义路径：`FRONTEND_ENV_OUTPUT=... npm run deploy:frontend-local`

脚本会部署一套最小 SourceDAO 组件：

- `SourceDao`
- `Committee`
- `Project`
- `DevToken`
- `NormalToken`
- `Lockup`
- `Dividend`
- `Acquired`

并输出一段可直接复制到前端 `.env.local` 的配置。

同时会预置一组便于手工联调的链上状态：

- `deployer / committee member 1`
- `committee member 2`
- `committee member 3`
- `viewer / token holder`
- `viewer` 预置 `BDT` 余额
- `viewer` 预置一条未解锁的 `lockup`
- `viewer` 预置一笔来自已完成项目的 `DevToken` 奖励

这样前端一启动，就可以直接看到：

- Header 的 `DevToken / BDT` 余额
- `/user/info` 的 `Assigned / Claimed / Remaining Locked`
- committee 身份在不同钱包之间切换

脚本文件位置：

- [deploy_frontend_local.ts](/home/bucky/work/SourceDAO/scripts/deploy_frontend_local.ts)

---

## 3. 配置前端 `.env.local`

如果你没有使用自动写入模式，就需要在 `buckydaowww/src` 目录手动新建 `.env.local`，把上一步输出的内容复制进去。

最小需要这些字段：

```env
NEXT_PUBLIC_CHAIN='Hardhat Local'
NEXT_PUBLIC_NETWORK_ID='31337'
NEXT_PUBLIC_RPC_URL='http://127.0.0.1:8545'
NEXT_PUBLIC_MAIN='0x...'
NEXT_PUBLIC_COMMITTEE='0x...'
NEXT_PUBLIC_DEV_TOKEN='0x...'
NEXT_PUBLIC_NORMAL_TOKEN='0x...'
NEXT_PUBLIC_ACQUIRED='0x...'
NEXT_PUBLIC_LOCKUP='0x...'
NEXT_PUBLIC_DIVIDEND='0x...'
NEXT_PUBLIC_PROJECT='0x...'
```

说明：

- `NEXT_PUBLIC_SERVER` 可以暂时沿用现有后端地址，或指向你自己的本地后端
- 如果这轮只测链交互层，没有后端也可以先测一部分 UI

---

## 4. 在浏览器钱包中添加本地网络

在 MetaMask / OKX Wallet 中手动添加：

- Network name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

然后把 `hardhat node` 输出的测试私钥导入进去。

建议至少导入两个：

1. 部署者 / committee member
2. 普通 token holder

部署脚本输出里会标明它们对应的地址用途。

---

## 5. 启动前端

在 `buckydaowww/src` 目录执行：

```bash
npm i
npm run dev
```

如果只想确认构建不报错，也可以：

```bash
npm run build
```

---

## 6. 推荐的链交互测试清单

### A. 钱包连接和地址状态

重点页面：

- Header
- `/user/info`

检查点：

1. 未连接钱包时，显示 `Connect`
2. 连接钱包后，Header 显示当前活动钱包地址
3. `/user/info` 中可以区分：
   - `bound wallet`
   - `active wallet`
4. 当切换钱包账户时：
   - 地址显示应更新
   - committee 身份应重新计算
   - token 余额应重新读取
   - `viewer` 应显示预置的 `DevToken / BDT / lockup`

### B. Committee 身份和权限 UI

重点页面：

- Header committee tag
- `/funding`
- `/invest`
- proposal 创建按钮区域

检查点：

1. 使用 committee member 钱包时，应识别为 committee
2. 切到普通 token holder 后，committee tag 应消失
3. committee-only 入口应随地址切换而变化
4. 未连接钱包时，不应继续假装拥有 committee 权限

推荐测试账户切换顺序：

1. `deployer / committee member 1`
2. `committee member 2`
3. `viewer / token holder`

### C. 只读链上数据

重点页面：

- Header token info
- `/user/info`

检查点：

1. 不发交易时，页面应通过 readonly RPC 正常读取数据
2. Header token balance 应按当前显示地址刷新
3. `Assigned / Claimed / Remaining Locked` 应能正常读取
4. `viewer` 账户下建议确认：
   - `DevToken` 有项目奖励余额
   - `BDT` 有普通余额
   - `Assigned Lockup > 0`
   - `Claimed Lockup = 0`

### D. 交易入口

重点页面：

- proposal execute
- proposal create
- whitelist investment modal
- investment subscription modal

检查点：

1. 未连接当前活动钱包时，应直接拦截
2. 已连接钱包但身份不满足时，应给出正确错误提示
3. 切换钱包后，再次点击时应使用新的 signer

---

## 7. 当前已知限制

1. proposal 列表、proposal 详情、repo 列表等页面仍依赖后端 API
2. `bind wallet` 仍依赖登录态和 `/api/user/bind`
3. 这套本地链联调主要覆盖“钱包 + 链状态 + 交易入口”
4. [user/info/page.tsx](/home/bucky/work/buckydaowww/src/app/(pages)/user/info/page.tsx) 仍有一个已有的 `<img>` lint warning，不影响链交互验证

---

## 8. 建议的联调顺序

推荐按这个顺序做：

1. Header 钱包状态
2. `/user/info` 地址拆分显示
3. committee 身份随切账号变化
4. Header token balance 和 lockup 数据刷新
5. proposal / invest / funding 的交易型入口拦截

等这层稳定后，再继续接后端去做：

- proposal metadata
- GitHub 登录
- wallet bind
- 完整 proposal 创建 / 投票 / 执行

---

## 9. 推荐的本轮手工 smoke 路径

如果只想先快速确认“链交互层”是否正常，建议按下面顺序点击：

1. 用 `viewer / token holder` 打开首页，确认 Header 余额出现
2. 进入 `/user/info`，确认 `active wallet`、`DevToken`、`Assigned Lockup`
3. 切到 `committee member 1`，确认 Header 出现 `committee`
4. 再切回 `viewer`，确认 `committee` 标记消失
5. 打开带交易入口的页面，确认未连接或错误身份时的拦截提示符合预期
