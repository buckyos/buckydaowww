const Tag: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const baseClasses = 'inline-block py-1 px-2 rounded'
  const colorClasses: any = {
    red: 'bg-red-200 text-red-800',
    blue: 'bg-blue-200 text-blue-800',
    green: 'bg-green-200 text-green-800',
    yellow: 'bg-yellow-200 text-yellow-800',
    // 在这里添加更多颜色
  }

  return (
    <span className={`${baseClasses} ${colorClasses[color]} text-sm`}>
      {text}
    </span>
  )
}

export default Tag
