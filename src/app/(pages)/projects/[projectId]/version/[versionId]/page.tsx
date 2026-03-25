'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAsyncEffect } from 'ahooks'
import {
  decodeProjectProfile,
  getProjectVersionDetail,
  fetchProposalId,
  fetchRepositoryList,
} from '@services/index'
import { ProjectInfo } from '@components/ProjectInfo'
import VersionSettlementModal from '@components/modal/VersionSettlementModal'
import VersionDescription from '@components/VersionDesciption'
import VersionSettlement from '@components/VersionSettlement'
import StateExplanationCard from '@components/StateExplanationCard'

function isProjectVersion(value: unknown): value is ProjectVersionProps {
  if (!value || typeof value !== 'object') {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'number'
    && typeof record.pname === 'string'
    && typeof record.version === 'string'
  )
}


// 版本详情页
const ProjectVersionPage = () => {
  const [version, setVersion] = useState<ProjectVersionProps>()
  const { projectId, versionId } = useParams()
  const [project, setProject] = useState<ProjectItem>()
  const [isLoading, setIsLoading] = useState(true)
  const [proposal, setProposal] = useState<ProposalResponseData>()
  const [invalidRoute, setInvalidRoute] = useState(false)

  useAsyncEffect(async () => {
    setIsLoading(true)
    setInvalidRoute(false)
    const [projectResult, versionResult] = await Promise.all([
      fetchRepositoryList(),
      getProjectVersionDetail(versionId as string),
    ])
    const versionData = versionResult.data
    if (!isProjectVersion(versionData)) {
      setVersion(undefined)
      setProject(undefined)
      setProposal(undefined)
      setInvalidRoute(true)
      setIsLoading(false)
      return
    }

    const version = versionData
    setVersion(version)
    const decodedProjectId = decodeURIComponent(String(projectId))
    const project = projectResult.data
      .map((item) => decodeProjectProfile(item))
      .find(
        (item) =>
          String(item.id) === decodedProjectId
          || item.project_name === decodedProjectId
          || item.project_name === version.pname,
      )
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
      {invalidRoute && (
        <div className='mb-6'>
          <StateExplanationCard
            heading='Version Status'
            status='Version detail link is invalid'
            why={[
              'This URL does not point to a valid project version detail record.',
              'Older proposal links may have encoded a settlement parameter instead of the actual version detail id.',
            ]}
            next={[
              'Return to the linked proposal or project page and open the version detail from the current project/version tables.',
              'You can also go back to the Projects page and open the version from its project card.',
            ]}
            tone='warning'
          />
          <div className='mt-3'>
            <Link className='text-cyfs-green underline' href='/projects'>
              Back to Projects
            </Link>
          </div>
        </div>
      )}

      <ProjectInfo project={project} loading={isLoading} version={version} />

      {!invalidRoute && (
        <>
          <h3 className='font-normal mt-20 mb-4'>version infomation</h3>
          <VersionDescription version={version} />

          <VersionSettlement
            version={version}
            loading={isLoading}
            proposal={proposal}
          />
        </>
      )}

      <VersionSettlementModal />
    </>
  )
}

export default ProjectVersionPage
