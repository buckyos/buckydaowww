
import { RightOutlined } from '@ant-design/icons'
import TokenTransferModal from '@components/modal/TokenTransferModal'
import { useState } from 'react'






const HeaderTokenTransferIcon = () => {
    const [show, setShow] = useState(false)

    return (
        <div>
            <RightOutlined className="cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => {
                setShow(true)
            }} />

            <TokenTransferModal showModal={show} setShowModal={setShow}/>
        </div>
    )
}

export default HeaderTokenTransferIcon