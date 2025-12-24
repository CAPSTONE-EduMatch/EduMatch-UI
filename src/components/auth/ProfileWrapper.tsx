'use client'

import { useRouter } from 'next/navigation'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { ErrorModal } from '@/components/ui'
import { useContext } from 'react'
import { ApplicantProfileContext } from '@/contexts/ApplicantProfileContext'

interface ProfileWrapperProps {
	children: React.ReactNode
	pageTitle?: string
	pageDescription?: string
	redirectTo?: string
}

export function ProfileWrapper({
	children,
	pageTitle = 'Profile Required',
	pageDescription = 'Please create your profile to access this feature',
	redirectTo = '/profile/create',
}: ProfileWrapperProps) {
	const router = useRouter()
	const { isAuthenticated, isLoading: authLoading } = useAuthCheck()

	// Use shared profile context if available (only in applicant routes)
	// Use useContext directly to check if provider exists without throwing
	// This allows ProfileWrapper to work in both applicant and institution contexts
	const context = useContext(ApplicantProfileContext)
	const hasProfile = context?.hasProfile ?? null
	const profileLoading = context?.isLoading ?? false

	const isCheckingProfile = profileLoading || authLoading

	// Show profile creation modal if user doesn't have a profile
	// Only show if we're certain the profile doesn't exist (hasProfile === false)
	// Don't show if hasProfile is null (uncertain) to avoid false positives
	if (isAuthenticated && hasProfile === false && !isCheckingProfile) {
		const handleCreateProfile = () => {
			router.push(redirectTo)
		}

		return (
			<>
				{/* Render the children but with a modal overlay */}
				<div className="relative">
					{children}
					{/* Modal overlay */}
					<div>
						<ErrorModal
							isOpen={true}
							onClose={() => {}} // Disable close functionality to force profile creation
							title="Profile Required"
							message="You need to create a profile to access this feature. Please create your profile to continue."
							buttonText="Create Profile"
							onButtonClick={handleCreateProfile}
							showRetry={false}
							showCloseButton={false}
						/>
					</div>
				</div>
			</>
		)
	}

	// User has profile, render the protected content
	return <>{children}</>
}
