







const HeaderTokenTransferIcon = () => {
    return (
        <div>
            <div className="flex items-center gap-2">
                {/* Token A */}
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    A
                </div>

                {/* 转换箭头 */}
                <svg
                    className="w-4 h-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                </svg>

                {/* Token B */}
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    B
                </div>
            </div>
        </div>
    )
}

export default HeaderTokenTransferIcon