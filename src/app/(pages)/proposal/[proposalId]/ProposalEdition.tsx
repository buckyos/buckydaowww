
'use client'
import { useState } from 'react'
import { Button } from 'antd'
import UpdateProposalModal from '@components/proposal/UpdateProposalModal'
import RetryMetadataButton from './RetryMetadataButton'

const ProposalEdition: React.FC<{
    proposal: ProposalResponseData,
    isEdit: boolean,
    fetchData: () => Promise<ProposalResponseData>
}> = ({ proposal, isEdit, fetchData }) => {
    const [showEditModal, setShowEditModal] = useState(false)
    return (
        <>
            <div className='flex gap-2'>
                <RetryMetadataButton proposal={proposal} fetchData={fetchData} />
                {isEdit && <Button onClick={() => setShowEditModal(true)}>Edit</Button>}
            </div>
            <UpdateProposalModal
                visible={showEditModal}
                setVisible={setShowEditModal}
                fetchData={fetchData}
            />
        </>
    )
}

export default ProposalEdition
