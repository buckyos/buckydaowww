import { useEffect, useState } from 'react'
import { message } from 'antd'
import useUserStore from '@hooks/useUserStore'
import useContractStore from '@hooks/useContract'
import { bindAddress, fetchRepositoryList } from '@services/index'
import { useAsyncEffect } from 'ahooks'
import { abis } from '@contracts/abis'
import { CommitteeType } from './useCommittee'
import { useWalletStore } from './useWallet'
import {
  // getProvider,
  // getProjectContract,
  contractProxyContract,
} from './function'
import {
  // getCommitteeContract,
  // getAddressOfLockup,
  // getAddressOfToken,
  newProviderContract,
  getProvider,
  contractService,
  getInjectedWalletState,
  subscribeWalletChanges,
} from '@contracts/index'

function ellipsisAddress(address: string) {
  if (!address) {
    return ''
  }

  if (address.length < 15) {
    return address
  }

  return `${address.slice(0, 6)}...${address.slice(address.length - 5)}`
}

function useWalletAddress() {
  const activeAddress = useWalletStore((state) => state.activeAddress)
  const chainId = useWalletStore((state) => state.chainId)
  const hasWallet = useWalletStore((state) => state.hasWallet)
  const initialized = useWalletStore((state) => state.initialized)
  const updateWalletState = useWalletStore((state) => state.updateWalletState)
  const resetWalletState = useWalletStore((state) => state.resetWalletState)

  useEffect(() => {
    let disposed = false

    const refreshWalletState = async () => {
      try {
        const walletState = await getInjectedWalletState()
        if (disposed) {
          return
        }

        updateWalletState({
          ...walletState,
          initialized: true,
        })
      } catch (error) {
        console.warn('refresh wallet state failed', error)
        if (!disposed) {
          resetWalletState()
        }
      }
    }

    void refreshWalletState()
    const unsubscribe = subscribeWalletChanges(() => {
      void refreshWalletState()
    })

    return () => {
      disposed = true
      unsubscribe()
    }
  }, [resetWalletState, updateWalletState])

  return {
    activeAddress,
    chainId,
    hasWallet,
    initialized,
    hasActiveWallet: !!activeAddress,
    addressEllipsis: (address = activeAddress) => ellipsisAddress(address),
  }
}

function useBindWalletAddress() {
  const { isConnect, user, updateUser, jwt } = useUserStore((state) => ({
    isConnect: state.isConnect,
    user: state.user,
    updateUser: state.updateUser,
    jwt: state.jwt,
  }))
  const { activeAddress, hasActiveWallet, hasWallet, initialized, chainId } =
    useWalletAddress()
  const updateWalletState = useWalletStore((state) => state.updateWalletState)
  const isLocalChainMode = process.env.NEXT_PUBLIC_NETWORK_ID === '31337'

  const handleConnectWallet = async () => {
    const provider = await getProvider()
    if (!provider) {
      return
    }
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const network = await provider.getNetwork()
    updateWalletState({
      activeAddress: address,
      chainId: network.chainId.toString(),
      hasWallet: true,
      initialized: true,
    })
    message.success('Wallet connected')
  }

  const handleBindWallet = async () => {
    if (isLocalChainMode) {
      message.info('Local chain mode does not require wallet binding')
      return
    }

    if (!jwt || !user.nickname) {
      message.error('Please login with GitHub first')
      return
    }

    const provider = await getProvider()
    if (!provider) {
      return
    }
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const signature = await signer.signMessage(jwt)
    const status = await bindAddress(signature, jwt)
    if (status == 200) {
      await updateUser()
      message.success('Wallet bound successfully')
    }

    const network = await provider.getNetwork()
    updateWalletState({
      activeAddress: address,
      chainId: network.chainId.toString(),
      hasWallet: true,
      initialized: true,
    })
  }

  const boundAddress = user.address
  const displayAddress = activeAddress || boundAddress
  const governanceAddress = activeAddress || boundAddress
  const isAddressMismatch =
    !!activeAddress &&
    !!boundAddress &&
    activeAddress.toLowerCase() !== boundAddress.toLowerCase()
  const canBindWallet = !isLocalChainMode && !!jwt && hasActiveWallet
  const shouldShowBindWalletAction = canBindWallet && (!boundAddress || isAddressMismatch)
  const bindWalletLabel = boundAddress ? 'Rebind wallet' : 'Bind wallet'

  return {
    isConnect: () => hasActiveWallet || isConnect(),
    user,
    boundAddress,
    activeAddress,
    displayAddress,
    governanceAddress,
    hasWallet,
    initialized,
    chainId,
    hasActiveWallet,
    hasBoundAddress: !!boundAddress,
    isAddressMismatch,
    isLocalChainMode,
    canBindWallet,
    shouldShowBindWalletAction,
    bindWalletLabel,
    handleConnectWallet,
    handleBindWallet,
    handleConnect: handleConnectWallet,
    addressEllipsis: (address = displayAddress) => ellipsisAddress(address),
  }
}

