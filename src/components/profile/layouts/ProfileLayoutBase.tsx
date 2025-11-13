'use client'

import { LucideIcon } from 'lucide-react'
import React from 'react'
import { ProfileSidebar } from './ProfileSidebar'

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
	onSectionChange: (_section: ProfileSection) => void
	children: React.ReactNode
	profile: any
	onEditProfile?: () => void
	navItems: NavItem[]
	roleLabel: string
	roleIcon?: React.ReactNode
	containerPaddingTop?: string
	sidebarStyle?: SidebarStyle
	noPadding?: boolean // Remove padding for full-width pages like messages
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
	noPadding = false,
}) => {
	return (
		<div className={`bg-gray-50 min-h-screen `}>
			<div className={noPadding ? '' : 'pr-8'}>
				<div className={`flex ${noPadding ? '' : 'gap-8'} min-h-screen`}>
					{/* Sidebar */}
					<ProfileSidebar
						activeSection={activeSection}
						onSectionChange={onSectionChange}
						profile={profile}
						navItems={navItems}
						roleLabel={roleLabel}
						roleIcon={roleIcon}
						containerPaddingTop={containerPaddingTop}
						sidebarStyle={sidebarStyle}
					/>

					{/* Main Content Area */}
					<div
						className={`w-full ${
							noPadding ? 'pb-0 pt-0' : `pb-12 pt-8 ${containerPaddingTop}`
						}`}
					>
						{/* Content */}
						<div className="w-full">{children}</div>
					</div>
				</div>
			</div>
		</div>
	)
}
