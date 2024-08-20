'use client'
import React, { useState } from 'react'
import useContractStore from '@hooks/useContract'
import { useAsyncEffect } from 'ahooks'
import {
  parseToFloat,
  wrapUnits,
  bigTransformPercentNumber,
} from '@utils/numberConverter'
import { GithubOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import {
  getNetworkId,
  getAddressOfMain,
  getAddressOfToken,
} from '@contracts/index'
import DaoTokenCard from './DaoTokenCard'

import localFont from 'next/font/local'
import { Tooltip } from 'antd'
const font = localFont({
  src: '../../public/RootstockSansHeadline.woff2',
  display: 'swap',
})

export default function DaoTokenBrief() {
  const mainAddress = getAddressOfMain()
  const networkId = getNetworkId()
  const tokenAddress = getAddressOfToken()

  const [symbol, setSymbol] = useState('')
  const [daoTokenCardItems, setDaoTokenCardItems] = useState<
    DaoTokenAmountCardItem[]
  >([
    {
      title: 'Total',
      amount: 0,
    },
    {
      title: 'Destroyed',
      amount: 0,
    },
    {
      title: 'Released',
      amount: 0,
    },
    {
      title: 'Unreleased',
      amount: 0,
    },
  ])
  const contract = useContractStore()

  const transformNumber = (value: any, decimals: any) => {
    return parseToFloat(wrapUnits(value, decimals))
  }

  useAsyncEffect(async () => {
    const token = await contract.fetchToken()
    const totalSupply = transformNumber(token.totalSupply, token.decimals)
    const totalReleased = transformNumber(token.totalReleased, token.decimals)
    const totalUnreleased = transformNumber(
      token.totalUnreleased,
      token.decimals,
    )
    setSymbol(token.symbol)
    setDaoTokenCardItems([
      {
        title: 'Total',
        amount: totalSupply,
      },
      {
        title: 'Destroyed',
        amount: 0,
      },
      {
        title: 'Released',
        amount: totalReleased,
        percent: bigTransformPercentNumber(
          token.totalReleased,
          token.totalSupply,
        ),
      },
      {
        title: 'Unreleased',
        amount: totalUnreleased,
        percent: bigTransformPercentNumber(
          token.totalUnreleased,
          token.totalSupply,
        ),
      },
    ])
  }, [])

  return (
    <div className='flex items-center justify-between md:flex-row md:items-start my-20'>
      <div className='flex flex-col w-[820px]'>
        <div className='text-black-secondary'>Governance of Buckyos</div>
        <div
          className={font.className + ' text-[40px] font-medium leading-[60px]'}
          style={{
            background: 'linear-gradient(to right, black, gray)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          <p>Buckyos is a Cloud OS (Network OS) for everyone.</p>
          <p>
            Its primary design goal is to allow consumers to have their own
            cluster/cloud (we call this cluster Zone).
          </p>
          <p>
            Consumers can install Service in their own Zone just like installing
            App.
          </p>
          <p>
            Based on buckyos, users can have AI Agents that can access all their
            data, devices, and services.
          </p>
        </div>
      </div>
      <div className='grid grid-cols-2 gap-x-4 gap-y-2 xs:grid-cols-1 '>
        {daoTokenCardItems.map((item: DaoTokenAmountCardItem) => (
          <DaoTokenCard item={item} key={item.title} symbol={symbol} />
        ))}
        <div className='col-span-2'>Chain Network:</div>
        <div className='col-span-2 font-bold'>
          {process.env.NEXT_PUBLIC_CHAIN}
          <span className='text-cyfs-gray ml-1'>{networkId}</span>
        </div>
        <div className='col-span-2'>Contract Address:</div>
        <a
          className='col-span-2 font-bold text-black'
          href={`https://polygonscan.com/address/${mainAddress}`}
          target='_blank'
        >
          {mainAddress}
        </a>

        <div className='col-span-2'>
          <span className='mr-1'>Token Address</span>
          <Tooltip title='ERC20 address'>
            <ExclamationCircleOutlined className='text-sm' />:
          </Tooltip>
        </div>
        <a
          className='col-span-2 font-bold text-black'
          href={`https://polygonscan.com/token/${tokenAddress}`}
          target='_blank'
        >
          {tokenAddress}
        </a>
        <a
          className='col-span-2 text-black no-underline flex items-center'
          href='https://github.com/buckyos/SourceDAO/'
          target='_blank'
        >
          Contract Source:
          <span className='text-cyfs-green ml-4'>
            <GithubOutlined className='text-[24px]' />
          </span>
        </a>
      </div>
    </div>
  )
}
