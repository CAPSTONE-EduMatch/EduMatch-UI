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
import {
	ProfileLayoutBase,
	NavItem,
} from '@/components/profile/layouts/ProfileLayoutBase'
import { useTranslations } from 'next-intl'

type ApplicantProfileSection =
	| 'profile'
	| 'academic'
	| 'wishlist'
	| 'application'
	| 'payment'
	| 'settings'

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
	const t = useTranslations('profile_view')

	const applicantNavItems: NavItem[] = [
		{
			id: 'profile' as ApplicantProfileSection,
			label: t('navigation.profile_info'),
			icon: User,
		},
		{
			id: 'academic' as ApplicantProfileSection,
			label: t('navigation.academic'),
			icon: GraduationCap,
		},
		{
			id: 'wishlist' as ApplicantProfileSection,
			label: t('navigation.wishlist'),
			icon: Heart,
		},
		{
			id: 'application' as ApplicantProfileSection,
			label: t('navigation.applications'),
			icon: FileText,
		},
		{
			id: 'payment' as ApplicantProfileSection,
			label: t('navigation.payment'),
			icon: CreditCard,
		},
		{
			id: 'settings' as ApplicantProfileSection,
			label: t('navigation.settings'),
			icon: Settings,
		},
	]

	return (
		<ProfileLayoutBase
			activeSection={activeSection}
			onSectionChange={onSectionChange as (section: string) => void}
			profile={profile}
			onEditProfile={onEditProfile}
			navItems={applicantNavItems}
			roleLabel={t('navigation.student')}
			roleIcon={<User className="w-8 h-8 text-white" />}
			containerPaddingTop="pt-26"
		>
			{children}
		</ProfileLayoutBase>
	)
}

export type { ApplicantProfileSection }
