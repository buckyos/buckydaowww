'use client'
import cx from 'classnames'
import { CheckCircleOutlined } from '@ant-design/icons'
import useUserStore from '@hooks/useUserStore'
import ContractAbout from '@components/funding/ContractAbout'
import { RightOutlined } from '@ant-design/icons'
import { wrapUnits } from '@utils/numberConverter'
import { useBindWalletAddress, useCommittee } from '@hooks/index'

const InvestmentInfo: React.FC<{ decimals: number }> = ({ decimals }) => {
  return null

  // return (
  //   <div className='relative border border-solid rounded-lg border-[#F0F0F0] p-6 mt-3 leading-10'>
  //     <dd>
  //       A total of
  //       <span className='mx-1 text-cyfs-green font-bold'>
  //         {wrapUnits(latestInvestment.goalAssetAmount, decimals)}
  //       </span>
  //       tokens will be released in this round of investment
  //     </dd>
  //     <dd>
  //       Current price:
  //       <span className='mx-1 font-bold'> {rate} </span>
  //       USDT per BST
  //     </dd>
  //     <dd>
  //       Maximum limit per investor: {latestInvestment.maxAssetPerInvestor} USDT
  //     </dd>
  //     <dd>
  //       Minimum limit per investor: {latestInvestment.minAssetPerInvestor} USDT
  //     </dd>
  //     <dd className='mt-10'>
  //       Tron USDT address for this round of investment:
  //       <span className='ml-1 font-bold'>{latestInvestment.assetAddress}</span>
  //     </dd>
  //     <dd>KYC-verified address: 0x0000000000000000000000000000000000000000</dd>
  //     <dd className='text-cyfs-gray text-sm'>
  //       (only accepts KYC-verified addresses to transfer Tron USDT out and
  //       receive DAO tokens)
  //     </dd>
  //     <dd>KYC-verified addresses have invested in this round: 750,000</dd>
  //     <dd>USDT, remaining investment quota: 250,000 USDT</dd>
  //   </div>
  // )
}

export default function Funding() {
  const { user } = useUserStore((state) => {
    return {
      user: state.user,
    }
  })
  const { governanceAddress } = useBindWalletAddress()
  const { isCommittee, decimals } = useCommittee(governanceAddress)

  return (
    <main className='w-[1200px] mx-auto my-10'>
      <div className='text-2xl font-medium'>Funding</div>

      <div className='flex items-center mt-10'>
        {isCommittee ? (
          <>
            <div className={cx('break-all mr-2')}>
              Address {governanceAddress || user.address} already in the whitelist.
            </div>
            <CheckCircleOutlined className={cx('text-[#52C41A]')} />
          </>
        ) : (
          <div className={cx('break-all mr-2')}>
            Current account are no the commitee
          </div>
        )}
      </div>

      <div className={cx('mt-[72px]')}>
        <ContractAbout />
      </div>

      <div className='text-xl font-medium mt-12'>
        <RightOutlined />
        Investment of POC round
      </div>
      <InvestmentInfo decimals={decimals} />
    </main>
  )
}
