import { Button, Modal, message, Form, Input, InputNumber, Radio } from 'antd'
import { useState } from 'react'
import { useBindWalletAddress } from '@hooks/index'
import useUserStore from '@hooks/useUserStore'
import { useVersionSettlementModalStore } from '@hooks/modal'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { getAddress } from 'ethers'
import { proposalSetparams } from '@services/index'
import { extractMessage, showErrorMessage, transactionWait } from '@utils/index'
import { contractService } from '@contracts/index'

function normalizeAddress(address?: string) {
  return address?.trim().toLowerCase() || ''
}

function buildSettlementPrecheckErrors(
  version: ProjectVersionProps,
  activeAddress: string,
  contributions: ContributionInfo[],
) {
  const errors: string[] = []

  if (version.state !== 1) {
    errors.push(
      'Settlement proposal can only be created when the version state is Developing.',
    )
  }

  if (!activeAddress) {
    errors.push('Connect the manager wallet first.')
  } else if (
    normalizeAddress(activeAddress) !== normalizeAddress(version.manager)
  ) {
    errors.push('Only the version manager wallet can create the settlement proposal.')
  }

  if (contributions.length === 0) {
    errors.push('At least one contributor is required.')
  }

  const seenAddresses = new Set<string>()
  contributions.forEach((item) => {
    const normalized = normalizeAddress(item.contributor)
    if (!normalized) {
      errors.push('Contributor address is required.')
      return
    }

    if (seenAddresses.has(normalized)) {
      errors.push(`Duplicate contributor address: ${item.contributor}`)
      return
    }

    seenAddresses.add(normalized)

    if (item.value <= 0) {
      errors.push(`Contribution value must be greater than 0 for ${item.contributor}.`)
    }
  })

  return errors
}

function showSettlementPrecheckErrors(errors: string[]) {
  message.open({
    type: 'error',
    duration: 10,
    style: { marginTop: '20vh' },
    content: (
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: '720px', lineHeight: 1.5 }}>
        {'Failed settlement\n' + errors.map((item) => `- ${item}`).join('\n')}
      </div>
    ),
  })
}

function isSettlementSimulationFailure(error: unknown) {
  const errorInfo = (error as any)?.message
  return (
    typeof errorInfo === 'string' &&
    errorInfo.includes('missing revert data') &&
    errorInfo.includes('estimateGas')
  )
}

// 项目结算 提案
const VersionSettlementModal = () => {
  const { visible, version, close } = useVersionSettlementModalStore()
  const { ensureAuthenticated, activeAddress } = useBindWalletAddress()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFinish = async (values: any) => {
    setIsSubmitting(true)
    const postContract = async () => {
      if (!(await ensureAuthenticated({ requireWallet: true }))) {
        return
      }

      if (version === undefined) {
        message.error('error: missing project version')
        return
      }

      let contributions: ContributionInfo[] = values.contributions.map(
        (item: any) => {
          return {
            contributor: getAddress(item.contributor),
            value: item.value,
            hasClaim: false,
          }
        },
      )
      console.log('onFinish', values, contributions)
      const precheckErrors = buildSettlementPrecheckErrors(
        version,
        activeAddress,
        contributions,
      )
      if (precheckErrors.length > 0) {
        showSettlementPrecheckErrors(precheckErrors)
        return
      }

      // 合约
      const projectContractCaller = await contractService.getProjectContract()
      const tx = await projectContractCaller.acceptProject(
        version.id,
        values.result,
        contributions,
      )

      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        console.warn('transaction status:', receipt?.status, tx)
        message.error(
          `settlement project version failed[3][${receipt?.status}]`,
        )
        return false
      }

      // 提案的参数设置
      // set params
      const jwt = useUserStore.getState().jwt
      const setparamResult = await proposalSetparams(
        jwt,
        [
          version.id, 
          version.pname, 
          version.version, 
          version.start_date, 
          version.end_date,
          'acceptProject',
        ],
        receipt.hash,
      )
      if (setparamResult.code !== 0) {
        message.error(
          'settlement project version failed[4], please try again later',
        )
      } else {
        message.success('settlement project version success')
        close()
      }
    }

    try {
      await postContract()
    } catch (e) {
      if (isSettlementSimulationFailure(e) && version) {
        showSettlementPrecheckErrors(
          buildSettlementPrecheckErrors(version, activeAddress, [] as ContributionInfo[]).concat([
            'Contributor addresses must be unique and contribution values must be greater than 0.',
          ]),
        )
      } else {
        const msg = extractMessage(e)
        if (typeof msg === 'string' && msg.trim()) {
          showErrorMessage(e, 'Failed settlement')
        } else {
          message.error('Failed settlement', 5)
        }
      }
    }
    setIsSubmitting(false)
  }

  return (
    <Modal
      width={800}
      title='Create version settlement proposal'
      open={visible}
      onCancel={() => {
        close()
      }}
      confirmLoading={isSubmitting}
      footer={null}
    >
      <div className='text-sm text-gray-500'>
        <p></p>
      </div>
      <Form
        onFinish={onFinish}
        className='mt-6'
        name='create-proposal'
        style={{ width: '100%' }}
        autoComplete='off'
        initialValues={{
          result: '4', // 默认是GOOD
        }}
      >
        <label>Acceptance Rating</label>
        <Form.Item
          name='result'
          rules={[{ required: true, message: 'Acceptance rating is required' }]}
        >
          <Radio.Group>
            <Radio.Button value='3'>Normal (80%)</Radio.Button>
            <Radio.Button value='4'>Good (100%)</Radio.Button>
            <Radio.Button value='5'>Excellent (120%)</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <label>contributions</label>
        <Form.List name='contributions'>
          {(fields, { add, remove }) => (
            <>
              <div>
                {fields.map(({ key, name }, index) => {
                  return (
                    <div
                      key={key}
                      className='flex items-center justify-between gap-10'
                    >
                      <Form.Item
                        className='w-full'
                        name={[name, 'contributor']}
                        rules={[
                          {
                            required: true,
                            message: 'contributor address is required',
                          },
                        ]}
                      >
                        <Input placeholder='Address' />
                      </Form.Item>
                      <Form.Item
                        name={[name, 'value']}
                        className='w-full'
                        rules={[
                          {
                            required: true,
                            message: 'Contribution is required',
                          },
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder='Contribution'
                        />
                      </Form.Item>

                      <MinusCircleOutlined
                        style={{ fontSize: '20px' }}
                        className='dynamic-delete-button mb-6 mr-6'
                        onClick={() => {
                          if (fields.length <= 1) {
                            message.error('At least input one contributor')
                          } else {
                            remove(index)
                          }
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <Form.Item>
                <Button onClick={() => add()} icon={<PlusOutlined />}>
                  Add one more address
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <div className='flex justify-center'>
          <Button loading={isSubmitting} type='primary' htmlType='submit'>
            Submit
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

// export { useCreateVersionModalStore }

export default VersionSettlementModal
