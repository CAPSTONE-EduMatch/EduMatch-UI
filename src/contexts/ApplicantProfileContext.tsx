'use client'

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	ReactNode,
	useRef,
} from 'react'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { ApiService } from '@/services/api/axios-config'

interface ApplicantProfileData {
	id: string
	role: string
	firstName: string
	lastName: string
	gender: string
	birthday: string
	nationality: string
	phoneNumber: string
	countryCode: string
	interests: string[]
	favoriteCountries: string[]
	profilePhoto?: string
	graduationStatus?: string
	degree?: string
	fieldOfStudy?: string
	university?: string
	graduationYear?: string
	gpa?: string
	countryOfStudy?: string
	scoreType?: string
	scoreValue?: string
	hasForeignLanguage?: string
	languages: Array<{
		id: string
		language: string
		certificate: string
		score: string
	}>
	researchPapers: Array<{
		id: string
		title: string
		discipline: string
		files: Array<{
			id: string
			file: {
				id: string
				name: string
				url: string
				size: number
			}
		}>
	}>
	uploadedFiles: Array<{
		id: string
		file: {
			id: string
			name: string
			url: string
			size: number
		}
		category: string
	}>
	user: {
		id: string
		name: string
		email: string
		image?: string
	}
	createdAt: string
	updatedAt: string
}

interface ApplicantProfileContextType {
	profile: ApplicantProfileData | null
	isLoading: boolean
	error: string | null
	refreshProfile: () => Promise<void>
	hasProfile: boolean | null // null = unknown, true = has profile, false = no profile
}

export const ApplicantProfileContext = createContext<
	ApplicantProfileContextType | undefined
>(undefined)

export function ApplicantProfileProvider({
	children,
}: {
	children: ReactNode
}) {
	const { isAuthenticated, user, isLoading: authLoading } = useAuthCheck()
	const [profile, setProfile] = useState<ApplicantProfileData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [hasProfile, setHasProfile] = useState<boolean | null>(null)
	const previousUserIdRef = useRef<string | undefined>(undefined)
	const fetchInProgressRef = useRef<Promise<any> | null>(null)

	// Load full profile data when authenticated
	const loadProfile = useCallback(async () => {
		// Clear profile when user logs out
		if (!isAuthenticated || !user) {
			setProfile(null)
			setIsLoading(false)
			setError(null)
			setHasProfile(null)
			previousUserIdRef.current = undefined
			fetchInProgressRef.current = null
			return
		}

		// Clear profile if user ID changed (different user logged in)
		if (previousUserIdRef.current && previousUserIdRef.current !== user.id) {
			setProfile(null)
			setHasProfile(null)
		}
		previousUserIdRef.current = user.id

		// If a fetch is already in progress, wait for it
		if (fetchInProgressRef.current) {
			try {
				await fetchInProgressRef.current
			} catch (error) {
				// Ignore errors from the in-progress fetch
			}
			return
		}

		setIsLoading(true)
		setError(null)

		// Create a shared promise for this fetch
		const fetchPromise = (async () => {
			try {
				const data = await ApiService.getProfile()
				if (data?.profile) {
					setProfile(data.profile)
					setHasProfile(true)
					return data.profile
				} else {
					setProfile(null)
					setHasProfile(false)
					return null
				}
			} catch (error: any) {
				if (error?.response?.status === 404 || error?.status === 404) {
					setProfile(null)
					setHasProfile(false)
					return null
				}
				setError('Failed to load profile data')
				setProfile(null)
				setHasProfile(null)
				throw error
			} finally {
				setIsLoading(false)
				fetchInProgressRef.current = null
			}
		})()

		fetchInProgressRef.current = fetchPromise
		return fetchPromise
	}, [isAuthenticated, user?.id])

	useEffect(() => {
		if (!authLoading) {
			loadProfile()
		}
	}, [authLoading, loadProfile])

	// Refresh profile function
	const refreshProfile = useCallback(async () => {
		if (!isAuthenticated || !user) return

		// Clear the in-progress fetch to force a new one
		fetchInProgressRef.current = null

		setIsLoading(true)
		setError(null)

		try {
			const data = await ApiService.getProfile()
			if (data?.profile) {
				setProfile(data.profile)
				setHasProfile(true)
			} else {
				setProfile(null)
				setHasProfile(false)
			}
		} catch (error: any) {
			if (error?.response?.status === 404 || error?.status === 404) {
				setProfile(null)
				setHasProfile(false)
			} else {
				setError('Failed to refresh profile data')
				setHasProfile(null)
			}
		} finally {
			setIsLoading(false)
		}
	}, [isAuthenticated, user?.id])

	const value: ApplicantProfileContextType = {
		profile,
		isLoading: isLoading || authLoading,
		error,
		refreshProfile,
		hasProfile,
	}

	return (
		<ApplicantProfileContext.Provider value={value}>
			{children}
		</ApplicantProfileContext.Provider>
	)
}

export function useApplicantProfileContext() {
	const context = useContext(ApplicantProfileContext)
	if (context === undefined) {
		throw new Error(
			'useApplicantProfileContext must be used within an ApplicantProfileProvider'
		)
	}
	return context
}
