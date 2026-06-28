import CreateProject from '@components/project/CreateProject'
import CreateProjectModal from '@components/project/CreateProjectModal'
import ProjectList from '@components/project/ProjectList'
import { Timeline } from 'antd'

const ProjectRoadmap = () => {
  return (
    <>
      <div className='text-2xl font-medium my-20'>
        Latest Updates and Roadmap
      </div>
      <div className='px-10'>
        <Timeline
          items={[
            {
              children:
                'Introduction to the Proof of Concept (PoC) version of OpenDAN, tokens have been released, acceptance results.',
            },
            {
              children:
                'OpenDAN 0.5.1 is live, situation introduction, about to release tokens, acceptance situation.',
            },
            {
              children: (
                <div>
                  OpenDAN version 0.5.2 is under development, expected release
                  time, expected token release, total tasks 23/43.
                  <a
                    className='text-cyfs-green ml-1'
                    href='https://github.com/fiatrete/OpenDAN-Personal-AI-OS/issues/46'
                    target='_blank'
                  >
                    See more details
                  </a>
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  )
}

export default function ProjectsPage() {
  return (
    <>
      {/* <ProjectRoadmap /> */}
      <div className='my-6 flex items-center justify-between gap-4'>
        <div>
          <div className='text-2xl font-medium'>Project Dashboard</div>
          <a
            className='text-sm text-cyfs-green underline underline-offset-2'
            href='https://github.com/buckyos/SourceDAO/blob/main/docs/ProjectVersionGuide.md'
            target='_blank'
          >
            Project / Version guide
          </a>
        </div>
        <CreateProject />
      </div>
      <ProjectList />
      <CreateProjectModal />
    </>
  )
}
