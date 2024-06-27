'use client'
import { Breadcrumb, Button, Form, Input } from 'antd'
import Link from 'next/link'

// render
export default function CreateProjectPage() {
  return (
    <main className='max-w-[90%] mx-auto my-6 md:max-w-[70%]'>
      <Breadcrumb
        items={[
          { title: <Link href='/projects'>Projects</Link> },
          { title: <div>Create</div> },
        ]}
      />
      <h2 className='mt-10 text-2xl font-bold text-center'>create project</h2>
      <div className='flex-center mt-20'>
        <Form
          name='basic'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          autoComplete='off'
        >
          <Form.Item
            label='project name'
            name='project_name'
            rules={[{ required: true, message: 'Please input project name' }]}
          >
            <Input className='ml-2' />
          </Form.Item>
          <Form.Item label='avatar' name='avatar'>
            <Input className='ml-2' />
          </Form.Item>

          <Form.Item
            label='github url'
            name='github_url'
            rules={[{ required: true, message: 'Please input github url' }]}
          >
            <Input className='ml-2' />
          </Form.Item>
          <Form.Item label='descption' name='descption'>
            <Input className='ml-2' />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type='primary' htmlType='submit'>
              Create
            </Button>
          </Form.Item>
        </Form>
      </div>
    </main>
  )
}
