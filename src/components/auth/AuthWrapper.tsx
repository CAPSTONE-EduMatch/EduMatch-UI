'use client'

import { useAuthCheck } from '@/hooks/useAuthCheck'
import { useRouter } from 'next/navigation'
import { ErrorModal } from '@/components/ui'

interface AuthWrapperProps {
	children: React.ReactNode
	pageTitle?: string
	pageDescription?: string
}

export function AuthWrapper({
	children,
	pageTitle = 'Protected Page',
	pageDescription = 'Please sign in to access this page',
}: AuthWrapperProps) {
	const router = useRouter()
	const {
		isAuthenticated,
		showAuthModal,
		handleCloseModal: closeAuthModal,
		isLoading: authLoading,
	} = useAuthCheck()

	// Show loading state while checking authentication
	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading...</p>
				</div>
			</div>
		)
	}

	// Show authentication modal if user is not authenticated
	if (!isAuthenticated) {
		const handleSignIn = () => {
			router.push('/signin')
		}

		const handleSignUp = () => {
			router.push('/signup')
		}

		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-primary mb-4">{pageTitle}</h1>
					<p className="text-muted-foreground">{pageDescription}</p>
				</div>
				<ErrorModal
					isOpen={showAuthModal}
					onClose={() => {}} // Disable close functionality
					title="Authentication Required"
					message="You need to sign in to access this feature. Please sign in to your account or create a new one."
					buttonText="Sign In"
					onButtonClick={handleSignIn}
					showSecondButton={true}
					secondButtonText="Sign Up"
					onSecondButtonClick={handleSignUp}
					showRetry={false}
					showCloseButton={false}
				/>
			</div>
		)
	}

	// User is authenticated, render the protected content
	return <>{children}</>
}
