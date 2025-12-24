'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: ReactNode
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
	showCloseButton?: boolean
}

const Modal = ({
	isOpen,
	onClose,
	title,
	children,
	maxWidth = 'md',
	showCloseButton = true,
}: ModalProps) => {
	const maxWidthClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-xl',
		xl: 'max-w-3xl',
	}

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					onClick={handleBackdropClick}
				>
					<motion.div
						className={`bg-white rounded-3xl p-8 md:p-12 ${maxWidthClasses[maxWidth]} w-full mx-6 relative shadow-2xl`}
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{
							type: 'spring',
							stiffness: 200,
							damping: 25,
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Close Button */}
						{showCloseButton && (
							<motion.button
								onClick={onClose}
								className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors duration-200"
								whileHover={{ scale: 1.1, rotate: 90 }}
								whileTap={{ scale: 0.95 }}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</motion.button>
						)}

						{/* Title */}
						{title && (
							<motion.h2
								className="text-3xl font-bold text-[#126E64] mb-8 pr-10"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
							>
								{title}
							</motion.h2>
						)}

						{/* Content */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							{children}
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default Modal
