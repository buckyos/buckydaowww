'use client'
import useUserStore from '@hooks/useUserStore'
import { Dropdown, MenuProps, Tag } from 'antd'
import ConnectWalletButton from './ConnectWalletButton'
import { LogoutOutlined, ContactsOutlined } from '@ant-design/icons'
import Link from 'next/link'
import Image from 'next/image'
import { useCommittee } from '@hooks/index'

const HeaderUserAvatar = () => {
  const user = useUserStore()
  const { isCommittee } = useCommittee(user.user)

  const items: MenuProps['items'] = [
    {
      label: (
        <Link className='flex items-center' href='/user/info'>
          <ContactsOutlined className='mr-2' />
          userinfo
        </Link>
      ),
      key: 'userinfo',
    },

    {
      label: <ConnectWalletButton />,
      key: 'wallet',
    },
    {
      label: (
        <div
          className='flex items-center py-2'
          onClick={() => {
            user.logout()
          }}
        >
          <LogoutOutlined className='mr-2' />
          logout
        </div>
      ),
      key: 'logout',
    },
  ]

  return (
    <Dropdown menu={{ items }} placement='bottomRight' arrow>
      <div className='flex-center'>
        <Image
          width={32}
          height={32}
          className='w-8 h-8 rounded-full overflow-hidden'
          src={user.user.avatar!}
          alt='avatar'
        />
        <span className='ml-2 text-sm cursor-default'>
          {user.user.nickname}
        </span>
        {isCommittee && (
          <div className='ml-2'>
            <Tag color='green'>committee</Tag>
          </div>
        )}
      </div>
    </Dropdown>
  )
}

export default HeaderUserAvatar
