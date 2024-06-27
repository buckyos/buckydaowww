'use client'
import { useRouter } from 'next/navigation'

export default function CreateProject() {
  const router = useRouter()
  const onCreateProject = () => {
    router.push('/projects/create')
  }

  // const onCreateVersion = () => {
  //   router.push('/projects/version/create')
  // }

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
