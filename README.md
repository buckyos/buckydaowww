# OpenDAN DAO

## 运行脚本

### 安装依赖

```
npm i
```

### 开发运行

```
npm start
```

### 生产构建

```
npm run build
```

## 概念说明

### Wallet Channel

指代`MetaMask`、`WalletConnect`等第三方`EIP1193`钱包，为避免与`ethers`内部的 Wallet 概念冲突，本项目使用`Channel`指代

### OriginalProvider

指代`MetaMask`、`WalletConnect`等第三方`EIP1193`钱包内部原始的操作对象。

比如:

`MetaMask`对应的是`window.ethereum`；

`WalletConnect`对应的是`EthereumProvider`。

### Provider

同`ethers`的`Provider`

### Signer

同`ethers`的`Signer`
