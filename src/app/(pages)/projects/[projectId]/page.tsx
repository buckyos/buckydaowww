'use client'
import { useParams } from 'next/navigation'
import CreateVersionModal from '@components/project/CreateVersionModal'
import Versions from '@components/project/Versions'
import { useGetProjectQuery } from '@hooks/index'
import { ProjectInfo } from '@components/ProjectInfo'

// project detail page render fn
const ProjectDetail = () => {
  const { projectId } = useParams()
  const { data: project, isLoading } = useGetProjectQuery(projectId as string)

  //
  return (
    <>
      <ProjectInfo project={project} loading={isLoading} />
      <Versions project_name={project?.project_name} />

      <CreateVersionModal />
    </>
  )
}

export default ProjectDetail
