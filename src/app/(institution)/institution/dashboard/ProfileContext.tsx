'use client'

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	ReactNode,
} from 'react'
import { useUserProfile } from '@/hooks/profile/useUserProfile'
import { ApiService } from '@/services/api/axios-config'

interface ProfileContextType {
	profile: any | null
	isLoading: boolean
	error: string | null
	refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
	const { profile: userProfile, isLoading: userProfileLoading } =
		useUserProfile()

	const [profile, setProfile] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const previousUserIdRef = React.useRef<string | undefined>(undefined)

	// Load full profile data when userProfile is available
	useEffect(() => {
		const loadFullProfile = async () => {
			// Clear profile if userProfile is null (user logged out)
			if (!userProfile) {
				setProfile(null)
				setIsLoading(false)
				setError(null)
				previousUserIdRef.current = undefined
				return
			}

			// Clear profile if user ID changed (different user logged in)
			if (
				previousUserIdRef.current &&
				previousUserIdRef.current !== userProfile.id
			) {
				setProfile(null)
			}
			previousUserIdRef.current = userProfile.id

			if (userProfileLoading) {
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const data = await ApiService.getProfile()
				setProfile(data.profile)
			} catch (error: any) {
				setError('Failed to load profile data')
				setProfile(null) // Clear profile on error
			} finally {
				setIsLoading(false)
			}
		}

		loadFullProfile()
	}, [userProfile, userProfileLoading])

	// Refresh profile function
	const refreshProfile = useCallback(async () => {
		if (!userProfile) return

		setIsLoading(true)
		setError(null)

		try {
			const data = await ApiService.getProfile()
			setProfile(data.profile)
		} catch (error: any) {
			setError('Failed to refresh profile data')
		} finally {
			setIsLoading(false)
		}
	}, [userProfile])

	const value: ProfileContextType = {
		profile,
		isLoading: isLoading || userProfileLoading,
		error,
		refreshProfile,
	}

	return (
		<ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
	)
}

export function useProfileContext() {
	const context = useContext(ProfileContext)
	if (context === undefined) {
		throw new Error('useProfileContext must be used within a ProfileProvider')
	}
	return context
}
