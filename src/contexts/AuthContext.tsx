'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from '@/app/lib/auth-client'

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

// Cache key for localStorage
const AUTH_CACHE_KEY = 'edumatch_auth_state'

// Load auth state from localStorage
const loadAuthState = (): Partial<AuthState> => {
	try {
		if (typeof window !== 'undefined') {
			const cached = localStorage.getItem(AUTH_CACHE_KEY)
			if (cached) {
				const parsed = JSON.parse(cached)
				// Check if cache is still valid (less than 5 minutes old)
				if (Date.now() - parsed.lastCheck < 300000) {
					return {
						isAuthenticated: parsed.isAuthenticated,
						user: parsed.user,
						isLoading: false,
					}
				}
			}
		}
	} catch (error) {
		// Silently handle cache errors
	}
	return {
		isAuthenticated: false,
		user: null,
		isLoading: true,
	}
}

// Save auth state to localStorage
const saveAuthState = (state: Partial<AuthState> & { lastCheck: number }) => {
	try {
		if (typeof window !== 'undefined') {
			localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(state))
		}
	} catch (error) {
		// Silently handle cache errors
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [showAuthModal, setShowAuthModal] = useState(false)

	// Initialize from cache on mount
	useEffect(() => {
		const cachedState = loadAuthState()
		setIsAuthenticated(cachedState.isAuthenticated || false)
		setUser(cachedState.user || null)
		setIsLoading(cachedState.isLoading !== false)

		// Set modal visibility based on cached authentication status
		if (cachedState.isAuthenticated && cachedState.user) {
			setShowAuthModal(false)
		} else {
			setShowAuthModal(true)
		}
	}, [])

	// Check authentication on mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const session = await authClient.getSession()
				const hasUser = session?.data?.user
				const isAuth = !!(session?.data?.user && session?.data?.session)

				// Update state
				setIsAuthenticated(isAuth)
				setUser(hasUser)
				setIsLoading(false)

				// Set modal visibility
				if (hasUser) {
					setShowAuthModal(false)
				} else {
					setShowAuthModal(true)
				}

				// Save to cache
				saveAuthState({
					isAuthenticated: isAuth,
					user: hasUser,
					lastCheck: Date.now(),
				})
			} catch (error) {
				setIsAuthenticated(false)
				setUser(null)
				setIsLoading(false)
				setShowAuthModal(true)

				// Save to cache
				saveAuthState({
					isAuthenticated: false,
					user: null,
					lastCheck: Date.now(),
				})
			}
		}

		checkAuth()
	}, [])

	const refreshAuth = async () => {
		if (isLoading) return

		setIsLoading(true)
		try {
			const session = await authClient.getSession()
			const hasUser = session?.data?.user
			const isAuth = !!(session?.data?.user && session?.data?.session)

			setIsAuthenticated(isAuth)
			setUser(hasUser)

			if (hasUser) {
				setShowAuthModal(false)
			} else {
				setShowAuthModal(true)
			}

			// Save to cache
			saveAuthState({
				isAuthenticated: isAuth,
				user: hasUser,
				lastCheck: Date.now(),
			})
		} catch (error) {
			setIsAuthenticated(false)
			setUser(null)
			setShowAuthModal(true)

			// Save to cache
			saveAuthState({
				isAuthenticated: false,
				user: null,
				lastCheck: Date.now(),
			})
		} finally {
			setIsLoading(false)
		}
	}

	const clearAuthCache = async () => {
		try {
			// Clear browser storage
			localStorage.clear()
			sessionStorage.clear()

			// Clear cookies (if any)
			document.cookie.split(';').forEach((c) => {
				const eqPos = c.indexOf('=')
				const name = eqPos > -1 ? c.substr(0, eqPos) : c
				document.cookie =
					name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
			})

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
