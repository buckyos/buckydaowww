import LastestProposals from '@components/LatestProposals'
import CreateButtons from '@components/proposal/CreateButtons'

export default function Proposals() {
  return (
    <>
      <h1 className='text-2xl mt-10'>Vote in governance</h1>
      <CreateButtons />

      <div className='mt-10'></div>
      <LastestProposals showButton={false} showPage={true} />
    </>
  )
}
