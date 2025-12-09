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
	// Track if we got a rate limit error - don't retry immediately
	rateLimited?: boolean
	rateLimitUntil?: number
}

let globalSessionCache: SessionCache | null = null
const SESSION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes - cache session for 5 minutes to reduce API calls
const MIN_CALL_INTERVAL = 10 * 1000 // Minimum 10 seconds between API calls
const RATE_LIMIT_BACKOFF = 60 * 1000 // 60 seconds - wait 1 minute after rate limit before retrying

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
				// If we're rate limited, respect the backoff period
				if (
					globalSessionCache.rateLimited &&
					globalSessionCache.rateLimitUntil &&
					now < globalSessionCache.rateLimitUntil
				) {
					// Still use cached data but don't make new requests
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

			// Check if we're still in rate limit backoff period
			if (
				globalSessionCache?.rateLimited &&
				globalSessionCache?.rateLimitUntil &&
				now < globalSessionCache.rateLimitUntil
			) {
				// Use cached data and don't make new requests
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

			isCheckingAuth = true
			lastCallTime = now

			try {
				// Use Better Auth's built-in caching with disableCookieCache for fresh data
				const session = await authClient.getSession({
					query: {
						disableCookieCache: false, // Use cookie cache for better performance
					},
				})

				// Update cache - clear rate limit flags on success
				globalSessionCache = {
					session,
					timestamp: now,
					rateLimited: false,
				}

				const hasUser = session?.data?.user
				const isAuth = !!(session?.data?.user && session?.data?.session)

				setIsAuthenticated(isAuth)
				setUser(hasUser)
				setIsLoading(false)
				setShowAuthModal(!hasUser)
			} catch (error: any) {
				// Check if this is a rate limit error (429)
				const isRateLimit =
					error?.status === 429 ||
					error?.response?.status === 429 ||
					error?.message?.includes('429') ||
					error?.message?.includes('rate limit') ||
					error?.message?.includes('Too Many Requests')

				if (isRateLimit) {
					// Cache the "no session" result with rate limit backoff
					// Preserve last known session if available, otherwise use null
					const lastSession = globalSessionCache?.session || null
					globalSessionCache = {
						session: lastSession,
						timestamp: now,
						rateLimited: true,
						rateLimitUntil: now + RATE_LIMIT_BACKOFF,
					}

					// Set state based on cached session
					if (lastSession?.data?.user) {
						const hasUser = lastSession.data.user
						const isAuth = !!(hasUser && lastSession.data.session)
						setIsAuthenticated(isAuth)
						setUser(hasUser)
					} else {
						setIsAuthenticated(false)
						setUser(null)
					}
					setIsLoading(false)
					setShowAuthModal(!lastSession?.data?.user)
				} else {
					// For other errors, set unauthenticated but don't clear cache immediately
					// This prevents rapid retries
					setIsAuthenticated(false)
					setUser(null)
					setIsLoading(false)
					setShowAuthModal(true)

					// Only clear cache if it's been a while since last successful check
					// This prevents clearing cache on transient errors
					if (
						!globalSessionCache ||
						now - globalSessionCache.timestamp > SESSION_CACHE_DURATION
					) {
						globalSessionCache = {
							session: null,
							timestamp: now,
							rateLimited: false,
						}
					}
				}
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
		} catch (error: any) {
			// Check if this is a rate limit error (429)
			const isRateLimit =
				error?.status === 429 ||
				error?.response?.status === 429 ||
				error?.message?.includes('429') ||
				error?.message?.includes('rate limit') ||
				error?.message?.includes('Too Many Requests')

			if (isRateLimit) {
				// Cache the "no session" result with rate limit backoff
				globalSessionCache = {
					session: null,
					timestamp: Date.now(),
					rateLimited: true,
					rateLimitUntil: Date.now() + RATE_LIMIT_BACKOFF,
				}
			} else {
				// For other errors, preserve cache if recent
				if (
					!globalSessionCache ||
					Date.now() - globalSessionCache.timestamp > SESSION_CACHE_DURATION
				) {
					globalSessionCache = {
						session: null,
						timestamp: Date.now(),
						rateLimited: false,
					}
				}
			}

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

	// Global status update - keeps users online regardless of which page they're on
	useEffect(() => {
		if (!isAuthenticated || !user?.id) return

		// Function to update status
		const updateStatus = () => {
			fetch('/api/users/status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ isOnline: true }),
			}).catch(() => {
				// Handle error silently
			})
		}

		// Update immediately when user is authenticated
		updateStatus()

		// Update status every 2 minutes (shorter than 5-minute threshold to prevent going offline)
		const statusInterval = setInterval(() => {
			// Only update if tab is visible (user is likely active)
			if (document.visibilityState === 'visible') {
				updateStatus()
			}
		}, 120000) // 2 minutes

		// Update status when tab becomes visible (user returns to tab)
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				updateStatus()
			}
		}

		// Track user activity (mouse movement, keyboard, clicks, scroll)
		let activityTimeout: NodeJS.Timeout | null = null
		const handleActivity = () => {
			// Clear existing timeout
			if (activityTimeout) {
				clearTimeout(activityTimeout)
			}

			// Update status after 30 seconds of activity (debounce)
			activityTimeout = setTimeout(() => {
				if (document.visibilityState === 'visible') {
					updateStatus()
				}
			}, 30000) // 30 seconds
		}

		// Add event listeners for activity detection
		window.addEventListener('visibilitychange', handleVisibilityChange)
		window.addEventListener('mousemove', handleActivity, { passive: true })
		window.addEventListener('keydown', handleActivity, { passive: true })
		window.addEventListener('click', handleActivity, { passive: true })
		window.addEventListener('scroll', handleActivity, { passive: true })

		return () => {
			clearInterval(statusInterval)
			window.removeEventListener('visibilitychange', handleVisibilityChange)
			window.removeEventListener('mousemove', handleActivity)
			window.removeEventListener('keydown', handleActivity)
			window.removeEventListener('click', handleActivity)
			window.removeEventListener('scroll', handleActivity)
			if (activityTimeout) {
				clearTimeout(activityTimeout)
			}
		}
	}, [isAuthenticated, user?.id])

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
