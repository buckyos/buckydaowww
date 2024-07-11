import { useState } from 'react'
import { message } from 'antd'
import useUserStore from '@hooks/useUserStore'
import useContractStore, { getProvider } from '@hooks/useContract'
import { bindAddress, getProjectDetail } from '@services/index'
import { useAsyncEffect } from 'ahooks'
import { ethers } from 'ethers'
import { abis } from '@contracts/abis'
import { useCommitteeStore, CommitteeType } from './useCommittee'

function useBindWalletAddress() {
  const { isConnect, user, updateUser, jwt } = useUserStore((state) => ({
    isConnect: state.isConnect,
    user: state.user,
    updateUser: state.updateUser,
    jwt: state.jwt,
  }))

  const handleConnect = async () => {
    const provider = await getProvider()
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

  return {
    isConnect,
    user,
    handleConnect,
  }
}

function useLockToken(ownerAddress: string) {
  const { lockupAddress, tokenAddress } = useContractStore((state) => {
    return {
      lockupAddress: state.lockupAddress,
      tokenAddress: state.tokenAddress,
    }
  })
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
    let provider = await getProvider()
    const contract = new ethers.Contract(lockupAddress, abis, provider)
    console.log('🍻 ownerAddress :', ownerAddress)
    const result = await Promise.all([
      contract.totalAssigned(ownerAddress),
      contract.totalUnlocked(ownerAddress),
      contract.totalLocked(ownerAddress),
    ])

    const tokenContract = new ethers.Contract(tokenAddress, abis, provider)
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
  const { getComitteeContract, decimals } = useContractStore((state) => ({
    getComitteeContract: state.getComitteeContract,
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

    const contract = await getComitteeContract()
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
    getProjectDetail(id).then((result) => {
      setData(result.data)
      setIsLoading(false)
    })
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
}
