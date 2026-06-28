'use client'
import { useState } from 'react'
import cx from 'classnames'
// import { ReactComponent as IconArrowRightUp } from 'assets/images/icon_arrow_right_up.svg'
// import { ReactComponent as IconContract } from 'assets/images/icon_contract.svg'
import { formatAmount, parseToFloat, wrapUnits } from 'utils/numberConverter'
import { useRouter } from 'next/navigation'
import useContractStore from '@hooks/useContract'
import { useAsyncEffect } from 'ahooks'
import { RightOutlined } from '@ant-design/icons'

import { contractService, fetchTokenInfo } from '@contracts/index'

const ContractAbout = () => {
  const mainAddress = contractService.getAddressOfMain()
  const contract = useContractStore()
  const router = useRouter()
  const toDaoContract = () => {
    const explorerBase = process.env.NEXT_PUBLIC_ADDRESS_LINK
    if (explorerBase) {
      window.open(`${explorerBase}${mainAddress}`, '_blank', 'noopener,noreferrer')
    }
  }

  const [totalReleasedDisplayed, setTotalReleasedDisplayed] = useState('')

  useAsyncEffect(async () => {
    const token = await fetchTokenInfo()
    setTotalReleasedDisplayed(formatAmount(token.dev.totalReleased, 3, true))
  }, [])

  const totalSupply = formatAmount(
    parseToFloat(wrapUnits(contract.totalSupply, contract.decimals)),
    3,
    true,
  )

  return (
    <div>
      <div className='text-xl font-medium'>
        <RightOutlined /> About DAO Contract
      </div>
      <div className='relative border border-solid rounded-lg border-[#F0F0F0] p-6 mt-3'>
        <div className={cx('flex flex-col gap-[18px] md:flex-row')}>
          <div>
            <span className='font-medium mr-4'>
              <span className='text-cyfs-green font-bold mr-1'>
                {contract.symbol}
              </span>
              total supply:
            </span>
            <span>{totalSupply}</span>
          </div>
          <div>
            <span className={cx('font-medium')}>Already allocated:&nbsp;</span>
            <span>{totalReleasedDisplayed}</span>
          </div>
        </div>

        <div className={cx('mt-[18px]', 'break-words')}>
          <span className={cx('font-medium')}>Contract address:&nbsp;</span>
          <span>{mainAddress}</span>
        </div>

        <div
          className={cx(
            'flex flex-col items-start gap-[18px] md:flex-row md:items-center md:gap-6',
            'mt-[18px]',
          )}
        >
          <div
            className={cx(
              'no-underline text-sm font-medium text-[#1890FF] hover:text-[#0066CC]',
              'flex items-center gap-2',
              'cursor-pointer',
            )}
            onClick={toDaoContract}
            aria-hidden
          >
            <div>Checkout contract</div>
            {/* <Icon component={IconArrowRightUp} /> */}
          </div>

          <div
            className={cx(
              'no-underline text-sm font-medium text-[#1890FF] hover:text-[#0066CC]',
              'flex items-center gap-2',
              'cursor-pointer',
            )}
            onClick={() => router.push('/governance_introducing')}
            aria-hidden
          >
            <div>Governance introducing</div>
            {/* <Icon component={IconArrowRightUp} /> */}
          </div>
        </div>

        <div className={cx('absolute right-6 top-6 z-[-1]')}>
          {/* <Icon component={IconContract} className={cx('text-5xl')} /> */}
        </div>
      </div>
    </div>
  )
}

export default ContractAbout
