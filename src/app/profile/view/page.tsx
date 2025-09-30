'use client'

import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import { ApiService } from '@/lib/axios-config'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { AuthRequiredModal } from '@/components/auth'
import { useState, useEffect } from 'react'

interface ProfileData {
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

export default function ViewProfile() {
	const [profile, setProfile] = useState<ProfileData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Use the authentication check hook
	const {
		isAuthenticated,
		showAuthModal,
		handleCloseModal: closeAuthModal,
		isLoading: authLoading,
	} = useAuthCheck()

	// Get current user ID and fetch profile
	useEffect(() => {
		const getCurrentUserAndProfile = async () => {
			if (!isAuthenticated) {
				setLoading(false)
				return
			}

			try {
				// Fetch profile data using cached API service
				const data = await ApiService.getProfile()
				setProfile(data.profile)
			} catch (error) {
				console.error('Failed to get current user:', error)
				setError('Failed to load profile')
			} finally {
				setLoading(false)
			}
		}
		getCurrentUserAndProfile()
	}, [isAuthenticated])

	const refreshProfile = async () => {
		setLoading(true)
		try {
			const data = await ApiService.getProfile()
			setProfile(data.profile)
		} catch (error) {
			setError('Failed to refresh profile')
		} finally {
			setLoading(false)
		}
	}

	// Show loading state while checking auth or profile
	if (authLoading || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
					<p className="mt-4 text-muted-foreground">Loading profile...</p>
				</div>
			</div>
		)
	}

	// Show authentication modal if user is not authenticated
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-primary mb-4">Profile View</h1>
					<p className="text-muted-foreground">
						Please sign in to view your profile
					</p>
				</div>
				<AuthRequiredModal isOpen={showAuthModal} onClose={closeAuthModal} />
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="text-red-500 text-6xl mb-4">⚠️</div>
						<h2 className="text-xl font-semibold mb-2">Error</h2>
						<p className="text-muted-foreground mb-4">{error}</p>
						<Button onClick={refreshProfile}>Try Again</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!profile) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="text-6xl mb-4">👤</div>
						<h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
						<p className="text-muted-foreground mb-4">
							You haven&apos;t created a profile yet.
						</p>
						<Button
							onClick={() => (window.location.href = '/profile/create-profile')}
						>
							Create Profile
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-primary">My Profile</h1>
					<p className="text-muted-foreground">
						View and manage your profile information
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Photo & Basic Info */}
					<div className="lg:col-span-1">
						<Card>
							<CardContent className="p-6">
								<div className="text-center">
									{profile.profilePhoto ? (
										<img
											src={profile.profilePhoto}
											alt="Profile"
											className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
										/>
									) : (
										<div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
											<span className="text-4xl">👤</span>
										</div>
									)}
									<h2 className="text-xl font-semibold">
										{profile.firstName} {profile.lastName}
									</h2>
									<p className="text-muted-foreground">{profile.user.email}</p>
									<div className="mt-2">
										<span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
											{profile.role === 'applicant' ? 'Student' : 'Institution'}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Detailed Information */}
					<div className="lg:col-span-2 space-y-6">
						{/* Personal Information */}
						<Card>
							<CardContent className="p-6">
								<h3 className="text-lg font-semibold mb-4">
									Personal Information
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Gender
										</label>
										<p className="text-sm">{profile.gender}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Birthday
										</label>
										<p className="text-sm">{profile.birthday}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Nationality
										</label>
										<p className="text-sm">{profile.nationality}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Phone
										</label>
										<p className="text-sm">
											{profile.countryCode} {profile.phoneNumber}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Academic Information */}
						{profile.role === 'applicant' && (
							<Card>
								<CardContent className="p-6">
									<h3 className="text-lg font-semibold mb-4">
										Academic Information
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{profile.graduationStatus && (
											<div>
												<label className="text-sm font-medium text-muted-foreground">
													Graduation Status
												</label>
												<p className="text-sm">{profile.graduationStatus}</p>
											</div>
										)}
										{profile.degree && (
											<div>
												<label className="text-sm font-medium text-muted-foreground">
													Degree
												</label>
												<p className="text-sm">{profile.degree}</p>
											</div>
										)}
										{profile.fieldOfStudy && (
											<div>
												<label className="text-sm font-medium text-muted-foreground">
													Field of Study
												</label>
												<p className="text-sm">{profile.fieldOfStudy}</p>
											</div>
										)}
										{profile.university && (
											<div>
												<label className="text-sm font-medium text-muted-foreground">
													University
												</label>
												<p className="text-sm">{profile.university}</p>
											</div>
										)}
										{profile.graduationYear && (
											<div>
												<label className="text-sm font-medium text-muted-foreground">
													Graduation Year
												</label>
												<p className="text-sm">{profile.graduationYear}</p>
											</div>
										)}
										{profile.gpa && (
											<div>
												<label className="text-sm font-medium text-muted-foreground">
													GPA
												</label>
												<p className="text-sm">{profile.gpa}</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Languages */}
						{profile.languages.length > 0 && (
							<Card>
								<CardContent className="p-6">
									<h3 className="text-lg font-semibold mb-4">
										Language Certifications
									</h3>
									<div className="space-y-3">
										{profile.languages.map((lang: any, index: number) => (
											<div key={index} className="border rounded-lg p-3">
												<div className="flex justify-between items-start">
													<div>
														<p className="font-medium">{lang.language}</p>
														<p className="text-sm text-muted-foreground">
															{lang.certificate}
														</p>
													</div>
													<span className="text-sm font-medium">
														{lang.score}
													</span>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Research Papers */}
						{profile.researchPapers.length > 0 && (
							<Card>
								<CardContent className="p-6">
									<h3 className="text-lg font-semibold mb-4">
										Research Papers
									</h3>
									<div className="space-y-3">
										{profile.researchPapers.map((paper: any, index: number) => (
											<div key={index} className="border rounded-lg p-3">
												<h4 className="font-medium">{paper.title}</h4>
												<p className="text-sm text-muted-foreground">
													{paper.discipline}
												</p>
												{paper.files.length > 0 && (
													<div className="mt-2">
														<p className="text-xs text-muted-foreground">
															{paper.files.length} file(s) attached
														</p>
													</div>
												)}
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Uploaded Files */}
						{profile.uploadedFiles.length > 0 && (
							<Card>
								<CardContent className="p-6">
									<h3 className="text-lg font-semibold mb-4">
										Uploaded Documents
									</h3>
									<div className="space-y-2">
										{profile.uploadedFiles.map((file: any, index: number) => (
											<div
												key={index}
												className="flex items-center justify-between border rounded-lg p-3"
											>
												<div className="flex items-center gap-3">
													<span className="text-2xl">📄</span>
													<div>
														<p className="font-medium">{file.file.name}</p>
														<p className="text-xs text-muted-foreground">
															{(file.file.size / 1024).toFixed(1)} KB •{' '}
															{file.category}
														</p>
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => window.open(file.file.url, '_blank')}
												>
													View
												</Button>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="mt-8 flex gap-4">
					<Button
						onClick={() => (window.location.href = '/profile/create-profile')}
					>
						Edit Profile
					</Button>
					<Button
						variant="outline"
						onClick={() => (window.location.href = '/')}
					>
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	)
}
