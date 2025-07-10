import { useState } from 'react'
import { Tag, message, Button, Tooltip, Spin, Table } from 'antd'
import ProposalStateTag from '@components/ProposalStateTag'
import { ProposalState } from '@vars/index'
import useContractStore from '@hooks/useContract'
import { extractMessage, transactionWait } from '@utils/index'
import {
  postContributionWithdraw,
  getVersionContributionInfo,
} from '@services/index'
import useUserStore from '@hooks/useUserStore'
import { wrapUnits, calculateProportion } from '@utils/numberConverter'
import { contractService } from '@contracts/index'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useAsyncEffect } from 'ahooks'
import _ from 'lodash'

const WithdrawButton: React.FC<{ proposal: ProposalResponseData }> = ({
  proposal,
}) => {
  const { jwt, isLogin } = useUserStore((state) => ({
    jwt: state.jwt,
    isLogin: state.isLogin,
  }))
  const [loading, setLoading] = useState(false)

  const onWithdraw = async () => {
    setLoading(true)
    const fn = async () => {
      if (!isLogin()) {
        message.error('error: please login first')
        return
      }

      if (proposal.state !== ProposalState.Executed) {
        message.error('withdraw error: proposal state error')
        return
      }

      if (!proposal.project) {
        message.error('error: missing project ')
        return
      }

      const projectContractCaller = await contractService.getProjectContract()
      const tx = await projectContractCaller.withdrawContributions([
        proposal.project.id,
      ])
      const receipt = await transactionWait(tx)
      if (receipt?.status !== 1) {
        console.warn('transaction status:', receipt?.status, tx)
        message.error(`withdraw token failed[3][${receipt?.status}]`)
        return false
      }

      const result = await postContributionWithdraw(jwt, [proposal.project.id])
      console.log('result', result)
    }

    try {
      await fn()
    } catch (e) {
      const msg = extractMessage(e)
      message.error(msg)
    }
    setLoading(false)
  }

  return (
    <>
      <div className='flex-center mt-20 '>
        <Button
          size='large'
          type='primary'
          loading={loading}
          onClick={onWithdraw}
        >
          withdraw
        </Button>
      </div>
      <div className='flex-center flex-col text-sm text-gray-400 mt-4 pb-20'>
        <p>
          After the settlement proposal is passed and successfully executed, the
          token can be withdrawn.
        </p>
        <p>
          The number of withdrawal tokens is calculated based on the version
          budget and your contribution value.
        </p>
      </div>
    </>
  )
}

const VersionSettlement: React.FC<{
  version?: ProjectVersionProps
  proposal?: ProposalResponseData
  loading: boolean
}> = ({ version, proposal, loading }) => {
  const { decimals, symbol } = useContractStore((state) => ({
    decimals: state.decimals,
    symbol: state.symbol,
  }))

  const [contributions, setContributions] = useState<ContributionInfo[]>([])

  useAsyncEffect(async () => {
    if (version && proposal) {
      const contributions = proposal.params[0]
        .contributions as ContributionInfo[]
      const result = await getVersionContributionInfo(version.id.toString())
      const data = contributions.map((contribution) => {
        const item = _.find(
          result.data,
          (item) => item.address == contribution.contributor,
        )
        if (item) {
          console.log('version contributions item', item)
          return {
            ...contribution,
            hasClaim: item.isClaim,
            amount: item.amount,
          }
        } else {
          return contribution
        }
      })
      setContributions(data)
    }
  }, [version, proposal])

  if (loading) {
    return <Spin></Spin>
  }

  if (!proposal || proposal.params == null) {
    return null
  }
  console.log('VersionSettlement proposal', proposal)
  if (proposal.params.length === 0 || !proposal.params[0].contributions) {
    return null
  }

  const budget = BigInt(proposal.params[0].budget)
  const totle = contributions.reduce((acc, cur) => {
    return acc + cur.value
  }, 0)

  const columns = [
    {
      title: 'Contributor',
      dataIndex: 'contributor',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (value: number) => {
        return <div>{value} Point</div>
      },
    },
    {
      title: 'Estimated gain',
      dataIndex: 'amount',
      render: (amount: string) => {
        if (!amount) {
          return <div>Unkonw</div>
        }

        return (
          <Tooltip title='except for unexplained situations, there may be deviations'>
            <div className='flex-center gap-2'>
              <div className='flex-center gap-1'>
                <span>
                  {parseFloat(wrapUnits(amount, decimals)).toFixed(4)}
                </span>
                <span>{symbol}</span>
              </div>
              <ExclamationCircleOutlined />
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: 'Claim',
      dataIndex: 'hasClaim',
      render: (hasClaim: boolean) => {
        return hasClaim ? 'YES' : 'NO'
      },
    },
  ]

  return (
    <>
      <div className='flex mt-20 items-center gap-4'>
        <div>settlement proposal status</div>
        <ProposalStateTag state={proposal.state} />
      </div>
      <h3 className='font-normal mt-10'>
        Corresponding contribution value of contributors in project settlement
      </h3>
      <div className='flex items-center mt-4'>
        Total contribution value: <Tag>{totle}</Tag>
        Point
      </div>

      <div className='mt-6 px-10'>
        <Table
          dataSource={contributions}
          columns={columns}
          bordered={false}
          pagination={false}
        />
      </div>

      <WithdrawButton proposal={proposal} />
    </>
  )
}

export default VersionSettlement
