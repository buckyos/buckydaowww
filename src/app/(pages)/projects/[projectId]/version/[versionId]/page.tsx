'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAsyncEffect } from 'ahooks'
import {
  getProjectVersionDetail,
  fetchProposalId,
  fetchRepositoryList,
} from '@services/index'
import { ProjectInfo } from '@components/ProjectInfo'
import VersionSettlementModal from '@components/modal/VersionSettlementModal'
import VersionDescription from '@components/VersionDesciption'
import VersionSettlement from '@components/VersionSettlement'


// 版本详情页
const ProjectVersionPage = () => {
  const [version, setVersion] = useState<ProjectVersionProps>()
  const { projectId, versionId } = useParams()
  const [project, setProject] = useState<ProjectItem>()
  const [isLoading, setIsLoading] = useState(true)
  const [proposal, setProposal] = useState<ProposalResponseData>()

  useAsyncEffect(async () => {
    setIsLoading(true)
    const [projectResult, versionResult] = await Promise.all([
      fetchRepositoryList(),
      getProjectVersionDetail(versionId as string),
    ])
    console.log(projectResult, versionResult)
    const version = versionResult.data as ProjectVersionProps
    setVersion(version)
    const project = projectResult.data
      .map((item) => {
        return JSON.parse(item.detail) as ProjectItem
      })
      .find((item) => item.id == projectId)
    if (project) {
      setProject(project)
    }

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
