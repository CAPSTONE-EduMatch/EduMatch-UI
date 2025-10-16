import Image from 'next/image'
import React, { ReactNode } from 'react'

interface AuthLayoutProps {
	children: ReactNode
	imageSrc?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, imageSrc }) => {
	return (
		<div className="min-h-screen text-black relative">
			{/* Background Image */}
			{imageSrc && (
				<div className="absolute inset-0 z-0">
					<Image
						src={imageSrc}
						alt="background"
						fill
						className="object-cover"
						priority
					/>
				</div>
			)}

			{/* Content Layout */}
			<div className="relative z-10 min-h-screen flex justify-end items-center ">
				{/* RIGHT: panel */}
				<div className="rounded-tl-[200px] w-full md:w-1/2 flex items-center justify-center bg-white/95 backdrop-blur-sm md:bg-white shadow-lg min-h-screen">
					<div className="w-full max-w-3xl p-8 md:p-12 lg:p-16 relative">
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
