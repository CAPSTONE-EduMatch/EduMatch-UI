'use client'

import React, { useEffect } from 'react'
import { LucideIcon } from 'lucide-react'
import Image from 'next/image'

export type ProfileSection = string

export interface NavItem {
	id: ProfileSection
	label: string
	icon: LucideIcon
}

interface SidebarStyle {
	bgColor?: string
	width?: string
	activeItemBgColor?: string
	activeItemTextColor?: string
	inactiveItemTextColor?: string
}

interface ProfileLayoutBaseProps {
	activeSection: ProfileSection
	onSectionChange: (section: ProfileSection) => void
	children: React.ReactNode
	profile: any
	onEditProfile?: () => void
	navItems: NavItem[]
	roleLabel: string
	roleIcon?: React.ReactNode
	containerPaddingTop?: string
	sidebarStyle?: SidebarStyle
}

export const ProfileLayoutBase: React.FC<ProfileLayoutBaseProps> = ({
	activeSection,
	onSectionChange,
	children,
	profile,
	navItems,
	roleLabel,
	roleIcon,
	containerPaddingTop = 'pt-24',
	sidebarStyle,
}) => {
	// Default sidebar styles
	const {
		bgColor = '#126E64',
		width = 'w-64',
		activeItemBgColor = 'bg-white',
		activeItemTextColor = 'text-[#126E64]',
		inactiveItemTextColor = 'text-white/90',
	} = sidebarStyle || {}
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
		// Check if current section has unsaved changes
		const handlerKey = `${activeSection}NavigationHandler`
		const currentSectionHandler = (window as any)[handlerKey]

		if (currentSectionHandler) {
			const canNavigate = currentSectionHandler(targetSection)
			if (!canNavigate) {
				// Navigation was blocked by warning modal
				return
			}
		}

		// No unsaved changes or navigation allowed
		onSectionChange(targetSection)
	}

	return (
		<div className={`bg-gray-50 min-h-screen ${containerPaddingTop}`}>
			<div className="pr-8">
				<div className="flex gap-8 min-h-screen">
					{/* Sidebar */}
					<div
						className={`flex-shrink-0 flex flex-col min-h-full ${width}`}
						style={{ backgroundColor: bgColor }}
					>
						{/* Profile Summary */}
						<div className="p-6 border-b border-white/20">
							<div className="text-center">
								{profile?.profilePhoto ? (
									<Image
										src={profile.profilePhoto}
										alt="Profile"
										width={64}
										height={64}
										className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-white"
									/>
								) : (
									<div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-white bg-white/20">
										{roleIcon}
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
										{roleLabel}
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
							{navItems.map((section) => {
								const Icon = section.icon
								const isActive = activeSection === section.id

								return (
									<button
										key={section.id}
										onClick={() => handleSectionChange(section.id)}
										className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 mb-1 ${
											isActive
												? `${activeItemBgColor} ${activeItemTextColor} shadow-lg`
												: `${inactiveItemTextColor} hover:bg-white/10 hover:text-white`
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
					<div className="w-full pb-12 pt-10">
						{/* Content */}
						<div className="w-full">{children}</div>
					</div>
				</div>
			</div>
		</div>
	)
}
