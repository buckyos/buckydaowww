'use client'
import { useState } from 'react'
import useUserStore from '@hooks/useUserStore'
import HeaderUserAvatar from './HeaderUserAvatar'
import { useAsyncEffect } from 'ahooks'
import { contractService } from '@contracts/index'
import { formatUnits } from 'ethers'
import { Tag, Spin } from 'antd'

const HeaderUserInfo = () => {
    const user = useUserStore()
    const [loading, setLoading] = useState<boolean>(false)
    const [devTokenAmount, setDevTokenAmount] = useState<string>('')
    const [normalTokenAmount, setNormalTokenAmount] = useState<string>('')

    const reload = async () => {
        if (user.user.address) {
            setLoading(true)
            const devToken = await contractService.getDevTokenContract()
            const normalToken = await contractService.getNormalTokenContract()
            const token = await Promise.all([
                devToken.balanceOf(user.user.address),
                normalToken.balanceOf(user.user.address)
            ])
            console.log('token', token)
            setDevTokenAmount(parseFloat(formatUnits(token[0], 18)).toFixed(2))
            setNormalTokenAmount(parseFloat(formatUnits(token[1], 18)).toFixed(2))
            setLoading(false)
        }
    }

    useAsyncEffect(async () => {
        await reload()
    }, [user])


    function TokenInfo() {
        return (
            <div className='flex-center flex-col gap-2'>
                <div>
                    <div>{devTokenAmount ? devTokenAmount : 0}</div>
                    <Tag>BDDT</Tag>
                </div>
                <div>
                    <div>{normalTokenAmount ? normalTokenAmount : 0}</div>
                    <Tag>BDT</Tag>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className='flex-center gap-2'>
                <div className='flex-center' onClick={() => reload()}>
                    {loading && <Spin size='small' />}
                    {!loading && <TokenInfo />}
                </div>
                <HeaderUserAvatar />
            </div>
        </>
    )
}


export default HeaderUserInfo