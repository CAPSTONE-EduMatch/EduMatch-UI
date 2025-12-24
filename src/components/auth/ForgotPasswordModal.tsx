import React, { useState } from 'react'

interface ForgotPasswordModalProps {
	isOpen: boolean
	onClose: () => void
	initialEmail: string
	onSubmit: (email: string) => Promise<boolean | void>
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
	isOpen,
	onClose,
	initialEmail,
	onSubmit,
}) => {
	const [email, setEmail] = useState(initialEmail)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | undefined>()
	const [resetSent, setResetSent] = useState(false)

	if (!isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			setError('Please enter a valid email address.')
			return
		}

		setIsLoading(true)
		try {
			await onSubmit(email)
			setError(undefined)
			setResetSent(true)
		} catch (err) {
			setError('Failed to send reset link. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
					aria-label="Close"
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
				</button>

				<h2 className="text-2xl font-bold text-[#126E64] mb-2">Verify Email</h2>

				{!resetSent ? (
					<>
						<p className="text-gray-600 mb-6">
							We will send a verification code to your email address.
						</p>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="example123@gmail.com"
									className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent"
									required
								/>
								{error && <p className="text-sm text-red-500 mt-2">{error}</p>}
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full bg-[#126E64] text-white py-3 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
							>
								{isLoading ? 'Sending...' : 'Confirm'}
							</button>
						</form>
					</>
				) : (
					<div className="text-center py-4">
						<svg
							className="mx-auto h-12 w-12 text-green-500 mb-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p className="text-gray-700 mb-4">
							Password reset link sent to{' '}
							<span className="font-medium">{email}</span>
						</p>
						<button
							onClick={onClose}
							className="w-full bg-[#126E64] text-white py-2 rounded-full font-medium shadow-md hover:bg-opacity-90 transition-colors"
						>
							Close
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default ForgotPasswordModal
