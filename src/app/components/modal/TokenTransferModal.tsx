import { Dispatch, SetStateAction, useState } from 'react'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, Input, Button, message, Spin } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import useUserStore from '@hooks/useUserStore'
import { extractMessage, transactionWait } from '@utils/index'
import { proposalSetExtraAndParams } from '@services/index'
import { contractService } from '@contracts/index'
import { parseUnits } from 'ethers'
import useContractStore from '@hooks/useContract'

const TokenTransferModal: React.FC<{
    showModal: boolean
    setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const user = useUserStore()
    const { decimals } = useContractStore((state => ({ decimals: state.decimals })))

    const onTransfer = async (values: StoreValue) => {
        console.log('🍻 values :', values)
        setIsSubmitting(true)
        const fn = async () => {
            const devToken = await contractService.getDevTokenContract()
            // const decimals = await getDecimals(daoTokenAddress)
            const devTokenAmount = parseUnits(values.devTokenAmount.toString(), decimals)
            {
                const tx = await devToken.approve(
                    contractService.getAddressOfNormalToken(),
                    devTokenAmount,
                )
                const receipt = await transactionWait(tx)
                if (receipt?.status !== 1) {
                    console.warn('transaction status:', receipt?.status, tx)
                    message.error(
                        `transfer token approve failed[3][${receipt?.status}]`,
                    )
                    return
                }
            }
            {
                const tx = await devToken.dev2normal(devTokenAmount)
                const receipt = await transactionWait(tx)
                if (receipt?.status !== 1) {
                    console.warn('transaction status:', receipt?.status, tx)
                    message.error(
                        `transfer token failed[3][${receipt?.status}]`,
                    )
                    return
                }
            }

            message.success("transfer BDDT to BDT success")
        }

        try {
            await fn()
        } catch (e) {
            let msg = extractMessage(e)
            message.error(`transfer token failed[1][${msg}]`, 10)
        }

        setIsSubmitting(false)
    }

    return (
        <Modal
            title='Transfer your BDDT to BDT'
            open={showModal}
            onCancel={() => {
                setShowModal(false)
            }}
            footer={null}
        >
            <Spin tip='Waiting for confirmation...' spinning={isSubmitting}>
                <Form
                    onFinish={onTransfer}
                    className='mt-6'
                    name=''
                    style={{ width: '100%' }}
                    autoComplete='off'
                >
                    <Form.Item
                        name='devTokenAmount'
                        rules={[
                            {
                                required: true,
                                message: 'BDDT amount is required ',
                            },
                        ]}
                    >
                        <Input
                            className=''
                            placeholder='amount'
                            suffix="BDDT"
                        />
                    </Form.Item>
                    <div className='flex justify-center'>
                        <Button loading={isSubmitting} type='primary' htmlType='submit'>
                            Transfer Proposal
                        </Button>
                    </div>
                </Form>
            </Spin>
        </Modal>
    )
}

export default TokenTransferModal
