'use client'
import useUserStore from '@hooks/useUserStore'
import { Dropdown, MenuProps, Tag } from 'antd'
import ConnectWalletButton from '@components/header/ConnectWalletButton'
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
      <div className='flex-center gap-2'>
        <Image
          width={64}
          height={64}
          className='w-16 h-16 rounded-full overflow-hidden'
          src={user.user.avatar!}
          alt='avatar'
        />
        <div className='flex flex-col'>
          <div className='flex items-center'>
            <span className='text-sm cursor-default'>{user.user.nickname}</span>
            {isCommittee && (
              <div className='ml-2'>
                <Tag color='green'>committee</Tag>
              </div>
            )}
          </div>

          <ConnectWalletButton tooltip={true} />
        </div>
      </div>
    </Dropdown>
  )
}

export default HeaderUserAvatar
