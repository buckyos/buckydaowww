import { useState, Fragment } from 'react'
import { Breadcrumb, message } from 'antd'

const ProjectLogLine: React.FC<{ project_logs?: ProjectLogsDefine[] }> = ({
  project_logs,
}) => {
  return (
    <>
      <div className='mt-20 mb-4 font-bold text-xl'>project events</div>
      {project_logs?.map((item) => {
        return (
          <div
            className='flex items-center w-full px-4 py-2'
            key={item.event_name}
          >
            <div className='w-4 h-4 rounded-full bg-cyfs-green mr-4'> </div>
            <div className='flex-1'>{item.event_name}</div>
            <div className='text-cyfs-gray'>{item.date}</div>
            <div>{item.descption}</div>
            <div>{item.link}</div>
          </div>
        )
      })}
    </>
  )
}

const ProjectActionCallingLeader: React.FC = () => {
  const list = [
    { name: 'alex', date: '2023-08-13', link: 'https://www.baidu.com' },
    { name: 'kk', date: '2023-08-13', link: 'https://www.baidu.com' },
    { name: 'bob', date: '2023-08-13', link: 'https://www.baidu.com' },
  ]

  const acceptApplicant = () => {
    message.success('accept applicant success')
  }
  return (
    <>
      <h3 className='text-xl mt-20'>Applicant List</h3>
      <div className='grid grid-cols-3 border-round px-10 py-6 mt-6 gap-y-4 drop-shadow-sm'>
        <div className='text-lg font-bold'>Applicant Name</div>
        <div className='text-lg font-bold text-center'>Date</div>
        <div></div>
        {list.map((item) => {
          return (
            <Fragment key={item.name}>
              <dd>{item.name}</dd>
              <dd className='text-center'>{item.date}</dd>
              <dd className='text-center'>
                <div
                  onClick={acceptApplicant}
                  className='bg-cyfs-green2 text-white px-2 py-1 text-sm rounded-lg inline-block cursor-pointer'
                >
                  Accept
                </div>
              </dd>
            </Fragment>
          )
        })}
      </div>
    </>
  )
}

const ProjectActionInDevelopment: React.FC = () => {
  const completeProject = () => {
    message.success('set project complete success')
  }
  const revertToCalling = () => {
    message.success('revert to calling success')
  }

  return (
    <>
      <h3 className='text-xl mt-20 mb-10'>In development</h3>
      <div>Start at: 2021-08-13</div>
      <div>Planned Duration:2 months</div>
      <div>Duration: 3 months</div>
      <div className='flex-center mt-6 gap-10'>
        <div
          onClick={completeProject}
          className='w-48 h-10 flex-center bg-cyfs-green2 text-white rounded-lg cursor-pointer'
        >
          Complete project
        </div>
        <div
          onClick={revertToCalling}
          className='w-48 h-10 flex-center bg-cyfs-gray text-white rounded-lg cursor-pointer'
        >
          Revert to Calling
        </div>
      </div>
    </>
  )
}

const ProjectActionComplete: React.FC = () => {
  return (
    <>
      <h3 className='text-xl mt-20 mb-10'>In development</h3>
      <div>Start at: 2021-08-13</div>
      <div>Planned Duration:2 months</div>
      <div>Duration: 3 months</div>
      <div className='flex-center mt-6 gap-10'></div>
    </>
  )
}
