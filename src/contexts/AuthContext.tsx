'use client'

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useRef,
} from 'react'
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

// Client-side session cache to prevent excessive API calls
interface SessionCache {
	session: any
	timestamp: number
}

let globalSessionCache: SessionCache | null = null
const SESSION_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes - cache session for 2 minutes
const MIN_CALL_INTERVAL = 5 * 1000 // Minimum 5 seconds between API calls

let lastCallTime = 0

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [showAuthModal, setShowAuthModal] = useState(false)
	const hasInitialized = useRef(false)

	// Single authentication check on mount - leveraging Better Auth's built-in caching
	useEffect(() => {
		// Prevent double calls in React Strict Mode
		if (hasInitialized.current) {
			return
		}
		hasInitialized.current = true

		const checkAuth = async () => {
			// Prevent multiple simultaneous calls
			if (isCheckingAuth) {
				return
			}

			// Check if we have a valid cached session
			const now = Date.now()
			if (
				globalSessionCache &&
				now - globalSessionCache.timestamp < SESSION_CACHE_DURATION
			) {
				const cachedSession = globalSessionCache.session
				const hasUser = cachedSession?.data?.user
				const isAuth = !!(
					cachedSession?.data?.user && cachedSession?.data?.session
				)

				setIsAuthenticated(isAuth)
				setUser(hasUser)
				setIsLoading(false)
				setShowAuthModal(!hasUser)
				return
			}

			// Throttle API calls - don't call if we just called recently
			if (now - lastCallTime < MIN_CALL_INTERVAL) {
				// Use cached data if available, even if expired
				if (globalSessionCache) {
					const cachedSession = globalSessionCache.session
					const hasUser = cachedSession?.data?.user
					const isAuth = !!(
						cachedSession?.data?.user && cachedSession?.data?.session
					)

					setIsAuthenticated(isAuth)
					setUser(hasUser)
					setIsLoading(false)
					setShowAuthModal(!hasUser)
				}
				return
			}

			isCheckingAuth = true
			lastCallTime = now

			try {
				// Use Better Auth's built-in caching with disableCookieCache for fresh data
				const session = await authClient.getSession({
					query: {
						disableCookieCache: false, // Use cookie cache for better performance
					},
				})

				// Update cache
				globalSessionCache = {
					session,
					timestamp: now,
				}

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
				// Clear cache on error
				globalSessionCache = null
			} finally {
				isCheckingAuth = false
			}
		}

		checkAuth()
	}, [])

	const refreshAuth = async () => {
		if (isCheckingAuth) return

		// Throttle refresh calls
		const now = Date.now()
		if (now - lastCallTime < MIN_CALL_INTERVAL) {
			return
		}

		setIsLoading(true)
		isCheckingAuth = true
		lastCallTime = now

		try {
			// Force fresh data by disabling cookie cache
			const session = await authClient.getSession({
				query: {
					disableCookieCache: true,
				},
			})

			// Update cache
			globalSessionCache = {
				session,
				timestamp: now,
			}

			const hasUser = session?.data?.user
			const isAuth = !!(session?.data?.user && session?.data?.session)

			setIsAuthenticated(isAuth)
			setUser(hasUser)
			setShowAuthModal(!hasUser)
		} catch (error) {
			setIsAuthenticated(false)
			setUser(null)
			setShowAuthModal(true)
			// Clear cache on error
			globalSessionCache = null
		} finally {
			setIsLoading(false)
			isCheckingAuth = false
		}
	}

	const clearAuthCache = async () => {
		try {
			// Clear AppSync session cache
			clearSessionCache()

			// Clear global session cache
			globalSessionCache = null
			lastCallTime = 0

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
