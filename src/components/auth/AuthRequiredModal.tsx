'use client'

import { useRouter } from 'next/navigation'
import { ErrorModal } from '@/components/ui'

interface AuthRequiredModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	message?: string
}

export function AuthRequiredModal({
	isOpen,
	onClose,
	title = 'Authentication Required',
	message = 'You need to sign in to access this feature. Please sign in to your account or create a new one.',
}: AuthRequiredModalProps) {
	const router = useRouter()

	const handleSignIn = () => {
		onClose()
		router.push('/signin')
	}

	const handleSignUp = () => {
		onClose()
		router.push('/signup')
	}

	return (
		<ErrorModal
			isOpen={isOpen}
			onClose={() => {}} // Disable close functionality
			title={title}
			message={message}
			buttonText="Sign In"
			onButtonClick={handleSignIn}
			showSecondButton={true}
			secondButtonText="Sign Up"
			onSecondButtonClick={handleSignUp}
			showRetry={false}
			showCloseButton={false}
		/>
	)
}
