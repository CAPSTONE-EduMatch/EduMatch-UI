'use client'

import { PasswordChangeSection } from '@/components/profile/shared/PasswordChangeSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { authClient } from '@/config/auth-client'
import { useAdminAuth } from '@/hooks/auth/useAdminAuth'
import { KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminSettingsPage() {
	const router = useRouter()
	const { isAdmin, isLoading } = useAdminAuth()
	const [showPassword, setShowPassword] = useState(false)
	const [profile, setProfile] = useState<any>(null)
	const [loadingProfile, setLoadingProfile] = useState(true)

	useEffect(() => {
		// Redirect if not admin
		if (!isLoading && !isAdmin) {
			router.push('/signin')
		}
	}, [isAdmin, isLoading, router])

	useEffect(() => {
		// Fetch admin profile data
		const fetchProfile = async () => {
			try {
				// Get current session
				const session = await authClient.getSession()
				if (!session?.data?.user?.id) {
					setLoadingProfile(false)
					return
				}

				const response = await fetch(`/api/profile/${session.data.user.id}`)
				if (response.ok) {
					const data = await response.json()
					setProfile(data)
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to fetch admin profile:', error)
			} finally {
				setLoadingProfile(false)
			}
		}

		if (isAdmin && !isLoading) {
			fetchProfile()
		}
	}, [isAdmin, isLoading])

	if (isLoading || loadingProfile) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#126E64]"></div>
			</div>
		)
	}

	if (!isAdmin) {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-8 py-6">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-[#126E64] rounded-lg flex items-center justify-center">
						<KeyRound className="w-5 h-5 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
						<p className="text-sm text-gray-500">
							Manage your admin account security
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-4xl mx-auto px-8 py-8">
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="text-xl font-semibold text-gray-900">
							Security Settings
						</CardTitle>
						<p className="text-sm text-gray-500 mt-1">
							Update your password to keep your account secure
						</p>
					</CardHeader>
					<CardContent>
						{profile ? (
							<PasswordChangeSection
								profile={profile}
								showPassword={showPassword}
								setShowPassword={setShowPassword}
							/>
						) : (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#126E64]"></div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Additional Info Card */}
				<Card className="shadow-sm mt-6">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-gray-900">
							Password Requirements
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2 text-sm text-gray-600">
							<li className="flex items-start gap-2">
								<span className="text-[#126E64] mt-1">•</span>
								<span>Minimum 12 characters long</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-[#126E64] mt-1">•</span>
								<span>At least one uppercase letter (A-Z)</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-[#126E64] mt-1">•</span>
								<span>At least one lowercase letter (a-z)</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-[#126E64] mt-1">•</span>
								<span>At least one number (0-9)</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-[#126E64] mt-1">•</span>
								<span>At least one special character (!@#$%^&*)</span>
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
