'use client'

import React from 'react'
import {
	Building2,
	GraduationCap,
	FileText,
	Users,
	BarChart3,
	CreditCard,
	Settings,
} from 'lucide-react'
import { ProfileLayoutBase, NavItem } from './ProfileLayoutBase'

type InstitutionProfileSection =
	| 'overview'
	| 'profile'
	| 'programs'
	| 'application'
	| 'students'
	| 'analytics'
	| 'payment'
	| 'settings'

const institutionNavItems: NavItem[] = [
	{
		id: 'overview' as InstitutionProfileSection,
		label: 'Overview',
		icon: Building2,
	},
	{
		id: 'programs' as InstitutionProfileSection,
		label: 'Programs',
		icon: GraduationCap,
	},
	{
		id: 'application' as InstitutionProfileSection,
		label: 'Application',
		icon: FileText,
	},
	{
		id: 'profile' as InstitutionProfileSection,
		label: 'Institution Information',
		icon: Users,
	},
	{
		id: 'analytics' as InstitutionProfileSection,
		label: 'Analytics & Reports',
		icon: BarChart3,
	},
	{
		id: 'payment' as InstitutionProfileSection,
		label: 'Payments',
		icon: CreditCard,
	},
	{
		id: 'settings' as InstitutionProfileSection,
		label: 'Setting',
		icon: Settings,
	},
]

interface InstitutionProfileLayoutProps {
	activeSection: InstitutionProfileSection
	onSectionChange: (section: InstitutionProfileSection) => void
	children: React.ReactNode
	profile: any
	onEditProfile?: () => void
}

export const InstitutionProfileLayout: React.FC<
	InstitutionProfileLayoutProps
> = ({ activeSection, onSectionChange, children, profile, onEditProfile }) => {
	return (
		<ProfileLayoutBase
			activeSection={activeSection}
			onSectionChange={onSectionChange as (section: string) => void}
			profile={profile}
			onEditProfile={onEditProfile}
			navItems={institutionNavItems}
			roleLabel="Institution"
			roleIcon={<Building2 className="w-8 h-8 text-white" />}
			containerPaddingTop="pt-22"
		>
			{children}
		</ProfileLayoutBase>
	)
}

export type { InstitutionProfileSection }
