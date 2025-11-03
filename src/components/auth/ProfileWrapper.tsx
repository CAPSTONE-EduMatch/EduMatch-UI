'use client'

import { useRouter } from 'next/navigation'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { ErrorModal } from '@/components/ui'
import { useState, useEffect } from 'react'

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
	const { isAuthenticated, user, isLoading: authLoading } = useAuthCheck()
	const [isCheckingProfile, setIsCheckingProfile] = useState(true)
	const [hasProfile, setHasProfile] = useState<boolean | null>(null)

	// Check if user has a profile
	useEffect(() => {
		const checkProfile = async () => {
			// Wait for authentication to complete
			if (authLoading) {
				return
			}

			if (!isAuthenticated || !user?.id) {
				setIsCheckingProfile(false)
				return
			}

			try {
				const response = await fetch('/api/profile', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				})

				if (response.ok) {
					setHasProfile(true)
				} else {
					setHasProfile(false)
				}
			} catch (error) {
				console.error('Error checking profile:', error)
				setHasProfile(false)
			} finally {
				setIsCheckingProfile(false)
			}
		}

		checkProfile()
	}, [isAuthenticated, user?.id, authLoading])

	// Show profile creation modal if user doesn't have a profile
	if (isAuthenticated && hasProfile === false) {
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
