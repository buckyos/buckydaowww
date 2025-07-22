import { useState } from 'react'
import { message } from 'antd'
import useUserStore from '@hooks/useUserStore'
import useContractStore from '@hooks/useContract'
import { bindAddress, fetchRepositoryList } from '@services/index'
import { useAsyncEffect } from 'ahooks'
import { ethers } from 'ethers'
import { abis } from '@contracts/abis'
import { useCommitteeStore, CommitteeType } from './useCommittee'
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
  contractService
} from '@contracts/index'

function useBindWalletAddress() {
  const { isConnect, user, updateUser, jwt } = useUserStore((state) => ({
    isConnect: state.isConnect,
    user: state.user,
    updateUser: state.updateUser,
    jwt: state.jwt,
  }))

  const handleConnect = async () => {
    const provider = await getProvider()
    if (!provider) {
      return
    }
    const signer = await provider.getSigner()
    const address = signer.address
    console.log('🍻 address :', address)
    message.success('get user address success')

    const signature = await signer.signMessage(jwt)
    console.log('🍻 signature :', signature, signature.toString())
    const status = await bindAddress(signature, jwt)
    if (status == 200) {
      console.log('🍻 refetch userinfo  ')
      updateUser()
    }
  }

  // ellipsis
  const addressEllipsis = () => {
    const displayed = user.address
    if (displayed.length < 15) {
      return displayed
    }
    return `${displayed.slice(0, 6)}...${displayed.slice(displayed.length - 5)}`
  }

  return {
    isConnect,
    user,
    handleConnect,
    addressEllipsis,
  }
}

function useLockToken(ownerAddress: string) {
  // const tokenAddress = contractService.getAddressOfToken()
  const lockupAddress = contractService.getAddressOfLockup()

  const [token, setToken] = useState<{
    token: number
    assigned: number
    unlocked: number
    locked: number
  }>({
    token: 0,
    assigned: 0,
    unlocked: 0,
    locked: 0,
  })
  useAsyncEffect(async () => {
    if (ownerAddress == '') {
      return
    }
    const contract = await newProviderContract(lockupAddress, abis)
    console.log('🍻 ownerAddress :', ownerAddress)
    const result = await Promise.all([
      contract.totalAssigned(ownerAddress),
      contract.totalUnlocked(ownerAddress),
      contract.totalLocked(ownerAddress),
    ])

    const tokenContract =  await newProviderContract(contractService.getAddressOfDevToken(), abis)
    const result2 = await tokenContract.balanceOf(ownerAddress)
    console.log('🍻 tokenContract token balanceOf :', result2)

    setToken({
      token: result2,
      assigned: result[0],
      unlocked: result[1],
      locked: result[2],
    })
    console.log('🍻 result totalLocked:', result)
  }, [ownerAddress])
  return { token }
}

// 是否是委员会成员
function useCommittee(user: User) {
  const { decimals } = useContractStore((state) => ({
    // getComitteeContract: state.getComitteeContract,
    decimals: state.decimals,
  }))

  const { update, ensureFetched, state } = useCommitteeStore()
  // const [_isCommittee, setIsCommittee] = useState<boolean>(false)
  useAsyncEffect(async () => {
    console.log('useCommittee user', user)
    if (!user.address) {
      // message.error('Please connect wallet first')
      return
    }
    if (ensureFetched()) {
      console.log('useCommittee ensureFetched')
      return
    }

    const contract = await contractService.getCommitteeContract()
    // 需要注意,这里是user表的, 可能和钱包地址不一致
    const isMember = await contract.isMember(user.address)
    console.log('isCommitteeMember: ', isMember, user.address)

    update(isMember ? CommitteeType.committee : CommitteeType.normal)
  }, [user])

  return {
    isCommittee: state === CommitteeType.committee,
    isUnknown: state === CommitteeType.unknown,
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
  useUserStore,
  useGetProjectQuery,
  useCommitteeStore,
  useContractStore,
  getProvider,
  contractProxyContract,
}
