import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'

const Loading: React.FC<{ className: string }> = ({ className }) => {
  return (
    <div className={'flex-center ' + className}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
    </div>
  )
}

export default Loading
