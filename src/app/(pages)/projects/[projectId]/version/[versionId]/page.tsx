'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAsyncEffect } from 'ahooks'
import {
  getProjectDetail,
  getProjectVersionDetail,
  fetchProposalId,
} from '@services/index'
import { ProjectInfo } from '@components/ProjectInfo'
import VersionSettlementModal from '@components/modal/VersionSettlementModal'
import VersionDescription from '@components/VersionDesciption'
import VersionSettlement from '@components/VersionSettlement'

const ProjectVersionPage = () => {
  const [version, setVersion] = useState<ProjectVersionProps>()
  const { projectId, versionId } = useParams()
  const [project, setProject] = useState<ProjectItem>()
  const [isLoading, setIsLoading] = useState(true)
  const [proposal, setProposal] = useState<ProposalResponseData>()

  useAsyncEffect(async () => {
    setIsLoading(true)
    const resp = await Promise.all([
      getProjectDetail(projectId as string),
      getProjectVersionDetail(versionId as string),
    ])
    console.log(resp)
    const version = resp[1].data as ProjectVersionProps
    setVersion(version)
    setProject(resp[0].data)

    // fetch 验收提案
    if (version.accept_proposal_id) {
      const result = await fetchProposalId(
        version.accept_proposal_id.toString(),
      )
      const proposal = result.data as ProposalResponseData
      setProposal(proposal)
    }

    setIsLoading(false)
  }, [])

  return (
    <>
      <ProjectInfo project={project} loading={isLoading} version={version} />

      <h3 className='font-normal mt-20 mb-4'>version infomation</h3>
      <VersionDescription version={version} />

      <VersionSettlement
        version={version}
        loading={isLoading}
        proposal={proposal}
      />

      <VersionSettlementModal />
    </>
  )
}

export default ProjectVersionPage
