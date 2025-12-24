'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import axios from 'axios'

interface InstitutionRedirectProps {
	children: React.ReactNode
}

export const InstitutionRedirect: React.FC<InstitutionRedirectProps> = ({
	children,
}) => {
	const router = useRouter()
	const { isAuthenticated, user } = useAuthCheck()

	useEffect(() => {
		const checkUserRole = async () => {
			if (!isAuthenticated || !user) return

			const currentPath = window.location.pathname

			// Don't redirect if already on institution routes, admin routes, or profile routes
			// These routes have their own redirect logic
			if (
				currentPath.startsWith('/institution/') ||
				currentPath.startsWith('/admin') ||
				currentPath.startsWith('/profile')
			) {
				return
			}

			try {
				const response = await axios.get('/api/profile')
				const profile = response.data?.profile

				if (profile?.role === 'admin') {
					// Admin user - redirect to admin dashboard
					// Only redirect if not already on an admin route to prevent loops
					if (!currentPath.includes('/admin')) {
						router.replace('/admin')
					}
				} else if (profile?.role === 'institution') {
					// Institution user trying to access public pages - redirect to institution dashboard
					// Only redirect if not already on institution route to prevent loops
					if (!currentPath.startsWith('/institution/')) {
						router.replace('/institution/dashboard')
					}
				}
			} catch (error) {
				// If profile doesn't exist or error, let them stay on public pages
				console.log('Profile check failed, allowing access to public pages')
			}
		}

		checkUserRole()
	}, [isAuthenticated, user, router])

	return <>{children}</>
}
