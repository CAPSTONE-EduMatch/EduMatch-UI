'use client'

import {
	ApplicationEligibility,
	useApplicationEligibility,
} from '@/hooks/application/useApplicationEligibility'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import React, { createContext, useCallback, useContext, useEffect } from 'react'

interface SubscriptionProgressContextType extends ApplicationEligibility {
	refresh: () => void
	refreshAfterApplication: () => void
}

const SubscriptionProgressContext =
	createContext<SubscriptionProgressContextType | null>(null)

interface SubscriptionProgressProviderProps {
	children: React.ReactNode
	autoRefreshInterval?: number
}

export function SubscriptionProgressProvider({
	children,
	autoRefreshInterval = 60000, // 1 minute default
}: SubscriptionProgressProviderProps) {
	const { isAuthenticated, user } = useAuthCheck()
	const applicantId = user?.id

	const eligibilityData = useApplicationEligibility(applicantId)

	// Auto-refresh on interval for real-time updates
	useEffect(() => {
		if (!autoRefreshInterval || !isAuthenticated) return

		const interval = setInterval(() => {
			eligibilityData.refresh()
		}, autoRefreshInterval)

		return () => clearInterval(interval)
	}, [autoRefreshInterval, isAuthenticated, eligibilityData])

	// Enhanced refresh function for post-application updates
	const refreshAfterApplication = useCallback(() => {
		// Immediate refresh after application submission
		eligibilityData.refresh()

		// Additional refresh after 2 seconds to account for any server processing delays
		setTimeout(() => {
			eligibilityData.refresh()
		}, 2000)
	}, [eligibilityData])

	const contextValue: SubscriptionProgressContextType = {
		...eligibilityData,
		refreshAfterApplication,
	}

	return (
		<SubscriptionProgressContext.Provider value={contextValue}>
			{children}
		</SubscriptionProgressContext.Provider>
	)
}

export function useSubscriptionProgress(): SubscriptionProgressContextType {
	const context = useContext(SubscriptionProgressContext)
	if (!context) {
		throw new Error(
			'useSubscriptionProgress must be used within a SubscriptionProgressProvider'
		)
	}
	return context
}

// Hook for triggering refresh after application actions
export function useRefreshAfterApplication() {
	const { refreshAfterApplication } = useSubscriptionProgress()
	return refreshAfterApplication
}
