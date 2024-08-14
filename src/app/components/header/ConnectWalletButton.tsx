'use client'
import { WalletOutlined } from '@ant-design/icons'
import { useBindWalletAddress } from '@hooks/index'
import { Tooltip } from 'antd'

const ConnectWalletButton: React.FC<{}> = ({}) => {
  const { isConnect, user, handleConnect, addressEllipsis } =
    useBindWalletAddress()

  const address = (
    <div className='flex items-center gap-2'>
      <Tooltip title={user.address}>
        <div className='text-cyfs-green'>{addressEllipsis()}</div>
      </Tooltip>
    </div>
  )

  return (
    <>
      <div className='flex items-center w-42'>
        <WalletOutlined className='mr-1' />
        <span className='mr-4'>wallet</span>
        {isConnect() ? (
          address
        ) : (
          <div
            className='flex-center bg-cyfs-green hover:bg-cyfs-green2 text-white h-6 px-4 rounded-lg cursor-pointer text-sm'
            onClick={() => {
              // setShowModal(true)
              // 先不用弹窗
              handleConnect()
            }}
          >
            <span className='ml-1'>Connect</span>
          </div>
        )}
      </div>
    </>
  )
}

export default ConnectWalletButton
