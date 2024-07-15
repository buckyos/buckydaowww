import DaoTokenBrief from '@components/DaoTokenBrief'
import FundingEntrance from '@components/FundingEntrance'
import LatestProposals from '@components/LatestProposals'
import DaoMembers from '@components/DaoMembers'

function Participate() {
  return (
    <>
      <div className='text-3xl font-medium'>
        How to Participate and Govern in Source DAO:
      </div>
      <h4 className='mt-8'>1. For Investors:</h4>
      <p>
        Investors can review funding-related information to understand the
        financial aspects and investment opportunities of Source DAO.
      </p>

      <h4 className='mt-8'>2. For Developers:</h4>
      <p>
        Developers are welcome to visit our
        <a
          className='text-cyfs-green ml-1'
          href='https://github.com/buckyos/buckyos'
          target='_blank'
        >
          project homepage
        </a>
        . Here, you can share code, build and use software, participate in
        discussions, and follow our updates. We also invite you to follow our
        Twitter for latest news and updates. The current MVP (Minimum Viable
        Product) version is now available for use.
      </p>
    </>
  )
}

export default function Home() {
  return (
    <div className='flex flex-col'>
      <DaoTokenBrief />

      <Participate />
      <FundingEntrance />

      <div className='mt-16'>
        <div className='text-3xl font-medium my-6'>
          Shape the Future, One Token at a Time!
        </div>

        <div className='leading-10'>
          <p>🎉 Welcome to Buckyos 🎉</p>

          <p>
            Ever imagined a place where passion meets innovation? Welcome
            aboard!
          </p>

          <p>
            🔥 Tokens Not Just Tinkering: Here at Buckyos, our DAO Tokens are
            more than just digital bits. They&apos;re a testament to your
            commitment, talent, and the value you bring. Dive in for the love of
            tech, but stay for the rewards you rightly deserve.
          </p>

          <p>🎯 Proposals That Pop:</p>

          <p>
            <strong>Dream & Draft:</strong>
            Think of a feature that could be the next big thing? Let&apos;s hear
            it! And for those irresistibly amazing ideas, watch out for extra
            tokens coming your way from impressed members!
          </p>

          <p>
            <strong>Be the Captain:</strong>
            Taking the lead on a project here means more than just overseeing
            tasks. You have the rudder to steer! But choose wisely— budgets,
            strategies, and yes, the right leaders are all part of the quest.
          </p>

          <p>
            <strong>Gold Star or Redo:</strong>
            Done with your masterpiece? Time for rewards! But a quick check:
            Does it match our set standards? Excellence is our shared goal, and
            only the best gets the gold star.
          </p>
        </div>
      </div>
      <div className='mt-9'>
        <div className='text-2xl font-medium my-6'>Recent Proposal Votes</div>
        <LatestProposals showButton={true} showPage={false} />
      </div>

      <div className='mt-4'>
        <DaoMembers />
      </div>
    </div>
  )
}
