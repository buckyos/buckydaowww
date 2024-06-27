'use client'
import { Breadcrumb, Form, Input, message } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// render
export default function CreateVersionPage() {
  const [form] = Form.useForm()
  const onCreate = async () => {
    try {
      await form.validateFields()
    } catch (err) {
      return
    }
    const data = form.getFieldsValue()
    console.log('form data:', form.getFieldsValue())
    const resp = await fetch('/api/project/version', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    resp
    // resp.status
    message.success('Create a version successfully')
    // router.push('/projects')
  }
  const router = useRouter()

  return (
    <main className='max-w-[90%] mx-auto my-6 md:max-w-[70%]'>
      <Breadcrumb
        items={[
          { title: <Link href='/projects'>Projects</Link> },
          { title: <Link href='/projects'>Version</Link> },
          { title: <div>Create</div> },
        ]}
      />
      <h2 className='mt-20 text-2xl font-bold text-center'>create version</h2>
      <div className='flex-center mt-10'>
        <Form
          form={form}
          name='basic'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          autoComplete='off'
        >
          <Form.Item
            label='version name'
            name='project_name'
            rules={[{ required: true, message: 'Please input project name' }]}
          >
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

          <div className='flex-center gap-10 mt-10'>
            <a
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer'
              onClick={onCreate}
            >
              Create
            </a>

            <a
              className='bg-gray-500 hover:bg-gray-200 text-white font-bold py-2 px-4 rounded-lg cursor-pointer'
              onClick={() => router.push('/projects')}
            >
              Cancel
            </a>
          </div>
        </Form>
      </div>
    </main>
  )
}
