import cx from 'classnames'
import { Avatar, Image } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const UserAvatar: React.FC<UserAvatar> = ({ avatar, size = 40 }) => {
  return (
    <>
      {avatar ? (
        <Image
          src={avatar}
          width={size}
          preview={false}
          className={cx('rounded-[50%]')}
          alt='user avatar'
        />
      ) : (
        <Avatar size={size} icon={<UserOutlined />} />
      )}
    </>
  )
}

export default UserAvatar
