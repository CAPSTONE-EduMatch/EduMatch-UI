'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from '@/config/auth-client'
import { clearSessionCache } from '@/services/messaging/appsync-client'

interface AuthState {
	isAuthenticated: boolean
	user: any
	isLoading: boolean
	showAuthModal: boolean
}

interface AuthContextType extends AuthState {
	refreshAuth: () => Promise<void>
	clearAuthCache: () => Promise<void>
	handleCloseModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global flag to prevent multiple simultaneous auth checks
let isCheckingAuth = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [showAuthModal, setShowAuthModal] = useState(false)

	// Single authentication check on mount - leveraging Better Auth's built-in caching
	useEffect(() => {
		const checkAuth = async () => {
			// Prevent multiple simultaneous calls
			if (isCheckingAuth) {
				return
			}

			isCheckingAuth = true
			try {
				// Use Better Auth's built-in caching with disableCookieCache for fresh data
				const session = await authClient.getSession({
					query: {
						disableCookieCache: false, // Use cookie cache for better performance
					},
				})

				const hasUser = session?.data?.user
				const isAuth = !!(session?.data?.user && session?.data?.session)

				setIsAuthenticated(isAuth)
				setUser(hasUser)
				setIsLoading(false)
				setShowAuthModal(!hasUser)
			} catch (error) {
				setIsAuthenticated(false)
				setUser(null)
				setIsLoading(false)
				setShowAuthModal(true)
			} finally {
				isCheckingAuth = false
			}
		}

		checkAuth()
	}, [])

	const refreshAuth = async () => {
		if (isCheckingAuth) return

		setIsLoading(true)
		isCheckingAuth = true
		try {
			// Force fresh data by disabling cookie cache
			const session = await authClient.getSession({
				query: {
					disableCookieCache: true,
				},
			})

			const hasUser = session?.data?.user
			const isAuth = !!(session?.data?.user && session?.data?.session)

			setIsAuthenticated(isAuth)
			setUser(hasUser)
			setShowAuthModal(!hasUser)
		} catch (error) {
			setIsAuthenticated(false)
			setUser(null)
			setShowAuthModal(true)
		} finally {
			setIsLoading(false)
			isCheckingAuth = false
		}
	}

	const clearAuthCache = async () => {
		try {
			// Clear AppSync session cache
			clearSessionCache()

			// Clear Better Auth session
			await authClient.signOut()

			// Clear browser storage
			localStorage.clear()
			sessionStorage.clear()

			// Reset state
			setIsAuthenticated(false)
			setUser(null)
			setIsLoading(true)
			setShowAuthModal(true)

			// Force re-check auth
			window.location.reload()
		} catch (error) {
			// Cache clear failed silently
		}
	}

	const handleCloseModal = () => {
		setShowAuthModal(false)
	}

	const value: AuthContextType = {
		isAuthenticated,
		user,
		isLoading,
		showAuthModal,
		refreshAuth,
		clearAuthCache,
		handleCloseModal,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
