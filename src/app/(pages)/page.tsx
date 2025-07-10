import DaoTokenBrief from '@components/home/DaoTokenBrief'
import FundingEntrance from '@components/home/FundingEntrance'
import LatestProposals from '@components/LatestProposals'
import DaoMembers from '@components/DaoMembers'
import { Participate } from '../components/home/Participate'
import { MainIntroduce } from '@components/home/MainIntroduce'

export default function Home() {
  return (
    <div className='flex flex-col'>
      <DaoTokenBrief />
      <Participate />
      <FundingEntrance />
      <MainIntroduce />
      <div className='text-2xl font-medium mt-16 mb-6'>Recent Proposal Votes</div>
      <LatestProposals showButton={true} showPage={false} />
      <div className='mt-4 min-h-[200px]'>
        <DaoMembers />
      </div>
    </div>
  )
}
