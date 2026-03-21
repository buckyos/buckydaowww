'use client'
import { useCreateProjectModalStore } from './CreateProjectModal'

export default function CreateProject() {
  const { show } = useCreateProjectModalStore()

  const onCreateProject = () => {
    show()
  }

  return (
    <div className='flex-center gap-5'>
      <a
        className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer text-sm'
        onClick={onCreateProject}
      >
        create project
      </a>
    </div>
  )
}
