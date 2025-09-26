import Image from 'next/image'
import React, { ReactNode } from 'react'

interface AuthLayoutProps {
	children: ReactNode
	imageSrc?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, imageSrc }) => {
	return (
		<div className="min-h-screen text-black">
			<div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
				{/* LEFT: image */}
				<div className="hidden md:block relative h-full w-full">
					{imageSrc && (
						<Image src={imageSrc} alt="campus" fill className="object-cover" />
					)}
				</div>

				{/* RIGHT: panel */}
				<div className="flex items-center justify-center rounded-tl-[150px] bg-white shadow-lg">
					<div className="w-full max-w-3xl p-8 md:p-12 lg:p-16 relative">
						{/* quarter-circle curve */}
						<div className="absolute w-[420px] bg-white" />

						<div className="relative z-10 max-w-2xl ml-4 md:ml-12">
							{children}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AuthLayout
