'use client'
import { WalletOutlined } from '@ant-design/icons'
import { useBindWalletAddress } from '@hooks/index'

const ConnectWalletButton: React.FC<{ tips?: string }> = () => {
  const { isConnect, user, handleConnect } = useBindWalletAddress()
  const encryptedUserDisplayed = () => {
    const displayed = user.address
    if (displayed.length < 15) {
      return displayed
    }
    return `${displayed.slice(0, 6)}...${displayed.slice(displayed.length - 5)}`
  }

  return (
    <>
      <div className='flex items-center py-2 w-42'>
        <WalletOutlined className='mr-2' />
        <span className='mr-4'>wallet</span>
        {isConnect() ? (
          <div className='flex items-center gap-2'>
            <div className='text-cyfs-green'>{encryptedUserDisplayed()}</div>
          </div>
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
