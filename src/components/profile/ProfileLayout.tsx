'use client'

import React, { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
	User,
	GraduationCap,
	Heart,
	FileText,
	CreditCard,
	Settings,
	Edit,
	ArrowLeft,
	Building2,
} from 'lucide-react'
import Button from '@/components/ui/Button'

type ProfileSection =
	| 'profile'
	| 'academic'
	| 'wishlist'
	| 'application'
	| 'payment'
	| 'settings'

const profileSections = [
	{ id: 'profile' as ProfileSection, label: 'Profile Info', icon: User },
	{ id: 'academic' as ProfileSection, label: 'Academic', icon: GraduationCap },
	{ id: 'wishlist' as ProfileSection, label: 'Wishlist', icon: Heart },
	{
		id: 'application' as ProfileSection,
		label: 'Applications',
		icon: FileText,
	},
	{ id: 'payment' as ProfileSection, label: 'Payment', icon: CreditCard },
	{ id: 'settings' as ProfileSection, label: 'Settings', icon: Settings },
]

interface ProfileLayoutProps {
	activeSection: ProfileSection
	onSectionChange: (section: ProfileSection) => void
	children: React.ReactNode
	profile: any
	onEditProfile: () => void
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
	activeSection,
	onSectionChange,
	children,
	profile,
	onEditProfile,
}) => {
	// Listen for navigation events from warning modal
	useEffect(() => {
		const handleNavigateToSection = (event: CustomEvent) => {
			const section = event.detail.section as ProfileSection
			onSectionChange(section)
		}

		window.addEventListener(
			'navigateToSection',
			handleNavigateToSection as EventListener
		)

		return () => {
			window.removeEventListener(
				'navigateToSection',
				handleNavigateToSection as EventListener
			)
		}
	}, [onSectionChange])

	// Handle section changes with unsaved changes check
	const handleSectionChange = (targetSection: ProfileSection) => {
		console.log(
			'ProfileLayout - Navigation attempt:',
			activeSection,
			'->',
			targetSection
		)

		// Check if current section has unsaved changes
		const handlerKey = `${activeSection}NavigationHandler`
		const currentSectionHandler = (window as any)[handlerKey]

		console.log('ProfileLayout - Looking for handler key:', handlerKey)
		console.log(
			'ProfileLayout - Current section handler:',
			currentSectionHandler
		)
		console.log(
			'ProfileLayout - Available handlers:',
			Object.keys(window).filter((key) => key.includes('NavigationHandler'))
		)

		if (currentSectionHandler) {
			const canNavigate = currentSectionHandler(targetSection)
			console.log('ProfileLayout - Can navigate:', canNavigate)
			if (!canNavigate) {
				// Navigation was blocked by warning modal
				console.log('ProfileLayout - Navigation blocked by warning modal')
				return
			}
		}

		// No unsaved changes or navigation allowed
		console.log('ProfileLayout - Proceeding with navigation')
		onSectionChange(targetSection)
	}

	return (
		<div className="bg-gray-50 min-h-screen pt-24">
			<div className="pr-8">
				<div className="flex gap-8 min-h-[calc(100vh-6rem)]">
					{/* Sidebar */}
					<div
						className="w-64 flex-shrink-0 flex flex-col min-h-full"
						style={{ backgroundColor: '#126E64' }}
					>
						{/* Profile Summary */}
						<div className="p-6 border-b border-white/20">
							<div className="text-center">
								{profile?.profilePhoto ? (
									<img
										src={profile.profilePhoto}
										alt="Profile"
										className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-white"
									/>
								) : (
									<div
										className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-white ${profile?.role === 'institution' ? 'bg-blue-500' : 'bg-orange-500'}`}
									>
										{profile?.role === 'institution' ? (
											<Building2 className="w-8 h-8 text-white" />
										) : (
											<User className="w-8 h-8 text-white" />
										)}
									</div>
								)}
								<h3 className="font-bold text-lg text-white mb-1">
									{profile?.firstName} {profile?.lastName}
								</h3>
								<p className="text-white/80 text-xs mb-2 truncate">
									{profile?.user?.email}
								</p>
								<div className="space-y-1">
									<span className="inline-block bg-white/20 text-white px-2 py-1 rounded-full text-xs font-medium">
										{profile?.role === 'applicant' ? 'Student' : 'Institution'}
									</span>
									{profile?.role === 'institution' &&
										profile?.institutionType && (
											<div className="mt-1">
												<span className="inline-block bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium">
													{profile.institutionType === 'university' &&
														'University'}
													{profile.institutionType === 'scholarship-provider' &&
														'Scholarship Provider'}
													{profile.institutionType === 'research-lab' &&
														'Research Lab'}
												</span>
											</div>
										)}
								</div>
							</div>
						</div>

						{/* Navigation Menu */}
						<nav className="flex-1 p-3">
							{profileSections.map((section) => {
								const Icon = section.icon
								const isActive = activeSection === section.id

								return (
									<button
										key={section.id}
										onClick={() => handleSectionChange(section.id)}
										className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 mb-1 ${
											isActive
												? 'bg-white text-[#126E64] shadow-lg'
												: 'text-white/90 hover:bg-white/10 hover:text-white'
										}`}
									>
										<Icon className="w-4 h-4" />
										<span className="font-medium text-sm">{section.label}</span>
									</button>
								)
							})}
						</nav>
					</div>

					{/* Main Content Area */}
					<div className="w-full pb-12">
						{/* Content */}
						<div className="w-full">{children}</div>
					</div>
				</div>
			</div>
		</div>
	)
}
