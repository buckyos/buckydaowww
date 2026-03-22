'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import CreateVersionModal from '@components/project/CreateVersionModal'
import EditProjectProfileModal from '@components/project/EditProjectProfileModal'
import Versions from '@components/project/Versions'
import { useBindWalletAddress, useCommittee, useGetProjectQuery, useUserStore } from '@hooks/index'
import { ProjectInfo } from '@components/ProjectInfo'

function normalizeAddress(address?: string) {
  return address?.trim().toLowerCase() || ''
}

function isProjectOwner(project?: ProjectItem, user?: User) {
  if (!project?.owner || !user) {
    return false
  }

  if (
    project.owner.github_account &&
    user.github_account &&
    project.owner.github_account === user.github_account
  ) {
    return true
  }

  return normalizeAddress(project.owner.address) === normalizeAddress(user.address)
}

// project detail page render fn
const ProjectDetail = () => {
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const { projectId } = useParams()
  const { data: project, isLoading, refetch } = useGetProjectQuery(projectId as string)
  const user = useUserStore((state) => state.user)
  const { governanceAddress, isAuthenticated, isAddressMismatch } = useBindWalletAddress()
  const { isCommittee } = useCommittee(governanceAddress)
  const canEditProfile =
    !!project &&
    isAuthenticated &&
    !isAddressMismatch &&
    (isCommittee || isProjectOwner(project, user))

  //
  return (
    <>
      <ProjectInfo
        project={project}
        loading={isLoading}
        canEditProfile={canEditProfile}
        onEditProfile={() => setEditProfileOpen(true)}
      />
      <Versions project_name={project?.project_name} />

      <CreateVersionModal />
      <EditProjectProfileModal
        open={editProfileOpen}
        project={project}
        onCancel={() => setEditProfileOpen(false)}
        onSaved={refetch}
      />
    </>
  )
}

export default ProjectDetail
