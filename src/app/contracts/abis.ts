import ISourceDaoCommittee from './Interface.sol/ISourceDaoCommittee.json'
import IAcquired from './Interface.sol/IAcquired.json'
import ISourceDao from './Interface.sol/ISourceDao.json'
import ISourceDAODevToken from './Interface.sol/ISourceDAODevToken.json'
import ISourceDAONormalToken from './Interface.sol/ISourceDAONormalToken.json'
import ISourceDAODividend from './Interface.sol/ISourceDAODividend.json'
import ISourceDevGroup from './Interface.sol/ISourceDevGroup.json'
import ISourceTokenLockup from './Interface.sol/ISourceTokenLockup.json'
import SourceDaoContractUpgradeable from './Interface.sol/SourceDaoContractUpgradeable.json'
import ISourceProject from './Interface.sol/ISourceProject.json'
import ProjectManagement from './Interface.sol/ProjectManagement.json'
import erc20 from './ERC20.json'

const abis = [
  ...erc20,
  ...IAcquired,
  ...ISourceDaoCommittee,
  // ...IMarketingGroup,
  // ...IMultiSigWallet,
  ...ISourceDao,
  ...ISourceDAODevToken,
  ...ISourceDAONormalToken,
  ...ISourceDAODividend,
  ...ISourceDevGroup,
  ...ISourceTokenLockup,
  ...SourceDaoContractUpgradeable,
]

export { abis, erc20, ISourceProject, ProjectManagement }
