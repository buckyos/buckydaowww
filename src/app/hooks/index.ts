import { useEffect, useState } from 'react'
import { message } from 'antd'
import useUserStore from '@hooks/useUserStore'
import useContractStore from '@hooks/useContract'
import { bindAddress, devLogin, fetchRepositoryList } from '@services/index'
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

let localDevLoginPromise: Promise<boolean> | null = null

function normalizeAddress(address?: string) {
  return address?.trim().toLowerCase() || ''
}

async function loginWithLocalDevSession(): Promise<boolean> {
  if (localDevLoginPromise) {
    return localDevLoginPromise
  }

  localDevLoginPromise = (async () => {
    const provider = await getProvider()
    if (!provider) {
      message.error('Please connect your browser wallet first')
      return false
    }

    try {
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      useWalletStore.getState().updateWalletState({
        activeAddress: address,
        chainId: network.chainId.toString(),
        hasWallet: true,
        initialized: true,
      })

      const result = await devLogin(address)
      if (result.code !== 0 || !result.data) {
        message.error(result.msg || 'Local dev login failed')
        return false
      }

      const store = useUserStore.getState()
      store.updateJwt(result.data)
      const code = await store.updateUser()
      if (code !== 0 || !useUserStore.getState().isLogin()) {
        store.logout()
        message.error('Local dev login failed')
        return false
      }

      const normalizedActiveAddress = normalizeAddress(address)
      const normalizedBoundAddress = normalizeAddress(useUserStore.getState().user.address)

      if (normalizedBoundAddress && normalizedBoundAddress === normalizedActiveAddress) {
        return true
      }

      const signature = await signer.signMessage(result.data)
      const bindStatus = await bindAddress(signature, result.data)
      if (bindStatus !== 200) {
        store.logout()
        message.error('Local wallet bind failed')
        return false
      }

      const refreshCode = await store.updateUser()
      const refreshedBoundAddress = normalizeAddress(useUserStore.getState().user.address)
      if (
        refreshCode !== 0 ||
        refreshedBoundAddress !== normalizedActiveAddress ||
        !useUserStore.getState().isLogin()
      ) {
        store.logout()
        message.error('Local wallet bind failed')
        return false
      }

      return true
    } catch (error) {
      useUserStore.getState().logout()
      console.warn('local dev login failed', error)
      message.error('Local dev login failed')
      return false
    }
  })().finally(() => {
    localDevLoginPromise = null
  })

  return localDevLoginPromise
}

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
  const { isConnect, user, updateUser, jwt, expiration } = useUserStore((state) => ({
    isConnect: state.isConnect,
    user: state.user,
    updateUser: state.updateUser,
    jwt: state.jwt,
    expiration: state.expiration,
  }))
  const { activeAddress, hasActiveWallet, hasWallet, initialized, chainId } =
    useWalletAddress()
  const updateWalletState = useWalletStore((state) => state.updateWalletState)
  const isLocalChainMode = process.env.NEXT_PUBLIC_NETWORK_ID === '31337'

  const handleConnectWallet = async () => {
    const provider = await getProvider()
    if (!provider) {
      return false
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
    return true
  }

  const handleLocalLogin = async () => {
    if (!isLocalChainMode) {
      return false
    }

    if (!hasActiveWallet) {
      const connected = await handleConnectWallet()
      if (!connected) {
        return false
      }
    }

    return loginWithLocalDevSession()
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
  const normalizedActiveAddress = normalizeAddress(activeAddress)
  const normalizedBoundAddress = normalizeAddress(boundAddress)
  const isAddressMismatch =
    !!normalizedActiveAddress &&
    !!normalizedBoundAddress &&
    normalizedActiveAddress !== normalizedBoundAddress
  const isAuthenticated = !!jwt && !!user.nickname && Date.now() <= expiration
  const sessionState = isAuthenticated
    ? 'authenticated'
    : hasActiveWallet
      ? 'anonymous'
      : 'disconnected'
  const canBindWallet = !isLocalChainMode && !!jwt && hasActiveWallet
  const shouldShowBindWalletAction = canBindWallet && (!boundAddress || isAddressMismatch)
  const bindWalletLabel = boundAddress ? 'Rebind wallet' : 'Bind wallet'

  const ensureAuthenticated = async ({
    requireWallet = false,
  }: {
    requireWallet?: boolean
  } = {}) => {
    if (requireWallet && !hasActiveWallet) {
      message.error('Please connect your browser wallet first')
      return false
    }

    if (sessionState === 'authenticated') {
      if (isAddressMismatch) {
        message.error('Active wallet differs from the authenticated address')
        return false
      }

      return true
    }

    if (sessionState === 'anonymous') {
      message.error('error: please login first')
      return false
    }

    if (isLocalChainMode) {
      message.error('Please connect your browser wallet and login first')
      return false
    }

    message.error('error: please login first')
    return false
  }

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
    isAuthenticated,
    sessionState,
    canBindWallet,
    shouldShowBindWalletAction,
    bindWalletLabel,
    ensureAuthenticated,
    handleConnectWallet,
    handleLocalLogin,
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
