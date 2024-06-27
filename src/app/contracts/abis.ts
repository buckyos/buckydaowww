import ISourceDaoCommittee from './Interface.sol/ISourceDaoCommittee.json'
import IInvestment from './Interface.sol/IInvestment.json'
import IMarketingGroup from './Interface.sol/IMarketingGroup.json'
import IMultiSigWallet from './Interface.sol/IMultiSigWallet.json'
import ISourceDao from './Interface.sol/ISourceDao.json'
import ISourceDAOToken from './Interface.sol/ISourceDAOToken.json'
import ISourceDAOTokenDividend from './Interface.sol/ISourceDAOTokenDividend.json'
import ISourceDevGroup from './Interface.sol/ISourceDevGroup.json'
import ISourceTokenLockup from './Interface.sol/ISourceTokenLockup.json'
import SourceDaoContractUpgradeable from './Interface.sol/SourceDaoContractUpgradeable.json'
import erc20 from './ERC20.json'

export const abis = [
  ...erc20,
  ...ISourceDaoCommittee,
  ...IInvestment,
  ...IMarketingGroup,
  ...IMultiSigWallet,
  ...ISourceDao,
  ...ISourceDAOToken,
  ...ISourceDAOTokenDividend,
  ...ISourceDevGroup,
  ...ISourceTokenLockup,
  ...SourceDaoContractUpgradeable,
]
