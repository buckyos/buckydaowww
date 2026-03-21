
import { SwapRightOutlined, ReloadOutlined } from '@ant-design/icons'
import TokenTransferModal from '@components/modal/TokenTransferModal'
import React, { useState } from 'react'
import { Tooltip } from 'antd'





const HeaderTokenInfo: React.FC<{
    devTokenAmount: string,
    normalTokenAmount: string,
    reload: () => Promise<void>,
}> = ({ devTokenAmount, normalTokenAmount, reload }) => {
    const [show, setShow] = useState(false)

    return (
        <div className='flex flex-wrap items-center justify-end gap-x-2 gap-y-1 xl:mr-4'>
            <div className='flex flex-wrap items-center justify-end gap-2'>
                <div className='flex items-center gap-1 whitespace-nowrap'>
                    <div>{devTokenAmount ? devTokenAmount : 0}</div>
                    <div className='font-bold text-cyfs-green'>BDDT</div>
                </div>
                <div className='flex items-center'>
                    <SwapRightOutlined className="cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => {
                        setShow(true)
                    }} />

                </div>

                <div className='flex items-center gap-1 whitespace-nowrap'>
                    <div>{normalTokenAmount ? normalTokenAmount : 0}</div>
                    <div className='font-bold text-cyfs-green'>BDT</div>
                </div>
            </div>
            <Tooltip title="Reload the token amount">
                <ReloadOutlined
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                        e.stopPropagation();
                        reload();
                    }}
                />
            </Tooltip>
            <TokenTransferModal showModal={show} setShowModal={setShow} />
        </div>
    )
}

export default HeaderTokenInfo
