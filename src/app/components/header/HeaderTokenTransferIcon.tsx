
import { SwapOutlined } from '@ant-design/icons'
import TokenTransferModal from '@components/modal/TokenTransferModal'
import { useState } from 'react'






const HeaderTokenTransferIcon = () => {
    const [show, setShow] = useState(false)

    return (
        <div>
            <SwapOutlined style={{ fontSize: '20px' }} onClick={() => {
                setShow(true)
            }} />

            <TokenTransferModal showModal={show} setShowModal={setShow}/>
        </div>
    )
}

export default HeaderTokenTransferIcon