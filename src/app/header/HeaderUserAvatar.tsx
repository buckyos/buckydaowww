'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Dropdown, MenuProps, Tag, Tooltip } from 'antd'
import { LogoutOutlined, ContactsOutlined } from '@ant-design/icons'
import ConnectWalletButton from '@components/header/ConnectWalletButton'
import useUserStore from '@hooks/useUserStore'
import { useCommittee, useBindWalletAddress } from '@hooks/index'

const HeaderUserAvatar = () => {
  const user = useUserStore()
  const userBind = useBindWalletAddress()

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
      label: (
        <div className='py-2'>
          <ConnectWalletButton />
        </div>
      ),
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
          width={60}
          height={60}
          className='w-14 h-14 rounded-full overflow-hidden'
          src={user.user.avatar!}
          alt='avatar'
        />
        <div className='flex flex-col gap-2'>
          <div className='flex items-center'>
            <span className='text-lg cursor-default'>
              {user.user.nickname}
            </span>
            {isCommittee && (
              <div className='ml-2'>
                <Tag color='green'>committee</Tag>
              </div>
            )}
          </div>

          {userBind.user.address && (
            <Tooltip title={userBind.user.address}>
              <div className='text-cyfs-green text-sm'>
                {userBind.addressEllipsis()}
              </div>
            </Tooltip>
          )}

          {!userBind.user.address && (
            <div
              className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-6 px-4 rounded-lg cursor-pointer text-sm'
              onClick={() => {
                // setShowModal(true)
                // 先不用弹窗
                userBind.handleConnect()
              }}
            >
              <span className='ml-1'>Connect</span>
            </div>
          )}
        </div>
      </div>
    </Dropdown>
  )
}

export default HeaderUserAvatar
