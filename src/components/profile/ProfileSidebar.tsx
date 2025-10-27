'use client'

import { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect } from 'react'
import { useSubscription } from '@/hooks/useSubscription'

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
	activeItemBorder?: string
	itemBorderRadius?: string
	itemPadding?: string
	itemSpacing?: string
}

interface ProfileSidebarProps {
	activeSection: ProfileSection
	onSectionChange: (section: ProfileSection) => void
	profile?: any
	navItems: NavItem[]
	roleLabel?: string
	roleIcon?: React.ReactNode
	containerPaddingTop?: string
	sidebarStyle?: SidebarStyle
	// New options for admin sidebar
	showProfileSection?: boolean
	logoSection?: React.ReactNode
	enableNavigationProtection?: boolean
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
	activeSection,
	onSectionChange,
	profile,
	navItems,
	roleLabel,
	roleIcon,
	containerPaddingTop = 'pt-24',
	sidebarStyle,
	showProfileSection = true,
	logoSection,
	enableNavigationProtection = true,
}) => {
	// Get subscription information
	const { currentPlan } = useSubscription()

	// Get plan display information
	const getPlanInfo = (plan: string) => {
		switch (plan) {
			case 'standard':
				return { label: 'Standard', color: 'bg-blue-500' }
			case 'premium':
				return { label: 'Premium', color: 'bg-purple-500' }
			default:
				return { label: 'Free', color: 'bg-gray-500' }
		}
	}

	const planInfo = getPlanInfo(currentPlan || 'free')

	// Default sidebar styles
	const {
		bgColor = '#126E64',
		activeItemBgColor = 'bg-white',
		activeItemTextColor = 'text-[#126E64]',
		inactiveItemTextColor = 'text-white/90',
		activeItemBorder = '',
		itemBorderRadius = 'rounded-lg',
		itemPadding = 'px-3 py-3',
		itemSpacing = 'mb-1',
	} = sidebarStyle || {}

	// Listen for navigation events from warning modal (only if protection is enabled)
	useEffect(() => {
		if (!enableNavigationProtection) return

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
	}, [onSectionChange, enableNavigationProtection])

	// Handle section changes with unsaved changes check (only if protection is enabled)
	const handleSectionChange = (targetSection: ProfileSection) => {
		if (!enableNavigationProtection) {
			onSectionChange(targetSection)
			return
		}

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
		<div
			className={`flex-shrink-0 flex flex-col min-h-full ${containerPaddingTop}`}
			style={{ backgroundColor: bgColor }}
		>
			{/* Profile Summary or Logo Section */}
			{showProfileSection && profile ? (
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
							{profile?.role === 'institution'
								? profile?.institutionName || 'Institution'
								: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
									'User'}
						</h3>
						<p className="text-white/80 text-xs mb-2 truncate">
							{profile?.user?.email}
						</p>
						<div className="space-y-1">
							<span className="inline-block bg-white/20 text-white px-2 py-1 rounded-full text-xs font-medium">
								{roleLabel}
							</span>
							{/* Subscription Plan Tag */}
							<div className="mt-1">
								<span
									className={`inline-block ${planInfo.color} text-white px-2 py-1 rounded-full text-xs font-medium`}
								>
									{planInfo.label} Plan
								</span>
							</div>
							{profile?.role === 'institution' && profile?.institutionType && (
								<div className="mt-1">
									<span className="inline-block bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium">
										{profile.institutionType === 'university' && 'University'}
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
			) : logoSection ? (
				<div className="p-6 border-b border-white/20">{logoSection}</div>
			) : null}

			{/* Navigation Menu */}
			<nav className="flex-1 p-3">
				{navItems.map((section) => {
					const Icon = section.icon
					const isActive = activeSection === section.id

					return (
						<button
							key={section.id}
							onClick={() => handleSectionChange(section.id)}
							className={`w-full flex items-center gap-3 text-left transition-all duration-200 ${itemPadding} ${itemSpacing} ${itemBorderRadius} ${
								isActive
									? `${activeItemBgColor} ${activeItemTextColor} ${activeItemBorder} shadow-lg`
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
	)
}
