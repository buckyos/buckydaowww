import React from 'react'
import { GithubOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import {
  contractService,
} from '@contracts/index'
import DaoTokenCard from '@components/home/DaoTokenCard'

import localFont from 'next/font/local'
import { Tag, Tooltip } from 'antd'
const font = localFont({
  src: '../../../public/RootstockSansHeadline.woff2',
  display: 'swap',
})

export default function DaoTokenBrief() {
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
        <DaoTokenCard />
        <div className='col-span-2 font-bold'>Chain Network:</div>
        <div className='col-span-2 '>
          {process.env.NEXT_PUBLIC_CHAIN}
          <Tag className='text-cyfs-gray ml-4'> NetworkID {process.env.NEXT_PUBLIC_NETWORK_ID}</Tag>
        </div>
        <div className='col-span-2 font-bold'>Contract Address:</div>
        <a
          className='col-span-2 font-bold text-gray-500'
          href={`${process.env.NEXT_PUBLIC_ADDRESS_LINK}${contractService.getAddressOfMain()}`}
          target='_blank'
        >
          {contractService.getAddressOfMain()}
        </a>

        <div className='col-span-2'>
          <span className='mr-1 font-bold'>NormalToken Address</span>
          <Tooltip title='ERC20 address'>
            <ExclamationCircleOutlined className='text-sm' />:
          </Tooltip>
        </div>
        <a
          className='col-span-2 font-bold text-gray-500'
          href={`${process.env.NEXT_PUBLIC_TOKEN_ADDRESS_LINK}${contractService.getAddressOfNormalToken()}`}
          target='_blank'
        >
          {contractService.getAddressOfNormalToken()}
        </a>
        <div className='col-span-2'>
          <span className='mr-1 font-bold'>DevToken Address</span>
          <Tooltip title='ERC20 address'>
            <ExclamationCircleOutlined className='text-sm' />:
          </Tooltip>
        </div>
        <a
          className='col-span-2 font-bold text-gray-500'
          href={`${process.env.NEXT_PUBLIC_TOKEN_ADDRESS_LINK}${contractService.getAddressOfDevToken()}`}
          target='_blank'
        >
          {contractService.getAddressOfDevToken()}
        </a>
        <a
          className='col-span-2 text-black no-underline flex items-center font-bold'
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
