import { Dispatch, SetStateAction, useState } from 'react'
import { StoreValue } from 'antd/es/form/interface'
import { Modal, Form, Input, Button, message, Spin } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { ethers } from 'ethers'
import { useBindWalletAddress } from '@hooks/index'
import useUserStore from '@hooks/useUserStore'
import {
  appendUpgradeCalldataToExtra,
  normalizeUpgradeCalldata,
  showErrorMessage,
  transactionWait,
} from '@utils/index'
import { proposalSetExtraAndParams } from '@services/index'
import { contractService } from '@contracts/index'

// 升级合约
const UpgradeContractModal: React.FC<{
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}> = ({ showModal, setShowModal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { ensureAuthenticated } = useBindWalletAddress()

  const onCreateProposal = async (values: StoreValue) => {
    console.log('🍻 values :', values)
    setIsSubmitting(true)
    const fn = async () => {
      if (!(await ensureAuthenticated({ requireWallet: true }))) {
        return
      }

      const migrationCalldata = normalizeUpgradeCalldata(values.migrationCalldata)
      const calldataHash = ethers.keccak256(migrationCalldata)
      const proposalExtra = appendUpgradeCalldataToExtra(
        values.content || '',
        migrationCalldata,
      )
      const comitteeContract = await contractService.getCommitteeContract()
      const tx = await comitteeContract[
        'prepareContractUpgrade(address,address,bytes32)'
      ](
        values.contractProxyAddress,
        values.implAddress,
        calldataHash,
      )

      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        console.warn('transaction status:', receipt?.status, tx)
        message.error(
          `Create upgrade contract proposal failed[3][${receipt?.status}]`,
        )
        return
      }
      const result = await proposalSetExtraAndParams(
        useUserStore.getState().jwt,
        [
          values.contractProxyAddress,
          values.implAddress,
          calldataHash,
          'upgradeContract',
        ],
        values.title,
        proposalExtra,
        receipt.hash,
      )
      if (result.code !== 0) {
        message.error(
          'Create upgrade contract proposal failed[4], please try again later',
        )
      } else {
        message.success('Create upgrade contract proposal success')
        setShowModal(false)
      }
    }

    try {
      await fn()
    } catch (e) {
      showErrorMessage(e, "Create proposal failed[1]")
    }

    setIsSubmitting(false)
  }

  return (
    <Modal
      title='Create upgrade contract proposal'
      open={showModal}
      onCancel={() => {
        setShowModal(false)
      }}
      footer={null}
    >
      <Spin tip='Waiting for confirmation...' spinning={isSubmitting}>
        <Form
          onFinish={onCreateProposal}
          className='mt-6'
          name=''
          style={{ width: '100%' }}
          autoComplete='off'
        >
          <Form.Item
            name='contractProxyAddress'
            rules={[
              {
                required: true,
                message: 'contract proxy address  is required ',
              },
            ]}
          >
            <Input className='' placeholder='contract proxy address' />
          </Form.Item>

          <Form.Item
            name='implAddress'
            rules={[{ required: true, message: 'impl address is required ' }]}
          >
            <Input className='' placeholder='impl address' />
          </Form.Item>

          <Form.Item
            name='migrationCalldata'
            tooltip='Optional raw calldata for upgradeToAndCall. Leave empty for a plain implementation upgrade.'
            rules={[
              {
                validator: async (_, value) => {
                  if (!value) {
                    return
                  }
                  if (!ethers.isHexString(value)) {
                    throw new Error('Migration calldata must be a hex string')
                  }
                },
              },
            ]}
          >
            <TextArea
              className=''
              placeholder='optional migration calldata, e.g. 0x1234...'
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item
            name='title'
            rules={[{ required: true, message: 'title  is required ' }]}
          >
            <Input className='' placeholder='proposal title' />
          </Form.Item>

          <Form.Item name='content'>
            <TextArea
              className=''
              placeholder='proposal content'
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>

          <div className='flex justify-center'>
            <Button loading={isSubmitting} type='primary' htmlType='submit'>
              Create Proposal
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  )
}

export default UpgradeContractModal