function useLockToken(ownerAddress: string) {
  // const tokenAddress = contractService.getAddressOfToken()
  const lockupAddress = contractService.getAddressOfLockup()

  const [token, setToken] = useState<{
    token: bigint
    assigned: bigint
    claimed: bigint
    locked: bigint
  }>({
    token: 0n,
    assigned: 0n,
    claimed: 0n,
    locked: 0n,
  })
  useAsyncEffect(async () => {
    if (ownerAddress == '') {
      return
    }
    const contract = await newProviderContract(lockupAddress, abis)
    console.log('🍻 ownerAddress :', ownerAddress)
    const [totalAssignedRaw, totalClaimedRaw] = await Promise.all([
      contract.totalAssigned(ownerAddress),
      contract.totalClaimed(ownerAddress),
    ])
    const totalAssigned = BigInt(totalAssignedRaw.toString())
    const totalClaimed = BigInt(totalClaimedRaw.toString())

    const tokenContract =  await newProviderContract(contractService.getAddressOfDevToken(), abis)
    const tokenBalance = BigInt((await tokenContract.balanceOf(ownerAddress)).toString())
    const locked: bigint = totalAssigned > totalClaimed
      ? totalAssigned - totalClaimed
      : 0n
    console.log('🍻 tokenContract token balanceOf :', tokenBalance)

    setToken({
      token: tokenBalance,
      assigned: totalAssigned,
      claimed: totalClaimed,
      locked,
    })
    console.log('🍻 lockup totals:', { totalAssigned, totalClaimed, locked })
  }, [ownerAddress])
  return { token }
}

// 是否是委员会成员
function useCommittee(address: string) {
  const { decimals } = useContractStore((state) => ({
    decimals: state.decimals,
  }))
  const [state, setState] = useState(CommitteeType.unknown)

  useAsyncEffect(async () => {
    if (!address) {
      setState(CommitteeType.unknown)
      return
    }

    setState(CommitteeType.unknown)

    try {
      const contract = await contractService.getReadonlyCommitteeContract()
      const isMember = await contract.isMember(address)
      setState(isMember ? CommitteeType.committee : CommitteeType.normal)
    } catch (error) {
      console.warn('useCommittee failed', error)
      setState(CommitteeType.unknown)
    }
  }, [address])

  return {
    isCommittee: state === CommitteeType.committee,
    isUnknown: state === CommitteeType.unknown,
    checkedAddress: address,
    decimals,
  }
}

// 查询项目详情
function useGetProjectQuery(id: string) {
  // state
  const [data, setData] = useState<ProjectItem>()
  const [isLoading, setIsLoading] = useState(true)
  //  const [error, setError] = useState<Error>()
  useAsyncEffect(async () => {
    // 没有单独的项目详情接口,
    // 需要先获取项目列表,然后再找到对应的项目
    const result = await fetchRepositoryList()
    if (result.code == 0) {
      const project = result.data
        .map((item) => {
          return JSON.parse(item.detail) as ProjectItem
        })
        .find((item) => item.id == id)
      if (project) {
        setData(project)
      }
    }
    setIsLoading(false)
  }, [])

  return { data, isLoading }
}

export {
  useLockToken,
  useCommittee,
  useBindWalletAddress,
  useWalletAddress,
  useUserStore,
  useGetProjectQuery,
  useContractStore,
  getProvider,
  contractProxyContract,
}
