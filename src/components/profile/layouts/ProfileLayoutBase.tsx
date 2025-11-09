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
	return (
		<div className={`bg-gray-50 min-h-screen `}>
			<div className="pr-8">
				<div className="flex gap-8 min-h-screen">
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
					<div className={`w-full pb-12 pt-10 ${containerPaddingTop}`}>
						{/* Content */}
						<div className="w-full">{children}</div>
					</div>
				</div>
			</div>
		</div>
	)
}
