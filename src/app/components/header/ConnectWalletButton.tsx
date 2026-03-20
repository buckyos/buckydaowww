'use client'
import { WalletOutlined } from '@ant-design/icons'
import { useBindWalletAddress } from '@hooks/index'
import { Tooltip } from 'antd'

const ConnectWalletButton: React.FC<{}> = ({}) => {
  const {
    hasActiveWallet,
    activeAddress,
    boundAddress,
    handleConnect,
    addressEllipsis,
    isAddressMismatch,
  } =
    useBindWalletAddress()

  const address = (
    <div className='flex flex-col gap-1'>
      <Tooltip title={activeAddress || boundAddress}>
        <div className='text-cyfs-green'>{addressEllipsis(activeAddress || boundAddress)}</div>
      </Tooltip>
      {isAddressMismatch && (
        <div className='text-amber-500 text-xs'>Bound address differs</div>
      )}
    </div>
  )

  return (
    <>
      <div className='flex items-center w-42'>
        <WalletOutlined className='mr-2' />
        <span className='mr-4'>wallet</span>
        {hasActiveWallet ? (
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
