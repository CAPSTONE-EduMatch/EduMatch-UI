'use client'

import React from 'react'
import {
	User,
	GraduationCap,
	Heart,
	FileText,
	CreditCard,
	Settings,
} from 'lucide-react'
import { ProfileLayoutBase, NavItem } from '../ProfileLayoutBase'

type ApplicantProfileSection =
	| 'profile'
	| 'academic'
	| 'wishlist'
	| 'application'
	| 'payment'
	| 'settings'

const applicantNavItems: NavItem[] = [
	{
		id: 'profile' as ApplicantProfileSection,
		label: 'Profile Info',
		icon: User,
	},
	{
		id: 'academic' as ApplicantProfileSection,
		label: 'Academic',
		icon: GraduationCap,
	},
	{
		id: 'wishlist' as ApplicantProfileSection,
		label: 'Wishlist',
		icon: Heart,
	},
	{
		id: 'application' as ApplicantProfileSection,
		label: 'Applications',
		icon: FileText,
	},
	{
		id: 'payment' as ApplicantProfileSection,
		label: 'Payment',
		icon: CreditCard,
	},
	{
		id: 'settings' as ApplicantProfileSection,
		label: 'Settings',
		icon: Settings,
	},
]

interface ApplicantProfileLayoutProps {
	activeSection: ApplicantProfileSection
	onSectionChange: (section: ApplicantProfileSection) => void
	children: React.ReactNode
	profile: any
	onEditProfile?: () => void
}

export const ApplicantProfileLayout: React.FC<ApplicantProfileLayoutProps> = ({
	activeSection,
	onSectionChange,
	children,
	profile,
	onEditProfile,
}) => {
	return (
		<ProfileLayoutBase
			activeSection={activeSection}
			onSectionChange={onSectionChange as (section: string) => void}
			profile={profile}
			onEditProfile={onEditProfile}
			navItems={applicantNavItems}
			roleLabel="Student"
			roleIcon={<User className="w-8 h-8 text-white" />}
			containerPaddingTop="pt-22"
		>
			{children}
		</ProfileLayoutBase>
	)
}

export type { ApplicantProfileSection }
