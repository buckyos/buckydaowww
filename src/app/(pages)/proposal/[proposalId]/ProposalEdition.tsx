
'use client'
import { useState } from 'react'
import { Button, Progress, Tag, message } from 'antd'
import UpdateProposalModal from '@components/proposal/UpdateProposalModal'

const ProposalEdition: React.FC<{
    isEdit: boolean,
    fetchData: () => Promise<ProposalResponseData>
}> = ({ isEdit, fetchData }) => {
    const [showEditModal, setShowEditModal] = useState(false)
    return (
        <>
            {isEdit && <Button onClick={() => setShowEditModal(true)}>Edit</Button>}
            <UpdateProposalModal
                visible={showEditModal}
                setVisible={setShowEditModal}
                fetchData={fetchData}
            />
        </>
    )
}

export default ProposalEdition