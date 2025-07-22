import { contractService, newProviderContract } from './contract'
import { erc20 } from './abis'
import ISourceDAODevToken from './Interface.sol/ISourceDAODevToken.json'
import {
    parseToFloat,
    wrapUnits,
    bigTransformPercentNumber,
    formatAmount,
    transformNumber,
} from '@utils/numberConverter'


export async function fetchTokenInfo(): Promise<ContractTokenInfo> {
    // BDT
    const normal = await newProviderContract(contractService.getAddressOfNormalToken(), erc20)
    const token = await Promise.all([
        normal.totalSupply(),
        normal.symbol(),
        normal.decimals(),
    ])

    // BDDT
    const dev = await newProviderContract(contractService.getAddressOfDevToken(), ISourceDAODevToken)
    const devToken = await Promise.all([
        dev.totalSupply(),
        dev.symbol(),
        dev.decimals(),
        dev.totalReleased(),
        dev.balanceOf(contractService.getAddressOfDevToken()),
    ])

    const devTotalSupply = transformNumber(devToken[0], devToken[2])
    const normalTotalSupply = transformNumber(token[0], token[2])

    const devTotalReleased = transformNumber(devToken[3], devToken[2])
    const devTotalReleasedPercent = bigTransformPercentNumber(
        devToken[3],
        devToken[0],
    )


    const devTokenBalancePercent =  bigTransformPercentNumber(
        devToken[4],
        devToken[0],
    )

    return {
        normal: {  // BDT
            totalSupply: normalTotalSupply,
            symbol: token[1],
            decimals: parseInt(token[2]),
        },
        dev: {  // BDDT
            totalSupply: devTotalSupply,
            symbol: devToken[1],
            decimals: parseInt(devToken[2]),
            totalReleased: devTotalReleased,
            totalReleasedPercent: devTotalReleasedPercent,
            unrelease: transformNumber(devToken[4], devToken[2]),
            unreleasePercent: devTokenBalancePercent,

        }
    }
}

