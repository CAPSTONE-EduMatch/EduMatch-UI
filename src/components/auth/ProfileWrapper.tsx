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
		const checkProfile = async (retryCount = 0) => {
			const maxRetries = 2
			const retryDelay = 500

			// Wait for authentication to complete
			if (authLoading) {
				return
			}

			if (!isAuthenticated || !user?.id) {
				setIsCheckingProfile(false)
				return
			}

			try {
				// Wait a bit for session to be fully established on first attempt
				if (retryCount === 0) {
					await new Promise((resolve) => setTimeout(resolve, 300))
				}

				const response = await fetch('/api/profile', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				})

				if (response.ok) {
					const data = await response.json()
					// Check if profile actually exists in the response
					if (data?.profile) {
						setHasProfile(true)
					} else {
						setHasProfile(false)
					}
				} else if (response.status === 404) {
					// Profile doesn't exist
					setHasProfile(false)
				} else if (response.status === 500 && retryCount < maxRetries) {
					// Server error, retry
					// eslint-disable-next-line no-console
					console.warn(
						`Profile check failed with 500, retrying... (${retryCount + 1}/${maxRetries})`
					)
					await new Promise((resolve) =>
						setTimeout(resolve, retryDelay * (retryCount + 1))
					)
					return checkProfile(retryCount + 1)
				} else {
					// Other errors - assume profile might exist to avoid false negatives
					// Only set to false if it's a clear 404
					setHasProfile(null) // Set to null to indicate uncertainty
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Error checking profile:', error)
				// On network errors, don't assume no profile - set to null
				if (retryCount < maxRetries) {
					await new Promise((resolve) =>
						setTimeout(resolve, retryDelay * (retryCount + 1))
					)
					return checkProfile(retryCount + 1)
				}
				// After max retries, set to null (uncertain) rather than false
				setHasProfile(null)
			} finally {
				setIsCheckingProfile(false)
			}
		}

		checkProfile()
	}, [isAuthenticated, user?.id, authLoading])

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
